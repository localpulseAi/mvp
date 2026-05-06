import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.types import UUID


class Competitor(Base):
    """A competitor in an owner's tracked set (max 5 per FR-CA)."""
    __tablename__ = "competitors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(500))
    google_place_id: Mapped[Optional[str]] = mapped_column(String(200))

    # Source handles
    instagram_handle: Mapped[Optional[str]] = mapped_column(String(100))
    facebook_page: Mapped[Optional[str]] = mapped_column(String(100))
    google_business_url: Mapped[Optional[str]] = mapped_column(String(500))

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    baseline_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    scrapes: Mapped[list["CompetitorScrape"]] = relationship(back_populates="competitor", cascade="all, delete-orphan")
    analyses: Mapped[list["CompetitorAnalysis"]] = relationship(back_populates="competitor", cascade="all, delete-orphan")


class CompetitorScrape(Base):
    """
    Raw scrape data per competitor per source per run.
    Full history retained. Owners NEVER see raw data (FR-CA-08).
    """
    __tablename__ = "competitor_scrapes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    competitor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("competitors.id", ondelete="CASCADE"), index=True
    )

    source: Mapped[str] = mapped_column(String(50))  # instagram | facebook | google_reviews | google_business | meta_ads
    scraped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Raw data — never exposed to owners
    raw_data: Mapped[Optional[dict]] = mapped_column(JSON)

    # Normalised data (populated by Week 4 normaliser)
    normalised_data: Mapped[Optional[dict]] = mapped_column(JSON)

    # Status
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(default=0)

    # Apify run reference
    apify_run_id: Mapped[Optional[str]] = mapped_column(String(100))
    apify_actor_id: Mapped[Optional[str]] = mapped_column(String(100))

    competitor: Mapped["Competitor"] = relationship(back_populates="scrapes")


class CompetitorAnalysis(Base):
    """
    AI-generated analysis per competitor per bi-weekly window.
    This is what owners see — never raw scrape data.
    """
    __tablename__ = "competitor_analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    competitor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("competitors.id", ondelete="CASCADE"), index=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), index=True)

    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Analysis output (structured, owner-facing)
    positioning_summary: Mapped[Optional[str]] = mapped_column(Text)
    strengths: Mapped[Optional[dict]] = mapped_column(JSON)           # list[str]
    vulnerabilities: Mapped[Optional[dict]] = mapped_column(JSON)     # list[str]
    recent_shifts: Mapped[Optional[str]] = mapped_column(Text)
    strategic_implication: Mapped[Optional[str]] = mapped_column(Text)

    # Data freshness per source
    data_freshness: Mapped[Optional[dict]] = mapped_column(JSON)      # {source: iso_timestamp}
    missing_sources: Mapped[Optional[dict]] = mapped_column(JSON)     # list[str] with stale/failed sources

    # Agent run metadata (observability)
    agent_run_id: Mapped[Optional[str]] = mapped_column(String(100))
    model_used: Mapped[Optional[str]] = mapped_column(String(100))
    latency_ms: Mapped[Optional[int]] = mapped_column()
    cost_cents: Mapped[Optional[int]] = mapped_column()

    competitor: Mapped["Competitor"] = relationship(back_populates="analyses")
