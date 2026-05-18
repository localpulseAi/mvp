"""
Competitor analysis cron task — Week 7.

Designed to run bi-weekly (e.g. every Monday and Thursday).
Calls generate_set_analysis for every owner with an active subscription.

Manual trigger:
  python -c "import asyncio; from app.tasks.competitor_cron import analyze_all_competitors; asyncio.run(analyze_all_competitors())"

Production: wire up to a cron scheduler (APScheduler / Celery Beat / cron job).
"""
import structlog
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.owner import Owner
from app.services.competitor_analyzer import generate_set_analysis

log = structlog.get_logger()


async def analyze_all_competitors() -> dict:
    """
    Run competitor set analysis for all subscription-active owners.
    Returns a summary dict for observability / logging.
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Owner).where(Owner.subscription_active == True)
        )
        owners = result.scalars().all()

    total = len(owners)
    completed = 0
    errors = []

    log.info("competitor_cron_start", total_owners=total)

    for owner in owners:
        try:
            async with AsyncSessionLocal() as db:
                outcome = await generate_set_analysis(owner, db)
            if outcome.get("status") == "completed":
                completed += 1
                log.info(
                    "competitor_cron_owner_done",
                    owner_id=str(owner.id),
                    analyses=outcome.get("analyses_created"),
                )
            else:
                errors.append({"owner_id": str(owner.id), "error": outcome.get("error")})
        except Exception as e:
            log.error("competitor_cron_owner_error", owner_id=str(owner.id), error=str(e))
            errors.append({"owner_id": str(owner.id), "error": str(e)})

    log.info(
        "competitor_cron_done",
        total=total,
        completed=completed,
        errors=len(errors),
    )

    return {"total": total, "completed": completed, "errors": errors}
