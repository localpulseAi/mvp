from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.market import CalgaryOccasion
from app.models.owner import Owner
from app.services.auth_service import get_current_owner
import structlog

router = APIRouter(prefix="/market", tags=["market"])
log = structlog.get_logger()


@router.get("/occasions")
async def get_occasions(
    niche: Optional[str] = Query(default="restaurant"),
    weeks_ahead: int = Query(default=12, ge=1, le=52),
    db: AsyncSession = Depends(get_db),
    owner: Owner = Depends(get_current_owner),
):
    """
    Week 2 deliverable: Return Calgary occasions relevant to the owner's niche
    for the next N weeks, ranked by relevance weight.
    """
    today = date.today()
    window_end = today + timedelta(weeks=weeks_ahead)

    result = await db.execute(
        select(CalgaryOccasion)
        .where(CalgaryOccasion.is_active == True)
        .order_by(CalgaryOccasion.month, CalgaryOccasion.day)
    )
    all_occasions = result.scalars().all()

    # Filter to upcoming occasions and attach relevance weight
    niche_field_map = {
        "restaurant": "relevance_restaurant",
        "cafe": "relevance_cafe",
        "bar": "relevance_bar",
        "retail": "relevance_retail",
        "fitness": "relevance_fitness",
    }
    relevance_field = niche_field_map.get(niche.lower(), "relevance_restaurant")

    upcoming = []
    current_year = today.year
    for occ in all_occasions:
        if not occ.month or not occ.day:
            continue
        occ_date = date(current_year, occ.month, occ.day)
        if occ_date < today:
            # Try next year
            try:
                occ_date = date(current_year + 1, occ.month, occ.day)
            except ValueError:
                continue
        if occ_date > window_end:
            continue

        days_out = (occ_date - today).days
        relevance = getattr(occ, relevance_field, 0.5)
        if relevance < 0.2:  # Skip very low relevance occasions
            continue

        upcoming.append({
            "id": str(occ.id),
            "name": occ.name,
            "date": occ_date.isoformat(),
            "days_out": days_out,
            "category": occ.category,
            "demand_signal": occ.demand_signal,
            "relevance": relevance,
            "lead_time_days": occ.lead_time_days,
            "calgary_notes": occ.calgary_notes,
            "in_lead_window": days_out <= occ.lead_time_days,
        })

    # Sort by days_out ascending
    upcoming.sort(key=lambda x: x["days_out"])

    log.info("occasions_fetched", owner_id=str(owner.id), count=len(upcoming), niche=niche)
    return {"occasions": upcoming, "generated_for": niche, "as_of": today.isoformat()}


@router.get("/signals")
async def get_market_signals(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Week 2 deliverable: Return all market-level signals for the current week
    relevant to this owner's niche. Combines occasions, weather, events, trends.
    """
    niche = owner.niche or "restaurant"

    # In production: pull from MarketSignalCache or regenerate if stale
    # For now: return stub structure that agents will populate
    return {
        "owner_id": str(owner.id),
        "niche": niche,
        "week_start": date.today().isoformat(),
        "signals": {
            "occasions": [],     # populated by occasions endpoint
            "weather": None,     # populated by weather service (Open-Meteo)
            "local_events": [],  # populated by events service
            "trends": None,      # populated by Google Trends service
        },
        "note": "Signal data is generated fresh on Brief generation and Strategy Session dispatch.",
    }
