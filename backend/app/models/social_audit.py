import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, Integer, JSON, ForeignKey, Date, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.types import UUID


class OwnerSocialAccount(Base):
    """An owner's own social account connected for the Social Presence Audit."""
    __tablename__ = "owner_social_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)

    platform: Mapped[str] = mapped_column(String(30))  # instagram | facebook | google_business
    handle: Mapped[Optional[str]] = mapped_column(String(200))  # @handle, page URL, or place_id
    display_name: Mapped[Optional[str]] = mapped_column(String(200))

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    connected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_scraped_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    last_scrape_status: Mapped[Optional[str]] = mapped_column(String(20))  # success | failed | pending

    __table_args__ = (
        Index("ix_owner_social_accounts_owner_platform", "owner_id", "platform"),
    )


class OwnerSocialScrape(Base):
    """Raw + normalised scrape data for owner's own social accounts."""
    __tablename__ = "owner_social_scrapes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owner_social_accounts.id", ondelete="CASCADE"))

    source: Mapped[str] = mapped_column(String(30))  # instagram | facebook | google_reviews | google_business
    scraped_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    raw_data: Mapped[Optional[dict]] = mapped_column(JSON)
    normalised_data: Mapped[Optional[dict]] = mapped_column(JSON)
    post_count: Mapped[int] = mapped_column(Integer, default=0)

    apify_run_id: Mapped[Optional[str]] = mapped_column(String(100))
    error_message: Mapped[Optional[str]] = mapped_column(Text)

    __table_args__ = (
        Index("ix_owner_social_scrapes_owner_source", "owner_id", "source", "scraped_at"),
    )


class SocialAudit(Base):
    """Weekly Social Presence Audit — one per owner per week."""
    __tablename__ = "social_audits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)
    orchestration_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(), ForeignKey("orchestration_runs.id", ondelete="SET NULL"), nullable=True
    )

    week_start: Mapped[date] = mapped_column(Date)
    week_end: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="generating")  # generating | completed | failed | regenerating

    # Audit content (structured output from SocialPresenceAnalyst)
    state_of_presence: Mapped[Optional[dict]] = mapped_column(JSON)   # list[{platform, assessment, cadence_observation, content_mix_observation, recent_direction}]
    what_working: Mapped[Optional[dict]] = mapped_column(JSON)         # list[{observation, why_it_works, theme}]
    what_not_working: Mapped[Optional[dict]] = mapped_column(JSON)     # list[{observation, hypothesis, category}]
    prior_plan_progress: Mapped[Optional[dict]] = mapped_column(JSON)  # list[{title, status, signal_observed}]
    market_connection: Mapped[Optional[str]] = mapped_column(Text)
    data_freshness: Mapped[Optional[dict]] = mapped_column(JSON)       # {source: iso_timestamp}
    full_output: Mapped[Optional[dict]] = mapped_column(JSON)

    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    regenerated_from: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_social_audits_owner_week", "owner_id", "week_start"),
    )


class SocialAuditActionItem(Base):
    """An action item produced by a SocialAudit, with persistent status tracking."""
    __tablename__ = "social_audit_action_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    audit_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("social_audits.id", ondelete="CASCADE"), index=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)
    source_audit_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(), nullable=True)  # the audit that first generated this item

    title: Mapped[str] = mapped_column(String(300))
    priority: Mapped[str] = mapped_column(String(10))   # high | medium | low
    category: Mapped[str] = mapped_column(String(30))   # content | cadence | engagement | positioning | reviews | profile | other
    why: Mapped[str] = mapped_column(Text)
    how: Mapped[str] = mapped_column(Text)
    watch_for: Mapped[str] = mapped_column(Text)
    effort_band: Mapped[str] = mapped_column(String(30))  # under_15_min | 15_to_60_min | over_1_hour

    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | in_progress | done | dismissed
    status_updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_social_audit_items_owner_status", "owner_id", "status"),
    )
