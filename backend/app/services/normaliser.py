"""
Normaliser pipeline — Week 4.
Maps raw Apify JSON (stored in CompetitorScrape.raw_data) to
NormalisedScrapeData and writes it back to CompetitorScrape.normalised_data.

One normaliser function per source. All functions return NormalisedScrapeData
or raise ValueError if the raw data is unusable.
"""
from datetime import datetime, timezone
from typing import Optional
import structlog

from app.models.normalised import (
    NormalisedScrapeData,
    NormalisedPost,
    NormalisedReview,
    NormalisedBusinessListing,
    NormalisedAdCreative,
)
from app.services.scraper import ScrapeSource

log = structlog.get_logger()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _parse_dt(value: Optional[str | int]) -> Optional[datetime]:
    """Best-effort datetime parse from Apify's various timestamp formats."""
    if value is None:
        return None
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(value / 1000 if value > 1e10 else value, tz=timezone.utc)
        if isinstance(value, str):
            for fmt in (
                "%Y-%m-%dT%H:%M:%S.%fZ",
                "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%dT%H:%M:%S%z",
                "%Y-%m-%d",
            ):
                try:
                    dt = datetime.strptime(value, fmt)
                    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
                except ValueError:
                    continue
    except Exception:
        pass
    return None


def _extract_hashtags(text: str) -> list[str]:
    import re
    return [tag.lower() for tag in re.findall(r"#(\w+)", text or "")]


def _extract_mentions(text: str) -> list[str]:
    import re
    return [m.lower() for m in re.findall(r"@(\w+)", text or "")]


# ── Per-source normalisers ────────────────────────────────────────────────────

def normalise_instagram(raw: dict, competitor_id: str, scraped_at: datetime) -> NormalisedScrapeData:
    """
    apify~instagram-scraper output schema:
    items: list of post objects. hashtags and mentions may be pre-parsed lists
    or embedded in caption text (both handled).
    """
    items = raw.get("items", [])
    posts: list[NormalisedPost] = []

    for item in items:
        if not isinstance(item, dict):
            continue
        caption = item.get("caption") or item.get("alt") or item.get("text") or ""
        raw_tags = item.get("hashtags")
        hashtags = raw_tags if isinstance(raw_tags, list) else _extract_hashtags(caption)
        raw_mentions = item.get("mentions")
        mentions = raw_mentions if isinstance(raw_mentions, list) else _extract_mentions(caption)
        post = NormalisedPost(
            source_id=str(item.get("id") or item.get("shortCode") or ""),
            source="instagram",
            posted_at=_parse_dt(item.get("timestamp") or item.get("takenAt")),
            caption=caption,
            hashtags=hashtags,
            mentions=mentions,
            media_type=(item.get("type") or item.get("mediaType") or "unknown").lower(),
            likes=int(item.get("likesCount") or item.get("likes") or 0),
            comments=int(item.get("commentsCount") or item.get("comments") or 0),
            plays=int(item.get("videoViewCount") or item.get("videoPlayCount") or 0),
            url=item.get("url") or item.get("displayUrl"),
        )
        posts.append(post)

    data = NormalisedScrapeData(
        source="instagram",
        competitor_id=competitor_id,
        scraped_at=scraped_at,
        posts=posts,
    )
    data.compute_stats()
    return data


def normalise_facebook(raw: dict, competitor_id: str, scraped_at: datetime) -> NormalisedScrapeData:
    """
    apify~facebook-posts-scraper output:
    items: list of post objects with keys:
      postId, time, text, likes, shares, viewsCount, isVideo,
      url, textReferences (hashtag/mention links)
    """
    items = raw.get("items", [])
    posts: list[NormalisedPost] = []

    for item in items:
        if not isinstance(item, dict):
            continue
        caption = item.get("text") or item.get("message") or ""
        # Extract hashtags from textReferences (more reliable than regex on text)
        refs = item.get("textReferences") or []
        hashtags = [
            r["url"].split("/hashtag/")[1].split("?")[0].lower()
            for r in refs
            if isinstance(r, dict) and "/hashtag/" in (r.get("url") or "")
        ] or _extract_hashtags(caption)
        post = NormalisedPost(
            source_id=str(item.get("postId") or item.get("id") or ""),
            source="facebook",
            posted_at=_parse_dt(item.get("time") or item.get("timestamp")),
            caption=caption,
            hashtags=hashtags,
            mentions=_extract_mentions(caption),
            media_type="video" if item.get("isVideo") else "post",
            likes=int(item.get("likes") or item.get("reactionLikeCount") or 0),
            comments=int(item.get("comments") or 0),
            shares=int(item.get("shares") or 0),
            plays=int(item.get("viewsCount") or 0),
            url=item.get("url") or item.get("facebookUrl"),
        )
        posts.append(post)

    data = NormalisedScrapeData(
        source="facebook",
        competitor_id=competitor_id,
        scraped_at=scraped_at,
        posts=posts,
    )
    data.compute_stats()
    return data


