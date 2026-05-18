# LocalPulse AI — Build Status
> Last updated: May 16, 2026

## What's Built

### Frontend — Next.js 14 (App Router) · `localhost:3130`

| Route | File | Status | Notes |
|-------|------|--------|-------|
| `/` | `src/app/page.tsx` | ✅ Done | Framer Motion storytelling landing page — animated hero, scroll narrative, pricing |
| `/login` | `src/app/(auth)/login/page.tsx` | ✅ Done | Magic link email form, simulated API call |
| `/verify` | `src/app/(auth)/verify/page.tsx` | ✅ Done | Email verification screen, resend button, dev shortcut links |
| `/onboarding` | `src/app/onboarding/page.tsx` | ✅ Done | 5-step wizard: Business → Brand → Costs → Ops → Competitor Discovery |
| `/dashboard` | `src/app/(dashboard)/dashboard/page.tsx` | ✅ Done | Insight-first layout: urgent banner, this week's plays, calendar timeline, competitor pulse |
| `/brief` | `src/app/(dashboard)/brief/page.tsx` | ✅ Done | Full weekly brief display with past brief history sidebar |
| `/session` | `src/app/(dashboard)/session/page.tsx` | ✅ Done | Strategy session chat UI, multi-tab AI response (Recommendation / Alternatives / Watch For), simulated agent run |
| `/competitors` | `src/app/(dashboard)/competitors/page.tsx` | ✅ Done | Per-competitor detail + cross-competitor patterns tab |
| `/settings` | `src/app/(dashboard)/settings/page.tsx` | ✅ Done | Two-panel layout: Profile, Notifications, Integrations, Competitors, Account |

#### Shared components
| Component | File | Notes |
|-----------|------|-------|
| Sidebar | `src/components/layout/Sidebar.tsx` | Active state via `usePathname`, Friday nudge, user profile |
| Badge | `src/components/ui/Badge.tsx` | Variants: default, brand, amber, green, red, gray, outline. Dot prop |
| Dashboard layout | `src/app/(dashboard)/layout.tsx` | Wraps all dashboard routes with sidebar |

