import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, Integer, JSON, ForeignKey, Date, func, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.types import UUID


class WeeklyBrief(Base):
    __tablename__ = "weekly_briefs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)
    orchestration_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(), ForeignKey("orchestration_runs.id", ondelete="SET NULL"), nullable=True
    )

    week_start: Mapped[date] = mapped_column(Date)
    week_end: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="generating")  # generating | completed | failed | regenerating

    # Brief content
    market_read: Mapped[Optional[str]] = mapped_column(Text)
    recommendations: Mapped[Optional[dict]] = mapped_column(JSON)  # list[{title, body, reasoning, watch_for}]
    watch_for: Mapped[Optional[dict]] = mapped_column(JSON)        # list[str]
    competitor_section: Mapped[Optional[dict]] = mapped_column(JSON)  # {entries: [{name, observation, implication}]} or null
    data_freshness: Mapped[Optional[dict]] = mapped_column(JSON)   # {source: iso_timestamp}
    full_output: Mapped[Optional[dict]] = mapped_column(JSON)      # complete structured output for archival

    # Email delivery
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    email_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    regenerated_from: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("owner_id", "week_start", name="uq_weekly_brief_owner_week"),
        Index("ix_weekly_briefs_owner_week", "owner_id", "week_start"),
        Index("ix_weekly_briefs_status", "status"),
    )
