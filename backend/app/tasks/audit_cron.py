"""
Social Presence Audit cron — generates audits for all owners with connected accounts.

Run weekly (Sunday night, before Monday brief delivery):
    python -m app.tasks.audit_cron
"""
import asyncio
import structlog
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.owner import Owner
from app.models.social_audit import OwnerSocialAccount
from app.orchestrator.audit_generator import generate_audit

log = structlog.get_logger()


async def generate_all_audits() -> dict:
    """Generate Social Presence Audits for all owners with at least one connected account."""
    async with AsyncSessionLocal() as db:
        # Find all owners who have at least one active social account
        result = await db.execute(
            select(Owner).where(
                Owner.id.in_(
                    select(OwnerSocialAccount.owner_id)
                    .where(OwnerSocialAccount.is_active == True)
                    .distinct()
                )
            )
        )
        owners = result.scalars().all()

    log.info("audit_cron_start", owner_count=len(owners))

    completed = 0
    failed = 0
    skipped = 0

    for owner in owners:
        async with AsyncSessionLocal() as db:
            try:
                audit = await generate_audit(owner, db)
                if audit and audit.status == "completed":
                    completed += 1
                elif audit is None:
                    skipped += 1
                else:
                    failed += 1
            except Exception as e:
                failed += 1
                log.error(
                    "audit_cron_owner_failed",
                    owner_id=str(owner.id),
                    error=type(e).__name__ + ": " + str(e)[:200],
                )

    log.info("audit_cron_complete", completed=completed, failed=failed, skipped=skipped)
    return {"completed": completed, "failed": failed, "skipped": skipped}


if __name__ == "__main__":
    asyncio.run(generate_all_audits())
