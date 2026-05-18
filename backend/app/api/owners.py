"""
Owner profile API — Week 8.

GET  /owners/me        — full profile (used by onboarding, settings, agent context)
PATCH /owners/me       — update any profile fields (incremental or all-at-once)
"""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.owner import Owner
from app.services.auth_service import get_current_owner

router = APIRouter(prefix="/owners", tags=["owners"])


class OwnerProfileUpdate(BaseModel):
    # Step 1 — Business basics
    business_name: Optional[str] = Field(default=None, max_length=255)
    address: Optional[str] = Field(default=None, max_length=500)
    niche: Optional[str] = Field(default=None, max_length=100)
    instagram_handle: Optional[str] = Field(default=None, max_length=100)
    facebook_page: Optional[str] = Field(default=None, max_length=100)

    # Step 2 — Brand
    business_description: Optional[str] = None
    brand_voice: Optional[str] = None
    quarter_goal: Optional[str] = None

    # Step 3 — Costs (ranges only)
    gross_margin_band: Optional[str] = Field(default=None, max_length=20)
    fixed_cost_band: Optional[str] = Field(default=None, max_length=20)
    price_range: Optional[str] = Field(default=None, max_length=100)

    # Step 4 — Operations
    capacity: Optional[str] = Field(default=None, max_length=100)
    staff_size: Optional[str] = Field(default=None, max_length=100)
    peak_hours: Optional[str] = Field(default=None, max_length=200)

    # Completion flag
    onboarding_completed: Optional[bool] = None
    onboarding_step: Optional[int] = Field(default=None, ge=1, le=5)


@router.get("/me")
async def get_me(owner: Owner = Depends(get_current_owner)):
    return {
        "id": str(owner.id),
        "email": owner.email,
        "onboarding_completed": owner.onboarding_completed,
        "onboarding_step": owner.onboarding_step,
        "business_name": owner.business_name,
        "address": owner.address,
        "niche": owner.niche,
        "instagram_handle": owner.instagram_handle,
        "facebook_page": owner.facebook_page,
        "business_description": owner.business_description,
        "brand_voice": owner.brand_voice,
        "quarter_goal": owner.quarter_goal,
        "gross_margin_band": owner.gross_margin_band,
        "fixed_cost_band": owner.fixed_cost_band,
        "price_range": owner.price_range,
        "capacity": owner.capacity,
        "staff_size": owner.staff_size,
        "peak_hours": owner.peak_hours,
        "is_founding_member": owner.is_founding_member,
        "subscription_active": owner.subscription_active,
        "created_at": owner.created_at.isoformat(),
    }


@router.patch("/me")
async def update_me(
    body: OwnerProfileUpdate,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    updates = body.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(owner, field, value)
    await db.commit()
    await db.refresh(owner)
    return {"updated": list(updates.keys()), "onboarding_completed": owner.onboarding_completed}
