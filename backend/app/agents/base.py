"""
BaseAgent — abstract class all analysts inherit from.

Implements:
- Tool-use agentic loop (calls tools until stop_reason=end_turn)
- Schema validation with one retry on ValidationError
- Per-run timeout via asyncio.wait_for
- Cost computation from token counts
- Structured AgentResult return (never raises)
"""
import asyncio
import json
import re
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, Type

import structlog
from anthropic import AsyncAnthropic
from pydantic import BaseModel, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.schemas import AgentInput
from app.config import settings
from app.tools.registry import ToolRegistry

log = structlog.get_logger()

# Cost lookup: cents per million tokens
MODEL_PRICING: dict[str, dict[str, int]] = {
    "claude-sonnet-4-6": {"input": 300, "output": 1500},       # $3/$15 per MTok
    "claude-opus-4-7":   {"input": 1500, "output": 7500},      # $15/$75 per MTok
    "claude-haiku-4-5-20251001": {"input": 25, "output": 125}, # $0.25/$1.25 per MTok
}


def compute_token_cost(model: str, input_tokens: int, output_tokens: int) -> int:
    pricing = MODEL_PRICING.get(model, MODEL_PRICING["claude-sonnet-4-6"])
    cost = (input_tokens * pricing["input"] + output_tokens * pricing["output"]) / 1_000_000
    return max(1, round(cost))


def _extract_json(text: str) -> dict:
    """Extract a JSON object from text, handling markdown code fences."""
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError(f"No valid JSON found in response (first 300 chars): {text[:300]}")


