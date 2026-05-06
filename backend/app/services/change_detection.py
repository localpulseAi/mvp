"""
Change detection pipeline — Week 4.

Compares a competitor's current normalised data against baselines at
7 / 30 / 60 / 90 day windows and emits CompetitorChangeEvent rows.

Design:
- Each detector function takes (current_stats, baseline_stats, window_days)
  and returns a list of ChangeSignal dataclasses.
- The orchestrator loads scrapes, builds stats per window, runs detectors,
  deduplicates against recent events, and writes new rows.
"""
import uuid
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional

import structlog
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competitor import Competitor, CompetitorScrape
from app.models.changes import CompetitorChangeEvent

log = structlog.get_logger()

DETECTION_WINDOWS = [7, 30, 60, 90]  # days


@dataclass
class ChangeSignal:
    change_type: str
    source: str
    severity: str        # high | medium | low
    window_days: int
    description: str
    before_value: Optional[float] = None
    after_value: Optional[float] = None
    detail: dict = field(default_factory=dict)


# ── Detector functions ────────────────────────────────────────────────────────

def detect_posting_cadence(
    current: dict,
    baseline: dict,
    window_days: int,
    source: str,
) -> list[ChangeSignal]:
    """Detect significant change in posts per week."""
    signals = []
    curr_count = current.get("post_count", 0)
    base_count = baseline.get("post_count", 0)
    if base_count == 0:
        return signals

    # Normalise to posts-per-week
    curr_ppw = curr_count / max(window_days / 7, 1)
    base_ppw = base_count / max(window_days / 7, 1)

    if base_ppw == 0:
        return signals

    ratio = curr_ppw / base_ppw
    if ratio >= 1.5:
        signals.append(ChangeSignal(
            change_type="posting_cadence_up",
            source=source,
            severity="medium" if ratio < 2.5 else "high",
            window_days=window_days,
            description=f"Posting frequency up {round((ratio - 1) * 100)}% vs {window_days}d baseline "
                        f"({round(curr_ppw, 1)} vs {round(base_ppw, 1)} posts/week)",
            before_value=round(base_ppw, 2),
            after_value=round(curr_ppw, 2),
        ))
    elif ratio <= 0.5:
        signals.append(ChangeSignal(
            change_type="posting_cadence_down",
            source=source,
            severity="low",
            window_days=window_days,
            description=f"Posting frequency down {round((1 - ratio) * 100)}% vs {window_days}d baseline",
            before_value=round(base_ppw, 2),
            after_value=round(curr_ppw, 2),
        ))
    return signals


def detect_engagement_change(
    current: dict,
    baseline: dict,
    window_days: int,
    source: str,
) -> list[ChangeSignal]:
    """Detect significant change in average engagement per post."""
    signals = []
    curr_eng = current.get("avg_engagement", 0)
    base_eng = baseline.get("avg_engagement", 0)
    if base_eng == 0 or curr_eng == 0:
        return signals

    ratio = curr_eng / base_eng
    if ratio >= 1.4:
        signals.append(ChangeSignal(
            change_type="engagement_rate_up",
            source=source,
            severity="medium",
            window_days=window_days,
            description=f"Avg engagement up {round((ratio - 1) * 100)}% vs {window_days}d baseline "
                        f"({round(curr_eng)} vs {round(base_eng)} per post)",
            before_value=round(base_eng, 1),
            after_value=round(curr_eng, 1),
        ))
    elif ratio <= 0.6:
        signals.append(ChangeSignal(
            change_type="engagement_rate_down",
            source=source,
            severity="low",
            window_days=window_days,
            description=f"Avg engagement down {round((1 - ratio) * 100)}% vs {window_days}d baseline",
            before_value=round(base_eng, 1),
            after_value=round(curr_eng, 1),
        ))
    return signals


def detect_promotional_activity(
    current: dict,
    baseline: dict,
    window_days: int,
    source: str,
) -> list[ChangeSignal]:
    """Detect spike in promotional posts."""
    signals = []
    curr_promo = current.get("promotional_post_count", 0)
    base_promo = baseline.get("promotional_post_count", 0)
    curr_total = current.get("post_count", 1)

    if curr_promo > 0 and (base_promo == 0 or curr_promo / curr_total > 0.3):
        signals.append(ChangeSignal(
            change_type="promotional_post_detected",
            source=source,
            severity="high" if curr_promo >= 3 else "medium",
            window_days=window_days,
            description=f"{curr_promo} promotional post{'s' if curr_promo > 1 else ''} detected "
                        f"in last {window_days} days (baseline: {base_promo})",
            before_value=float(base_promo),
            after_value=float(curr_promo),
        ))
    return signals


