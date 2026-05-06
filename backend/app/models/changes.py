"""
CompetitorChangeEvent — persisted change signals detected by the change detection pipeline.
Agents query this table instead of re-scanning all raw scrapes.
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Integer, JSON, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.types import UUID


class CompetitorChangeEvent(Base):
    """
    A detected change for a competitor over a specific time window.
    Written by change_detection.py after each normalisation run.
    Read by agents via data_retrieval.py.
    """
    __tablename__ = "competitor_change_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)

    # Foreign keys
    competitor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("competitors.id", ondelete="CASCADE"), index=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), index=True)

    # Change classification
    change_type: Mapped[str] = mapped_column(String(80))
    # Enum values:
    #   posting_cadence_up | posting_cadence_down
    #   engagement_rate_up | engagement_rate_down
    #   new_ad_campaign | ad_campaign_ended
    #   review_volume_spike | review_volume_drop
    #   rating_up | rating_down
    #   promotional_post_detected
    #   promotional_ad_detected
    #   business_hours_changed
    #   price_level_changed
    #   new_hashtag_cluster

    source: Mapped[str] = mapped_column(String(50))        # which scrape source triggered this
    severity: Mapped[str] = mapped_column(String(20))       # high | medium | low
    window_days: Mapped[int] = mapped_column(Integer)        # 7 | 30 | 60 | 90

    # Human-readable summary (what agents and brief generation use)
    description: Mapped[str] = mapped_column(Text)

    # Numeric before/after for changes that have a value
    before_value: Mapped[Optional[float]] = mapped_column()
    after_value: Mapped[Optional[float]] = mapped_column()

    # Raw delta detail (JSON — extra context for agents)
    detail: Mapped[Optional[dict]] = mapped_column(JSON)

    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # Deduplication — don't re-emit the same change within a window
    dedup_key: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    # Format: "{competitor_id}:{change_type}:{source}:{window_days}:{period_start_date}"

    __table_args__ = (
        Index("ix_change_events_owner_detected", "owner_id", "detected_at"),
        Index("ix_change_events_competitor_type", "competitor_id", "change_type"),
    )


class CrossCompetitorPattern(Base):
    """
    A pattern shared by 3+ competitors in the same owner's tracked set.
    Written by pattern_detection.py.
    """
    __tablename__ = "cross_competitor_patterns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), index=True)

    pattern_type: Mapped[str] = mapped_column(String(80))
    # simultaneous_promos | hashtag_cluster | ad_wave | cadence_drop | rating_trend

    severity: Mapped[str] = mapped_column(String(20))       # high | medium | low
    window_days: Mapped[int] = mapped_column(Integer)

    description: Mapped[str] = mapped_column(Text)
    strategic_implication: Mapped[Optional[str]] = mapped_column(Text)

    # Which competitors (list of UUIDs as strings)
    competitor_ids: Mapped[dict] = mapped_column(JSON)       # {"ids": [...]}
    competitor_names: Mapped[dict] = mapped_column(JSON)     # {"names": [...]}

    # Supporting evidence
    evidence: Mapped[Optional[dict]] = mapped_column(JSON)

    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
    dedup_key: Mapped[Optional[str]] = mapped_column(String(255), index=True)
