"""
Audit evidence — the data and agent work behind a Social Presence Audit.

Returns what the platform actually retrieved (normalised posts, reviews,
listing facts per source) and which agents ran, so the UI can show that
findings are grounded in data rather than free-form AI output.

Read-only. Callers must already have verified the audit belongs to the owner.
Only trimmed, owner-facing fields are returned — never raw scrape payloads,
agent prompts, or raw model output.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import AgentRun, OrchestrationRun
from app.models.social_audit import OwnerSocialScrape, SocialAudit

log = structlog.get_logger()

MAX_POSTS = 60
MAX_REVIEWS = 40
CAPTION_CHARS = 140
REVIEW_CHARS = 180
SCRAPE_GRACE = timedelta(hours=2)  # scrapes run just before generation


def _aware(dt: Optional[datetime]) -> Optional[datetime]:
    """SQLite returns naive datetimes; treat them as UTC so comparisons work in both DBs."""
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _iso(dt: Optional[datetime]) -> Optional[str]:
    dt = _aware(dt)
    return dt.isoformat() if dt else None


def _trim(text: Optional[str], n: int) -> str:
    text = (text or "").strip()
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


async def _scrapes_for_audit(db: AsyncSession, audit: SocialAudit) -> list[OwnerSocialScrape]:
    """Latest successful scrape per source at (or just before) audit generation."""
    # In dev SQLite, generated_at may be local time while created_at is UTC; use the later of the two.
    stamps = [t for t in (_aware(audit.generated_at), _aware(audit.created_at)) if t]
    cutoff = (max(stamps) if stamps else datetime.now(timezone.utc)) + SCRAPE_GRACE
    result = await db.execute(
        select(OwnerSocialScrape)
        .where(OwnerSocialScrape.owner_id == audit.owner_id, OwnerSocialScrape.normalised_data.isnot(None))
        .order_by(OwnerSocialScrape.scraped_at.desc())
        .limit(50)
    )
    latest: dict[str, OwnerSocialScrape] = {}
    for s in result.scalars().all():
        if (_aware(s.scraped_at) or cutoff) > cutoff:
            continue
        latest.setdefault(s.source, s)
    return list(latest.values())


async def _agent_runs(db: AsyncSession, audit: SocialAudit) -> tuple[Optional[OrchestrationRun], list[AgentRun]]:
    if not audit.orchestration_id:
        return None, []
    orch = (
        await db.execute(select(OrchestrationRun).where(OrchestrationRun.id == audit.orchestration_id))
    ).scalar_one_or_none()
    runs = (
        await db.execute(
            select(AgentRun).where(AgentRun.orchestration_id == audit.orchestration_id).order_by(AgentRun.started_at)
        )
    ).scalars().all()
    return orch, list(runs)


async def build_audit_evidence(db: AsyncSession, audit: SocialAudit) -> dict[str, Any]:
    scrapes = await _scrapes_for_audit(db, audit)
    orch, runs = await _agent_runs(db, audit)

    sources: list[dict[str, Any]] = []
    posts: list[dict[str, Any]] = []
    reviews: list[dict[str, Any]] = []
    listing: Optional[dict[str, Any]] = None

    for s in scrapes:
        nd = s.normalised_data or {}
        s_posts = nd.get("posts") or []
        s_reviews = nd.get("reviews") or []
        sources.append(
            {
                "source": s.source,
                "scraped_at": _iso(s.scraped_at),
                "item_count": len(s_posts) + len(s_reviews) + (1 if nd.get("listing") else 0),
            }
        )
        for p in s_posts:
            posts.append(
                {
                    "source": p.get("source") or s.source,
                    "posted_at": p.get("posted_at"),
                    "media_type": p.get("media_type") or "unknown",
                    "likes": int(p.get("likes") or 0),
                    "comments": int(p.get("comments") or 0),
                    "caption": _trim(p.get("caption"), CAPTION_CHARS),
                    "url": p.get("url"),
                }
            )
        for r in s_reviews:
            reviews.append(
                {
                    "rating": int(r.get("rating") or 0),
                    "posted_at": r.get("posted_at"),
                    "text": _trim(r.get("text"), REVIEW_CHARS),
                    "owner_replied": bool(r.get("owner_replied")),
                }
            )
        if nd.get("listing") and listing is None:
            l = nd["listing"]
            listing = {
                "overall_rating": l.get("overall_rating"),
                "review_count": l.get("review_count"),
                "has_website": bool(l.get("website")),
                "hours_listed": len(l.get("hours") or {}),
                "categories": (l.get("categories") or [])[:4],
            }

    posts.sort(key=lambda p: p.get("posted_at") or "", reverse=True)
    reviews.sort(key=lambda r: r.get("posted_at") or "", reverse=True)

    agents = [
        {
            "agent_name": r.agent_name,
            "model_used": r.model_used,
            "status": r.status,
            "latency_ms": r.latency_ms,
            "tools": sorted({c.get("tool_name") for c in ((r.tool_calls or {}).get("calls") or []) if c.get("tool_name")}),
            "tool_call_count": len((r.tool_calls or {}).get("calls") or []),
            "started_at": _iso(r.started_at),
        }
        for r in runs
    ]

    log.info("audit_evidence_built", audit_id=str(audit.id), sources=len(sources), posts=len(posts), reviews=len(reviews), agents=len(agents))

    return {
        "audit_id": str(audit.id),
        "generated_at": _iso(audit.generated_at),
        "sources": sources,
        "posts": posts[:MAX_POSTS],
        "reviews": reviews[:MAX_REVIEWS],
        "totals": {"posts": len(posts), "reviews": len(reviews)},
        "listing": listing,
        "agents": agents,
        "orchestration": {
            "status": orch.status,
            "total_latency_ms": orch.total_latency_ms,
            "started_at": _iso(orch.started_at),
            "finished_at": _iso(orch.finished_at),
        }
        if orch
        else None,
    }
