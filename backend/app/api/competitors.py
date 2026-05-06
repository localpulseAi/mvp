"""
Competitor API — Week 3.

Endpoints:
  GET    /competitors              list owner's competitors
  POST   /competitors              add a competitor (max 5)
  GET    /competitors/{id}         get one competitor
  DELETE /competitors/{id}         soft-delete a competitor
  POST   /competitors/{id}/scrape  trigger an immediate scrape (manual)
  GET    /competitors/{id}/scrapes list scrape history (metadata only, no raw data)
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from pydantic import BaseModel, Field
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.owner import Owner
from app.models.competitor import Competitor, CompetitorScrape
from app.services.auth_service import get_current_owner
from app.services.competitor_service import (
    get_competitors,
    get_competitor,
    add_competitor,
    remove_competitor,
    run_scrape_for_competitor,
)
import structlog

router = APIRouter(prefix="/competitors", tags=["competitors"])
log = structlog.get_logger()


# ── Schemas ──────────────────────────────────────────────────────────────────

class CompetitorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    address: Optional[str] = None
    google_place_id: Optional[str] = None
    instagram_handle: Optional[str] = None
    facebook_page: Optional[str] = None
    google_business_url: Optional[str] = None


class CompetitorOut(BaseModel):
    id: str
    name: str
    address: Optional[str]
    google_place_id: Optional[str]
    instagram_handle: Optional[str]
    facebook_page: Optional[str]
    google_business_url: Optional[str]
    is_active: bool
    baseline_complete: bool
    added_at: datetime

    @classmethod
    def from_orm(cls, c: Competitor) -> "CompetitorOut":
        return cls(
            id=str(c.id),
            name=c.name,
            address=c.address,
            google_place_id=c.google_place_id,
            instagram_handle=c.instagram_handle,
            facebook_page=c.facebook_page,
            google_business_url=c.google_business_url,
            is_active=c.is_active,
            baseline_complete=c.baseline_complete,
            added_at=c.added_at,
        )


class ScrapeHistoryItem(BaseModel):
    id: str
    source: str
    scraped_at: datetime
    success: bool
    error_message: Optional[str]
    retry_count: int
    apify_run_id: Optional[str]
    # raw_data intentionally omitted (FR-CA-08)

    @classmethod
    def from_orm(cls, s: CompetitorScrape) -> "ScrapeHistoryItem":
        return cls(
            id=str(s.id),
            source=s.source,
            scraped_at=s.scraped_at,
            success=s.success,
            error_message=s.error_message,
            retry_count=s.retry_count,
            apify_run_id=s.apify_run_id,
        )


# ── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=list[CompetitorOut])
async def list_competitors(
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """List all active competitors for the authenticated owner."""
    competitors = await get_competitors(owner.id, db)
    return [CompetitorOut.from_orm(c) for c in competitors]


@router.post("", response_model=CompetitorOut, status_code=status.HTTP_201_CREATED)
async def create_competitor(
    body: CompetitorCreate,
    background_tasks: BackgroundTasks,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Add a competitor to the owner's tracked set.
    Triggers a baseline scrape in the background immediately.
    Max 5 competitors per owner (FR-CA).
    """
    try:
        competitor = await add_competitor(
            owner_id=owner.id,
            name=body.name,
            db=db,
            address=body.address,
            google_place_id=body.google_place_id,
            instagram_handle=body.instagram_handle,
            facebook_page=body.facebook_page,
            google_business_url=body.google_business_url,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    # Kick off baseline scrape in background
    background_tasks.add_task(_background_scrape, competitor.id, owner.id)

    log.info("competitor_created", id=str(competitor.id), owner_id=str(owner.id))
    return CompetitorOut.from_orm(competitor)


@router.get("/{competitor_id}", response_model=CompetitorOut)
async def get_one_competitor(
    competitor_id: uuid.UUID,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    competitor = await get_competitor(competitor_id, owner.id, db)
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found.")
    return CompetitorOut.from_orm(competitor)


@router.delete("/{competitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_competitor(
    competitor_id: uuid.UUID,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete a competitor (retains scrape history)."""
    deleted = await remove_competitor(competitor_id, owner.id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Competitor not found.")


@router.post("/{competitor_id}/scrape", status_code=status.HTTP_202_ACCEPTED)
async def trigger_scrape(
    competitor_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger a full scrape for a competitor.
    Runs in background — returns immediately with 202.
    """
    competitor = await get_competitor(competitor_id, owner.id, db)
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found.")

    background_tasks.add_task(_background_scrape, competitor.id, owner.id)
    return {"message": "Scrape triggered.", "competitor_id": str(competitor_id)}


@router.get("/{competitor_id}/scrapes", response_model=list[ScrapeHistoryItem])
async def get_scrape_history(
    competitor_id: uuid.UUID,
    limit: int = 20,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Get scrape history (metadata only — no raw data, per FR-CA-08).
    """
    competitor = await get_competitor(competitor_id, owner.id, db)
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found.")

    result = await db.execute(
        select(CompetitorScrape)
        .where(CompetitorScrape.competitor_id == competitor_id)
        .order_by(desc(CompetitorScrape.scraped_at))
        .limit(min(limit, 100))
    )
    scrapes = result.scalars().all()
    return [ScrapeHistoryItem.from_orm(s) for s in scrapes]


# ── Background task helper ───────────────────────────────────────────────────

async def _background_scrape(competitor_id: uuid.UUID, owner_id: uuid.UUID) -> None:
    """
    Background scrape runner — creates its own DB session.
    Used by background_tasks so the request session is already closed.
    """
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Competitor).where(
                and_(Competitor.id == competitor_id, Competitor.owner_id == owner_id)
            )
        )
        competitor = result.scalar_one_or_none()
        if not competitor:
            log.warning("background_scrape_competitor_not_found", id=str(competitor_id))
            return

        try:
            await run_scrape_for_competitor(competitor, db, force=True)
            # Run change detection immediately after scraping
            from app.services.change_detection import run_change_detection
            from app.services.competitor_service import get_competitors
            from app.services.pattern_detection import run_pattern_detection
            await run_change_detection(competitor, owner_id, db)
            # Re-run cross-competitor patterns with fresh data
            all_competitors = await get_competitors(owner_id, db)
            if len(all_competitors) >= 3:
                await run_pattern_detection(owner_id, all_competitors, db)
        except Exception as e:
            log.error("background_scrape_failed", competitor_id=str(competitor_id), error=str(e))
