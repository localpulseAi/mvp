"""
Strategy Session API.

POST /sessions              — start a new session (runs full 7-agent pipeline)
GET  /sessions              — list sessions for authenticated owner
GET  /sessions/{id}         — get full session with all turns
POST /sessions/{id}/followup — add a follow-up question (Strategist only re-run)
"""
import uuid
from typing import Optional

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.owner import Owner
from app.models.session import StrategySession
from app.orchestrator.session_runner import start_session, continue_session
from app.services.auth_service import get_current_owner

router = APIRouter(prefix="/sessions", tags=["sessions"])
log = structlog.get_logger()


# ── Request / Response schemas ────────────────────────────────────────────────

class StartSessionRequest(BaseModel):
    question: str = Field(..., min_length=10, max_length=2000)


class FollowUpRequest(BaseModel):
    question: str = Field(..., min_length=5, max_length=2000)


class SessionSummary(BaseModel):
    id: str
    status: str
    original_question: str
    parsed_type: Optional[str]
    turn_count: int
    total_cost_cents: int
    created_at: str


class TurnOut(BaseModel):
    turn_number: int
    question: str
    is_followup: bool
    strategist_output: Optional[dict]
    cost_cents: int
    latency_ms: int


class SessionDetail(SessionSummary):
    implicit_goal: Optional[str]
    turns: list[TurnOut]


def _to_summary(s: StrategySession) -> SessionSummary:
    return SessionSummary(
        id=str(s.id),
        status=s.status,
        original_question=s.original_question,
        parsed_type=s.parsed_type,
        turn_count=len(s.turns or []),
        total_cost_cents=s.total_cost_cents or 0,
        created_at=s.created_at.isoformat(),
    )


def _to_detail(s: StrategySession) -> SessionDetail:
    turns_out = []
    for t in (s.turns or []):
        turns_out.append(TurnOut(
            turn_number=t.get("turn_number", 1),
            question=t.get("question", ""),
            is_followup=t.get("is_followup", False),
            strategist_output=t.get("strategist_output"),
            cost_cents=t.get("cost_cents", 0),
            latency_ms=t.get("latency_ms", 0),
        ))
    return SessionDetail(
        id=str(s.id),
        status=s.status,
        original_question=s.original_question,
        parsed_type=s.parsed_type,
        implicit_goal=s.implicit_goal,
        turn_count=len(turns_out),
        total_cost_cents=s.total_cost_cents or 0,
        created_at=s.created_at.isoformat(),
        turns=turns_out,
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("")
async def create_session(
    body: StartSessionRequest,
    background_tasks: BackgroundTasks,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new strategy session. Runs the full 6-analyst + Strategist pipeline.
    Response may take up to 45 seconds — runs synchronously and returns when complete.
    """
    log.info("session_create_request", owner_id=str(owner.id), question_len=len(body.question))
    session, turn_result = await start_session(owner, body.question, db)

    if turn_result.needs_clarification:
        return {
            "session_id": str(session.id),
            "status": "needs_clarification",
            "clarifying_question": turn_result.clarifying_question,
            "turn": None,
        }

    turn_out = None
    if turn_result.strategist_output:
        turn_out = {
            "turn_number": turn_result.turn_number,
            "question": turn_result.question,
            "strategist_output": turn_result.strategist_output.model_dump(mode="json"),
            "cost_cents": turn_result.cost_cents,
            "latency_ms": turn_result.latency_ms,
        }

    return {
        "session_id": str(session.id),
        "status": turn_result.status,
        "turn": turn_out,
    }


@router.get("")
async def list_sessions(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(StrategySession)
        .where(StrategySession.owner_id == owner.id)
        .order_by(StrategySession.created_at.desc())
        .limit(20)
    )
    sessions = result.scalars().all()

    count_result = await db.execute(
        select(func.count()).select_from(StrategySession).where(StrategySession.owner_id == owner.id)
    )
    total = count_result.scalar_one()

    return {"sessions": [_to_summary(s) for s in sessions], "total": total}


@router.get("/{session_id}")
async def get_session(
    session_id: str,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(select(StrategySession).where(StrategySession.id == sid))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.owner_id != owner.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"session": _to_detail(session)}


@router.post("/{session_id}/followup")
async def add_followup(
    session_id: str,
    body: FollowUpRequest,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a follow-up question to an existing session.
    Re-runs only the Strategist — analyst context from turn 1 is preserved.
    """
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(select(StrategySession).where(StrategySession.id == sid))
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.owner_id != owner.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if session.status == "error":
        raise HTTPException(status_code=422, detail="Cannot continue an errored session")

    turn_result = await continue_session(session, owner, body.question, db)

    turn_out = None
    if turn_result.strategist_output:
        turn_out = {
            "turn_number": turn_result.turn_number,
            "question": turn_result.question,
            "strategist_output": turn_result.strategist_output.model_dump(mode="json"),
            "cost_cents": turn_result.cost_cents,
            "latency_ms": turn_result.latency_ms,
        }

    return {
        "session_id": str(session.id),
        "status": turn_result.status,
        "turn": turn_out,
    }
