"""
Agent run observability API — for pilot debugging and cost monitoring.
"""
import uuid
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.agent import AgentRun, OrchestrationRun
from app.models.owner import Owner
from app.orchestrator.cost_tracker import get_cost_summary
from app.services.auth_service import get_current_owner

router = APIRouter(prefix="/agent-runs", tags=["observability"])
log = structlog.get_logger()


class AgentRunSummary(BaseModel):
    id: str
    orchestration_id: str
    agent_name: str
    status: str
    latency_ms: int
    cost_cents: int
    input_tokens: Optional[int]
    output_tokens: Optional[int]
    retry_count: int
    created_at: str


class AgentRunDetail(AgentRunSummary):
    agent_version: str
    model_used: str
    output_data: Optional[dict]
    tool_calls: Optional[dict]
    error_message: Optional[str]


def _to_summary(r: AgentRun) -> AgentRunSummary:
    return AgentRunSummary(
        id=str(r.id),
        orchestration_id=str(r.orchestration_id),
        agent_name=r.agent_name,
        status=r.status,
        latency_ms=r.latency_ms,
        cost_cents=r.cost_cents,
        input_tokens=r.input_tokens,
        output_tokens=r.output_tokens,
        retry_count=r.retry_count,
        created_at=r.created_at.isoformat(),
    )


def _to_detail(r: AgentRun) -> AgentRunDetail:
    return AgentRunDetail(
        id=str(r.id),
        orchestration_id=str(r.orchestration_id),
        agent_name=r.agent_name,
        status=r.status,
        latency_ms=r.latency_ms,
        cost_cents=r.cost_cents,
        input_tokens=r.input_tokens,
        output_tokens=r.output_tokens,
        retry_count=r.retry_count,
        created_at=r.created_at.isoformat(),
        agent_version=r.agent_version,
        model_used=r.model_used,
        output_data=r.output_data,
        tool_calls=r.tool_calls,
        error_message=r.error_message,
    )


@router.get("")
async def list_agent_runs(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(
        select(func.count()).select_from(AgentRun).where(AgentRun.owner_id == owner.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(AgentRun)
        .where(AgentRun.owner_id == owner.id)
        .order_by(AgentRun.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    runs = result.scalars().all()

    return {
        "runs": [_to_summary(r) for r in runs],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/cost")
async def get_monthly_cost(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    return await get_cost_summary(owner.id, db)


@router.get("/{run_id}")
async def get_agent_run(
    run_id: str,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    try:
        rid = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Agent run not found")

    result = await db.execute(select(AgentRun).where(AgentRun.id == rid))
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    if run.owner_id != owner.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"run": _to_detail(run)}