def detect_ad_campaigns(
    current: dict,
    baseline: dict,
    window_days: int,
) -> list[ChangeSignal]:
    """Detect new or ended Meta Ad campaigns."""
    signals = []
    curr_active = current.get("active_ad_count", 0)
    base_active = baseline.get("active_ad_count", 0)

    if curr_active > 0 and base_active == 0:
        signals.append(ChangeSignal(
            change_type="new_ad_campaign",
            source="meta_ads",
            severity="high",
            window_days=window_days,
            description=f"New Meta Ads campaign running ({curr_active} active ad{'s' if curr_active > 1 else ''})",
            before_value=0.0,
            after_value=float(curr_active),
        ))
    elif curr_active == 0 and base_active > 0:
        signals.append(ChangeSignal(
            change_type="ad_campaign_ended",
            source="meta_ads",
            severity="low",
            window_days=window_days,
            description=f"Meta Ads campaign ended (had {base_active} active ad{'s' if base_active > 1 else ''})",
            before_value=float(base_active),
            after_value=0.0,
        ))

    # Promotional ads
    curr_promo_ads = current.get("promotional_ad_count", 0)
    if curr_promo_ads > 0:
        signals.append(ChangeSignal(
            change_type="promotional_ad_detected",
            source="meta_ads",
            severity="high",
            window_days=window_days,
            description=f"Promotional ad creative detected ({curr_promo_ads} promotional ad{'s' if curr_promo_ads > 1 else ''})",
            before_value=float(baseline.get("promotional_ad_count", 0)),
            after_value=float(curr_promo_ads),
        ))
    return signals


def detect_review_signals(
    current: dict,
    baseline: dict,
    window_days: int,
) -> list[ChangeSignal]:
    """Detect review volume spikes and rating changes."""
    signals = []
    curr_count = current.get("review_count", 0)
    base_count = baseline.get("review_count", 0)

    # Volume spike: 3x+ more reviews than baseline in same window
    if base_count > 0 and curr_count >= base_count * 3:
        signals.append(ChangeSignal(
            change_type="review_volume_spike",
            source="google_reviews",
            severity="medium",
            window_days=window_days,
            description=f"Review volume spike: {curr_count} reviews vs {base_count} baseline in {window_days}d window",
            before_value=float(base_count),
            after_value=float(curr_count),
        ))

    # Rating change
    curr_rating = current.get("avg_rating", 0)
    base_rating = baseline.get("avg_rating", 0)
    if base_rating > 0 and curr_rating > 0:
        delta = curr_rating - base_rating
        if abs(delta) >= 0.3:
            signals.append(ChangeSignal(
                change_type="rating_up" if delta > 0 else "rating_down",
                source="google_reviews",
                severity="medium",
                window_days=window_days,
                description=f"Rating {'increased' if delta > 0 else 'decreased'} by {abs(round(delta, 1))} "
                            f"({round(base_rating, 1)} → {round(curr_rating, 1)}) over {window_days}d",
                before_value=round(base_rating, 2),
                after_value=round(curr_rating, 2),
            ))
    return signals


def detect_hashtag_clusters(
    current: dict,
    baseline: dict,
    window_days: int,
    source: str,
) -> list[ChangeSignal]:
    """Detect new hashtag clusters (competitor pushing a new theme/promo via tags)."""
    signals = []
    curr_tags = set(current.get("top_hashtags", []))
    base_tags = set(baseline.get("top_hashtags", []))
    new_tags = curr_tags - base_tags

    promo_tag_signals = {
        "deal", "promo", "discount", "sale", "special", "free",
        "happyhour", "limitedtime", "offer", "save",
    }
    new_promo_tags = [t for t in new_tags if any(sig in t for sig in promo_tag_signals)]

    if new_promo_tags:
        signals.append(ChangeSignal(
            change_type="new_hashtag_cluster",
            source=source,
            severity="medium",
            window_days=window_days,
            description=f"New promotional hashtags appeared: {', '.join('#' + t for t in new_promo_tags[:5])}",
            detail={"new_tags": list(new_tags), "new_promo_tags": new_promo_tags},
        ))
    return signals


# ── Stats builder ─────────────────────────────────────────────────────────────

