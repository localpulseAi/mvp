---
name: testing
description: Testing specialist for LocalPulse AI — pytest for FastAPI backend, Jest + RTL for Next.js frontend. Use when writing tests, fixing test failures, or improving coverage.
when_to_use: Triggered when writing pytest tests, component tests, test fixtures, or debugging test failures.
allowed-tools: Read Glob Grep Bash(pytest *) Bash(npm test) Bash(npm run test:coverage) Bash(npm run build)
---

# Testing — LocalPulse AI

## Backend Testing (pytest + httpx)

### Test file location
```
backend/tests/
├── conftest.py          # Fixtures: test DB, async client, test owner
├── test_auth.py         # Magic link request, verify, logout
├── test_market.py       # Occasions calendar, market signals
├── test_competitors.py  # Competitor CRUD, scrape data
└── test_services/       # Unit tests for service layer
    ├── test_scraper.py
    ├── test_normaliser.py
    └── test_change_detection.py
```

### conftest.py pattern (project-specific)
```python
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite+aiosqlite:///./test.db"

@pytest.fixture(scope="session")
async def engine():
    engine = create_async_engine(TEST_DB_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db(engine):
    session_factory = async_sessionmaker(engine, class_=AsyncSession)
    async with session_factory() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(db):
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
```

### Auth test pattern (magic link — no passwords)
```python
class TestMagicLinkAuth:
    async def test_request_link_sends_email(self, client):
        response = await client.post("/api/v1/auth/request-link", json={
            "email": "owner@cafe.com",
        })
        assert response.status_code == 200
        # Verify magic link token was created in DB

    async def test_verify_valid_token(self, client, db):
        # Create a magic link token in the DB
        token = await create_test_magic_link(db, "owner@cafe.com")
        response = await client.get(f"/api/v1/auth/verify?token={token.token}")
        assert response.status_code == 200
        assert "session" in response.cookies

    async def test_verify_expired_token_returns_401(self, client, db):
        token = await create_test_magic_link(db, "owner@cafe.com", expired=True)
        response = await client.get(f"/api/v1/auth/verify?token={token.token}")
        assert response.status_code == 401
```

### API endpoint test pattern
```python
class TestOccasions:
    async def test_list_occasions_returns_seeded_data(self, client):
        response = await client.get("/api/v1/market/occasions")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert "name" in data[0]
        assert "date_start" in data[0]

class TestCompetitors:
    async def test_create_competitor(self, client, authenticated_owner):
        response = await client.post("/api/v1/competitors", json={
            "name": "Wurst",
            "address": "2437 4 St SW, Calgary",
            "website_url": "https://wurst.ca",
        })
        assert response.status_code == 201
        assert response.json()["name"] == "Wurst"
```

### Coverage rules
- Happy path + at least 2 edge cases per endpoint
- Auth boundaries: unauthenticated → 401, wrong owner → 403
- Service layer: unit test complex logic (change detection, pattern analysis)
- No mocking the database — use test SQLite DB

## Frontend Testing (Jest + RTL)

### Test file location
Co-located with components:
```
frontend/src/
├── components/
│   ├── layout/Sidebar.tsx
│   └── layout/Sidebar.test.tsx       # ← co-located
└── app/
    └── (dashboard)/
        └── dashboard/page.test.tsx    # ← co-located
```

### Component test pattern
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DashboardPage from "./page";

test("renders stat cards with mock data", () => {
  render(<DashboardPage />);
  expect(screen.getByText("Brief")).toBeInTheDocument();
  expect(screen.getByText("Sessions")).toBeInTheDocument();
  expect(screen.getByText("Tracked")).toBeInTheDocument();
});

test("renders Calgary calendar section", () => {
  render(<DashboardPage />);
  expect(screen.getByText("Calgary Calendar")).toBeInTheDocument();
});
```

### What to test in this project
- Landing page: CTA buttons render, section headings present
- Dashboard: stat cards, calendar events, competitor alerts
- Onboarding: step navigation, form validation
- Session: message display, agent pipeline steps
- Sidebar: active route highlighting via usePathname

### Rules
- Query by role/label/text — never by test-id
- Test user-visible behavior, not internal state
- All pages with mock data → assert the mock data renders correctly
- No snapshot tests — too brittle with Tailwind classes

## After Writing Tests
1. Run `pytest` (backend) or `npm test` (frontend) — all must pass
2. Hand off to `code-reviewer` agent if tests reveal issues in implementation
