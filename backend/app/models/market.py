import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Text, Date, DateTime, Float, JSON, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.types import UUID


class CalgaryOccasion(Base):
    """
    Calgary-specific occasion calendar.
    200+ tagged occasions with seasonality and niche relevance weights.
    Week 2 deliverable — curated manually + AI-assisted.
    """
    __tablename__ = "calgary_occasions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)

    # Core fields
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50))  # holiday, sports, festival, local, seasonal, civic

    # Date info — some occasions are fixed dates, some are relative (e.g., "2nd Monday of October")
    is_fixed_date: Mapped[bool] = mapped_column(Boolean, default=True)
    month: Mapped[Optional[int]] = mapped_column()  # 1-12
    day: Mapped[Optional[int]] = mapped_column()    # 1-31 for fixed dates
    # For floating dates, use recurrence_rule (rrule-compatible string)
    recurrence_rule: Mapped[Optional[str]] = mapped_column(String(200))

    # Niche relevance weights (0.0 to 1.0)
    relevance_restaurant: Mapped[float] = mapped_column(Float, default=0.5)
    relevance_cafe: Mapped[float] = mapped_column(Float, default=0.5)
    relevance_bar: Mapped[float] = mapped_column(Float, default=0.5)
    relevance_retail: Mapped[float] = mapped_column(Float, default=0.5)
    relevance_fitness: Mapped[float] = mapped_column(Float, default=0.3)

    # Lead time (days before the occasion the signal becomes relevant)
    lead_time_days: Mapped[int] = mapped_column(default=7)

    # Demand signal strength (qualitative)
    demand_signal: Mapped[str] = mapped_column(String(20), default="medium")  # low, medium, high, critical

    # Calgary-specific notes
    calgary_notes: Mapped[Optional[str]] = mapped_column(Text)

    # Meta
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    def __repr__(self) -> str:
        return f"<CalgaryOccasion {self.name}>"


class MarketSignalCache(Base):
    """
    Cached market signals for a given owner + time window.
    Refreshed on Brief generation and Strategy Session dispatch.
    """
    __tablename__ = "market_signal_cache"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)

    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column()  # null = shared signals
    niche: Mapped[str] = mapped_column(String(100))
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    week_end: Mapped[date] = mapped_column(Date, nullable=False)

    # Signal data as JSON blob
    occasions: Mapped[Optional[dict]] = mapped_column(JSON)    # list of relevant occasions
    weather: Mapped[Optional[dict]] = mapped_column(JSON)      # Open-Meteo forecast
    local_events: Mapped[Optional[dict]] = mapped_column(JSON) # Eventbrite + manual
    trends: Mapped[Optional[dict]] = mapped_column(JSON)       # Google Trends data

    # Freshness
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:
        return f"<MarketSignalCache {self.niche} week={self.week_start}>"
