"""
Strategy Session runner — orchestrates the full 7-agent pipeline for a strategy session.

Flow:
  1. Parse the question (classify type, detect if clarification needed)
  2. If clarification needed → return early with the clarifying question (no agents run)
  3. Dispatch all 6 analysts in parallel
  4. Collect analyst outputs and run the Strategist with full context
  5. Persist the session turn and return the result

Follow-up flow:
  1. Use the previous session's analyst outputs (no re-run of analysts)
  2. Run Strategist with full history + new question
"""
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.registry import ANALYST_AGENTS
from app.agents.schemas import AgentInput, OwnerProfile, TimeWindow, StrategistOutput, ParsedQuestion
from app.agents.strategist import Strategist
from app.config import settings
from app.models.owner import Owner
from app.models.session import StrategySession
from app.orchestrator.dispatcher import dispatch_agents
from app.orchestrator.cost_tracker import record_cost
from app.services.question_parser import parse_question

from datetime import date, timedelta

log = structlog.get_logger()


def _current_week() -> tuple[date, date]:
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    return monday, monday + timedelta(days=6)


def _owner_to_profile(owner: Owner) -> OwnerProfile:
    return OwnerProfile(
        owner_id=str(owner.id),
        business_name=owner.business_name,
        niche=owner.niche or "restaurant",
        address=owner.address,
        business_description=owner.business_description,
        brand_voice=owner.brand_voice,
        quarter_goal=owner.quarter_goal,
        gross_margin_band=owner.gross_margin_band,
        fixed_cost_band=owner.fixed_cost_band,
        price_range=owner.price_range,
        capacity=owner.capacity,
        staff_size=owner.staff_size,
        peak_hours=owner.peak_hours,
        instagram_handle=owner.instagram_handle,
        facebook_page=owner.facebook_page,
    )


@dataclass
class SessionTurnResult:
    session_id: uuid.UUID
    turn_number: int
    question: str
    is_followup: bool
    strategist_output: Optional[StrategistOutput]
    needs_clarification: bool
    clarifying_question: Optional[str]
    analyst_outputs: dict
    cost_cents: int
    latency_ms: int
    status: str  # completed | error | needs_clarification


async def _run_strategist(
    input_data: AgentInput,
    db: AsyncSession,
) -> tuple[Optional[StrategistOutput], int, int]:
    """Run just the Strategist agent. Returns (output, cost_cents, latency_ms)."""
    from app.tools.registry import ToolRegistry
    t0 = time.time()
    agent = Strategist()
    empty_registry = ToolRegistry()
    result = await agent.run(input_data, empty_registry, db, budget_remaining_cents=500)
    latency_ms = int((time.time() - t0) * 1000)
    output = result.output if result.status in ("success", "validation_retry") else None
    return output, result.cost_cents, latency_ms