#### Design system (`src/app/globals.css` + `tailwind.config.ts`)
- Brand: violet-700 `#7c3aed`, accent: amber-500 `#f59e0b`, bg: gray-50
- Utility classes: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-amber`, `.input`, `.label`, `.section-title`
- Framer Motion used throughout: `fadeUp`, `staggerContainer`, `AnimatePresence`, `useScroll`/`useTransform`

---

### Backend — FastAPI · `localhost:8990`

| Module | File | Status | Notes |
|--------|------|--------|-------|
| App entry | `app/main.py` | ✅ Done | FastAPI + lifespan, CORS, structlog, optional Sentry |
| Config | `app/config.py` | ✅ Done | Pydantic Settings, SQLite default for local dev |
| Database | `app/database.py` | ✅ Done | AsyncEngine, SQLite (aiosqlite) for dev / PostgreSQL (asyncpg) for prod |
| Auth API | `app/api/auth.py` | ✅ Done | POST /auth/request-magic-link, GET /auth/verify, POST /auth/logout, GET /auth/me |
| Market API | `app/api/market.py` | ✅ Done | GET /market/occasions (niche-filtered, sorted by days_out), GET /market/signals (stub) |
| Competitors API | `app/api/competitors.py` | ✅ Done | CRUD + POST /competitors/{id}/scrape + GET /competitors/{id}/scrapes |
| Scraper service | `app/services/scraper.py` | ✅ Done | Apify client, 5 per-source scrapers, retry with exponential back-off, fan-out |
| Competitor service | `app/services/competitor_service.py` | ✅ Done | CRUD, cadence scheduling, scrape orchestration, baseline detection |
| UUID type fix | `app/models/types.py` | ✅ Done | Cross-DB UUID (SQLite=CHAR(36), PostgreSQL=native UUID) |
| Owner model | `app/models/owner.py` | ✅ Done | Owner, MagicLinkToken, OwnerSession — ranges only, no exact financials (FR-ONB-04) |
| Market models | `app/models/market.py` | ✅ Done | CalgaryOccasion, MarketSignalCache |
| Competitor models | `app/models/competitor.py` | ✅ Done | Competitor, CompetitorScrape (raw, private), CompetitorAnalysis (AI, owner-facing) |
| Auth service | `app/services/auth_service.py` | ✅ Done | hash_token (SHA-256), verify_magic_link, create_session, get_current_owner dependency |
| Email service | `app/services/email_service.py` | ✅ Done | Magic link email (logs in dev, Resend in prod), weekly brief email, HTML template |
| **Week 5 — Agent Framework** | | | |
| Agent models | `app/models/agent.py` | ✅ Done | AgentRun, OrchestrationRun, OwnerCostLedger |
| Brief model | `app/models/brief.py` | ✅ Done | WeeklyBrief with full content + email tracking |
| Tool registry | `app/tools/registry.py` | ✅ Done | ToolDefinition, ToolRegistry — versioned, DB-aware tool dispatch |
| Market data tool | `app/tools/market_data.py` | ✅ Done | market_data_retrieval — occasions calendar, weather/events stubs |
| Competitor data tool | `app/tools/competitor_data.py` | ✅ Done | competitor_data_retrieval — wraps data_retrieval.py for agents |
| BaseAgent | `app/agents/base.py` | ✅ Done | Agentic tool-use loop, validation with 1 retry, timeout, cost tracking |
| Agent schemas | `app/agents/schemas.py` | ✅ Done | AgentInput, MarketAnalystOutput, CompetitorAnalystOutput, BriefSynthesisOutput |
| Market Analyst | `app/agents/market_analyst.py` | ✅ Done | Analyzes occasions + market signals for owner's niche |
| Competitor Analyst | `app/agents/competitor_analyst.py` | ✅ Done | Analyzes competitor change events + patterns |
| Agent registry | `app/agents/registry.py` | ✅ Done | Dict mapping agent names → classes (Week 6 adds 5 more) |
| Cost tracker | `app/orchestrator/cost_tracker.py` | ✅ Done | Monthly ledger per owner, budget tracking |
| Dispatcher | `app/orchestrator/dispatcher.py` | ✅ Done | Parallel dispatch, AgentRun persistence, OrchestrationRun tracking |
| Brief generator | `app/orchestrator/brief_generator.py` | ✅ Done | Orchestrates analysts → synthesizer → WeeklyBrief row |
| Brief cron | `app/tasks/brief_cron.py` | ✅ Done | generate_all_briefs() for Sunday-night run (manual trigger for now) |
| Briefs API | `app/api/briefs.py` | ✅ Done | GET /briefs, GET /briefs/current, GET /briefs/{id}, POST /briefs/generate |
| Agent runs API | `app/api/agent_runs.py` | ✅ Done | GET /agent-runs, GET /agent-runs/cost, GET /agent-runs/{id} |
| **Week 6 — Strategy Session** | | | |
| New schemas | `app/agents/schemas.py` | ✅ Done | BrandAnalystOutput, TimingAnalystOutput, FinancialAnalystOutput, RiskAnalystOutput, StrategistOutput, ParsedQuestion |
| Brand Analyst | `app/agents/brand_analyst.py` | ✅ Done | Positioning gaps, whitespace, messaging recommendations |
| Timing Analyst | `app/agents/timing_analyst.py` | ✅ Done | Best windows, key dates, avoid-timing signals |
| Financial Analyst | `app/agents/financial_analyst.py` | ✅ Done | Range-based sense-check, financial constraints, viable options |
| Risk Analyst | `app/agents/risk_analyst.py` | ✅ Done | Key risks with mitigations across timing/competitive/operational dimensions |
| Strategist | `app/agents/strategist.py` | ✅ Done | claude-opus-4-7, synthesizes all 6 analysts, alternatives + watch-for |
| Question parser | `app/services/question_parser.py` | ✅ Done | Haiku-based classifier: type/scope/horizon/implicit_goal/clarification |
| Session model | `app/models/session.py` | ✅ Done | StrategySession with turns JSON, parsed question fields, cost tracking |
| Session runner | `app/orchestrator/session_runner.py` | ✅ Done | start_session (full 7-agent), continue_session (Strategist-only follow-up) |
| Sessions API | `app/api/sessions.py` | ✅ Done | POST /sessions, GET /sessions, GET /sessions/{id}, POST /sessions/{id}/followup |
| **Week 7 — Competitor Analyzer** | | | |
| Competitor analyzer | `app/services/competitor_analyzer.py` | ✅ Done | generate_set_analysis, get_latest_analysis, get_all_analyses — fuzzy name matching |
| Discovery service | `app/services/discovery.py` | ✅ Done | Google Places Text Search → Haiku 5-dimension scoring → ranked shortlist |
| Discovery API | `app/api/discovery.py` | ✅ Done | POST /discovery/competitors — onboarding Step 5 competitor discovery |
| Competitor cron | `app/tasks/competitor_cron.py` | ✅ Done | analyze_all_competitors() for bi-weekly run (manual trigger for now) |
| Competitors API update | `app/api/competitors.py` | ✅ Done | POST /competitors/analyze-all, GET /competitors/{id}/analysis |
| Competitor data API update | `app/api/competitor_data.py` | ✅ Done | GET /competitor-data/analysis — latest analysis for all competitors |

#### Data
- `backend/data/calgary_occasions.json` — 36 seed occasions (target 200+, tagged with niche relevance per business type)
- Seed script: `python -m scripts.seed_occasions`

#### Stack quirks / known fixes
- Python 3.14: must install `greenlet` manually for SQLAlchemy async
- structlog: use `make_filtering_bound_logger(20)` + `PrintLoggerFactory()` — do NOT use `filter_by_level` processor
- Next.js 14.2: config must be `next.config.mjs` (ESM), not `.ts`

---

## Dev Week Progress

| Week | Focus | Status |
|------|-------|--------|
| 1 | Foundation — auth, DB models, project structure | ✅ Complete |
| 2 | Market data layer — occasions calendar, signal cache model, occasions API | ✅ Complete |
| 3 | Competitor scraping pipeline (Apify integration) | ✅ Complete |
| 4 | Normalisation + change detection pipeline | ✅ Complete |
| 5 | Multi-agent framework (7-agent Anthropic pipeline) | ✅ Complete |
| 5 | Weekly Brief generation + email delivery | ✅ Complete |
| 6 | Strategy Session — real Claude calls, cost tracking | ✅ Complete |
| 7 | Competitor Analyzer — real data, analysis API | ✅ Complete |
| 8 | Onboarding polish, magic link email, founder flow | ⬜ Not started |
| 9 | Billing (Stripe), usage caps, admin tooling | ⬜ Not started |
| 10 | QA, performance, production deploy | ⬜ Not started |

---

## How to Run

```bash
# Frontend
cd frontend && npm install && npm run dev
# → http://localhost:3130

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pip install greenlet   # required for Python 3.14
uvicorn app.main:app --reload --port 8990
# → http://localhost:8990

