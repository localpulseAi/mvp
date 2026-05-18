"""
Weekly Brief API — CRUD + manual generation trigger.
"""
import asyncio
import uuid
from datetime import date, timedelta
from typing import Optional

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.brief import WeeklyBrief
from app.models.owner import Owner
from app.orchestrator.brief_generator import generate_brief
from app.services.auth_service import get_current_owner

router = APIRouter(prefix="/briefs", tags=["briefs"])
log = structlog.get_logger()


# ── Response schemas ──────────────────────────────────────────────────────────

class WeeklyBriefSummary(BaseModel):
    id: str
    week_start: str
    week_end: str
    status: str
    generated_at: str
    has_competitor_section: bool


class WeeklyBriefOut(BaseModel):
    id: str
    week_start: str
    week_end: str
    status: str
    market_read: Optional[str]
    recommendations: Optional[list[dict]]
    watch_for: Optional[list[str]]
    competitor_section: Optional[dict]
    data_freshness: Optional[dict]
    generated_at: str


def _brief_to_summary(b: WeeklyBrief) -> WeeklyBriefSummary:
    return WeeklyBriefSummary(
        id=str(b.id),
        week_start=b.week_start.isoformat() if b.week_start else "",
        week_end=b.week_end.isoformat() if b.week_end else "",
        status=b.status,
        generated_at=b.generated_at.isoformat() if b.generated_at else "",
        has_competitor_section=bool(b.competitor_section),
    )


def _brief_to_out(b: WeeklyBrief) -> WeeklyBriefOut:
    return WeeklyBriefOut(
        id=str(b.id),
        week_start=b.week_start.isoformat() if b.week_start else "",
        week_end=b.week_end.isoformat() if b.week_end else "",
        status=b.status,
        market_read=b.market_read,
        recommendations=b.recommendations,
        watch_for=b.watch_for,
        competitor_section=b.competitor_section,
        data_freshness=b.data_freshness,
        generated_at=b.generated_at.isoformat() if b.generated_at else "",
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("")
async def list_briefs(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(
        select(func.count()).select_from(WeeklyBrief).where(WeeklyBrief.owner_id == owner.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(WeeklyBrief)
        .where(WeeklyBrief.owner_id == owner.id)
        .order_by(WeeklyBrief.week_start.desc())
        .limit(limit)
        .offset(offset)
    )
    briefs = result.scalars().all()

    return {
        "briefs": [_brief_to_summary(b) for b in briefs],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/current")
async def get_current_brief(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    result = await db.execute(
        select(WeeklyBrief).where(
            and_(
                WeeklyBrief.owner_id == owner.id,
                WeeklyBrief.week_start == week_start,
            )
        )
    )
    brief = result.scalar_one_or_none()

    return {"brief": _brief_to_out(brief) if brief else None}


@router.get("/{brief_id}")
async def get_brief(
    brief_id: str,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    try:
        bid = uuid.UUID(brief_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Brief not found")

    result = await db.execute(select(WeeklyBrief).where(WeeklyBrief.id == bid))
    brief = result.scalar_one_or_none()

    if not brief:
        raise HTTPException(status_code=404, detail="Brief not found")
    if brief.owner_id != owner.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"brief": _brief_to_out(brief)}


@router.post("/generate")
async def trigger_generate(
    background_tasks: BackgroundTasks,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    # Rate limit: one per week per owner (allow one regeneration of existing)
    result = await db.execute(
        select(WeeklyBrief).where(
            and_(
                WeeklyBrief.owner_id == owner.id,
                WeeklyBrief.week_start == week_start,
            )
        )
    )
    existing = result.scalar_one_or_none()

    if existing and existing.status == "regenerating":
        raise HTTPException(status_code=429, detail="Brief is already being regenerated")

    if existing and existing.status == "generating":
        raise HTTPException(status_code=429, detail="Brief is already generating")

    if existing and existing.status == "completed":
        existing.status = "regenerating"
        existing.regenerated_from = existing.id
        await db.commit()
        brief_id = str(existing.id)
    else:
        brief_id = "pending"

    # Run generation in background
    background_tasks.add_task(_background_generate, owner.id, owner.email)

    log.info("brief_generate_triggered", owner_id=str(owner.id), week_start=week_start.isoformat())
    return {"brief_id": brief_id, "status": "generating", "week_start": week_start.isoformat()}


async def _background_generate(owner_id: uuid.UUID, owner_email: str) -> None:
    """Background task: generate brief and persist results."""
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Owner).where(Owner.id == owner_id))
        owner = result.scalar_one_or_none()
        if not owner:
            log.error("background_generate_owner_not_found", owner_id=str(owner_id))
            return
        try:
            await generate_brief(owner, db)
        except Exception as e:
            log.error("background_generate_failed", owner_id=str(owner_id), error=str(e))


@router.post("/generate-all")
async def trigger_generate_all(
    background_tasks: BackgroundTasks,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: trigger brief generation for all active owners."""
    admin_emails = [e.strip() for e in settings.admin_emails.split(",") if e.strip()]
    if owner.email not in admin_emails:
        raise HTTPException(status_code=403, detail="Admin access required")

    background_tasks.add_task(_background_generate_all)
    return {"message": "Brief generation triggered for all active owners"}


async def _background_generate_all() -> None:
    from app.tasks.brief_cron import generate_all_briefs
    await generate_all_briefs()
