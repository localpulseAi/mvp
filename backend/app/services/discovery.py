"""
Competitor discovery service — Week 7.

Two-phase approach:
  1. Google Places Text Search finds nearby businesses matching the owner's niche
  2. Claude Haiku scores each candidate on 5 dimensions and returns ranked shortlist

Called by POST /discovery/competitors during onboarding Step 5.
"""
import json
from typing import Optional

import httpx
import structlog
from anthropic import AsyncAnthropic

from app.config import settings

log = structlog.get_logger()

_NICHE_QUERY_MAP = {
    # exact frontend values
    "full-service restaurant": "restaurant",
    "fast casual": "fast casual restaurant",
    "cafe / coffee shop": "cafe coffee shop",
    "bar / gastropub": "bar pub gastropub",
    "food truck": "food truck",
    "bakery": "bakery",
    # generic keys
    "restaurant": "restaurant",
    "cafe": "cafe coffee shop",
    "bar": "bar pub lounge",
    "salon": "hair salon beauty salon",
    "spa": "spa massage",
    "fitness": "gym fitness studio",
    "yoga": "yoga studio",
    "retail": "boutique store shop",
    "clothing": "clothing boutique",
    "jewelry": "jewelry store",
    "florist": "florist flower shop",
}

_MOCK_CANDIDATES = [
    {
        "place_id": "mock_1",
        "name": "The Local Table",
        "address": "2437 4 St SW",
        "rating": 4.3,
        "review_count": 312,
        "types": ["restaurant", "food"],
        "lat": 51.035,
        "lng": -114.072,
        "google_business_url": "https://www.google.com/maps",
        "scores": {"proximity": 9, "niche_alignment": 8, "market_overlap": 8, "competitive_intensity": 7, "strategic_value": 8},
        "composite_score": 8.0,
        "reasoning": "0.3 km away · same casual dining niche · active social presence",
    },
    {
        "place_id": "mock_2",
        "name": "Corner Kitchen",
        "address": "1804 4 St SW",
        "rating": 4.1,
        "review_count": 198,
        "types": ["restaurant", "food"],
        "lat": 51.031,
        "lng": -114.069,
        "google_business_url": "https://www.google.com/maps",
        "scores": {"proximity": 8, "niche_alignment": 9, "market_overlap": 7, "competitive_intensity": 6, "strategic_value": 7},
        "composite_score": 7.4,
        "reasoning": "0.6 km away · lunch-heavy menu overlapping your peak window",
    },
    {
        "place_id": "mock_3",
        "name": "Neighbourhood Bistro",
        "address": "1015 17 Ave SW",
        "rating": 4.5,
        "review_count": 487,
        "types": ["restaurant", "food"],
        "lat": 51.038,
        "lng": -114.075,
        "google_business_url": "https://www.google.com/maps",
        "scores": {"proximity": 7, "niche_alignment": 8, "market_overlap": 9, "competitive_intensity": 8, "strategic_value": 9},
        "composite_score": 8.2,
        "reasoning": "0.8 km away · strong Google rating · competes for your dinner crowd",
    },
    {
        "place_id": "mock_4",
        "name": "The Midday Spot",
        "address": "2310 4 St SW",
        "rating": 3.9,
        "review_count": 144,
        "types": ["restaurant", "food"],
        "lat": 51.033,
        "lng": -114.071,
        "google_business_url": "https://www.google.com/maps",
        "scores": {"proximity": 9, "niche_alignment": 7, "market_overlap": 7, "competitive_intensity": 5, "strategic_value": 6},
        "composite_score": 6.8,
        "reasoning": "0.4 km away · lunch staple · weaker ratings leave room to win share",
    },
    {
        "place_id": "mock_5",
        "name": "Fusion & Co.",
        "address": "2208 4 St SW",
        "rating": 4.2,
        "review_count": 263,
        "types": ["restaurant", "food"],
        "lat": 51.034,
        "lng": -114.073,
        "google_business_url": "https://www.google.com/maps",
        "scores": {"proximity": 8, "niche_alignment": 6, "market_overlap": 8, "competitive_intensity": 7, "strategic_value": 7},
        "composite_score": 7.2,
        "reasoning": "0.5 km away · trendy crossover audience · active on Instagram",
    },
]


def _niche_query(niche: str) -> str:
    key = niche.lower().strip()
    return _NICHE_QUERY_MAP.get(key, niche)


