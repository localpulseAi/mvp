"""
competitor_data_retrieval tool — fetches competitor change events, patterns, and summaries.

Called by: Competitor Analyst agent
Returns: per-competitor summaries, change events, cross-competitor patterns.
"""
import uuid
import structlog
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competitor import Competitor
from app.services.data_retrieval import (
    get_all_competitor_changes,
    get_cross_competitor_patterns,
    get_competitor_summary,
)
from app.tools.registry import ToolDefinition

log = structlog.get_logger()


async def _competitor_data_handler(args: dict, db: AsyncSession) -> dict:
    owner_id_str = args.get("owner_id", "")
    window_days = int(args.get("window_days", 7))
    include_changes = bool(args.get("include_changes", True))
    include_patterns = bool(args.get("include_patterns", True))
    include_summaries = bool(args.get("include_summaries", True))

    try:
        owner_id = uuid.UUID(owner_id_str)
    except (ValueError, AttributeError):
        return {"error": "Invalid owner_id"}

    result = await db.execute(
        select(Competitor).where(
            and_(Competitor.owner_id == owner_id, Competitor.is_active == True)
        )
    )
    competitors = result.scalars().all()

    if not competitors:
        return {
            "owner_id": owner_id_str,
            "competitor_count": 0,
            "competitors": [],
            "changes": {},
            "patterns": [],
            "data_freshness": {},
        }

    changes = {}
    if include_changes:
        changes_data = await get_all_competitor_changes(owner_id, db, window_days=window_days)
        changes = changes_data

    patterns = []
    if include_patterns:
        patterns_data = await get_cross_competitor_patterns(owner_id, db, window_days=window_days)
        patterns = patterns_data.get("patterns", [])

    summaries = []
    data_freshness = {}
    if include_summaries:
        for comp in competitors:
            summary = await get_competitor_summary(comp.id, owner_id, db)
            summaries.append(summary)
            if "data_freshness" in summary:
                data_freshness[comp.name] = summary["data_freshness"]

    return {
        "owner_id": owner_id_str,
        "window_days": window_days,
        "competitor_count": len(competitors),
        "competitors": summaries,
        "changes": changes,
        "patterns": patterns,
        "data_freshness": data_freshness,
    }


competitor_data_tool = ToolDefinition(
    name="competitor_data_retrieval",
    version="1.0",
    description=(
        "Retrieve competitor intelligence for an owner's tracked competitor set. "
        "Returns per-competitor summaries (positioning, recent stats, change history), "
        "change events across all competitors, and cross-competitor patterns "
        "(what 3+ competitors are doing simultaneously). "
        "Always call this to ground competitor analysis in actual scraped data."
    ),
    input_schema={
        "type": "object",
        "properties": {
            "owner_id": {
                "type": "string",
                "description": "UUID of the owner whose competitors to retrieve",
            },
            "window_days": {
                "type": "integer",
                "description": "How many days back to look for changes (default 7)",
                "default": 7,
            },
            "include_changes": {
                "type": "boolean",
                "description": "Include per-competitor change events (default true)",
                "default": True,
            },
            "include_patterns": {
                "type": "boolean",
                "description": "Include cross-competitor patterns (default true)",
                "default": True,
            },
            "include_summaries": {
                "type": "boolean",
                "description": "Include per-competitor data summaries (default true)",
                "default": True,
            },
        },
        "required": ["owner_id"],
    },
    handler=_competitor_data_handler,
)
