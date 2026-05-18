"""
Tool registry — agents call tools by name. Tools are versioned and DB-aware.

Usage:
    registry = ToolRegistry()
    registry.register(market_data_tool)
    registry.register(competitor_data_tool)

    # In agent agentic loop:
    tools_for_api = registry.get_anthropic_tools()
    result = await registry.call("market_data_retrieval", args, db)
"""
import time
from dataclasses import dataclass, field
from typing import Callable, Any
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

log = structlog.get_logger()


@dataclass
class ToolDefinition:
    name: str
    version: str
    description: str
    input_schema: dict
    handler: Callable  # async (args: dict, db: AsyncSession) -> dict


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, ToolDefinition] = {}

    def register(self, tool: ToolDefinition) -> None:
        self._tools[tool.name] = tool

    def get_anthropic_tools(self) -> list[dict]:
        return [
            {
                "name": t.name,
                "description": t.description,
                "input_schema": t.input_schema,
            }
            for t in self._tools.values()
        ]

    async def call(self, name: str, args: dict, db: AsyncSession) -> dict:
        tool = self._tools.get(name)
        if not tool:
            log.error("tool_not_found", name=name)
            return {"error": f"Tool '{name}' not found in registry"}
        t0 = time.time()
        try:
            result = await tool.handler(args, db)
            latency_ms = int((time.time() - t0) * 1000)
            log.info("tool_called", tool=name, version=tool.version, latency_ms=latency_ms)
            return result
        except Exception as e:
            latency_ms = int((time.time() - t0) * 1000)
            log.error("tool_call_failed", tool=name, error=str(e), latency_ms=latency_ms)
            return {"error": f"Tool '{name}' failed: {str(e)}"}