def normalise_google_reviews(raw: dict, competitor_id: str, scraped_at: datetime) -> NormalisedScrapeData:
    """
    Apify google-maps-reviews-scraper output:
    items: list of review objects with keys:
      reviewId, stars, text, publishedAtDate, reviewerName,
      responseFromOwnerText
    """
    items = raw.get("items", [])
    reviews: list[NormalisedReview] = []

    for item in items:
        if not isinstance(item, dict):
            continue
        reply = item.get("responseFromOwnerText") or item.get("ownerResponse")
        review = NormalisedReview(
            source_id=str(item.get("reviewId") or item.get("id") or ""),
            rating=int(item.get("stars") or item.get("rating") or 3),
            text=item.get("text") or "",
            posted_at=_parse_dt(item.get("publishedAtDate") or item.get("date")),
            author=item.get("reviewerName") or item.get("name") or "Anonymous",
            owner_replied=bool(reply),
            reply_text=reply or None,
        )
        reviews.append(review)

    data = NormalisedScrapeData(
        source="google_reviews",
        competitor_id=competitor_id,
        scraped_at=scraped_at,
        reviews=reviews,
    )
    data.compute_stats()
    return data


def normalise_google_business(raw: dict, competitor_id: str, scraped_at: datetime) -> NormalisedScrapeData:
    """
    Apify google-maps-scraper output:
    items: list — usually one entry per place. Keys:
      title, address, phone, website, openingHours, totalScore,
      reviewsCount, categoryName, price
    """
    items = raw.get("items", [])
    place = items[0] if items and isinstance(items[0], dict) else {}

    hours_raw = place.get("openingHours") or []
    hours: dict[str, str] = {}
    for h in hours_raw:
        if isinstance(h, dict):
            day = h.get("day") or h.get("dayOfWeek") or ""
            hours_str = h.get("hours") or h.get("openingHoursRanges") or ""
            if day:
                hours[day] = str(hours_str)

    listing = NormalisedBusinessListing(
        name=place.get("title") or place.get("name") or "",
        address=place.get("address") or place.get("street") or "",
        phone=place.get("phone"),
        website=place.get("website"),
        hours=hours,
        overall_rating=float(place.get("totalScore") or place.get("rating") or 0),
        review_count=int(place.get("reviewsCount") or place.get("userRatingsTotal") or 0),
        categories=[place.get("categoryName") or place.get("type") or ""],
        price_level=place.get("price"),
        is_temporarily_closed=bool(place.get("temporarilyClosed")),
        scraped_at=scraped_at,
    )

    data = NormalisedScrapeData(
        source="google_business",
        competitor_id=competitor_id,
        scraped_at=scraped_at,
        listing=listing,
    )
    data.compute_stats()
    return data


def normalise_meta_ads(raw: dict, competitor_id: str, scraped_at: datetime) -> NormalisedScrapeData:
    """
    apify~facebook-ads-scraper output:
    items: list of ad objects from the Meta Ads Library.
    Key fields: adArchiveID, startDateFormatted, endDateFormatted, isActive,
    snapshot (body/ctaText/cards), publisherPlatform, impressionsWithIndex.
    """
    items = raw.get("items", [])
    ads: list[NormalisedAdCreative] = []

    for item in items:
        if not isinstance(item, dict):
            continue
        snapshot = item.get("snapshot") or {}
        cards = snapshot.get("cards") or []
        # Ad body: try snapshot.body, then first card body, then caption field
        ad_text = (
            snapshot.get("body")
            or (cards[0].get("body") if cards else None)
            or snapshot.get("caption")
            or ""
        )
        # Impressions from impressionsWithIndex dict
        imp = item.get("impressionsWithIndex") or {}
        ad = NormalisedAdCreative(
            ad_id=str(
                item.get("adArchiveID") or item.get("adId")
                or item.get("adArchiveId") or item.get("id") or ""
            ),
            started_at=_parse_dt(item.get("startDateFormatted") or item.get("startDate")),
            ended_at=_parse_dt(item.get("endDateFormatted") or item.get("endDate")),
            is_active=bool(item.get("isActive", True)),
            ad_text=ad_text,
            call_to_action=snapshot.get("ctaText") or item.get("ctaText"),
            media_type=(item.get("adType") or "unknown").lower(),
            platforms=item.get("publisherPlatform") or [],
            impressions_lower=imp.get("lowerBoundCount") or imp.get("lowerBound"),
            impressions_upper=imp.get("upperBoundCount") or imp.get("upperBound"),
        )
        ads.append(ad)

    data = NormalisedScrapeData(
        source="meta_ads",
        competitor_id=competitor_id,
        scraped_at=scraped_at,
        ads=ads,
    )
    data.compute_stats()
    return data


# ── Dispatch ─────────────────────────────────────────────────────────────────

_NORMALISERS = {
    ScrapeSource.INSTAGRAM: normalise_instagram,
    ScrapeSource.FACEBOOK: normalise_facebook,
    ScrapeSource.GOOGLE_REVIEWS: normalise_google_reviews,
    ScrapeSource.GOOGLE_BUSINESS: normalise_google_business,
    ScrapeSource.META_ADS: normalise_meta_ads,
}


def normalise_scrape(
    source: ScrapeSource,
    raw_data: dict,
    competitor_id: str,
    scraped_at: datetime,
) -> Optional[NormalisedScrapeData]:
    """
    Normalise raw scrape data for a given source.
    Returns None on failure — never raises (failures are logged).
    """
    normaliser = _NORMALISERS.get(source)
    if not normaliser:
        log.error("normaliser_not_found", source=source)
        return None
    try:
        result = normaliser(raw_data, competitor_id, scraped_at)
        log.info(
            "normalised",
            source=source,
            competitor_id=competitor_id,
            stats=result.stats,
        )
        return result
    except Exception as e:
        log.error("normalise_failed", source=source, competitor_id=competitor_id, error=str(e))
        return None
