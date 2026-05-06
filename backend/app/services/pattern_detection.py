"""
Cross-competitor pattern detection — Week 4.

Finds what 3+ competitors in an owner's tracked set are doing in common.
Runs after change detection and writes CrossCompetitorPattern rows.

Patterns detected:
  simultaneous_promos   — 3+ competitors running promotional posts/ads at once
  ad_wave               — 3+ competitors running Meta Ads simultaneously
  hashtag_cluster       — 3+ competitors using the same hashtag in recent posts
  cadence_drop          — 3+ competitors posting less frequently (market signal)
  review_surge          — 3+ competitors getting unusual review volume
"""
import uuid
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional

import structlog
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competitor import Competitor, CompetitorScrape
from app.models.changes import CrossCompetitorPattern, CompetitorChangeEvent

log = structlog.get_logger()

PATTERN_WINDOW_DAYS = 7   # look at the last 7 days for cross-competitor patterns
MIN_COMPETITORS_FOR_PATTERN = 3


@dataclass
class PatternResult:
    pattern_type: str
    severity: str
    window_days: int
    description: str
    strategic_implication: str
    competitor_ids: list[str]
    competitor_names: list[str]
    evidence: dict = field(default_factory=dict)


# ── Detectors ─────────────────────────────────────────────────────────────────

def detect_simultaneous_promos(
    competitor_stats: list[dict],   # [{id, name, stats}]
    window_days: int,
) -> list[PatternResult]:
    """3+ competitors running promotional posts simultaneously."""
    promo_competitors = [
        c for c in competitor_stats
        if c["stats"].get("promotional_post_count", 0) > 0
    ]
    if len(promo_competitors) < MIN_COMPETITORS_FOR_PATTERN:
        return []

    names = [c["name"] for c in promo_competitors]
    return [PatternResult(
        pattern_type="simultaneous_promos",
        severity="high",
        window_days=window_days,
        description=f"{len(promo_competitors)} of your tracked competitors are running promotions right now: "
                    f"{', '.join(names)}",
        strategic_implication="Market is in promo mode. Adding another discount erodes the signal "
                              "and risks anchoring customer price expectations downward. "
                              "Consider a value-add offer instead, or hold until the promo wave passes.",
        competitor_ids=[c["id"] for c in promo_competitors],
        competitor_names=names,
        evidence={"promo_counts": {c["name"]: c["stats"]["promotional_post_count"] for c in promo_competitors}},
    )]


def detect_ad_wave(
    competitor_stats: list[dict],
    window_days: int,
) -> list[PatternResult]:
    """3+ competitors running Meta Ads at the same time."""
    ad_competitors = [
        c for c in competitor_stats
        if c["stats"].get("active_ad_count", 0) > 0
    ]
    if len(ad_competitors) < MIN_COMPETITORS_FOR_PATTERN:
        return []

    names = [c["name"] for c in ad_competitors]
    return [PatternResult(
        pattern_type="ad_wave",
        severity="high",
        window_days=window_days,
        description=f"{len(ad_competitors)} competitors running Meta Ads simultaneously: {', '.join(names)}",
        strategic_implication="Paid social spend is elevated across the competitive set. "
                              "Organic reach will be suppressed. This is a good time to focus on "
                              "owned channels (email, in-restaurant) or ensure your Meta creative "
                              "is meaningfully differentiated.",
        competitor_ids=[c["id"] for c in ad_competitors],
        competitor_names=names,
        evidence={"active_ads": {c["name"]: c["stats"]["active_ad_count"] for c in ad_competitors}},
    )]


def detect_hashtag_cluster(
    competitor_posts: list[dict],   # [{id, name, hashtags}]
    window_days: int,
) -> list[PatternResult]:
    """3+ competitors using the same hashtag (coordinated campaign or trend)."""
    patterns: list[PatternResult] = []

    # Build hashtag → competitor mapping
    tag_to_competitors: dict[str, list[dict]] = {}
    for c in competitor_posts:
        for tag in c.get("hashtags", []):
            tag_to_competitors.setdefault(tag, []).append(c)

    # Filter to tags used by 3+ competitors
    shared_tags = {
        tag: competitors
        for tag, competitors in tag_to_competitors.items()
        if len(competitors) >= MIN_COMPETITORS_FOR_PATTERN
        and len(tag) > 3  # skip very short/generic tags
    }

    for tag, competitors in shared_tags.items():
        names = list({c["name"] for c in competitors})
        patterns.append(PatternResult(
            pattern_type="hashtag_cluster",
            severity="medium",
            window_days=window_days,
            description=f"#{tag} is being used by {len(names)} competitors: {', '.join(names)}",
            strategic_implication=f"#{tag} is trending in your competitive set. "
                                  "Joining the conversation could boost organic reach, "
                                  "but assess whether the association fits your brand before using it.",
            competitor_ids=list({c["id"] for c in competitors}),
            competitor_names=names,
            evidence={"tag": f"#{tag}", "competitor_count": len(names)},
        ))

    return patterns


