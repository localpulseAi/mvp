import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.types import UUID


class Owner(Base):
    __tablename__ = "owners"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Onboarding status
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_step: Mapped[int] = mapped_column(default=1)

    # Business basics (step 1)
    business_name: Mapped[Optional[str]] = mapped_column(String(255))
    address: Mapped[Optional[str]] = mapped_column(String(500))
    niche: Mapped[Optional[str]] = mapped_column(String(100))
    instagram_handle: Mapped[Optional[str]] = mapped_column(String(100))
    facebook_page: Mapped[Optional[str]] = mapped_column(String(100))

    # Brand (step 2)
    business_description: Mapped[Optional[str]] = mapped_column(Text)
    brand_voice: Mapped[Optional[str]] = mapped_column(Text)
    quarter_goal: Mapped[Optional[str]] = mapped_column(Text)

    # Cost structure (step 3) — ranges only, never exact figures
    gross_margin_band: Mapped[Optional[str]] = mapped_column(String(20))
    fixed_cost_band: Mapped[Optional[str]] = mapped_column(String(20))
    price_range: Mapped[Optional[str]] = mapped_column(String(100))

    # Operations (step 4)
    capacity: Mapped[Optional[str]] = mapped_column(String(100))
    staff_size: Mapped[Optional[str]] = mapped_column(String(100))
    peak_hours: Mapped[Optional[str]] = mapped_column(String(200))

    # Subscription
    is_founding_member: Mapped[bool] = mapped_column(Boolean, default=False)
    subscription_active: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    sessions: Mapped[list["OwnerSession"]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    magic_link_tokens: Mapped[list["MagicLinkToken"]] = relationship(back_populates="owner", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Owner {self.email}>"


class MagicLinkToken(Base):
    __tablename__ = "magic_link_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"))
    token: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    owner: Mapped["Owner"] = relationship(back_populates="magic_link_tokens")


class OwnerSession(Base):
    __tablename__ = "owner_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(), primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(), ForeignKey("owners.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    user_agent: Mapped[Optional[str]] = mapped_column(String(500))
    ip_address: Mapped[Optional[str]] = mapped_column(String(50))

    owner: Mapped["Owner"] = relationship(back_populates="sessions")
