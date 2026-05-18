"""
Social Presence Audit generation — runs the SocialPresenceAnalyst agent
and persists the SocialAudit + SocialAuditActionItem rows.

One audit per owner per week. On-demand re-generation replaces the current week's audit.
"""
import uuid
from datetime import date, timedelta, datetime
from typing import Optional

import structlog
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.schemas import AgentInput, OwnerProfile, TimeWindow, SocialPresenceAuditOutput
from app.config import settings
from app.models.owner import Owner
from app.models.social_audit import OwnerSocialAccount, SocialAudit, SocialAuditActionItem
from app.orchestrator.dispatcher import dispatch_agents
from app.services.owner_scraper import scrape_all_owner_accounts

log = structlog.get_logger()


def _current_week_bounds() -> tuple[date, date]:
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _owner_to_profile(owner: Owner) -> OwnerProfile:
    return OwnerProfile(
        owner_id=str(owner.id),
        business_name=owner.business_name,
        niche=owner.niche or "restaurant",
        address=owner.address,
        business_description=owner.business_description,
        brand_voice=owner.brand_voice,
        quarter_goal=owner.quarter_goal,
        gross_margin_band=owner.gross_margin_band,
        fixed_cost_band=owner.fixed_cost_band,
        price_range=owner.price_range,
        capacity=owner.capacity,
        staff_size=owner.staff_size,
        peak_hours=owner.peak_hours,
        instagram_handle=owner.instagram_handle,
        facebook_page=owner.facebook_page,
    )


async def _has_connected_accounts(owner_id: uuid.UUID, db: AsyncSession) -> bool:
    result = await db.execute(
        select(OwnerSocialAccount).where(
            and_(OwnerSocialAccount.owner_id == owner_id, OwnerSocialAccount.is_active == True)
        ).limit(1)
    )
    return result.scalar_one_or_none() is not None


async def generate_audit(owner: Owner, db: AsyncSession) -> Optional[SocialAudit]:
    owner_id = owner.id
    week_start, week_end = _current_week_bounds()

    log.info("audit_generate_start", owner_id=str(owner_id), week_start=week_start.isoformat())

    if not await _has_connected_accounts(owner_id, db):
        log.info("audit_skipped_no_accounts", owner_id=str(owner_id))
        return None

    # Ensure fresh scrape data before running the agent
    try:
        await scrape_all_owner_accounts(owner_id, db)
    except Exception as e:
        log.warning("audit_scrape_prefetch_failed", owner_id=str(owner_id), error=type(e).__name__ + ": " + str(e)[:200])

    # Get or create the SocialAudit row for this week
    existing_result = await db.execute(
        select(SocialAudit).where(
            and_(
                SocialAudit.owner_id == owner_id,
                SocialAudit.week_start == week_start,
            )
        )
    )
    audit = existing_result.scalar_one_or_none()

    if audit:
        audit.status = "regenerating"
        await db.commit()
    else:
        audit = SocialAudit(
            owner_id=owner_id,
            week_start=week_start,
            week_end=week_end,
            status="generating",
        )
        db.add(audit)
        await db.commit()
        await db.refresh(audit)

    # Build agent input
    owner_profile = _owner_to_profile(owner)
    agent_input = AgentInput(
        owner_profile=owner_profile,
        time_window=TimeWindow(week_start=week_start, week_end=week_end),
    )

    # Run the Social Presence Analyst
    orch_result = await dispatch_agents(
        agent_names=["social_presence_analyst"],
        input_data=agent_input,
        owner_id=owner_id,
        trigger="social_audit",
        db=db,
    )

    agent_result = orch_result.results.get("social_presence_analyst")

    if not agent_result or not agent_result.output:
        audit.status = "failed"
        await db.commit()
        log.error(
            "audit_generation_failed_no_output",
            owner_id=str(owner_id),
            agent_status=agent_result.status if agent_result else "no_result",
            error=agent_result.error_message if agent_result else "agent_not_dispatched",
        )
        return audit

    output: SocialPresenceAuditOutput = agent_result.output

    # Persist audit content
    audit.status = "completed"
    audit.orchestration_id = orch_result.orchestration_id
    audit.state_of_presence = [s.model_dump() for s in output.state_of_presence]
    audit.what_working = [w.model_dump() for w in output.what_working]
    audit.what_not_working = [n.model_dump() for n in output.what_not_working]
    audit.prior_plan_progress = [p.model_dump() for p in output.prior_plan_progress]
    audit.market_connection = output.market_connection
    audit.data_freshness = output.data_freshness
    audit.full_output = output.model_dump(mode="json")
    audit.generated_at = datetime.now()
    await db.commit()
    await db.refresh(audit)

    # Persist action items — delete old ones for this audit first (for re-generations)
    from sqlalchemy import delete as sql_delete
    await db.execute(
        sql_delete(SocialAuditActionItem).where(SocialAuditActionItem.audit_id == audit.id)
    )
    await db.commit()

    for i, item in enumerate(output.action_plan):
        action_item = SocialAuditActionItem(
            audit_id=audit.id,
            owner_id=owner_id,
            source_audit_id=audit.id,
            title=item.title,
            priority=item.priority,
            category=item.category,
            why=item.why,
            how=item.how,
            watch_for=item.watch_for,
            effort_band=item.effort_band,
            status="pending",
            display_order=i,
        )
        db.add(action_item)

    await db.commit()

    log.info(
        "audit_generation_complete",
        owner_id=str(owner_id),
        audit_id=str(audit.id),
        action_items=len(output.action_plan),
        what_working=len(output.what_working),
        what_not_working=len(output.what_not_working),
        cost_cents=orch_result.total_cost_cents,
        latency_ms=orch_result.total_latency_ms,
    )
    return audit