def detect_cadence_drop(
    change_events: list[CompetitorChangeEvent],
    competitors: list[Competitor],
    window_days: int,
) -> list[PatternResult]:
    """3+ competitors posting significantly less (collective market slowdown signal)."""
    drop_competitor_ids = {
        str(e.competitor_id) for e in change_events
        if e.change_type == "posting_cadence_down" and e.window_days == window_days
    }
    if len(drop_competitor_ids) < MIN_COMPETITORS_FOR_PATTERN:
        return []

    names = [c.name for c in competitors if str(c.id) in drop_competitor_ids]
    return [PatternResult(
        pattern_type="cadence_drop",
        severity="low",
        window_days=window_days,
        description=f"{len(drop_competitor_ids)} competitors posting less frequently than their baseline",
        strategic_implication="Reduced activity across competitors may signal low consumer demand or a "
                              "seasonal trough. This could be an opportunity to stand out with consistent "
                              "posting when competitors go quiet.",
        competitor_ids=list(drop_competitor_ids),
        competitor_names=names,
        evidence={"affected_competitors": names},
    )]


# ── Orchestrator ──────────────────────────────────────────────────────────────

async def run_pattern_detection(
    owner_id: uuid.UUID,
    competitors: list[Competitor],
    db: AsyncSession,
) -> list[CrossCompetitorPattern]:
    """
    Run all cross-competitor pattern detectors for an owner's full competitor set.
    Writes CrossCompetitorPattern rows. Returns newly written rows.
    """
    if len(competitors) < MIN_COMPETITORS_FOR_PATTERN:
        return []

    now = datetime.now(timezone.utc)
    period_start = now - timedelta(days=PATTERN_WINDOW_DAYS)

    # Load recent scrapes for all competitors
    competitor_ids = [c.id for c in competitors]
    result = await db.execute(
        select(CompetitorScrape)
        .where(
            and_(
                CompetitorScrape.competitor_id.in_(competitor_ids),
                CompetitorScrape.success == True,
                CompetitorScrape.scraped_at >= period_start,
                CompetitorScrape.normalised_data.isnot(None),
            )
        )
    )
    recent_scrapes = list(result.scalars().all())

    # Build per-competitor stats
    id_to_competitor = {c.id: c for c in competitors}
    competitor_stats: list[dict] = []
    competitor_posts: list[dict] = []

    for comp in competitors:
        comp_scrapes = [s for s in recent_scrapes if s.competitor_id == comp.id]
        merged_stats: dict = {}
        all_hashtags: list[str] = []

        for scrape in comp_scrapes:
            nd = scrape.normalised_data or {}
            stats = nd.get("stats", {})
            for k, v in stats.items():
                if isinstance(v, (int, float)):
                    merged_stats[k] = merged_stats.get(k, 0) + v
                elif k == "top_hashtags" and isinstance(v, list):
                    all_hashtags.extend(v)

        competitor_stats.append({
            "id": str(comp.id),
            "name": comp.name,
            "stats": merged_stats,
        })
        competitor_posts.append({
            "id": str(comp.id),
            "name": comp.name,
            "hashtags": list(set(all_hashtags)),
        })

    # Load recent change events for cadence detection
    ce_result = await db.execute(
        select(CompetitorChangeEvent)
        .where(
            and_(
                CompetitorChangeEvent.owner_id == owner_id,
                CompetitorChangeEvent.detected_at >= period_start,
            )
        )
    )
    recent_changes = list(ce_result.scalars().all())

    # Run detectors
    all_patterns: list[PatternResult] = []
    all_patterns += detect_simultaneous_promos(competitor_stats, PATTERN_WINDOW_DAYS)
    all_patterns += detect_ad_wave(competitor_stats, PATTERN_WINDOW_DAYS)
    all_patterns += detect_hashtag_cluster(competitor_posts, PATTERN_WINDOW_DAYS)
    all_patterns += detect_cadence_drop(recent_changes, competitors, PATTERN_WINDOW_DAYS)

    # Persist (with dedup)
    new_rows: list[CrossCompetitorPattern] = []
    for pattern in all_patterns:
        dedup_key = f"{owner_id}:{pattern.pattern_type}:{period_start.strftime('%Y-%m-%d')}"
        existing = await db.execute(
            select(CrossCompetitorPattern.id)
            .where(CrossCompetitorPattern.dedup_key == dedup_key)
            .limit(1)
        )
        if existing.scalar_one_or_none():
            continue

        row = CrossCompetitorPattern(
            owner_id=owner_id,
            pattern_type=pattern.pattern_type,
            severity=pattern.severity,
            window_days=pattern.window_days,
            description=pattern.description,
            strategic_implication=pattern.strategic_implication,
            competitor_ids={"ids": pattern.competitor_ids},
            competitor_names={"names": pattern.competitor_names},
            evidence=pattern.evidence,
            dedup_key=dedup_key,
        )
        db.add(row)
        new_rows.append(row)

    if new_rows:
        await db.commit()
        log.info("pattern_detection_done", owner_id=str(owner_id), new_patterns=len(new_rows))

    return new_rows
