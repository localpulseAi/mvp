"""
AgentDispatcher — parallel dispatch of multiple agents with cost tracking and DB persistence.

Usage:
    result = await dispatch_agents(
        agent_names=["market_analyst", "competitor_analyst"],
        input_data=agent_input,
        owner_id=owner.id,
        trigger="weekly_brief",
        db=db,
    )
"""
import asyncio
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.base import AgentResult
from app.agents.registry import AGENT_REGISTRY
from app.agents.schemas import AgentInput
from app.config import settings
from app.models.agent import AgentRun, OrchestrationRun
from app.orchestrator.cost_tracker import get_or_create_ledger, record_cost
from app.tools.market_data import market_data_tool
from app.tools.competitor_data import competitor_data_tool
from app.tools.registry import ToolRegistry

log = structlog.get_logger()


def _build_full_registry() -> ToolRegistry:
    registry = ToolRegistry()
    registry.register(market_data_tool)
    registry.register(competitor_data_tool)
    return registry


@dataclass
class OrchestrationResult:
    orchestration_id: uuid.UUID
    status: str  # completed | partial | failed | budget_exceeded
    results: dict[str, AgentResult] = field(default_factory=dict)
    total_cost_cents: int = 0
    total_latency_ms: int = 0
    agents_completed: list[str] = field(default_factory=list)
    agents_failed: list[str] = field(default_factory=list)
    budget_exceeded: bool = False


async def _run_single_agent(
    agent_name: str,
    input_data: AgentInput,
    tool_registry: ToolRegistry,
    db: AsyncSession,
    budget_remaining: int,
) -> AgentResult:
    agent_class = AGENT_REGISTRY.get(agent_name)
    if not agent_class:
        from app.agents.base import AgentResult as AR
        return AR(
            agent_name=agent_name,
            agent_version="unknown",
            model_used="unknown",
            status="error",
            error_message=f"Agent '{agent_name}' not found in registry",
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
        )

    agent = agent_class()
    return await agent.run(input_data, tool_registry, db, budget_remaining)


async def dispatch_agents(
    agent_names: list[str],
    input_data: AgentInput,
    owner_id: uuid.UUID,
    trigger: str,
    db: AsyncSession,
) -> OrchestrationResult:
    t0 = time.time()
    now = datetime.now(timezone.utc)

    # Check monthly budget before starting
    ledger = await get_or_create_ledger(owner_id, db)
    budget_remaining = max(0, ledger.budget_limit_cents - ledger.total_cost_cents)
    per_session_budget = settings.max_cost_per_session_cents

    if ledger.total_cost_cents >= ledger.budget_limit_cents:
        log.warning("monthly_budget_exhausted", owner_id=str(owner_id))
        orch_run = OrchestrationRun(
            owner_id=owner_id,
            trigger=trigger,
            status="budget_exceeded",
            agents_dispatched={"names": agent_names},
            agents_completed={"names": []},
            agents_failed={"names": agent_names},
            budget_cents=per_session_budget,
            budget_exceeded=True,
            started_at=now,
            finished_at=datetime.now(timezone.utc),
        )
        db.add(orch_run)
        await db.commit()
        await db.refresh(orch_run)
        return OrchestrationResult(
            orchestration_id=orch_run.id,
            status="budget_exceeded",
            agents_failed=agent_names,
            budget_exceeded=True,
        )

    # Create orchestration run record
    orch_run = OrchestrationRun(
        owner_id=owner_id,
        trigger=trigger,
        status="running",
        agents_dispatched={"names": agent_names},
        agents_completed={"names": []},
        agents_failed={"names": []},
        budget_cents=per_session_budget,
        started_at=now,
    )
    db.add(orch_run)
    await db.commit()
    await db.refresh(orch_run)

    tool_registry = _build_full_registry()

    # Dispatch all agents concurrently
    budget_per_agent = per_session_budget // max(len(agent_names), 1)
    tasks = [
        _run_single_agent(name, input_data, tool_registry, db, budget_per_agent)
        for name in agent_names
    ]
    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    results: dict[str, AgentResult] = {}
    completed: list[str] = []
    failed: list[str] = []
    total_cost = 0

    for name, result in zip(agent_names, raw_results):
        if isinstance(result, Exception):
            from app.agents.base import AgentResult as AR
            result = AR(
                agent_name=name,
                agent_version="unknown",
                model_used="unknown",
                status="error",
                error_message=str(result),
                started_at=now,
                finished_at=datetime.now(timezone.utc),
            )

        results[name] = result
        if result.status == "success" or result.status == "validation_retry":
            completed.append(name)
        else:
            failed.append(name)

        total_cost += result.cost_cents

        # Persist agent run row
        agent_run = AgentRun(
            orchestration_id=orch_run.id,
            owner_id=owner_id,
            agent_name=result.agent_name,
            agent_version=result.agent_version,
            model_used=result.model_used,
            status=result.status,
            input_data=input_data.model_dump(mode="json"),
            output_data=result.output.model_dump(mode="json") if result.output else None,
            raw_output=result.raw_output,
            tool_calls={"calls": result.tool_calls},
            error_message=result.error_message,
            retry_count=result.retry_count,
            latency_ms=result.latency_ms,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            cost_cents=result.cost_cents,
            started_at=result.started_at or now,
            finished_at=result.finished_at or datetime.now(timezone.utc),
        )
        db.add(agent_run)

    # Record cost in monthly ledger
    if total_cost > 0:
        _, budget_exceeded = await record_cost(owner_id, total_cost, db)
    else:
        budget_exceeded = False

    total_latency_ms = int((time.time() - t0) * 1000)

    if not failed:
        status = "completed"
    elif not completed:
        status = "failed"
    else:
        status = "partial"

    # Update orchestration run
    orch_run.status = status
    orch_run.agents_completed = {"names": completed}
    orch_run.agents_failed = {"names": failed}
    orch_run.total_cost_cents = total_cost
    orch_run.total_latency_ms = total_latency_ms
    orch_run.budget_exceeded = budget_exceeded
    orch_run.finished_at = datetime.now(timezone.utc)
    await db.commit()

    log.info(
        "orchestration_complete",
        orchestration_id=str(orch_run.id),
        trigger=trigger,
        status=status,
        completed=completed,
        failed=failed,
        total_cost_cents=total_cost,
        total_latency_ms=total_latency_ms,
    )

    return OrchestrationResult(
        orchestration_id=orch_run.id,
        status=status,
        results=results,
        total_cost_cents=total_cost,
        total_latency_ms=total_latency_ms,
        agents_completed=completed,
        agents_failed=failed,
        budget_exceeded=budget_exceeded,
    )
