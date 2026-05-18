"""
Owner social scraping — mirrors competitor scraper but targets the owner's own accounts.

Reuses Apify infrastructure from scraper.py. Results stored in OwnerSocialScrape.
Normalised using the same normaliser.py functions.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional
import structlog
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.social_audit import OwnerSocialAccount, OwnerSocialScrape
from app.services.scraper import (
    ScrapeSource,
    SCRAPE_CADENCE,
    scrape_source,
)
from app.services.normaliser import normalise_scrape

log = structlog.get_logger()


async def get_or_create_account(
    owner_id: uuid.UUID,
    platform: str,
    handle: str,
    display_name: Optional[str],
    db: AsyncSession,
) -> OwnerSocialAccount:
    result = await db.execute(
        select(OwnerSocialAccount).where(
            and_(
                OwnerSocialAccount.owner_id == owner_id,
                OwnerSocialAccount.platform == platform,
            )
        )
    )
    account = result.scalar_one_or_none()
    if account:
        account.handle = handle
        account.display_name = display_name or account.display_name
        account.is_active = True
    else:
        account = OwnerSocialAccount(
            owner_id=owner_id,
            platform=platform,
            handle=handle,
            display_name=display_name,
            is_active=True,
        )
        db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


def _source_for_platform(platform: str) -> Optional[ScrapeSource]:
    return {
        "instagram": ScrapeSource.INSTAGRAM,
        "facebook": ScrapeSource.FACEBOOK,
        "google_business": ScrapeSource.GOOGLE_BUSINESS,
    }.get(platform)


def _competitor_dict_from_account(account: OwnerSocialAccount) -> dict:
    """Map an OwnerSocialAccount to the dict shape scraper.py expects."""
    return {
        "name": account.display_name or account.handle,
        "instagram_handle": account.handle if account.platform == "instagram" else None,
        "facebook_page": account.handle if account.platform == "facebook" else None,
        "google_place_id": account.handle if account.platform == "google_business" else None,
        "google_business_url": None,
    }


def _is_stale(account: OwnerSocialAccount, source: ScrapeSource) -> bool:
    if not account.last_scraped_at:
        return True
    cadence_days = SCRAPE_CADENCE.get(source, 7)
    # Use naive datetime to match SQLite behaviour (same fix as change_detection.py)
    threshold = datetime.now() - timedelta(days=cadence_days)
    last = account.last_scraped_at
    if last.tzinfo is not None:
        from datetime import timezone
        last = last.replace(tzinfo=None)
    return last < threshold


async def scrape_owner_account(
    account: OwnerSocialAccount,
    db: AsyncSession,
    force: bool = False,
) -> Optional[OwnerSocialScrape]:
    source = _source_for_platform(account.platform)
    if not source:
        log.warning("owner_scrape_unknown_platform", platform=account.platform)
        return None

    if not force and not _is_stale(account, source):
        log.info("owner_scrape_skipped_fresh", account_id=str(account.id), platform=account.platform)
        return None

    if not settings.apify_api_token:
        log.warning("owner_scrape_no_apify_token")
        return None

    competitor_dict = _competitor_dict_from_account(account)
    log.info("owner_scrape_start", account_id=str(account.id), platform=account.platform, handle=account.handle)

    scrape_result = await scrape_source(source, competitor_dict)

    scrape_row = OwnerSocialScrape(
        owner_id=account.owner_id,
        account_id=account.id,
        source=source.value,
        raw_data=scrape_result.raw_data or {},
        post_count=0,
        apify_run_id=scrape_result.apify_run_id,
        error_message=scrape_result.error_message,
    )

    if scrape_result.success and scrape_result.raw_data:
        try:
            normalised = normalise_scrape(source, scrape_result.raw_data, str(account.id), datetime.now())
            scrape_row.normalised_data = normalised.model_dump(mode="json")
            posts = normalised.posts or []
            reviews = normalised.reviews or []
            scrape_row.post_count = len(posts) + len(reviews)
        except Exception as e:
            log.warning("owner_scrape_normalise_failed", error=type(e).__name__ + ": " + str(e)[:200])

    db.add(scrape_row)
    account.last_scraped_at = datetime.now()
    account.last_scrape_status = "success" if scrape_result.success else "failed"
    await db.commit()
    await db.refresh(scrape_row)

    log.info(
        "owner_scrape_complete",
        account_id=str(account.id),
        platform=account.platform,
        success=scrape_result.success,
        post_count=scrape_row.post_count,
    )
    return scrape_row


async def scrape_all_owner_accounts(owner_id: uuid.UUID, db: AsyncSession, force: bool = False) -> list[OwnerSocialScrape]:
    result = await db.execute(
        select(OwnerSocialAccount).where(
            and_(OwnerSocialAccount.owner_id == owner_id, OwnerSocialAccount.is_active == True)
        )
    )
    accounts = result.scalars().all()
    scrapes = []
    for account in accounts:
        scrape = await scrape_owner_account(account, db, force=force)
        if scrape:
            scrapes.append(scrape)
    return scrapes


async def get_recent_owner_scrapes(
    owner_id: uuid.UUID,
    db: AsyncSession,
    window_days: int = 30,
    limit_per_source: int = 10,
) -> dict[str, list[dict]]:
    """Return normalised scrape data per platform for the owner, for the agent tool."""
    result = await db.execute(
        select(OwnerSocialAccount).where(
            and_(OwnerSocialAccount.owner_id == owner_id, OwnerSocialAccount.is_active == True)
        )
    )
    accounts = result.scalars().all()
    data: dict[str, list[dict]] = {}

    since = datetime.now() - timedelta(days=window_days)

    for account in accounts:
        scrapes_result = await db.execute(
            select(OwnerSocialScrape)
            .where(
                and_(
                    OwnerSocialScrape.account_id == account.id,
                    OwnerSocialScrape.scraped_at >= since,
                    OwnerSocialScrape.normalised_data.isnot(None),
                )
            )
            .order_by(desc(OwnerSocialScrape.scraped_at))
            .limit(limit_per_source)
        )
        scrapes = scrapes_result.scalars().all()

        if scrapes:
            platform_data = []
            for s in scrapes:
                nd = s.normalised_data or {}
                platform_data.append({
                    "scraped_at": s.scraped_at.isoformat() if s.scraped_at else None,
                    "post_count": s.post_count,
                    "posts": nd.get("posts", [])[:20],    # cap to keep context manageable
                    "reviews": nd.get("reviews", [])[:10],
                    "listing": nd.get("listing"),
                })
            data[account.platform] = platform_data

    return data
