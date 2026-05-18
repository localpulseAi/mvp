import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, Integer, JSON, ForeignKey, Date, func, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.types import UUID


class OrchestrationRun(Base):
    __tablename__ = "orchestration_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)
    trigger: Mapped[str] = mapped_column(String(40))  # weekly_brief | strategy_session | competitor_update | manual
    status: Mapped[str] = mapped_column(String(20), default="running")  # running | completed | partial | failed | budget_exceeded
    agents_dispatched: Mapped[Optional[dict]] = mapped_column(JSON)
    agents_completed: Mapped[Optional[dict]] = mapped_column(JSON)
    agents_failed: Mapped[Optional[dict]] = mapped_column(JSON)
    total_cost_cents: Mapped[int] = mapped_column(Integer, default=0)
    total_latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    budget_cents: Mapped[int] = mapped_column(Integer, default=300)
    budget_exceeded: Mapped[bool] = mapped_column(Boolean, default=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_orchestration_runs_owner", "owner_id", "started_at"),
        Index("ix_orchestration_runs_trigger", "trigger", "status"),
    )


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    orchestration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(), ForeignKey("orchestration_runs.id", ondelete="CASCADE"), index=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)
    agent_name: Mapped[str] = mapped_column(String(80))
    agent_version: Mapped[str] = mapped_column(String(20), default="1.0")
    model_used: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(20))  # success | validation_retry | validation_failed | timeout | error
    input_data: Mapped[Optional[dict]] = mapped_column(JSON)
    output_data: Mapped[Optional[dict]] = mapped_column(JSON)
    raw_output: Mapped[Optional[str]] = mapped_column(Text)
    tool_calls: Mapped[Optional[dict]] = mapped_column(JSON)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    input_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    output_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    cost_cents: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_agent_runs_owner_created", "owner_id", "created_at"),
        Index("ix_agent_runs_name_status", "agent_name", "status"),
    )


class OwnerCostLedger(Base):
    __tablename__ = "owner_cost_ledger"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"), index=True)
    month: Mapped[date] = mapped_column(Date)  # first day of the billing month, e.g. 2026-05-01
    total_cost_cents: Mapped[int] = mapped_column(Integer, default=0)
    run_count: Mapped[int] = mapped_column(Integer, default=0)
    budget_limit_cents: Mapped[int] = mapped_column(Integer, default=8000)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("owner_id", "month", name="uq_owner_cost_ledger_month"),
    )
