import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Integer, JSON, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.types import UUID


class StrategySession(Base):
    """
    A strategy session: one owner question + all turns (including follow-ups).

    turns JSON structure:
    [
      {
        "turn_number": 1,
        "question": "...",
        "is_followup": false,
        "orchestration_id": "uuid",
        "strategist_output": {...},
        "analyst_outputs": {"market_analyst": {...}, ...},
        "cost_cents": 42,
        "latency_ms": 9100
      },
      ...
    ]
    """
    __tablename__ = "strategy_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)

    status: Mapped[str] = mapped_column(String(20), default="active")  # active | completed | error
    original_question: Mapped[str] = mapped_column(Text)

    # Question parsing
    parsed_type: Mapped[Optional[str]] = mapped_column(String(50))   # pricing | marketing | operations | ...
    parsed_scope: Mapped[Optional[str]] = mapped_column(String(20))  # tactical | strategic
    implicit_goal: Mapped[Optional[str]] = mapped_column(Text)

    # All turns (JSON array)
    turns: Mapped[Optional[list]] = mapped_column(JSON, default=list)

    # Cost tracking
    total_cost_cents: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        Index("ix_strategy_sessions_owner_created", "owner_id", "created_at"),
        Index("ix_strategy_sessions_status", "status"),
    )
