"""
market_data_retrieval tool — fetches occasion calendar and market signals for an owner's niche.

Called by: Market Analyst agent
Returns: occasions (upcoming), weather context (stub for now), local events (stub).
"""
from datetime import date, timedelta
from typing import Any
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.market import CalgaryOccasion
from app.tools.registry import ToolDefinition

log = structlog.get_logger()

NICHE_RELEVANCE_FIELDS = {
    "restaurant": "relevance_restaurant",
    "cafe": "relevance_cafe",
    "bar": "relevance_bar",
    "retail": "relevance_retail",
    "fitness": "relevance_fitness",
}


async def _market_data_handler(args: dict, db: AsyncSession) -> dict:
    niche = str(args.get("niche", "restaurant")).lower()
    week_start_str = args.get("week_start")
    week_end_str = args.get("week_end")
    include_occasions = bool(args.get("include_occasions", True))

    try:
        week_start = date.fromisoformat(week_start_str) if week_start_str else date.today()
        week_end = date.fromisoformat(week_end_str) if week_end_str else week_start + timedelta(days=6)
    except (ValueError, TypeError):
        week_start = date.today()
        week_end = week_start + timedelta(days=6)

    occasions = []
    if include_occasions:
        relevance_field = NICHE_RELEVANCE_FIELDS.get(niche, "relevance_restaurant")
        result = await db.execute(
            select(CalgaryOccasion).where(CalgaryOccasion.is_active == True)
        )
        all_occasions = result.scalars().all()

        # Include occasions in the window plus 30 days ahead for forward planning
        look_ahead_end = week_end + timedelta(days=30)
        current_year = week_start.year

        for occ in all_occasions:
            if not occ.month or not occ.day:
                continue
            try:
                occ_date = date(current_year, occ.month, occ.day)
                if occ_date < week_start:
                    occ_date = date(current_year + 1, occ.month, occ.day)
            except ValueError:
                continue
            if occ_date > look_ahead_end:
                continue

            relevance = getattr(occ, relevance_field, 0.5)
            if relevance < 0.2:
                continue

            days_out = (occ_date - week_start).days
            occasions.append({
                "name": occ.name,
                "date": occ_date.isoformat(),
                "days_out": days_out,
                "category": occ.category,
                "demand_signal": occ.demand_signal,
                "relevance": relevance,
                "lead_time_days": occ.lead_time_days,
                "in_lead_window": days_out <= occ.lead_time_days,
                "notes": occ.calgary_notes,
            })

        occasions.sort(key=lambda x: x["days_out"])

    return {
        "niche": niche,
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "occasions": occasions,
        "weather": None,    # Open-Meteo integration — Week 7+
        "local_events": [], # Eventbrite integration — Week 7+
        "trends": None,     # Google Trends integration — Week 7+
        "data_freshness": {
            "occasions": "current",
            "weather": "unavailable",
            "local_events": "unavailable",
            "trends": "unavailable",
        },
    }


market_data_tool = ToolDefinition(
    name="market_data_retrieval",
    version="1.0",
    description=(
        "Retrieve market-level signals for the owner's niche and time window. "
        "Returns upcoming occasions (seasonal events, holidays, local observances), "
        "weather context, local events, and trend signals. "
        "Always call this first to ground your analysis in current market data."
    ),
    input_schema={
        "type": "object",
        "properties": {
            "niche": {
                "type": "string",
                "description": "Business niche: restaurant, cafe, bar, retail, or fitness",
                "enum": ["restaurant", "cafe", "bar", "retail", "fitness"],
            },
            "week_start": {
                "type": "string",
                "description": "ISO date for the start of the analysis window (e.g. 2026-05-18)",
            },
            "week_end": {
                "type": "string",
                "description": "ISO date for the end of the analysis window (e.g. 2026-05-24)",
            },
            "include_occasions": {
                "type": "boolean",
                "description": "Whether to include the occasions calendar (default true)",
                "default": True,
            },
        },
        "required": ["niche", "week_start", "week_end"],
    },
    handler=_market_data_handler,
)
