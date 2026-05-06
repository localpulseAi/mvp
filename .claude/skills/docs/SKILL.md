---
name: docs
description: Documentation specialist for LocalPulse AI. Use when writing docstrings, README sections, OpenAPI metadata, changelogs, or Architecture Decision Records.
when_to_use: Triggered when documenting functions, adding OpenAPI metadata to routes, updating README, writing ADRs, or generating a changelog entry.
disable-model-invocation: false
---

# Documentation — LocalPulse AI

## Python Docstrings (Google Style)
```python
async def send_magic_link(db: AsyncSession, email: str) -> MagicLinkToken:
    """Send a magic link login email to a business owner.

    Creates a one-time token, stores it in the database, and sends
    an email with the verification link.

    Args:
        db: Active async database session.
        email: The owner's email address.

    Returns:
        The created MagicLinkToken with a 15-minute expiry.

    Raises:
        HTTPException: 404 if no owner with this email exists.
        HTTPException: 429 if rate limit exceeded (max 3 per hour).
    """
```

## FastAPI OpenAPI Metadata
Every route in `app/api/` must have complete metadata:
```python
@router.post(
    "/auth/request-link",
    status_code=200,
    summary="Request a magic login link",
    description="Sends a one-time magic link to the owner's email. "
                "Link expires after 15 minutes.",
    responses={
        200: {"description": "Magic link sent successfully"},
        404: {"description": "No account found for this email"},
        429: {"description": "Rate limit exceeded"},
    },
    tags=["auth"],
)
```

## TypeScript JSDoc (for shared utilities and hooks)
```typescript
/**
 * Formats a date relative to now for display in the Calgary calendar.
 * @param date - ISO date string from the occasions API.
 * @returns Human-readable string like "in 7 days" or "Tomorrow".
 */
export function formatRelativeDate(date: string): string {
```

## README Structure (for the repo root)
```markdown
# LocalPulse AI
AI-powered marketing strategist for independent local business owners.

## Quick Start
cd frontend && npm install && npm run dev   # localhost:3000
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload  # localhost:8000

## Architecture
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind
- Backend: FastAPI + SQLAlchemy 2.0 async + PostgreSQL
- Auth: Magic links only (no passwords)

## API Reference
See /docs (Swagger) at localhost:8000/docs

## Deployment
- Frontend: Vercel (auto-deploys from main via GitHub)
- Backend: TBD
```

## Architecture Decision Records
Create `docs/adr/NNN-title.md` for significant decisions:
```markdown
# ADR-001: Magic link auth instead of passwords

**Status**: Accepted
**Date**: 2026-04-XX

## Context
Target users (SMB owners) have password fatigue. Reducing friction
at login is critical for a product with weekly touchpoints.

## Decision
Use magic link (email-based) authentication only. No password storage.

## Consequences
**Positive**: Zero password UX friction, no password reset flows, no breach risk
**Negative**: Depends on email delivery speed, requires email service integration
```

## Existing plan docs (read-only reference)
- `plan/PRD.md` — Product Requirements Document
- `plan/DEV_PLAN.md` — 10-week development plan
- `plan/REQUIREMENT_SPECIFICATIONS.md` — Detailed requirements
- `plan/BUILD_STATUS.md` — Week-by-week build status

Never modify files in `plan/` — they are reference documents.

## Workflow
1. Read all new/changed files to understand what was built
2. Write docstrings for undocumented Python functions
3. Add OpenAPI metadata to undocumented routes
4. Update README if project structure or setup changed
5. Update `plan/BUILD_STATUS.md` if a milestone was completed
6. Hand off to `docs-writer` agent for review if unsure about phrasing
