"""
Automatic social handle discovery for competitors.

Strategy (in order — stops at first hit):
1. Website crawl — fetch the competitor's website (from Google Business) and
   extract instagram.com / facebook.com profile links from the HTML.
2. Google search via Apify — runs `site:instagram.com "Business Name City"` and
   `site:facebook.com "Business Name City"` and extracts the profile URL from the
   top result. Works even when there is no website.
3. LLM fallback — asks Claude to infer likely handles; Claude returns null when
   not confident, so false positives are minimal.

Called automatically after a successful Google Business scrape if the
competitor has no social handles set yet.
"""
import asyncio
import re
from typing import Optional
import httpx
import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

APIFY_BASE = "https://api.apify.com/v2"
GOOGLE_SEARCH_ACTOR = "apify~google-search-scraper"

log = structlog.get_logger()

_CRAWL_TIMEOUT = 10
_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

# Patterns that are definitely not profile handles
_INSTAGRAM_SKIP = re.compile(r"instagram\.com/(p/|reel/|explore/|accounts/|stories/|tv/)", re.I)
_FACEBOOK_SKIP = re.compile(r"facebook\.com/(sharer|share|dialog/|login|events/|groups/|pages/category|watch|photo|video|permalink)", re.I)

_INSTAGRAM_RE = re.compile(r'instagram\.com/([A-Za-z0-9_.]{1,30})/?["\'>\s]', re.I)
_FACEBOOK_RE = re.compile(r'facebook\.com/([A-Za-z0-9_.]{3,60})/?["\'>\s]', re.I)


def _extract_from_html(html: str) -> tuple[Optional[str], Optional[str]]:
    """Return (instagram_handle, facebook_page) from a page's HTML."""
    instagram: Optional[str] = None
    facebook: Optional[str] = None

    for match in _INSTAGRAM_RE.finditer(html):
        url_part = match.group(0)
        if _INSTAGRAM_SKIP.search(url_part):
            continue
        handle = match.group(1).rstrip("/").lower()
        if handle and handle not in ("web", "instagram", "accounts"):
            instagram = handle
            break

    for match in _FACEBOOK_RE.finditer(html):
        url_part = match.group(0)
        if _FACEBOOK_SKIP.search(url_part):
            continue
        page = match.group(1).rstrip("/")
        if page and page not in ("home", "pages", "groups", "events", "watch", "marketplace"):
            facebook = page
            break

    return instagram, facebook


