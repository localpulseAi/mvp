"""
Agent-facing data retrieval — Week 4.

These are the query tools that Week 5+ agents will call.
All return structured dicts — no raw scrape data exposed.

Available tools:
  get_changes_for_competitor(competitor_id, owner_id, window_days)
  get_cross_competitor_patterns(owner_id, window_days)
  get_competitor_summary(competitor_id, owner_id)
  get_all_competitor_changes(owner_id, window_days, severity)
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import structlog
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competitor import Competitor, CompetitorScrape
from app.models.changes import CompetitorChangeEvent, CrossCompetitorPattern

log = structlog.get_logger()


async def get_changes_for_competitor(
    competitor_id: uuid.UUID,
    owner_id: uuid.UUID,
    db: AsyncSession,
    window_days: int = 30,
    limit: int = 20,
) -> dict:
    """
    Return recent change events for one competitor.
    Used by: Competitor Analyst agent, competitor detail page.
    """
    since = datetime.now(timezone.utc) - timedelta(days=window_days)

    result = await db.execute(
        select(CompetitorChangeEvent)
        .where(
            and_(
                CompetitorChangeEvent.competitor_id == competitor_id,
                CompetitorChangeEvent.owner_id == owner_id,
                CompetitorChangeEvent.detected_at >= since,
            )
        )
        .order_by(desc(CompetitorChangeEvent.detected_at))
        .limit(limit)
    )
    events = result.scalars().all()

    # Also get competitor name
    comp_result = await db.execute(
        select(Competitor.name).where(Competitor.id == competitor_id)
    )
    name = comp_result.scalar_one_or_none() or "Unknown"

    return {
        "competitor_id": str(competitor_id),
        "competitor_name": name,
        "window_days": window_days,
        "change_count": len(events),
        "changes": [
            {
                "type": e.change_type,
                "source": e.source,
                "severity": e.severity,
                "description": e.description,
                "before": e.before_value,
                "after": e.after_value,
                "detected_at": e.detected_at.isoformat(),
                "window_days": e.window_days,
            }
            for e in events
        ],
    }


async def get_all_competitor_changes(
    owner_id: uuid.UUID,
    db: AsyncSession,
    window_days: int = 7,
    severity: Optional[str] = None,
    limit: int = 50,
) -> dict:
    """
    Return all recent changes across an owner's full competitor set.
    Used by: Weekly Brief generation, dashboard feed.
    """
    since = datetime.now(timezone.utc) - timedelta(days=window_days)

    filters = [
        CompetitorChangeEvent.owner_id == owner_id,
        CompetitorChangeEvent.detected_at >= since,
    ]
    if severity:
        filters.append(CompetitorChangeEvent.severity == severity)

    result = await db.execute(
        select(CompetitorChangeEvent)
        .where(and_(*filters))
        .order_by(desc(CompetitorChangeEvent.detected_at))
        .limit(limit)
    )
    events = result.scalars().all()

    # Group by competitor
    by_competitor: dict[str, list] = {}
    for e in events:
        cid = str(e.competitor_id)
        by_competitor.setdefault(cid, []).append({
            "type": e.change_type,
            "source": e.source,
            "severity": e.severity,
            "description": e.description,
            "detected_at": e.detected_at.isoformat(),
        })

    return {
        "owner_id": str(owner_id),
        "window_days": window_days,
        "total_changes": len(events),
        "high_severity_count": sum(1 for e in events if e.severity == "high"),
        "by_competitor": by_competitor,
        "flat": [
            {
                "competitor_id": str(e.competitor_id),
                "type": e.change_type,
                "source": e.source,
                "severity": e.severity,
                "description": e.description,
                "detected_at": e.detected_at.isoformat(),
            }
            for e in events
        ],
    }


async def get_cross_competitor_patterns(
    owner_id: uuid.UUID,
    db: AsyncSession,
    window_days: int = 7,
    limit: int = 10,
) -> dict:
    """
    Return cross-competitor patterns for an owner's tracked set.
    Used by: Market Analyst agent, Weekly Brief, dashboard.
    """
    since = datetime.now(timezone.utc) - timedelta(days=window_days)

    result = await db.execute(
        select(CrossCompetitorPattern)
        .where(
            and_(
                CrossCompetitorPattern.owner_id == owner_id,
                CrossCompetitorPattern.detected_at >= since,
            )
        )
        .order_by(desc(CrossCompetitorPattern.detected_at))
        .limit(limit)
    )
    patterns = result.scalars().all()

    return {
        "owner_id": str(owner_id),
        "window_days": window_days,
        "pattern_count": len(patterns),
        "patterns": [
            {
                "type": p.pattern_type,
                "severity": p.severity,
                "description": p.description,
                "strategic_implication": p.strategic_implication,
                "competitor_names": p.competitor_names.get("names", []),
                "detected_at": p.detected_at.isoformat(),
            }
            for p in patterns
        ],
    }


async def get_competitor_summary(
    competitor_id: uuid.UUID,
    owner_id: uuid.UUID,
    db: AsyncSession,
) -> dict:
    """
    Return a structured summary of a competitor: latest scrape stats + recent changes.
    Used by: Competitor Analyst agent, competitor detail page.
    """
    # Competitor record
    comp_result = await db.execute(
        select(Competitor).where(
            and_(Competitor.id == competitor_id, Competitor.owner_id == owner_id)
        )
    )
    competitor = comp_result.scalar_one_or_none()
    if not competitor:
        return {"error": "Competitor not found"}

    # Latest normalised scrape per source
    latest_by_source: dict[str, dict] = {}
    sources_result = await db.execute(
        select(CompetitorScrape)
        .where(
            and_(
                CompetitorScrape.competitor_id == competitor_id,
                CompetitorScrape.success == True,
                CompetitorScrape.normalised_data.isnot(None),
            )
        )
        .order_by(desc(CompetitorScrape.scraped_at))
        .limit(20)
    )
    scrapes = sources_result.scalars().all()

    for scrape in scrapes:
        if scrape.source not in latest_by_source:
            nd = scrape.normalised_data or {}
            latest_by_source[scrape.source] = {
                "stats": nd.get("stats", {}),
                "scraped_at": scrape.scraped_at.isoformat(),
            }

    # Recent changes (30d)
    changes_data = await get_changes_for_competitor(competitor_id, owner_id, db, window_days=30)

    return {
        "competitor": {
            "id": str(competitor.id),
            "name": competitor.name,
            "instagram_handle": competitor.instagram_handle,
            "facebook_page": competitor.facebook_page,
            "baseline_complete": competitor.baseline_complete,
        },
        "latest_data": latest_by_source,
        "recent_changes": changes_data["changes"],
        "change_count_30d": changes_data["change_count"],
        "data_freshness": {
            source: data["scraped_at"]
            for source, data in latest_by_source.items()
        },
    }
