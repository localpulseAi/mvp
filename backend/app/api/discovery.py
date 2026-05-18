"""
Competitor discovery API — Week 7.

POST /discovery/competitors
  Searches Google Places for nearby competitors in the owner's niche,
  scores them with LLM on 5 dimensions, returns a ranked shortlist.
  Called from onboarding Step 5 (Competitor Discovery).
"""
from typing import Optional

import structlog
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.owner import Owner
from app.services.auth_service import get_current_owner
from app.services.discovery import discover_competitors

router = APIRouter(prefix="/discovery", tags=["discovery"])
log = structlog.get_logger()


class DiscoverRequest(BaseModel):
    address: str = Field(..., min_length=5, max_length=500)
    niche: str = Field(..., min_length=1, max_length=100)
    business_name: str = Field(..., min_length=1, max_length=255)
    business_description: Optional[str] = Field(default=None, max_length=1000)
    max_results: int = Field(default=8, ge=3, le=15)


@router.post("/competitors")
async def discover(
    body: DiscoverRequest,
    owner: Owner = Depends(get_current_owner),
    db: AsyncSession = Depends(get_db),
):
    """
    Discover nearby competitor candidates for the owner's niche.
    Returns ranked shortlist with LLM-generated scores on 5 competitive dimensions.
    """
    log.info(
        "discovery_request",
        owner_id=str(owner.id),
        niche=body.niche,
        max_results=body.max_results,
    )

    result = await discover_competitors(
        address=body.address,
        niche=body.niche,
        business_name=body.business_name,
        business_description=body.business_description,
        max_results=body.max_results,
    )

    return result
