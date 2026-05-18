"""
Sunday-night brief generation for all active owners.

For Week 5: triggered manually via API or run directly.
For production (Week 7+): wire into APScheduler or Celery Beat to run Sunday 23:00 MT.

Usage:
    python -m app.tasks.brief_cron
"""
import asyncio
import structlog
from sqlalchemy import select, and_

from app.database import AsyncSessionLocal
from app.models.owner import Owner
from app.orchestrator.brief_generator import generate_brief
from app.services.email_service import send_weekly_brief_email

log = structlog.get_logger()


async def generate_all_briefs() -> dict:
    """
    Generate briefs for all owners with completed onboarding and active subscriptions.
    Returns a summary dict: {total, success, failed, skipped, total_cost_cents}.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Owner).where(
                and_(
                    Owner.onboarding_completed == True,
                    Owner.subscription_active == True,
                )
            )
        )
        owners = result.scalars().all()

    log.info("brief_cron_start", owner_count=len(owners))

    success = 0
    failed = 0
    skipped = 0
    total_cost = 0
    errors = []

    for owner in owners:
        try:
            async with AsyncSessionLocal() as db:
                brief = await generate_brief(owner, db)
                if brief.status == "completed":
                    success += 1
                    if brief.full_output:
                        cost = brief.full_output.get("orchestration", {}).get("total_cost_cents", 0)
                        total_cost += cost
                    # Send email
                    try:
                        await send_brief_email(brief, owner)
                    except Exception as e:
                        log.error("brief_email_failed", owner_id=str(owner.id), error=str(e))
                else:
                    failed += 1
                    errors.append({"owner_id": str(owner.id), "reason": "generation_failed"})
        except Exception as e:
            failed += 1
            errors.append({"owner_id": str(owner.id), "reason": str(e)})
            log.error("brief_cron_owner_error", owner_id=str(owner.id), error=str(e))

    summary = {
        "total": len(owners),
        "success": success,
        "failed": failed,
        "skipped": skipped,
        "total_cost_cents": total_cost,
    }
    log.info("brief_cron_complete", **summary)
    return summary


def _build_brief_html(brief, owner: Owner) -> str:
    """Build plain HTML for the weekly brief email."""
    recs = brief.recommendations or []
    watch = brief.watch_for or []
    recs_html = "".join(
        f"<li><strong>{r.get('title', '')}</strong><br>{r.get('body', '')}</li>"
        for r in recs
    )
    watch_html = "".join(f"<li>{w}</li>" for w in watch)
    week_of = brief.week_start.isoformat() if brief.week_start else ""
    return f"""<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 16px;">
<p style="font-size:12px;color:#7c3aed;font-weight:700;letter-spacing:1px;">LOCALPULSE AI</p>
<h1 style="font-size:20px;margin:0 0 4px;">Weekly Strategic Brief</h1>
<p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Week of {week_of} · {owner.business_name or ''}</p>
<h2 style="font-size:16px;margin:0 0 8px;">Market Read</h2>
<p style="line-height:1.7;color:#374151;">{brief.market_read or ''}</p>
<h2 style="font-size:16px;margin:24px 0 8px;">This Week's Plays</h2>
<ul style="line-height:1.8;color:#374151;">{recs_html}</ul>
<h2 style="font-size:16px;margin:24px 0 8px;">Watch For</h2>
<ul style="line-height:1.8;color:#374151;">{watch_html}</ul>
</body></html>"""


async def send_brief_email(brief, owner: Owner) -> None:
    """Send the weekly brief email using the existing email service."""
    if not brief.market_read:
        return
    week_of = brief.week_start.isoformat() if brief.week_start else ""
    brief_html = _build_brief_html(brief, owner)
    await send_weekly_brief_email(
        to_email=owner.email,
        brief_html=brief_html,
        business_name=owner.business_name or "Your business",
        week_of=week_of,
    )


if __name__ == "__main__":
    asyncio.run(generate_all_briefs())
