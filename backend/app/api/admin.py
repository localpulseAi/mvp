"""
Admin API — Week 8.

Restricted to emails listed in settings.admin_emails (comma-separated).

GET  /admin/owners                        — list all owners with stats
POST /admin/owners/{id}/toggle-subscription — flip subscription_active
GET  /admin/stats                         — aggregate usage stats
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.owner import Owner
from app.models.agent import OwnerCostLedger
from app.services.auth_service import get_current_owner
import structlog

router = APIRouter(prefix="/admin", tags=["admin"])
log = structlog.get_logger()


def _admin_emails() -> set[str]:
    return {e.strip().lower() for e in settings.admin_emails.split(",") if e.strip()}


def _require_admin(owner: Owner = Depends(get_current_owner)) -> Owner:
    if owner.email.lower() not in _admin_emails():
        raise HTTPException(status_code=403, detail="Admin access required")
    return owner


@router.get("/owners")
async def list_owners(
    _admin: Owner = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Owner).order_by(Owner.created_at.desc())
    )
    owners = result.scalars().all()

    return {
        "owners": [
            {
                "id": str(o.id),
                "email": o.email,
                "business_name": o.business_name,
                "niche": o.niche,
                "onboarding_completed": o.onboarding_completed,
                "subscription_active": o.subscription_active,
                "is_founding_member": o.is_founding_member,
                "created_at": o.created_at.isoformat(),
            }
            for o in owners
        ],
        "total": len(owners),
    }


@router.post("/owners/{owner_id}/toggle-subscription")
async def toggle_subscription(
    owner_id: uuid.UUID,
    _admin: Owner = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Owner).where(Owner.id == owner_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Owner not found")

    target.subscription_active = not target.subscription_active
    await db.commit()

    log.info(
        "admin_subscription_toggle",
        target_owner=str(owner_id),
        new_state=target.subscription_active,
        admin=str(_admin.id),
    )

    return {"owner_id": str(target.id), "subscription_active": target.subscription_active}


@router.get("/stats")
async def get_stats(
    _admin: Owner = Depends(_require_admin),
    db: AsyncSession = Depends(get_db),
):
    owner_count = await db.scalar(select(func.count()).select_from(Owner))
    active_count = await db.scalar(
        select(func.count()).select_from(Owner).where(Owner.subscription_active == True)
    )
    onboarded_count = await db.scalar(
        select(func.count()).select_from(Owner).where(Owner.onboarding_completed == True)
    )
    total_cost = await db.scalar(select(func.sum(OwnerCostLedger.total_cost_cents)))

    return {
        "total_owners": owner_count or 0,
        "active_subscriptions": active_count or 0,
        "onboarding_completed": onboarded_count or 0,
        "total_ai_cost_cents": total_cost or 0,
        "total_ai_cost_usd": round((total_cost or 0) / 100, 2),
    }