# Seed occasions data
cd backend && python -m scripts.seed_occasions
```

## Environment

```bash
# backend/.env (copy from .env.example)
DATABASE_URL=sqlite+aiosqlite:///./localpulse_dev.db   # default, no setup needed
SECRET_KEY=dev-secret-key-change-in-production
ANTHROPIC_API_KEY=          # needed for Week 4+
RESEND_API_KEY=             # needed for Week 5+
GOOGLE_PLACES_API_KEY=      # needed for onboarding competitor discovery
APIFY_API_TOKEN=            # needed for Week 3+
```

---

## What's Wired vs Mocked

| Feature | Frontend | Backend | Connected? |
|---------|----------|---------|-----------|
| Magic link auth | ✅ UI done | ✅ API done | ❌ Frontend uses simulated delay |
| Onboarding | ✅ UI done | ✅ Models done | ❌ Not wired up |
| Weekly Brief | ✅ UI done | ✅ Generation built (Week 5) | ❌ Frontend still uses mock data |
| Strategy Session | ✅ UI done | ⬜ Agent pipeline not built | ❌ Simulated 3.5s response |
| Competitor Analyzer | ✅ UI done | ✅ Analysis API done (Week 7) | ❌ Frontend still uses mock data |
| Calgary Calendar | ✅ UI done | ✅ API done | ❌ Frontend uses hardcoded data |
| Settings | ✅ UI done | ✅ Models done | ❌ Not wired up |
| Agent observability | ⬜ No UI | ✅ API done | — POST /briefs/generate triggers real runs |
