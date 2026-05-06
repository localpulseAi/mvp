---
name: backend
description: FastAPI + SQLAlchemy + PostgreSQL specialist for the LocalPulse AI backend. Use when writing API routes, database models, Pydantic schemas, services, or seed scripts.
when_to_use: Triggered when writing FastAPI endpoints, SQLAlchemy models, Pydantic schemas, services, or database queries.
allowed-tools: Read Glob Grep Bash(pytest) Bash(pytest *) Bash(alembic *) Bash(python -m scripts.*)
---

# Backend — FastAPI + SQLAlchemy 2.0 Async

## Project Structure
```
backend/
├── app/
│   ├── main.py             # FastAPI app, CORS, router registration, lifespan
│   ├── config.py           # pydantic-settings (Settings class)
│   ├── database.py         # Async engine + session factory (aiosqlite dev / asyncpg prod)
│   ├── api/                # Route handlers (NOT routers/ — this project uses api/)
│   │   ├── __init__.py
│   │   ├── auth.py         # Magic link: request-link, verify-token, logout
│   │   ├── market.py       # Occasions calendar, market signals
│   │   ├── competitors.py  # Competitor CRUD + analysis endpoints
│   │   └── competitor_data.py  # Scrape data retrieval
│   ├── models/             # SQLAlchemy ORM models
│   │   ├── __init__.py     # Re-exports all models
│   │   ├── owner.py        # Owner, MagicLinkToken, OwnerSession
│   │   ├── market.py       # CalgaryOccasion, MarketSignalCache
│   │   ├── competitor.py   # Competitor, CompetitorScrape, CompetitorAnalysis
│   │   ├── changes.py      # CompetitorChangeEvent, CrossCompetitorPattern
│   │   ├── normalised.py   # Normalised data models
│   │   └── types.py        # Shared column types / enums
│   └── services/           # Business logic (no DB calls in route handlers)
│       ├── auth_service.py
│       ├── email_service.py
│       ├── scraper.py
│       ├── normaliser.py
│       ├── data_retrieval.py
│       ├── change_detection.py
│       ├── pattern_detection.py
│       └── competitor_service.py
├── data/
│   └── calgary_occasions.json  # Seed data (36 occasions, target 200+)
├── scripts/
│   └── seed_occasions.py       # Run: python -m scripts.seed_occasions
├── requirements.txt
└── .env.example
```

## Key Models
| Model | Table | Purpose |
|-------|-------|---------|
| `Owner` | owners | Business owner account (email, business name, niche) |
| `MagicLinkToken` | magic_link_tokens | One-time login tokens |
| `OwnerSession` | owner_sessions | httpOnly session tracking |
| `CalgaryOccasion` | calgary_occasions | City events/holidays calendar |
| `MarketSignalCache` | market_signal_cache | Cached external market data |
| `Competitor` | competitors | Tracked competitor businesses |
| `CompetitorScrape` | competitor_scrapes | Raw scraped data per competitor |
| `CompetitorAnalysis` | competitor_analyses | Processed competitor insights |
| `CompetitorChangeEvent` | competitor_change_events | Detected changes over time |
| `CrossCompetitorPattern` | cross_competitor_patterns | Patterns across competitors |

## Route Registration
Routes live in `app/api/` and are registered in `app/main.py`:
```python
app.include_router(auth.router, prefix="/api/v1")
app.include_router(market.router, prefix="/api/v1")
```
All routes are prefixed with `/api/v1`. Always follow this pattern.

## Auth — Magic Links Only
**No passwords anywhere.** The auth flow is:
1. `POST /api/v1/auth/request-link` → send magic link email
2. `GET /api/v1/auth/verify?token=...` → verify token, create session
3. Session stored as httpOnly cookie — no JWT in headers
4. `POST /api/v1/auth/logout` → invalidate session

## Route Pattern
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter(prefix="/things", tags=["things"])

@router.get("/", response_model=list[ThingResponse])
async def list_things(db: AsyncSession = Depends(get_db)):
    return await thing_service.list_all(db)
```

## Service Pattern
All business logic goes in `app/services/`, not in route handlers:
```python
# app/services/thing_service.py
async def list_all(db: AsyncSession) -> list[Thing]:
    result = await db.execute(select(Thing).order_by(Thing.created_at.desc()))
    return result.scalars().all()
```

## Logging
Uses `structlog` — already configured in `main.py`:
```python
import structlog
log = structlog.get_logger()
log.info("event_name", key="value")
```

## Development Database
- Dev: SQLite (`localpulse_dev.db`) via `aiosqlite`
- Prod: PostgreSQL via `asyncpg`
- Tables auto-created on startup via `create_tables()` in lifespan

## After Every Change
1. Run `pytest` — all tests must pass
2. Verify `/docs` (Swagger UI) reflects changes at `localhost:8000/docs`
3. Hand off to `security-reviewer` agent for any auth/data endpoints
4. Hand off to `db-analyst` agent for schema/query changes
