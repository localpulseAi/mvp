"""
owner_social_data_retrieval tool — fetches the owner's own social content for the Social Presence Analyst.

Returns normalised posts, reviews, cadence signals, and prior audit action plan.
"""
import uuid
import structlog
from datetime import datetime, timedelta
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.social_audit import OwnerSocialAccount, OwnerSocialScrape, SocialAudit, SocialAuditActionItem
from app.services.owner_scraper import get_recent_owner_scrapes
from app.tools.registry import ToolDefinition

log = structlog.get_logger()


async def _owner_social_data_handler(args: dict, db: AsyncSession) -> dict:
    owner_id_str = args.get("owner_id", "")
    window_days = int(args.get("window_days", 30))
    include_prior_plan = bool(args.get("include_prior_plan", True))

    try:
        owner_id = uuid.UUID(owner_id_str)
    except (ValueError, AttributeError):
        return {"error": "Invalid owner_id"}

    # Connected accounts
    accounts_result = await db.execute(
        select(OwnerSocialAccount).where(
            and_(OwnerSocialAccount.owner_id == owner_id, OwnerSocialAccount.is_active == True)
        )
    )
    accounts = accounts_result.scalars().all()

    if not accounts:
        return {
            "owner_id": owner_id_str,
            "connected_accounts": [],
            "social_data": {},
            "data_freshness": {},
            "prior_audit": None,
            "prior_action_plan": [],
        }

    # Social content per platform
    social_data = await get_recent_owner_scrapes(owner_id, db, window_days=window_days)

    # Data freshness per account
    data_freshness = {
        a.platform: a.last_scraped_at.isoformat() if a.last_scraped_at else None
        for a in accounts
    }

    # Prior audit + action plan
    prior_audit_data = None
    prior_action_plan = []

    if include_prior_plan:
        prior_result = await db.execute(
            select(SocialAudit)
            .where(
                and_(
                    SocialAudit.owner_id == owner_id,
                    SocialAudit.status == "completed",
                )
            )
            .order_by(desc(SocialAudit.generated_at))
            .limit(1)
        )
        prior_audit = prior_result.scalar_one_or_none()

        if prior_audit:
            prior_audit_data = {
                "week_start": prior_audit.week_start.isoformat() if prior_audit.week_start else None,
                "market_connection": prior_audit.market_connection,
                "what_working_count": len(prior_audit.what_working or []),
                "what_not_working_count": len(prior_audit.what_not_working or []),
            }
            # Fetch the action items from the prior audit
            items_result = await db.execute(
                select(SocialAuditActionItem)
                .where(SocialAuditActionItem.audit_id == prior_audit.id)
                .order_by(SocialAuditActionItem.display_order)
            )
            prior_items = items_result.scalars().all()
            prior_action_plan = [
                {
                    "title": item.title,
                    "priority": item.priority,
                    "category": item.category,
                    "status": item.status,
                    "why": item.why,
                    "how": item.how,
                }
                for item in prior_items
            ]

    return {
        "owner_id": owner_id_str,
        "connected_accounts": [
            {
                "platform": a.platform,
                "handle": a.handle,
                "last_scraped_at": a.last_scraped_at.isoformat() if a.last_scraped_at else None,
                "last_scrape_status": a.last_scrape_status,
            }
            for a in accounts
        ],
        "social_data": social_data,
        "data_freshness": data_freshness,
        "prior_audit": prior_audit_data,
        "prior_action_plan": prior_action_plan,
    }


owner_social_data_tool = ToolDefinition(
    name="owner_social_data_retrieval",
    version="1.0",
    description=(
        "Retrieve the owner's own social media content (posts, reviews, business listing) "
        "and their prior audit action plan. Use this to analyse what the owner is doing on "
        "social media and track progress on prior recommendations."
    ),
    input_schema={
        "type": "object",
        "properties": {
            "owner_id": {
                "type": "string",
                "description": "The owner UUID",
            },
            "window_days": {
                "type": "integer",
                "description": "How many days of scrape data to include (default 30)",
                "default": 30,
            },
            "include_prior_plan": {
                "type": "boolean",
                "description": "Whether to include the prior audit action plan for progress tracking",
                "default": True,
            },
        },
        "required": ["owner_id"],
    },
    handler=_owner_social_data_handler,
)
