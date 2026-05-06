"""
Week 3 — Competitor scraping pipeline.

Apify is the primary scraping infrastructure. Each source has:
- A dedicated Actor ID
- Its own input schema
- A cadence (how often to scrape)
- Graceful fallback on failure (never crashes the caller)
"""
import asyncio
from dataclasses import dataclass
from enum import Enum
from typing import Optional
import httpx
import structlog

from app.config import settings

log = structlog.get_logger()

MAX_RETRIES = 2
APIFY_BASE = "https://api.apify.com/v2"
ACTOR_TIMEOUT_SECS = 120  # 2 min max per actor run


class ScrapeSource(str, Enum):
    INSTAGRAM = "instagram"
    FACEBOOK = "facebook"
    GOOGLE_REVIEWS = "google_reviews"
    GOOGLE_BUSINESS = "google_business"
    META_ADS = "meta_ads"


# Cadence in days (how often each source should be re-scraped)
SCRAPE_CADENCE: dict[ScrapeSource, int] = {
    ScrapeSource.INSTAGRAM: 7,
    ScrapeSource.FACEBOOK: 7,
    ScrapeSource.GOOGLE_REVIEWS: 14,
    ScrapeSource.GOOGLE_BUSINESS: 30,
    ScrapeSource.META_ADS: 7,
}

# Apify Actor IDs per source
ACTOR_IDS: dict[ScrapeSource, str] = {
    ScrapeSource.INSTAGRAM: "apify/instagram-profile-scraper",
    ScrapeSource.FACEBOOK: "apify/facebook-pages-scraper",
    ScrapeSource.GOOGLE_REVIEWS: "apify/google-maps-reviews-scraper",
    ScrapeSource.GOOGLE_BUSINESS: "apify/google-maps-scraper",
    ScrapeSource.META_ADS: "apify/meta-ads-scraper",
}


@dataclass
class ScrapeResult:
    source: ScrapeSource
    success: bool
    raw_data: Optional[dict]
    apify_run_id: Optional[str]
    error_message: Optional[str]
    retry_count: int = 0


def _build_actor_input(source: ScrapeSource, competitor: dict) -> dict:
    """
    Build the Apify actor input for each source type.
    `competitor` dict should have: name, instagram_handle, facebook_page,
    google_place_id, google_business_url.
    """
    if source == ScrapeSource.INSTAGRAM:
        handle = competitor.get("instagram_handle", "")
        if not handle:
            raise ValueError("instagram_handle required for Instagram scrape")
        return {
            "usernames": [handle.lstrip("@")],
            "resultsLimit": 50,
            "scrapePosts": True,
            "scrapeStories": False,
        }

    if source == ScrapeSource.FACEBOOK:
        page = competitor.get("facebook_page", "")
        if not page:
            raise ValueError("facebook_page required for Facebook scrape")
        return {
            "startUrls": [{"url": f"https://www.facebook.com/{page}"}],
            "maxPosts": 25,
            "scrapeAbout": True,
            "scrapeReviews": False,
        }

    if source == ScrapeSource.GOOGLE_REVIEWS:
        place_id = competitor.get("google_place_id", "")
        if not place_id:
            raise ValueError("google_place_id required for Google Reviews scrape")
        return {
            "placeIds": [place_id],
            "maxReviewsPerPlace": 50,
            "language": "en",
            "reviewsSort": "newest",
        }

    if source == ScrapeSource.GOOGLE_BUSINESS:
        place_id = competitor.get("google_place_id", "")
        name = competitor.get("name", "")
        if not place_id and not name:
            raise ValueError("google_place_id or name required for Google Business scrape")
        return {
            "searchStringsArray": [name] if not place_id else [],
            "placeIds": [place_id] if place_id else [],
            "maxCrawledPlacesPerSearch": 1,
            "language": "en",
            "countryCode": "ca",
        }

    if source == ScrapeSource.META_ADS:
        page = competitor.get("facebook_page", "")
        if not page:
            raise ValueError("facebook_page required for Meta Ads scrape")
        return {
            "pageIds": [page],
            "country": "CA",
            "adType": "ALL",
            "activeStatus": "ALL",
        }

    raise ValueError(f"Unknown source: {source}")


