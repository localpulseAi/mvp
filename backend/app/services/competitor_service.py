"""
Competitor service — CRUD and scrape orchestration.
Week 3 deliverable.
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import structlog
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.competitor import Competitor, CompetitorScrape
from app.services.scraper import scrape_all_sources, SCRAPE_CADENCE, ScrapeSource

log = structlog.get_logger()

MAX_COMPETITORS = 5  # FR-CA: owners track up to 5 competitors


# ── CRUD ─────────────────────────────────────────────────────────────────────

async def get_competitors(owner_id: uuid.UUID, db: AsyncSession) -> list[Competitor]:
    result = await db.execute(
        select(Competitor)
        .where(and_(Competitor.owner_id == owner_id, Competitor.is_active == True))
        .order_by(Competitor.added_at)
    )
    return list(result.scalars().all())


async def get_competitor(
    competitor_id: uuid.UUID,
    owner_id: uuid.UUID,
    db: AsyncSession,
) -> Optional[Competitor]:
    result = await db.execute(
        select(Competitor).where(
            and_(
                Competitor.id == competitor_id,
                Competitor.owner_id == owner_id,
                Competitor.is_active == True,
            )
        )
    )
    return result.scalar_one_or_none()


async def add_competitor(
    owner_id: uuid.UUID,
    name: str,
    db: AsyncSession,
    address: Optional[str] = None,
    google_place_id: Optional[str] = None,
    instagram_handle: Optional[str] = None,
    facebook_page: Optional[str] = None,
    google_business_url: Optional[str] = None,
) -> Competitor:
    # Enforce 5-competitor cap
    existing = await get_competitors(owner_id, db)
    if len(existing) >= MAX_COMPETITORS:
        raise ValueError(f"Owner already has {MAX_COMPETITORS} active competitors (maximum).")

    competitor = Competitor(
        owner_id=owner_id,
        name=name,
        address=address,
        google_place_id=google_place_id,
        instagram_handle=instagram_handle,
        facebook_page=facebook_page,
        google_business_url=google_business_url,
    )
    db.add(competitor)
    await db.commit()
    await db.refresh(competitor)

    log.info("competitor_added", owner_id=str(owner_id), name=name, id=str(competitor.id))
    return competitor


async def remove_competitor(
    competitor_id: uuid.UUID,
    owner_id: uuid.UUID,
    db: AsyncSession,
) -> bool:
    competitor = await get_competitor(competitor_id, owner_id, db)
    if not competitor:
        return False
    # Soft delete — retain scrape history
    competitor.is_active = False
    await db.commit()
    log.info("competitor_removed", id=str(competitor_id), owner_id=str(owner_id))
    return True


# ── Scrape cadence ───────────────────────────────────────────────────────────

async def _last_scrape_at(
    competitor_id: uuid.UUID,
    source: ScrapeSource,
    db: AsyncSession,
) -> Optional[datetime]:
    """Return the timestamp of the last successful scrape for this competitor+source."""
    result = await db.execute(
        select(CompetitorScrape.scraped_at)
        .where(
            and_(
                CompetitorScrape.competitor_id == competitor_id,
                CompetitorScrape.source == source.value,
                CompetitorScrape.success == True,
            )
        )
        .order_by(CompetitorScrape.scraped_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def sources_due_for_scrape(
    competitor: Competitor,
    db: AsyncSession,
) -> list[ScrapeSource]:
    """
    Return the list of sources that are due for re-scraping based on cadence.
    A source is due if it has never been scraped or the last scrape is older
    than its configured cadence.
    """
    due = []
    now = datetime.now(timezone.utc)

    for source, cadence_days in SCRAPE_CADENCE.items():
        last = await _last_scrape_at(competitor.id, source, db)
        if last is None or (now - last) > timedelta(days=cadence_days):
            due.append(source)

    return due


# ── Scrape orchestration ─────────────────────────────────────────────────────

async def run_scrape_for_competitor(
    competitor: Competitor,
    db: AsyncSession,
    force: bool = False,
) -> list[CompetitorScrape]:
    """
    Run scraping for a competitor.
    - `force=False`: only scrapes sources that are due per cadence.
    - `force=True`: scrapes all applicable sources regardless of cadence.

    Stores raw results in CompetitorScrape table.
    Returns the list of CompetitorScrape rows created.
    """
    competitor_dict = {
        "name": competitor.name,
        "instagram_handle": competitor.instagram_handle,
        "facebook_page": competitor.facebook_page,
        "google_place_id": competitor.google_place_id,
        "google_business_url": competitor.google_business_url,
    }

    if force:
        from app.services.scraper import scrape_all_sources as _scrape
        results = await _scrape(competitor_dict)
    else:
        due_sources = await sources_due_for_scrape(competitor, db)
        if not due_sources:
            log.info("scrape_nothing_due", competitor_id=str(competitor.id))
            return []

        from app.services.scraper import scrape_source
        import asyncio
        results = await asyncio.gather(
            *[scrape_source(src, competitor_dict) for src in due_sources]
        )

    # Persist results + run normaliser on each successful scrape
    from app.services.normaliser import normalise_scrape

    scrape_rows: list[CompetitorScrape] = []
    google_business_listing = None  # capture for social discovery

    for result in results:
        normalised_payload = None
        normalised = None
        if result.success and result.raw_data:
            normalised = normalise_scrape(
                source=result.source,
                raw_data=result.raw_data,
                competitor_id=str(competitor.id),
                scraped_at=datetime.now(timezone.utc),
            )
            if normalised:
                normalised_payload = normalised.model_dump(mode="json")
                if result.source == ScrapeSource.GOOGLE_BUSINESS and normalised.listing:
                    google_business_listing = normalised.listing

        row = CompetitorScrape(
            competitor_id=competitor.id,
            source=result.source.value,
            raw_data=result.raw_data,
            normalised_data=normalised_payload,
            success=result.success,
            error_message=result.error_message,
            retry_count=result.retry_count,
            apify_run_id=result.apify_run_id,
            apify_actor_id=str(result.source),
        )
        db.add(row)
        scrape_rows.append(row)

    await db.commit()

    success_count = sum(1 for r in results if r.success)
    log.info(
        "scrape_complete",
        competitor_id=str(competitor.id),
        competitor_name=competitor.name,
        total=len(results),
        success=success_count,
    )

    # Mark baseline complete once we have at least one successful scrape
    if not competitor.baseline_complete and success_count > 0:
        competitor.baseline_complete = True
        await db.commit()

    # Auto-discover social handles if competitor has none yet
    needs_social = not competitor.instagram_handle or not competitor.facebook_page
    if needs_social and google_business_listing:
        from app.services.social_discovery import discover_and_update_social_handles
        website = google_business_listing.website
        category = (google_business_listing.categories or [""])[0]
        await discover_and_update_social_handles(
            competitor=competitor,
            db=db,
            website=website,
            category=category,
        )

    return scrape_rows


async def run_scheduled_scrapes(db: AsyncSession) -> dict:
    """
    Run cadence-based scrapes for ALL active competitors across ALL owners.
    Called by the background scheduler (cron/arq). Returns a summary dict.
    """
    result = await db.execute(
        select(Competitor).where(Competitor.is_active == True)
    )
    all_competitors = list(result.scalars().all())

    summary = {"total": len(all_competitors), "scraped": 0, "skipped": 0, "errors": 0}

    for competitor in all_competitors:
        try:
            rows = await run_scrape_for_competitor(competitor, db, force=False)
            if rows:
                summary["scraped"] += 1
            else:
                summary["skipped"] += 1
        except Exception as e:
            log.error("scheduled_scrape_error", competitor_id=str(competitor.id), error=str(e))
            summary["errors"] += 1

    log.info("scheduled_scrapes_done", **summary)
    return summary
