"""
Per-owner cost accounting. Tracks cumulative spend per calendar month.
"""
import uuid
from datetime import date, datetime, timezone
from typing import Optional

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.agent import OwnerCostLedger

log = structlog.get_logger()


async def get_or_create_ledger(owner_id: uuid.UUID, db: AsyncSession) -> OwnerCostLedger:
    today = date.today()
    month_start = today.replace(day=1)

    result = await db.execute(
        select(OwnerCostLedger).where(
            OwnerCostLedger.owner_id == owner_id,
            OwnerCostLedger.month == month_start,
        )
    )
    ledger = result.scalar_one_or_none()
    if ledger:
        return ledger

    ledger = OwnerCostLedger(
        owner_id=owner_id,
        month=month_start,
        total_cost_cents=0,
        run_count=0,
        budget_limit_cents=settings.max_cost_per_owner_month_cents,
    )
    db.add(ledger)
    await db.commit()
    await db.refresh(ledger)
    return ledger


async def record_cost(
    owner_id: uuid.UUID,
    cost_cents: int,
    db: AsyncSession,
) -> tuple[int, bool]:
    """
    Atomically add cost_cents to the owner's monthly ledger.
    Returns (new_total_cents, budget_exceeded).
    """
    ledger = await get_or_create_ledger(owner_id, db)

    new_total = ledger.total_cost_cents + cost_cents
    new_run_count = ledger.run_count + 1

    await db.execute(
        update(OwnerCostLedger)
        .where(OwnerCostLedger.id == ledger.id)
        .values(
            total_cost_cents=new_total,
            run_count=new_run_count,
            updated_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()

    budget_exceeded = new_total > ledger.budget_limit_cents
    if budget_exceeded:
        log.warning(
            "owner_budget_exceeded",
            owner_id=str(owner_id),
            total_cents=new_total,
            budget_cents=ledger.budget_limit_cents,
        )

    return new_total, budget_exceeded


async def get_cost_summary(owner_id: uuid.UUID, db: AsyncSession) -> dict:
    today = date.today()
    month_start = today.replace(day=1)

    result = await db.execute(
        select(OwnerCostLedger).where(
            OwnerCostLedger.owner_id == owner_id,
            OwnerCostLedger.month == month_start,
        )
    )
    ledger = result.scalar_one_or_none()

    if not ledger:
        return {
            "month": month_start.isoformat(),
            "total_cost_cents": 0,
            "run_count": 0,
            "budget_limit_cents": settings.max_cost_per_owner_month_cents,
            "budget_remaining_cents": settings.max_cost_per_owner_month_cents,
        }

    return {
        "month": ledger.month.isoformat(),
        "total_cost_cents": ledger.total_cost_cents,
        "run_count": ledger.run_count,
        "budget_limit_cents": ledger.budget_limit_cents,
        "budget_remaining_cents": max(0, ledger.budget_limit_cents - ledger.total_cost_cents),
    }