async def _places_text_search(address: str, niche: str) -> list[dict]:
    """Call Google Places Text Search and return raw place dicts."""
    api_key = settings.google_places_api_key
    if not api_key:
        log.warning("discovery_no_google_key_using_mock")
        return [c.copy() for c in _MOCK_CANDIDATES]

    query = f"{_niche_query(niche)} near {address}"
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params={"query": query, "key": api_key})

    if resp.status_code != 200:
        log.error("places_api_error", status=resp.status_code)
        return []

    data = resp.json()
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        log.error("places_api_status", status=data.get("status"))
        return []

    places = []
    for p in data.get("results", [])[:20]:
        geometry = p.get("geometry", {}).get("location", {})
        places.append({
            "place_id": p.get("place_id", ""),
            "name": p.get("name", ""),
            "address": p.get("formatted_address", ""),
            "rating": p.get("rating"),
            "review_count": p.get("user_ratings_total", 0),
            "types": p.get("types", []),
            "lat": geometry.get("lat"),
            "lng": geometry.get("lng"),
            "google_business_url": f"https://www.google.com/maps/place/?q=place_id:{p.get('place_id', '')}",
        })
    return places


async def _llm_score_candidates(
    candidates: list[dict],
    business_name: str,
    niche: str,
    business_description: Optional[str],
) -> list[dict]:
    """
    Use Claude Haiku to score each candidate on 5 dimensions.
    Returns candidates with scores and composite_score added, sorted descending.
    """
    if not candidates:
        return candidates

    # If candidates already have scores (e.g. from mock data), skip LLM
    if not settings.anthropic_api_key or all(c.get("composite_score") is not None for c in candidates):
        for c in candidates:
            if c.get("composite_score") is None:
                c["scores"] = {}
                c["composite_score"] = 5.0
                c["reasoning"] = ""
        return sorted(candidates, key=lambda x: x.get("composite_score", 0), reverse=True)

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    candidate_list = "\n".join(
        f"{i+1}. {c['name']} | {c['address']} | rating: {c.get('rating', 'N/A')} | reviews: {c.get('review_count', 0)}"
        for i, c in enumerate(candidates)
    )

    owner_ctx = f"Business: {business_name}, Niche: {niche}"
    if business_description:
        owner_ctx += f", Description: {business_description}"

    prompt = f"""You are evaluating competitor candidates for a local business owner.

OWNER:
{owner_ctx}

CANDIDATES:
{candidate_list}

Score each candidate on these 5 dimensions (0-10 each):
- proximity: How close and geographically relevant they are
- niche_alignment: How similar their offering is to the owner's niche
- market_overlap: How much they compete for the same customers
- competitive_intensity: How aggressively/actively they compete
- strategic_value: How valuable monitoring them would be for the owner's strategy

Return ONLY a JSON array with one object per candidate (same order):
[
  {{
    "index": 1,
    "scores": {{
      "proximity": 8,
      "niche_alignment": 9,
      "market_overlap": 7,
      "competitive_intensity": 6,
      "strategic_value": 8
    }},
    "reasoning": "One sentence on why this competitor matters"
  }},
  ...
]"""

    try:
        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = response.content[0].text.strip()

        # Extract JSON array from the response
        start = raw.find("[")
        end = raw.rfind("]") + 1
        scored = json.loads(raw[start:end]) if start != -1 else []

        scored_map = {item["index"]: item for item in scored}
        for i, candidate in enumerate(candidates):
            entry = scored_map.get(i + 1, {})
            scores = entry.get("scores", {})
            dims = ["proximity", "niche_alignment", "market_overlap", "competitive_intensity", "strategic_value"]
            candidate["scores"] = scores
            values = [scores.get(d, 5) for d in dims]
            candidate["composite_score"] = round(sum(values) / len(values), 1) if values else 5.0
            candidate["reasoning"] = entry.get("reasoning", "")

    except Exception as e:
        log.error("discovery_scoring_failed", error=str(e))
        for c in candidates:
            c["scores"] = {}
            c["composite_score"] = 5.0
            c["reasoning"] = ""

    return sorted(candidates, key=lambda x: x.get("composite_score", 0), reverse=True)


async def discover_competitors(
    address: str,
    niche: str,
    business_name: str,
    business_description: Optional[str] = None,
    max_results: int = 8,
) -> dict:
    """
    Main discovery entry point. Returns shortlisted and scored competitor candidates.
    """
    raw_candidates = await _places_text_search(address, niche)

    # Heuristic prune: drop places with no reviews and skip the owner's own business
    pruned = [
        c for c in raw_candidates
        if c["name"].lower().strip() != business_name.lower().strip()
        and c.get("review_count", 0) >= 5
    ]

    if not pruned:
        pruned = [c for c in raw_candidates if c["name"].lower().strip() != business_name.lower().strip()]

    scored = await _llm_score_candidates(pruned, business_name, niche, business_description)
    shortlisted = scored[:max_results]

    log.info(
        "discovery_complete",
        found=len(raw_candidates),
        after_prune=len(pruned),
        shortlisted=len(shortlisted),
    )

    return {
        "candidates": shortlisted,
        "total_found": len(raw_candidates),
        "shortlisted": len(shortlisted),
    }
