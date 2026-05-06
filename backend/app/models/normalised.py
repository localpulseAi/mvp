"""
Normalised data schemas for competitor scrape data.
These are Pydantic models — they live inside CompetitorScrape.normalised_data (JSON).
All sources map to one of four entity types: Post, Review, BusinessListing, AdCreative.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Per-entity schemas ────────────────────────────────────────────────────────

class NormalisedPost(BaseModel):
    """Instagram or Facebook post."""
    source_id: str                          # platform's native post ID
    source: str                             # instagram | facebook
    posted_at: Optional[datetime]
    caption: str = ""
    hashtags: list[str] = Field(default_factory=list)
    mentions: list[str] = Field(default_factory=list)
    media_type: str = "unknown"             # image | video | carousel | reel | story
    likes: int = 0
    comments: int = 0
    shares: int = 0
    plays: int = 0                          # video plays
    url: Optional[str] = None

    @property
    def engagement(self) -> int:
        return self.likes + self.comments + self.shares

    @property
    def is_promotional(self) -> bool:
        promo_signals = {
            "off", "discount", "promo", "deal", "special", "free",
            "happy hour", "sale", "limited", "offer", "% off",
        }
        text = (self.caption + " " + " ".join(self.hashtags)).lower()
        return any(sig in text for sig in promo_signals)


class NormalisedReview(BaseModel):
    """Google Review."""
    source_id: str
    rating: int = Field(..., ge=1, le=5)
    text: str = ""
    posted_at: Optional[datetime]
    author: str = "Anonymous"
    owner_replied: bool = False
    reply_text: Optional[str] = None

    @property
    def is_positive(self) -> bool:
        return self.rating >= 4

    @property
    def is_negative(self) -> bool:
        return self.rating <= 2


class NormalisedBusinessListing(BaseModel):
    """Google Business Profile snapshot."""
    name: str
    address: str = ""
    phone: Optional[str] = None
    website: Optional[str] = None
    hours: dict[str, str] = Field(default_factory=dict)  # "Monday" -> "11:00–22:00"
    overall_rating: float = 0.0
    review_count: int = 0
    categories: list[str] = Field(default_factory=list)
    price_level: Optional[str] = None      # $ | $$ | $$$ | $$$$
    is_temporarily_closed: bool = False
    scraped_at: Optional[datetime] = None


class NormalisedAdCreative(BaseModel):
    """Meta (Facebook/Instagram) Ad."""
    ad_id: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    is_active: bool = True
    ad_text: str = ""
    call_to_action: Optional[str] = None   # BOOK_NOW | LEARN_MORE | ORDER_NOW | etc.
    media_type: str = "unknown"            # image | video | carousel
    platforms: list[str] = Field(default_factory=list)  # facebook | instagram
    impressions_lower: Optional[int] = None
    impressions_upper: Optional[int] = None

    @property
    def is_promotional(self) -> bool:
        promo_signals = {
            "off", "discount", "promo", "deal", "special", "free",
            "happy hour", "sale", "limited", "offer", "% off",
        }
        return any(sig in self.ad_text.lower() for sig in promo_signals)


# ── Top-level container stored in CompetitorScrape.normalised_data ───────────

class NormalisedScrapeData(BaseModel):
    """
    The full normalised payload for one scrape run.
    Stored as JSON in CompetitorScrape.normalised_data.
    """
    source: str                             # instagram | facebook | google_reviews | google_business | meta_ads
    competitor_id: str
    scraped_at: datetime
    normalised_at: datetime = Field(default_factory=datetime.utcnow)
    schema_version: str = "1.0"

    # Exactly one of these will be populated per source type
    posts: list[NormalisedPost] = Field(default_factory=list)
    reviews: list[NormalisedReview] = Field(default_factory=list)
    listing: Optional[NormalisedBusinessListing] = None
    ads: list[NormalisedAdCreative] = Field(default_factory=list)

    # Aggregate stats computed at normalisation time
    stats: dict = Field(default_factory=dict)

    def compute_stats(self) -> None:
        """Pre-compute aggregate stats for fast retrieval."""
        if self.posts:
            self.stats["post_count"] = len(self.posts)
            self.stats["avg_engagement"] = sum(p.engagement for p in self.posts) / len(self.posts)
            self.stats["promotional_post_count"] = sum(1 for p in self.posts if p.is_promotional)
            all_hashtags: list[str] = []
            for p in self.posts:
                all_hashtags.extend(p.hashtags)
            # Top 10 hashtags by frequency
            from collections import Counter
            self.stats["top_hashtags"] = [h for h, _ in Counter(all_hashtags).most_common(10)]

        if self.reviews:
            self.stats["review_count"] = len(self.reviews)
            self.stats["avg_rating"] = sum(r.rating for r in self.reviews) / len(self.reviews)
            self.stats["positive_count"] = sum(1 for r in self.reviews if r.is_positive)
            self.stats["negative_count"] = sum(1 for r in self.reviews if r.is_negative)
            self.stats["reply_rate"] = sum(1 for r in self.reviews if r.owner_replied) / len(self.reviews)

        if self.listing:
            self.stats["overall_rating"] = self.listing.overall_rating
            self.stats["review_count_listing"] = self.listing.review_count
            self.stats["price_level"] = self.listing.price_level

        if self.ads:
            self.stats["ad_count"] = len(self.ads)
            self.stats["active_ad_count"] = sum(1 for a in self.ads if a.is_active)
            self.stats["promotional_ad_count"] = sum(1 for a in self.ads if a.is_promotional)