@dataclass
class AgentResult:
    agent_name: str
    agent_version: str
    model_used: str
    status: str  # success | validation_retry | validation_failed | timeout | error
    output: Optional[BaseModel] = None
    raw_output: Optional[str] = None
    tool_calls: list[dict] = field(default_factory=list)
    input_tokens: int = 0
    output_tokens: int = 0
    cost_cents: int = 0
    latency_ms: int = 0
    retry_count: int = 0
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class BaseAgent(ABC):
    name: str
    version: str = "1.0"
    model: str = "claude-sonnet-4-6"
    timeout_seconds: int = 30
    max_tokens: int = 2048
    max_retries: int = 1  # validation retries only

    @property
    @abstractmethod
    def output_schema(self) -> Type[BaseModel]:
        ...

    @abstractmethod
    def build_system_prompt(self) -> str:
        ...

    @abstractmethod
    def build_user_message(self, input_data: AgentInput) -> str:
        ...

    @abstractmethod
    def get_tool_names(self) -> list[str]:
        """Return the tool names this agent needs from the registry."""
        ...

    def _build_tool_registry(self, full_registry: ToolRegistry) -> ToolRegistry:
        """Create a scoped registry with only the tools this agent needs."""
        from app.tools.registry import ToolRegistry as TR
        scoped = TR()
        for name in self.get_tool_names():
            if name in full_registry._tools:
                scoped._tools[name] = full_registry._tools[name]
        return scoped

    async def _run_agentic_loop(
        self,
        client: AsyncAnthropic,
        system: str,
        user_message: str,
        tool_registry: ToolRegistry,
        db: AsyncSession,
    ) -> tuple[str, list[dict], int, int]:
        """
        Runs the Anthropic tool-use loop until stop_reason=end_turn.
        Returns: (final_text, tool_calls_log, total_input_tokens, total_output_tokens)
        """
        messages = [{"role": "user", "content": user_message}]
        tools = tool_registry.get_anthropic_tools()
        all_tool_calls: list[dict] = []
        total_input = 0
        total_output = 0

        while True:
            kwargs: dict = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "system": system,
                "messages": messages,
            }
            if tools:
                kwargs["tools"] = tools
            response = await client.messages.create(**kwargs)

            total_input += response.usage.input_tokens
            total_output += response.usage.output_tokens

            if response.stop_reason == "end_turn":
                final_text = ""
                for block in response.content:
                    if block.type == "text":
                        final_text = block.text
                        break
                return final_text, all_tool_calls, total_input, total_output

            if response.stop_reason == "tool_use":
                assistant_content = []
                tool_results = []

                for block in response.content:
                    if block.type == "text":
                        assistant_content.append({"type": "text", "text": block.text})
                    elif block.type == "tool_use":
                        assistant_content.append({
                            "type": "tool_use",
                            "id": block.id,
                            "name": block.name,
                            "input": block.input,
                        })
                        t0 = time.time()
                        result = await tool_registry.call(block.name, block.input, db)
                        latency = int((time.time() - t0) * 1000)
                        all_tool_calls.append({
                            "tool_name": block.name,
                            "tool_use_id": block.id,
                            "latency_ms": latency,
                        })
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result),
                        })

                messages.append({"role": "assistant", "content": assistant_content})
                messages.append({"role": "user", "content": tool_results})
                continue

            # Unexpected stop reason — treat as end
            final_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    final_text = block.text
                    break
            return final_text, all_tool_calls, total_input, total_output

    async def _attempt_run(
        self,
        client: AsyncAnthropic,
        input_data: AgentInput,
        tool_registry: ToolRegistry,
        db: AsyncSession,
    ) -> tuple[str, list[dict], int, int]:
        system = self.build_system_prompt()
        user_msg = self.build_user_message(input_data)
        scoped_registry = self._build_tool_registry(tool_registry)
        return await self._run_agentic_loop(client, system, user_msg, scoped_registry, db)

    async def run(
        self,
        input_data: AgentInput,
        tool_registry: ToolRegistry,
        db: AsyncSession,
        budget_remaining_cents: int = 999,
    ) -> AgentResult:
        started_at = datetime.now(timezone.utc)
        t0 = time.time()

        if not settings.anthropic_api_key:
            return AgentResult(
                agent_name=self.name,
                agent_version=self.version,
                model_used=self.model,
                status="error",
                error_message="ANTHROPIC_API_KEY not configured",
                started_at=started_at,
                finished_at=datetime.now(timezone.utc),
            )

        client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        raw_output = None
        tool_calls: list[dict] = []
        input_tokens = 0
        output_tokens = 0
        retry_count = 0

        try:
            raw_output, tool_calls, input_tokens, output_tokens = await asyncio.wait_for(
                self._attempt_run(client, input_data, tool_registry, db),
                timeout=self.timeout_seconds,
            )
        except asyncio.TimeoutError:
            latency_ms = int((time.time() - t0) * 1000)
            return AgentResult(
                agent_name=self.name,
                agent_version=self.version,
                model_used=self.model,
                status="timeout",
                raw_output=raw_output,
                tool_calls=tool_calls,
                latency_ms=latency_ms,
                error_message=f"Agent timed out after {self.timeout_seconds}s",
                started_at=started_at,
                finished_at=datetime.now(timezone.utc),
            )
        except Exception as e:
            latency_ms = int((time.time() - t0) * 1000)
            log.error("agent_run_failed", agent=self.name, error=str(e))
            return AgentResult(
                agent_name=self.name,
                agent_version=self.version,
                model_used=self.model,
                status="error",
                raw_output=raw_output,
                latency_ms=latency_ms,
                error_message=str(e),
                started_at=started_at,
                finished_at=datetime.now(timezone.utc),
            )

        # Attempt validation, retry once on failure
        output = None
        status = "success"
        for attempt in range(self.max_retries + 1):
            try:
                parsed = _extract_json(raw_output or "")
                output = self.output_schema.model_validate(parsed)
                if attempt > 0:
                    status = "validation_retry"
                    retry_count = attempt
                break
            except (ValueError, ValidationError) as e:
                if attempt < self.max_retries:
                    log.warning(
                        "agent_validation_retry",
                        agent=self.name,
                        attempt=attempt + 1,
                        error=str(e)[:200],
                    )
                    # One correction round-trip
                    try:
                        correction_msg = (
                            f"Your previous response did not match the required JSON schema. "
                            f"Validation errors: {str(e)[:500]}\n\n"
                            f"Please return ONLY valid JSON matching the schema, with no explanation."
                        )
                        correction_messages = [
                            {"role": "user", "content": self.build_user_message(input_data)},
                            {"role": "assistant", "content": raw_output or ""},
                            {"role": "user", "content": correction_msg},
                        ]
                        correction_response = await asyncio.wait_for(
                            client.messages.create(
                                model=self.model,
                                max_tokens=self.max_tokens,
                                system=self.build_system_prompt(),
                                messages=correction_messages,
                            ),
                            timeout=20,
                        )
                        input_tokens += correction_response.usage.input_tokens
                        output_tokens += correction_response.usage.output_tokens
                        raw_output = next(
                            (b.text for b in correction_response.content if b.type == "text"),
                            raw_output,
                        )
                    except Exception:
                        pass
                else:
                    status = "validation_failed"
                    log.error("agent_validation_failed", agent=self.name, error=str(e)[:200])

        cost_cents = compute_token_cost(self.model, input_tokens, output_tokens)
        latency_ms = int((time.time() - t0) * 1000)

        if cost_cents > budget_remaining_cents:
            log.warning(
                "agent_budget_exceeded",
                agent=self.name,
                cost_cents=cost_cents,
                budget_remaining=budget_remaining_cents,
            )

        log.info(
            "agent_run_complete",
            agent=self.name,
            status=status,
            latency_ms=latency_ms,
            cost_cents=cost_cents,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

        return AgentResult(
            agent_name=self.name,
            agent_version=self.version,
            model_used=self.model,
            status=status,
            output=output,
            raw_output=raw_output,
            tool_calls=tool_calls,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_cents=cost_cents,
            latency_ms=latency_ms,
            retry_count=retry_count,
            started_at=started_at,
            finished_at=datetime.now(timezone.utc),
        )
