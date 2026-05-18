"""
Competitor data retrieval API — Week 4 + Week 7.
Exposes the data_retrieval service and AI analysis as HTTP endpoints.
These are what the frontend dashboard and (later) agent tools call.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.owner import Owner
from app.models.competitor import Competitor
from app.services.auth_service import get_current_owner
from app.services.competitor_service import get_competitor, get_competitors
from app.services.change_detection import run_change_detection
from app.services.pattern_detection import run_pattern_detection
from app.services.data_retrieval import (
    get_changes_for_competitor,
    get_all_competitor_changes,
    get_cross_competitor_patterns,
    get_competitor_summary,
)
from app.services.competitor_analyzer import get_all_analyses
from sqlalchemy import select, and_

router = APIRouter(prefix="/competitor-data", tags=["competitor-data"])


@router.get("/changes")
async def all_changes(
    window_days: int = Query(default=7, ge=1, le=90),
    severity: Optional[str] = Query(default=None, pattern="^(high|medium|low)$"),
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    All competitor changes across the owner's tracked set for a given window.
    Used by: dashboard, Weekly Brief generation.
    """
    return await get_all_competitor_changes(
        owner_id=owner.id,
        db=db,
        window_days=window_days,
        severity=severity,
    )


@router.get("/patterns")
async def cross_patterns(
    window_days: int = Query(default=7, ge=1, le=90),
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Cross-competitor patterns (shared promos, ad waves, hashtag clusters).
    Used by: dashboard, Market Analyst agent.
    """
    return await get_cross_competitor_patterns(
        owner_id=owner.id,
        db=db,
        window_days=window_days,
    )


@router.get("/{competitor_id}/summary")
async def competitor_summary(
    competitor_id: uuid.UUID,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Full structured summary for one competitor.
    Used by: competitor detail page, Competitor Analyst agent.
    """
    return await get_competitor_summary(competitor_id, owner.id, db)


@router.get("/{competitor_id}/changes")
async def competitor_changes(
    competitor_id: uuid.UUID,
    window_days: int = Query(default=30, ge=1, le=90),
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """Changes for a single competitor over the specified window."""
    return await get_changes_for_competitor(competitor_id, owner.id, db, window_days=window_days)


@router.get("/analysis")
async def all_analyses(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Latest AI analysis for each competitor in the owner's tracked set.
    Used by: competitor intelligence page, Weekly Brief sidebar.
    """
    analyses = await get_all_analyses(owner.id, db)
    return {
        "analyses": [
            {
                "id": str(a.id),
                "competitor_id": str(a.competitor_id),
                "generated_at": a.generated_at.isoformat(),
                "positioning_summary": a.positioning_summary,
                "strengths": (a.strengths or {}).get("items", []),
                "vulnerabilities": (a.vulnerabilities or {}).get("items", []),
                "recent_shifts": a.recent_shifts,
                "strategic_implication": a.strategic_implication,
                "data_freshness": a.data_freshness,
            }
            for a in analyses
        ],
        "total": len(analyses),
    }


@router.post("/run-detection")
async def trigger_detection(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger change detection + pattern detection for all competitors.
    Returns a summary of what was detected.
    In production this runs automatically after every scrape cycle.
    """
    competitors_list = await get_competitors(owner.id, db)
    if not competitors_list:
        return {"message": "No active competitors.", "events": 0, "patterns": 0}

    total_events = 0
    for competitor in competitors_list:
        events = await run_change_detection(competitor, owner.id, db)
        total_events += len(events)

    patterns = await run_pattern_detection(owner.id, competitors_list, db)

    return {
        "message": "Detection complete.",
        "competitors_scanned": len(competitors_list),
        "new_change_events": total_events,
        "new_patterns": len(patterns),
    }
