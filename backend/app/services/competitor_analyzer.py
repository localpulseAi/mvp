"""
Competitor Analyzer service — runs the Competitor Analyst agent for an owner's full set
and persists results to CompetitorAnalysis rows.

Called by:
  - POST /competitors/analyze-all (manual trigger)
  - app/tasks/competitor_cron.py (bi-weekly)
"""
import unicodedata
import uuid
from datetime import date, datetime, timezone, timedelta
from typing import Optional

import structlog
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.competitor_analyst import CompetitorAnalyst
from app.agents.schemas import (
    AgentInput,
    OwnerProfile,
    TimeWindow,
    CompetitorAnalystOutput,
    CompetitorAssessment,
)
from app.models.competitor import Competitor, CompetitorAnalysis
from app.models.owner import Owner
from app.services.competitor_service import get_competitors
from app.tools.competitor_data import competitor_data_tool
from app.tools.registry import ToolRegistry

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


def _normalize_name(s: str) -> str:
    """Normalize unicode and lowercase for fuzzy matching."""
    return unicodedata.normalize("NFC", s).lower().strip()


def _ascii_words(s: str) -> set[str]:
    """Return the set of ASCII word tokens from a string."""
    return {w for w in s.encode("ascii", "ignore").decode().lower().split() if w}


def _match_competitor(
    assessment: CompetitorAssessment,
    name_map: dict[str, Competitor],
) -> Optional[Competitor]:
    """Best-effort name match between analyst output and DB rows."""
    target = _normalize_name(assessment.competitor_name)
    if target in name_map:
        return name_map[target]
    for name, comp in name_map.items():
        if name in target or target in name:
            return comp
    # ASCII-only fallback — handles unicode rendering differences
    target_words = _ascii_words(target)
    if target_words:
        for name, comp in name_map.items():
            overlap = target_words & _ascii_words(name)
            if len(overlap) >= min(2, len(target_words)):
                return comp
    return None


async def get_latest_analysis(
    competitor_id: uuid.UUID,
    owner_id: uuid.UUID,
    db: AsyncSession,
) -> Optional[CompetitorAnalysis]:
    result = await db.execute(
        select(CompetitorAnalysis)
        .where(
            and_(
                CompetitorAnalysis.competitor_id == competitor_id,
                CompetitorAnalysis.owner_id == owner_id,
            )
        )
        .order_by(desc(CompetitorAnalysis.generated_at))
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_all_analyses(
    owner_id: uuid.UUID,
    db: AsyncSession,
) -> list[CompetitorAnalysis]:
    """Return latest analysis per competitor for an owner."""
    competitors = await get_competitors(owner_id, db)
    analyses = []
    for comp in competitors:
        analysis = await get_latest_analysis(comp.id, owner_id, db)
        if analysis:
            analyses.append(analysis)
    return analyses


async def generate_set_analysis(owner: Owner, db: AsyncSession) -> dict:
    """
    Run the Competitor Analyst agent for the owner's full competitor set.
    Persists a CompetitorAnalysis row for each matched competitor.
    Returns a structured result dict.
    """
    week_start, week_end = _current_week()
    profile = _owner_to_profile(owner)

    input_data = AgentInput(
        owner_profile=profile,
        time_window=TimeWindow(week_start=week_start, week_end=week_end),
    )

    registry = ToolRegistry()
    registry.register(competitor_data_tool)

    agent = CompetitorAnalyst()
    result = await agent.run(input_data, registry, db, budget_remaining_cents=500)

    if result.status not in ("success", "validation_retry") or not result.output:
        log.error(
            "competitor_analysis_failed",
            owner_id=str(owner.id),
            status=result.status,
            error=result.error_message,
        )
        return {
            "status": "error",
            "error": result.error_message or "Agent run failed",
            "agent_status": result.status,
        }

    output: CompetitorAnalystOutput = result.output

    # Match analyst assessments to DB competitor rows
    competitors = await get_competitors(owner.id, db)
    name_map = {_normalize_name(c.name): c for c in competitors}

    period_start = datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc)
    period_end = datetime.combine(week_end, datetime.max.time()).replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)

    analyses_created = 0
    for assessment in output.per_competitor:
        comp = _match_competitor(assessment, name_map)
        if not comp:
            log.warning(
                "competitor_analysis_no_match",
                name=assessment.competitor_name,
                owner_id=str(owner.id),
            )
            continue

        analysis = CompetitorAnalysis(
            competitor_id=comp.id,
            owner_id=owner.id,
            period_start=period_start,
            period_end=period_end,
            generated_at=now,
            positioning_summary=assessment.positioning_summary,
            strengths={"items": assessment.strengths},
            vulnerabilities={"items": assessment.vulnerabilities},
            recent_shifts=assessment.recent_shifts,
            strategic_implication=assessment.strategic_implication,
            data_freshness=output.data_freshness,
            model_used=result.model_used,
            latency_ms=result.latency_ms,
            cost_cents=result.cost_cents,
        )
        db.add(analysis)
        analyses_created += 1

    await db.commit()

    log.info(
        "competitor_analysis_generated",
        owner_id=str(owner.id),
        analyses=analyses_created,
        cost_cents=result.cost_cents,
        latency_ms=result.latency_ms,
    )

    return {
        "status": "completed",
        "analyses_created": analyses_created,
        "per_competitor": [a.model_dump(mode="json") for a in output.per_competitor],
        "cross_competitor_patterns": [p.model_dump(mode="json") for p in output.cross_competitor_patterns],
        "top_observations": output.top_observations,
        "latency_ms": result.latency_ms,
        "cost_cents": result.cost_cents,
    }