async def _run_actor(
    client: httpx.AsyncClient,
    actor_id: str,
    actor_input: dict,
    api_token: str,
) -> tuple[str, list]:
    """
    Start an Apify actor run and wait for it to finish.
    Returns (run_id, items).
    Raises httpx.HTTPError or RuntimeError on failure.
    """
    # Start the run
    start_resp = await client.post(
        f"{APIFY_BASE}/acts/{actor_id}/runs",
        params={"token": api_token},
        json=actor_input,
        timeout=30,
    )
    start_resp.raise_for_status()
    run_data = start_resp.json()
    run_id = run_data["data"]["id"]

    log.info("apify_run_started", actor=actor_id, run_id=run_id)

    # Poll until finished
    deadline = asyncio.get_event_loop().time() + ACTOR_TIMEOUT_SECS
    while True:
        if asyncio.get_event_loop().time() > deadline:
            raise RuntimeError(f"Actor run {run_id} timed out after {ACTOR_TIMEOUT_SECS}s")

        await asyncio.sleep(5)

        status_resp = await client.get(
            f"{APIFY_BASE}/actor-runs/{run_id}",
            params={"token": api_token},
            timeout=15,
        )
        status_resp.raise_for_status()
        status = status_resp.json()["data"]["status"]

        if status == "SUCCEEDED":
            break
        if status in ("FAILED", "ABORTED", "TIMED-OUT"):
            raise RuntimeError(f"Actor run {run_id} ended with status: {status}")

    # Fetch dataset items
    dataset_id = status_resp.json()["data"]["defaultDatasetId"]
    items_resp = await client.get(
        f"{APIFY_BASE}/datasets/{dataset_id}/items",
        params={"token": api_token, "format": "json", "clean": "true"},
        timeout=30,
    )
    items_resp.raise_for_status()
    items = items_resp.json()

    log.info("apify_run_finished", run_id=run_id, item_count=len(items))
    return run_id, items


async def scrape_source(
    source: ScrapeSource,
    competitor: dict,
) -> ScrapeResult:
    """
    Scrape one source for one competitor.
    Retries up to MAX_RETRIES times on transient errors.
    Always returns a ScrapeResult — never raises.
    """
    if not settings.apify_api_token:
        log.warning("apify_token_missing", source=source)
        return ScrapeResult(
            source=source,
            success=False,
            raw_data=None,
            apify_run_id=None,
            error_message="APIFY_API_TOKEN not configured",
        )

    actor_id = ACTOR_IDS[source]
    last_error: Optional[str] = None
    attempt = 0

    try:
        actor_input = _build_actor_input(source, competitor)
    except ValueError as e:
        return ScrapeResult(
            source=source,
            success=False,
            raw_data=None,
            apify_run_id=None,
            error_message=str(e),
        )

    async with httpx.AsyncClient() as client:
        while attempt <= MAX_RETRIES:
            try:
                run_id, items = await _run_actor(
                    client, actor_id, actor_input, settings.apify_api_token
                )
                return ScrapeResult(
                    source=source,
                    success=True,
                    raw_data={"items": items, "count": len(items)},
                    apify_run_id=run_id,
                    error_message=None,
                    retry_count=attempt,
                )
            except (httpx.HTTPError, RuntimeError, asyncio.TimeoutError) as e:
                last_error = str(e)
                attempt += 1
                log.warning(
                    "scrape_attempt_failed",
                    source=source,
                    actor=actor_id,
                    attempt=attempt,
                    error=last_error,
                )
                if attempt <= MAX_RETRIES:
                    await asyncio.sleep(2 ** attempt)  # exponential back-off: 2s, 4s

    return ScrapeResult(
        source=source,
        success=False,
        raw_data=None,
        apify_run_id=None,
        error_message=last_error,
        retry_count=attempt - 1,
    )


async def scrape_all_sources(competitor: dict) -> list[ScrapeResult]:
    """
    Fan-out scrape across all applicable sources for a competitor.
    Sources that lack the required handle/ID are skipped (not counted as errors).
    Runs all applicable sources concurrently.
    """
    applicable: list[ScrapeSource] = []

    if competitor.get("instagram_handle"):
        applicable.append(ScrapeSource.INSTAGRAM)
    if competitor.get("facebook_page"):
        applicable.extend([ScrapeSource.FACEBOOK, ScrapeSource.META_ADS])
    if competitor.get("google_place_id"):
        applicable.extend([ScrapeSource.GOOGLE_REVIEWS, ScrapeSource.GOOGLE_BUSINESS])
    elif competitor.get("name"):
        # Can still try Google Business by name search
        applicable.append(ScrapeSource.GOOGLE_BUSINESS)

    if not applicable:
        log.warning("no_applicable_sources", competitor=competitor.get("name"))
        return []

    log.info("scrape_all_sources_start", competitor=competitor.get("name"), sources=applicable)

    results = await asyncio.gather(
        *[scrape_source(source, competitor) for source in applicable],
        return_exceptions=False,
    )

    success_count = sum(1 for r in results if r.success)
    log.info(
        "scrape_all_sources_done",
        competitor=competitor.get("name"),
        total=len(results),
        success=success_count,
    )
    return list(results)
