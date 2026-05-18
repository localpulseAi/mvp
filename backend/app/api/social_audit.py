"""
Social Presence Audit API — accounts, audit retrieval, generation trigger, action-item status.
"""
import uuid
from datetime import date, timedelta
from typing import Optional

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, and_, func, delete as sql_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.owner import Owner
from app.models.social_audit import OwnerSocialAccount, SocialAudit, SocialAuditActionItem
from app.services.auth_service import get_current_owner
from app.services.owner_scraper import get_or_create_account

router = APIRouter(prefix="/social-audit", tags=["social-audit"])
log = structlog.get_logger()

VALID_PLATFORMS = {"instagram", "facebook", "google_business"}
VALID_ITEM_STATUSES = {"pending", "in_progress", "done", "dismissed"}


# ── Request / response schemas ────────────────────────────────────────────────

class ConnectAccountIn(BaseModel):
    platform: str
    handle: str
    display_name: Optional[str] = None


class AccountOut(BaseModel):
    id: str
    platform: str
    handle: Optional[str]
    display_name: Optional[str]
    is_active: bool
    connected_at: str
    last_scraped_at: Optional[str]
    last_scrape_status: Optional[str]


class ActionItemOut(BaseModel):
    id: str
    title: str
    priority: str
    category: str
    why: str
    how: str
    watch_for: str
    effort_band: str
    status: str
    display_order: int


class AuditSummaryOut(BaseModel):
    id: str
    week_start: str
    week_end: str
    status: str
    generated_at: str
    action_item_count: int
    has_prior_plan_progress: bool


class AuditDetailOut(BaseModel):
    id: str
    week_start: str
    week_end: str
    status: str
    state_of_presence: Optional[list[dict]]
    what_working: Optional[list[dict]]
    what_not_working: Optional[list[dict]]
    prior_plan_progress: Optional[list[dict]]
    market_connection: Optional[str]
    data_freshness: Optional[dict]
    action_items: list[ActionItemOut]
    generated_at: str


def _account_out(a: OwnerSocialAccount) -> AccountOut:
    return AccountOut(
        id=str(a.id),
        platform=a.platform,
        handle=a.handle,
        display_name=a.display_name,
        is_active=a.is_active,
        connected_at=a.connected_at.isoformat() if a.connected_at else "",
        last_scraped_at=a.last_scraped_at.isoformat() if a.last_scraped_at else None,
        last_scrape_status=a.last_scrape_status,
    )


def _item_out(i: SocialAuditActionItem) -> ActionItemOut:
    return ActionItemOut(
        id=str(i.id),
        title=i.title,
        priority=i.priority,
        category=i.category,
        why=i.why,
        how=i.how,
        watch_for=i.watch_for,
        effort_band=i.effort_band,
        status=i.status,
        display_order=i.display_order,
    )


async def _audit_to_detail(audit: SocialAudit, db: AsyncSession) -> AuditDetailOut:
    items_result = await db.execute(
        select(SocialAuditActionItem)
        .where(SocialAuditActionItem.audit_id == audit.id)
        .order_by(SocialAuditActionItem.display_order)
    )
    items = items_result.scalars().all()
    return AuditDetailOut(
        id=str(audit.id),
        week_start=audit.week_start.isoformat() if audit.week_start else "",
        week_end=audit.week_end.isoformat() if audit.week_end else "",
        status=audit.status,
        state_of_presence=audit.state_of_presence,
        what_working=audit.what_working,
        what_not_working=audit.what_not_working,
        prior_plan_progress=audit.prior_plan_progress,
        market_connection=audit.market_connection,
        data_freshness=audit.data_freshness,
        action_items=[_item_out(i) for i in items],
        generated_at=audit.generated_at.isoformat() if audit.generated_at else "",
    )


# ── Account endpoints ─────────────────────────────────────────────────────────

@router.get("/accounts")
async def list_accounts(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OwnerSocialAccount)
        .where(OwnerSocialAccount.owner_id == owner.id)
        .order_by(OwnerSocialAccount.connected_at)
    )
    accounts = result.scalars().all()
    return {"accounts": [_account_out(a) for a in accounts]}


@router.post("/accounts")
async def connect_account(
    body: ConnectAccountIn,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    if body.platform not in VALID_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"platform must be one of {sorted(VALID_PLATFORMS)}")
    if not body.handle or not body.handle.strip():
        raise HTTPException(status_code=400, detail="handle is required")

    account = await get_or_create_account(
        owner.id, body.platform, body.handle.strip(), body.display_name, db
    )
    log.info("account_connected", owner_id=str(owner.id), platform=body.platform)
    return {"account": _account_out(account)}