def _merge_stats(scrapes: list[CompetitorScrape], source_filter: str) -> dict:
    """
    Merge normalised stats from multiple scrape rows of the same source
    into a single aggregate dict.
    """
    all_stats: list[dict] = []
    for scrape in scrapes:
        if scrape.source == source_filter and scrape.normalised_data:
            stats = scrape.normalised_data.get("stats", {})
            if stats:
                all_stats.append(stats)

    if not all_stats:
        return {}

    # Average numeric values, sum counts
    merged: dict = {}
    for stats in all_stats:
        for k, v in stats.items():
            if isinstance(v, (int, float)):
                merged[k] = merged.get(k, 0) + v
            elif isinstance(v, list) and k == "top_hashtags":
                existing = merged.get("top_hashtags", [])
                merged["top_hashtags"] = list(set(existing) | set(v))

    # Normalise averages
    count = len(all_stats)
    avg_keys = {"avg_engagement", "avg_rating", "overall_rating", "reply_rate"}
    for k in avg_keys:
        if k in merged:
            merged[k] = merged[k] / count

    return merged


# ── Orchestrator ──────────────────────────────────────────────────────────────

def _dedup_key(competitor_id: uuid.UUID, signal: ChangeSignal, period_start: datetime) -> str:
    date_str = period_start.strftime("%Y-%m-%d")
    return f"{competitor_id}:{signal.change_type}:{signal.source}:{signal.window_days}:{date_str}"


async def _already_emitted(dedup_key: str, db: AsyncSession) -> bool:
    result = await db.execute(
        select(CompetitorChangeEvent.id).where(
            CompetitorChangeEvent.dedup_key == dedup_key
        ).limit(1)
    )
    return result.scalar_one_or_none() is not None


async def run_change_detection(
    competitor: Competitor,
    owner_id: uuid.UUID,
    db: AsyncSession,
) -> list[CompetitorChangeEvent]:
    """
    Run full change detection for one competitor across all windows.
    Returns newly written CompetitorChangeEvent rows.
    """
    now = datetime.now(timezone.utc)
    new_events: list[CompetitorChangeEvent] = []

    # Load all scrapes for this competitor (most recent first)
    result = await db.execute(
        select(CompetitorScrape)
        .where(
            and_(
                CompetitorScrape.competitor_id == competitor.id,
                CompetitorScrape.success == True,
                CompetitorScrape.normalised_data.isnot(None),
            )
        )
        .order_by(CompetitorScrape.scraped_at.desc())
    )
    all_scrapes = list(result.scalars().all())

    if not all_scrapes:
        return []

    sources_to_check = list({s.source for s in all_scrapes})

    for window_days in DETECTION_WINDOWS:
        period_start = now - timedelta(days=window_days)
        current_scrapes = [s for s in all_scrapes if s.scraped_at >= period_start]
        baseline_scrapes = [s for s in all_scrapes if s.scraped_at < period_start]

        if not current_scrapes:
            continue

        for source in sources_to_check:
            current_stats = _merge_stats(current_scrapes, source)
            baseline_stats = _merge_stats(baseline_scrapes, source) if baseline_scrapes else {}

            if not current_stats:
                continue

            # Run detectors
            signals: list[ChangeSignal] = []

            if source in ("instagram", "facebook"):
                signals += detect_posting_cadence(current_stats, baseline_stats, window_days, source)
                signals += detect_engagement_change(current_stats, baseline_stats, window_days, source)
                signals += detect_promotional_activity(current_stats, baseline_stats, window_days, source)
                signals += detect_hashtag_clusters(current_stats, baseline_stats, window_days, source)

            elif source == "meta_ads":
                signals += detect_ad_campaigns(current_stats, baseline_stats, window_days)

            elif source == "google_reviews":
                signals += detect_review_signals(current_stats, baseline_stats, window_days)

            # Write new events (skip duplicates)
            for signal in signals:
                dk = _dedup_key(competitor.id, signal, period_start)
                if await _already_emitted(dk, db):
                    continue

                event = CompetitorChangeEvent(
                    competitor_id=competitor.id,
                    owner_id=owner_id,
                    change_type=signal.change_type,
                    source=signal.source,
                    severity=signal.severity,
                    window_days=signal.window_days,
                    description=signal.description,
                    before_value=signal.before_value,
                    after_value=signal.after_value,
                    detail=signal.detail or None,
                    dedup_key=dk,
                )
                db.add(event)
                new_events.append(event)

    if new_events:
        await db.commit()
        log.info(
            "change_detection_done",
            competitor_id=str(competitor.id),
            new_events=len(new_events),
        )

    return new_events