async def _crawl_website(url: str) -> tuple[Optional[str], Optional[str]]:
    """Fetch a website homepage and extract social handles."""
    try:
        async with httpx.AsyncClient(
            follow_redirects=True,
            timeout=_CRAWL_TIMEOUT,
            headers={"User-Agent": _USER_AGENT},
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return _extract_from_html(resp.text)
    except Exception as e:
        log.warning("social_crawl_failed", url=url, error=str(e))
        return None, None


async def _apify_google_search(query: str, api_token: str) -> list[str]:
    """
    Run a Google search via Apify and return a list of result URLs.
    Returns [] on any failure.
    """
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            start = await client.post(
                f"{APIFY_BASE}/acts/{GOOGLE_SEARCH_ACTOR}/runs",
                params={"token": api_token},
                json={
                    "queries": query,
                    "maxPagesPerQuery": 1,
                    "resultsPerPage": 5,
                    "mobileResults": False,
                },
            )
            start.raise_for_status()
            run_id = start.json()["data"]["id"]

            deadline = asyncio.get_event_loop().time() + 60
            while True:
                if asyncio.get_event_loop().time() > deadline:
                    return []
                await asyncio.sleep(4)
                status_resp = await client.get(
                    f"{APIFY_BASE}/actor-runs/{run_id}",
                    params={"token": api_token},
                    timeout=15,
                )
                status = status_resp.json()["data"]["status"]
                if status == "SUCCEEDED":
                    break
                if status in ("FAILED", "ABORTED", "TIMED-OUT"):
                    return []

            dataset_id = status_resp.json()["data"]["defaultDatasetId"]
            items_resp = await client.get(
                f"{APIFY_BASE}/datasets/{dataset_id}/items",
                params={"token": api_token, "format": "json", "clean": "true"},
            )
            items_resp.raise_for_status()
            items = items_resp.json()

            urls: list[str] = []
            for item in items:
                for result in item.get("organicResults", []):
                    url = result.get("url", "")
                    if url:
                        urls.append(url)
            return urls
    except Exception as e:
        log.warning("google_search_scraper_failed", query=query, error=str(e))
        return []


def _handle_from_search_urls(urls: list[str], platform: str) -> Optional[str]:
    """Extract a profile handle from a list of search result URLs."""
    if platform == "instagram":
        skip = _INSTAGRAM_SKIP
        pattern = re.compile(r"instagram\.com/([A-Za-z0-9_.]{1,30})/?", re.I)
        bad = {"web", "instagram", "accounts", "explore", "p", "reel"}
    else:
        skip = _FACEBOOK_SKIP
        pattern = re.compile(r"facebook\.com/([A-Za-z0-9_.]{3,60})/?", re.I)
        bad = {"home", "pages", "groups", "events", "watch", "marketplace", "business"}

    for url in urls:
        if skip.search(url):
            continue
        m = pattern.search(url)
        if m:
            handle = m.group(1).rstrip("/").lower()
            if handle and handle not in bad:
                return handle
    return None


async def _google_search_discover(
    name: str,
    address: str,
) -> tuple[Optional[str], Optional[str]]:
    """
    Search Google for the business's Instagram and Facebook profiles.
    Uses 'site:instagram.com' and 'site:facebook.com' queries.
    """
    if not settings.apify_api_token:
        return None, None

    # City hint — take first word after the last comma in address, e.g. "Calgary"
    city = ""
    if address:
        parts = [p.strip() for p in address.split(",")]
        city = parts[-2] if len(parts) >= 2 else parts[-1]

    query_base = f'"{name}" {city}'.strip()
    query_short = f'"{name}"'  # fallback without city for less common names

    ig_urls, fb_urls = await asyncio.gather(
        _apify_google_search(f"{query_base} site:instagram.com", settings.apify_api_token),
        _apify_google_search(f"{query_base} site:facebook.com", settings.apify_api_token),
    )

    # If Facebook search with city found nothing, retry with name only
    if not _handle_from_search_urls(fb_urls, "facebook"):
        fb_urls = await _apify_google_search(f"{query_short} site:facebook.com", settings.apify_api_token)

    instagram = _handle_from_search_urls(ig_urls, "instagram")
    facebook = _handle_from_search_urls(fb_urls, "facebook")

    log.info(
        "google_search_discovery",
        name=name,
        instagram=instagram,
        facebook=facebook,
        ig_results=len(ig_urls),
        fb_results=len(fb_urls),
    )
    return instagram, facebook


async def _llm_discover(
    name: str,
    category: str,
    address: str,
    website: Optional[str],
) -> tuple[Optional[str], Optional[str]]:
    """
    Ask Claude to suggest social handles for a business.
    Returns (instagram_handle, facebook_page) — both may be None if Claude isn't confident.
    """
    if not settings.anthropic_api_key:
        return None, None

    try:
        import anthropic
        import json

        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

        website_hint = f"Website: {website}" if website else "No website found."
        prompt = (
            f"Find the Instagram handle and Facebook page slug for this local business.\n\n"
            f"Business: {name}\n"
            f"Category: {category}\n"
            f"Address: {address}\n"
            f"{website_hint}\n\n"
            f"Rules:\n"
            f"- Return ONLY handles you are highly confident exist (based on common naming patterns or the website domain).\n"
            f"- Do NOT hallucinate. Return null for any handle you are not sure about.\n"
            f"- Instagram handle: no @ sign, lowercase (e.g. burgermesh or burgermeshyyc).\n"
            f"- Facebook page: the slug from facebook.com/SLUG (e.g. burgermesh).\n\n"
            f'Respond with ONLY a JSON object: {{"instagram_handle": "..." or null, "facebook_page": "..." or null}}'
        )

        msg = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=128,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = msg.content[0].text.strip()
        # Strip markdown code fences if present
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        data = json.loads(raw)
        ig = data.get("instagram_handle") or None
        fb = data.get("facebook_page") or None
        log.info("llm_social_discovery", name=name, instagram=ig, facebook=fb)
        return ig, fb
    except Exception as e:
        log.warning("llm_social_discovery_failed", name=name, error=str(e))
        return None, None


async def discover_and_update_social_handles(
    competitor,
    db: AsyncSession,
    website: Optional[str] = None,
    category: Optional[str] = None,
) -> bool:
    """
    Attempt to discover Instagram/Facebook handles for a competitor.
    Updates the competitor record in-place if handles are found.
    Returns True if at least one handle was discovered.
    """
    # Skip if both handles already set
    if competitor.instagram_handle and competitor.facebook_page:
        return False

    address = competitor.address or ""
    cat = category or "restaurant"

    instagram: Optional[str] = None
    facebook: Optional[str] = None

    # Step 1 — crawl website
    if website:
        instagram, facebook = await _crawl_website(website)
        if instagram or facebook:
            log.info(
                "social_handles_from_website",
                competitor=competitor.name,
                instagram=instagram,
                facebook=facebook,
            )

    # Step 2 — Google search via Apify (site:instagram.com / site:facebook.com)
    if not instagram and not facebook:
        instagram, facebook = await _google_search_discover(
            name=competitor.name,
            address=address,
        )
        if instagram or facebook:
            log.info(
                "social_handles_from_search",
                competitor=competitor.name,
                instagram=instagram,
                facebook=facebook,
            )

    # Step 3 — LLM fallback if search also found nothing
    if not instagram and not facebook:
        instagram, facebook = await _llm_discover(
            name=competitor.name,
            category=cat,
            address=address,
            website=website,
        )
        if instagram or facebook:
            log.info(
                "social_handles_from_llm",
                competitor=competitor.name,
                instagram=instagram,
                facebook=facebook,
            )

    if not instagram and not facebook:
        log.info("social_handles_not_found", competitor=competitor.name)
        return False

    # Only update fields that weren't already set
    updated = False
    if instagram and not competitor.instagram_handle:
        competitor.instagram_handle = instagram
        updated = True
    if facebook and not competitor.facebook_page:
        competitor.facebook_page = facebook
        updated = True

    if updated:
        await db.commit()
        log.info(
            "social_handles_saved",
            competitor=competitor.name,
            instagram=competitor.instagram_handle,
            facebook=competitor.facebook_page,
        )

    return updated