async def start_session(
    owner: Owner,
    question: str,
    db: AsyncSession,
) -> tuple[StrategySession, SessionTurnResult]:
    """
    Start a new strategy session with the owner's first question.
    Creates the StrategySession row and runs the full pipeline.
    """
    t0 = time.time()
    week_start, week_end = _current_week()
    profile = _owner_to_profile(owner)

    # Parse the question
    parsed = await parse_question(question, profile)

    # Create session row immediately (so we have an ID to return)
    session = StrategySession(
        owner_id=owner.id,
        status="active",
        original_question=question,
        parsed_type=parsed.question_type,
        parsed_scope=parsed.scope,
        implicit_goal=parsed.implicit_goal,
        turns=[],
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # If clarification is needed, return early
    if parsed.needs_clarification:
        turn_result = SessionTurnResult(
            session_id=session.id,
            turn_number=1,
            question=question,
            is_followup=False,
            strategist_output=None,
            needs_clarification=True,
            clarifying_question=parsed.clarifying_question,
            analyst_outputs={},
            cost_cents=0,
            latency_ms=int((time.time() - t0) * 1000),
            status="needs_clarification",
        )
        return session, turn_result

    # Dispatch all 6 analysts in parallel
    input_data = AgentInput(
        owner_profile=profile,
        time_window=TimeWindow(week_start=week_start, week_end=week_end),
        question=question,
        context={"parsed_question": parsed.model_dump(mode="json")},
    )

    orch_result = await dispatch_agents(
        agent_names=ANALYST_AGENTS,
        input_data=input_data,
        owner_id=owner.id,
        trigger="strategy_session",
        db=db,
    )

    # Collect analyst outputs
    analyst_outputs: dict[str, Optional[dict]] = {}
    for name, result in orch_result.results.items():
        if result.output:
            analyst_outputs[name] = result.output.model_dump(mode="json")
        else:
            analyst_outputs[name] = None

    # Run Strategist with all analyst outputs in context
    strategist_input = AgentInput(
        owner_profile=profile,
        time_window=TimeWindow(week_start=week_start, week_end=week_end),
        question=question,
        context={
            "parsed_question": parsed.model_dump(mode="json"),
            "analyst_outputs": analyst_outputs,
            "session_history": [],
        },
    )
    strat_output, strat_cost, strat_latency = await _run_strategist(strategist_input, db)

    total_cost = orch_result.total_cost_cents + strat_cost
    total_latency = int((time.time() - t0) * 1000)

    # Build turn record
    turn = {
        "turn_number": 1,
        "question": question,
        "is_followup": False,
        "orchestration_id": str(orch_result.orchestration_id),
        "strategist_output": strat_output.model_dump(mode="json") if strat_output else None,
        "analyst_outputs": analyst_outputs,
        "cost_cents": total_cost,
        "latency_ms": total_latency,
    }

    session.turns = [turn]
    session.total_cost_cents = total_cost
    session.status = "completed" if strat_output else "error"
    await db.commit()
    await db.refresh(session)

    # Record in monthly ledger
    if total_cost > 0:
        await record_cost(owner.id, total_cost, db)

    log.info(
        "session_started",
        session_id=str(session.id),
        cost_cents=total_cost,
        latency_ms=total_latency,
        analyst_completed=orch_result.agents_completed,
    )

    return session, SessionTurnResult(
        session_id=session.id,
        turn_number=1,
        question=question,
        is_followup=False,
        strategist_output=strat_output,
        needs_clarification=False,
        clarifying_question=None,
        analyst_outputs=analyst_outputs,
        cost_cents=total_cost,
        latency_ms=total_latency,
        status="completed" if strat_output else "error",
    )


async def continue_session(
    session: StrategySession,
    owner: Owner,
    follow_up_question: str,
    db: AsyncSession,
) -> SessionTurnResult:
    """
    Add a follow-up question to an existing session.
    Re-runs only the Strategist (analysts from turn 1 are reused).
    """
    t0 = time.time()
    week_start, week_end = _current_week()
    profile = _owner_to_profile(owner)

    existing_turns = session.turns or []
    turn_number = len(existing_turns) + 1

    # Reuse analyst outputs from the first turn
    first_turn = existing_turns[0] if existing_turns else {}
    analyst_outputs = first_turn.get("analyst_outputs", {})

    # Build context with session history (last 3 turns)
    history_for_context = [
        {
            "question": t.get("question", ""),
            "strategist_output": t.get("strategist_output"),
        }
        for t in existing_turns[-3:]
    ]

    strategist_input = AgentInput(
        owner_profile=profile,
        time_window=TimeWindow(week_start=week_start, week_end=week_end),
        question=follow_up_question,
        context={
            "parsed_question": {
                "question_type": session.parsed_type or "general",
                "scope": session.parsed_scope or "tactical",
                "implicit_goal": session.implicit_goal or "",
            },
            "analyst_outputs": analyst_outputs,
            "session_history": history_for_context,
        },
    )

    strat_output, strat_cost, strat_latency = await _run_strategist(strategist_input, db)
    total_latency = int((time.time() - t0) * 1000)

    turn = {
        "turn_number": turn_number,
        "question": follow_up_question,
        "is_followup": True,
        "orchestration_id": None,
        "strategist_output": strat_output.model_dump(mode="json") if strat_output else None,
        "analyst_outputs": analyst_outputs,
        "cost_cents": strat_cost,
        "latency_ms": total_latency,
    }

    session.turns = existing_turns + [turn]
    session.total_cost_cents = (session.total_cost_cents or 0) + strat_cost
    await db.commit()
    await db.refresh(session)

    if strat_cost > 0:
        await record_cost(owner.id, strat_cost, db)

    log.info(
        "session_followup",
        session_id=str(session.id),
        turn=turn_number,
        cost_cents=strat_cost,
        latency_ms=total_latency,
    )

    return SessionTurnResult(
        session_id=session.id,
        turn_number=turn_number,
        question=follow_up_question,
        is_followup=True,
        strategist_output=strat_output,
        needs_clarification=False,
        clarifying_question=None,
        analyst_outputs=analyst_outputs,
        cost_cents=strat_cost,
        latency_ms=total_latency,
        status="completed" if strat_output else "error",
    )