@router.delete("/accounts/{account_id}")
async def disconnect_account(
    account_id: str,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    try:
        aid = uuid.UUID(account_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Account not found")

    result = await db.execute(select(OwnerSocialAccount).where(OwnerSocialAccount.id == aid))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if account.owner_id != owner.id:
        raise HTTPException(status_code=403, detail="Access denied")

    account.is_active = False
    await db.commit()
    log.info("account_disconnected", owner_id=str(owner.id), platform=account.platform)
    return {"status": "disconnected"}


# ── Audit endpoints ───────────────────────────────────────────────────────────

@router.get("")
async def list_audits(
    limit: int = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    count_result = await db.execute(
        select(func.count()).select_from(SocialAudit).where(SocialAudit.owner_id == owner.id)
    )
    total = count_result.scalar_one()

    result = await db.execute(
        select(SocialAudit)
        .where(SocialAudit.owner_id == owner.id)
        .order_by(SocialAudit.week_start.desc())
        .limit(limit)
        .offset(offset)
    )
    audits = result.scalars().all()

    summaries = []
    for a in audits:
        count_result2 = await db.execute(
            select(func.count()).select_from(SocialAuditActionItem).where(SocialAuditActionItem.audit_id == a.id)
        )
        item_count = count_result2.scalar_one()
        summaries.append(AuditSummaryOut(
            id=str(a.id),
            week_start=a.week_start.isoformat() if a.week_start else "",
            week_end=a.week_end.isoformat() if a.week_end else "",
            status=a.status,
            generated_at=a.generated_at.isoformat() if a.generated_at else "",
            action_item_count=item_count,
            has_prior_plan_progress=bool(a.prior_plan_progress),
        ))

    return {"audits": summaries, "total": total, "limit": limit, "offset": offset}


@router.get("/current")
async def get_current_audit(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    result = await db.execute(
        select(SocialAudit).where(
            and_(SocialAudit.owner_id == owner.id, SocialAudit.week_start == week_start)
        )
    )
    audit = result.scalar_one_or_none()
    if not audit:
        return {"audit": None}
    return {"audit": await _audit_to_detail(audit, db)}


@router.get("/{audit_id}")
async def get_audit(
    audit_id: str,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    try:
        aid = uuid.UUID(audit_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Audit not found")

    result = await db.execute(select(SocialAudit).where(SocialAudit.id == aid))
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    if audit.owner_id != owner.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {"audit": await _audit_to_detail(audit, db)}


@router.post("/generate")
async def trigger_generate(
    background_tasks: BackgroundTasks,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    result = await db.execute(
        select(SocialAudit).where(
            and_(SocialAudit.owner_id == owner.id, SocialAudit.week_start == week_start)
        )
    )
    existing = result.scalar_one_or_none()

    if existing and existing.status in ("generating", "regenerating"):
        raise HTTPException(status_code=429, detail="Audit is already generating")

    # On-demand rate limit: check last generated_at (3-day window)
    if existing and existing.status == "completed" and existing.generated_at:
        from datetime import datetime
        last_gen = existing.generated_at
        if last_gen.tzinfo is not None:
            last_gen = last_gen.replace(tzinfo=None)
        if (datetime.now() - last_gen).days < 3:
            raise HTTPException(status_code=429, detail="Audit can only be regenerated once every 3 days")

    background_tasks.add_task(_background_generate, owner.id)
    log.info("audit_generate_triggered", owner_id=str(owner.id))
    return {"status": "generating", "week_start": week_start.isoformat()}


async def _background_generate(owner_id: uuid.UUID) -> None:
    from app.database import AsyncSessionLocal
    from app.orchestrator.audit_generator import generate_audit
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Owner).where(Owner.id == owner_id))
        owner = result.scalar_one_or_none()
        if not owner:
            return
        try:
            await generate_audit(owner, db)
        except Exception as e:
            log.error("background_audit_generate_failed", owner_id=str(owner_id), error=type(e).__name__ + ": " + str(e)[:200])


# ── Action item status endpoints ─────────────────────────────────────────────

class UpdateItemStatusIn(BaseModel):
    status: str


@router.patch("/items/{item_id}")
async def update_item_status(
    item_id: str,
    body: UpdateItemStatusIn,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    if body.status not in VALID_ITEM_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(VALID_ITEM_STATUSES)}")

    try:
        iid = uuid.UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Item not found")

    result = await db.execute(select(SocialAuditActionItem).where(SocialAuditActionItem.id == iid))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.owner_id != owner.id:
        raise HTTPException(status_code=403, detail="Access denied")

    from datetime import datetime
    item.status = body.status
    item.status_updated_at = datetime.now()
    await db.commit()
    return {"item": _item_out(item)}


@router.get("/items/active")
async def list_active_items(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """All non-dismissed action items across all audits — for the action plan view."""
    result = await db.execute(
        select(SocialAuditActionItem)
        .where(
            and_(
                SocialAuditActionItem.owner_id == owner.id,
                SocialAuditActionItem.status != "dismissed",
            )
        )
        .order_by(
            SocialAuditActionItem.status,
            SocialAuditActionItem.priority,
            SocialAuditActionItem.display_order,
        )
    )
    items = result.scalars().all()
    return {"items": [_item_out(i) for i in items]}
