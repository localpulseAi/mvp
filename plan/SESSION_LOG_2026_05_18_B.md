# LocalPulse AI — Session Log: 2026-05-18 (Session B)
> Full engineering record: what was done, what broke, how it was fixed, what's still open.

---

## Context Going In

Continuing from Session A (same date). The backend was fully wired through Week 7 of the dev plan. Going into this session the remaining goal was to:

1. Plan and implement the Social Presence Audit feature (Week 10 of the dev plan) — the fourth flagship feature, analysing the owner's own social media presence rather than competitors.
2. Wire the frontend audit page to the real API (replacing mock data).
3. Fix the layout/padding issue on the audit page.

---

## 1. Feature Planning — Social Presence Audit

### Design Decision

Framed Social Presence Audit as the fourth pillar alongside the existing three flagship features:
- Market intelligence → Weekly Brief
- Strategic questions → Strategy Session
- Competitive landscape → Competitor Analyzer
- **Own social presence → Social Presence Audit** (new)

Key design choices:
- **Qualitative, not metric-driven** — no follower counts or reach numbers. The output is analysis: what's working, what isn't, why, and what to do.
- **Manually triggered but weekly cadence** — owner controls when to generate; a cron handles weekly auto-generation for all owners with connected accounts.
- **Progress tracking across audits** — each new audit compares against the previous one's action plan, closing the feedback loop.
- **Reuse all existing infrastructure** — Apify scraping pipeline, normaliser, BaseAgent, ToolRegistry, dispatch_agents orchestrator. No new patterns introduced.

### Plan doc updates

Updated three plan files:
- `plan/PRD.md` — Added section 7.5 (Social Presence Audit as 4th flagship), updated goals, UX section, pricing line.
- `plan/REQUIREMENT_SPECIFICATIONS.md` — Added FR-SPA-01–18, FR-SOC-01–08, agent AGENT-SP-01–08, data DATA-10/11/12, NFR-PERF-06/07, ACC-08/09.
- `plan/DEV_PLAN.md` — Inserted Week 10 (Social Presence Audit), renamed old Week 10 → Week 11. Plan is now 11 weeks.

---

## 2. Backend — New Models

**File:** `backend/app/models/social_audit.py` (new)

Four new tables:

| Model | Table | Purpose |
|-------|-------|---------|
| `OwnerSocialAccount` | `owner_social_accounts` | Connected platform accounts (Instagram, Facebook, Google Business) |
| `OwnerSocialScrape` | `owner_social_scrapes` | Raw + normalised scrape data per account |
| `SocialAudit` | `social_audits` | Weekly audit with JSON fields for all sections |
| `SocialAuditActionItem` | `social_audit_action_items` | Individual action items with status tracking across audits |

`SocialAuditActionItem` carries `source_audit_id` (the audit that originated it) and `audit_id` (the current audit it belongs to) — this supports the "prior plan progress" feature where items can be carried forward.

**Registered in:** `backend/app/models/__init__.py`

---

## 3. Backend — Agent Schemas

**File:** `backend/app/agents/schemas.py` (appended)

New Pydantic output schemas for the social presence analyst agent:

```python
class PresencePlatformState      # per-platform: assessment, cadence, content mix, direction
class WorkingItem                 # observation, why_it_works, theme
class NotWorkingItem              # observation, hypothesis, category
class AuditActionItem             # title, priority, category, why, how, watch_for, effort_band
class PriorPlanItemProgress       # title, status, signal_observed
class SocialPresenceAuditOutput   # full agent output schema
```

---

## 4. Backend — Owner Scraper Service

**File:** `backend/app/services/owner_scraper.py` (new)

Thin wrapper around the existing `scrape_source()` + `normalise_scrape()` functions, pointed at owner accounts instead of competitors. Key functions:

- `get_or_create_account(owner_id, platform, handle, display_name, db)` — upsert by platform+handle
- `scrape_owner_account(account, db)` — scrape one account, save `OwnerSocialScrape`, update `last_scraped_at`
- `scrape_all_owner_accounts(owner_id, db)` — scrape all active accounts for an owner
- `get_recent_owner_scrapes(owner_id, db, days=30)` — fetch recent scrapes for the agent tool

**Bug fixed during build:** Initial version called `run_scrape()` and `normalise_source()` which don't exist. Corrected to `scrape_source()` and `normalise_scrape()` (the actual function names).

---

## 5. Backend — Agent Tool

**File:** `backend/app/tools/owner_social_data.py` (new)

`owner_social_data_retrieval` ToolDefinition. Fetches:
- All connected active accounts
- Normalised scrape data per platform (last 30 days)
- Most recent completed audit + its action items (for prior plan progress context)

Registered in `backend/app/orchestrator/dispatcher.py` `_build_full_registry()`.

---

## 6. Backend — Social Presence Analyst Agent

**File:** `backend/app/agents/social_presence_analyst.py` (new)

```python
class SocialPresenceAnalyst(BaseAgent):
    name = "social_presence_analyst"
    timeout_seconds = 90
    max_tokens = 4096
    tool_names = ["owner_social_data_retrieval"]
```

System prompt instructs the agent to: assess each platform's state of presence, identify what's working and why, identify what's not working and the root cause hypothesis, compare against the previous week's plan, connect findings to the local market context, and produce 3–6 prioritised action items with full how-to instructions.

Registered in `backend/app/agents/registry.py` `AGENT_REGISTRY`.

---

## 7. Backend — Audit Generator Orchestrator

**File:** `backend/app/orchestrator/audit_generator.py` (new)

`generate_audit(owner, db)` function:
1. Checks at least one active account exists (returns `None` if not)
2. Scrapes all owner accounts
3. Creates/updates `SocialAudit` row with `status='generating'`
4. Dispatches `social_presence_analyst` via `dispatch_agents()`
5. Parses agent output, persists to `SocialAudit` JSON fields
6. Deletes old `SocialAuditActionItem` rows for the audit, inserts new ones
7. Sets `status='completed'` (or `'failed'` on error)

---

## 8. Backend — API Routes

**File:** `backend/app/api/social_audit.py` (new)

9 routes under `/api/v1/social-audit`:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/accounts` | List connected accounts |
| POST | `/accounts` | Connect a new account |
| DELETE | `/accounts/{id}` | Disconnect (soft-delete via `is_active=False`) |
| GET | `/` | List audit summaries (paginated) |
| GET | `/current` | This week's audit |
| GET | `/{audit_id}` | Any audit by ID |
| POST | `/generate` | Trigger generation (3-day re-gen rate limit) |
| GET | `/items/active` | All non-dismissed items across all audits |
| PATCH | `/items/{item_id}` | Update item status |

Rate limit: on-demand re-generation blocked if last `generated_at` is within 3 days.

Registered in `backend/app/main.py`.

---

## 9. Backend — Cron Task

**File:** `backend/app/tasks/audit_cron.py` (new)

`generate_all_audits()` — finds all owners with at least one active account, runs `generate_audit()` for each. Designed to run Sunday night before Monday brief delivery.

```bash
python -m app.tasks.audit_cron
```

---

## 10. Frontend — API Client

**File:** `frontend/src/lib/api.ts` (appended)

New TypeScript types and API functions:

**Types:** `SocialAuditAccount`, `AuditActionItem`, `PlatformState`, `WorkingItem`, `NotWorkingItem`, `PriorPlanProgress`, `SocialAuditDetail`, `AuditSummary`

**Functions:** `getSocialAccounts`, `connectSocialAccount`, `disconnectSocialAccount`, `getCurrentAudit`, `listAudits`, `triggerAuditGenerate`, `updateActionItemStatus`, `getActiveActionItems`

---

## 11. Frontend — Sidebar

**File:** `frontend/src/components/layout/Sidebar.tsx`

Added `Activity` icon import and Social Audit nav item:
```tsx
{ label: "Social Audit", href: "/audit", icon: Activity }
```

---

## 12. Frontend — Audit Page (Initial Build)

**File:** `frontend/src/app/(dashboard)/audit/page.tsx` (new)

Built with mock data initially. Three tabs:
- **Audit Report** — accounts strip, prior plan progress, state of presence per platform, what's working, what's not working, market connection callout, data freshness footer
- **Action Plan** — sortable action item cards with priority badges, status controls (pending / in_progress / done / dismiss), expandable how-to + watch-for detail, link to Strategy Session
- **History** — list of past audits

Empty states: no accounts connected (with inline connect flow), no audit yet (with generate button).

---

## 13. Frontend — API Wiring + Layout Fix

**File:** `frontend/src/app/(dashboard)/audit/page.tsx` (rewritten)

### Layout fix
The page was rendering without a padding wrapper — going edge-to-edge. All dashboard pages use `<div className="min-h-screen p-8">` as their outer wrapper (the `(dashboard)/layout.tsx` only provides `pl-64` for the sidebar). Added the correct wrapper on all render paths (loading, no-accounts, no-audit, main page).

### API wiring
- `getSocialAccounts()` + `getCurrentAudit()` run in parallel on mount
- `triggerAuditGenerate()` on generate button → `setInterval` polling `getCurrentAudit()` every 5s until `status === "completed"` or `"failed"`
- `updateActionItemStatus(id, status)` on status button with optimistic local update + rollback on error
- `listAudits(20)` lazy-loaded on first History tab open
- Generating skeleton card shown while polling
- `ConnectAccountRow` inline component for connecting accounts from empty state

### Date fix
`new Date("2026-05-18")` parses as UTC midnight, which renders as the previous day in negative-offset timezones (e.g. MST = UTC-6). Fixed with a `parseDate` helper:
```ts
function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);  // local midnight, no UTC shift
}
```

---

## 14. End-to-End Test

Successfully ran a full audit generation against a real owner account:

- Instagram handle: `bombaytigeryyc`
- Apify actor: `apify~instagram-scraper`
- Scrape result: 1 post, no caption/hashtags/engagement (`no_items` — private or near-empty account)
- Agent: `social_presence_analyst` ran with `owner_social_data_retrieval` tool
- Output: 7 action items generated; the agent correctly surfaced the data limitation as a strategic finding ("the account looks dark to scrapers = it looks dark to potential customers")
- Polling: frontend polled every 5s and updated automatically on completion
- Total wall-clock time: ~90s (scrape ~28s + agent ~60s)

---

## Commits This Session

| Hash | Message |
|------|---------|
| `4747786` | feat: Social Presence Audit — fourth flagship feature, end-to-end |
| `199f165` | feat: wire Social Presence Audit page to real API |

---

## What's Still Open

- Week 8: Onboarding polish, email notifications, scheduling
- Week 9: Billing, usage caps, admin panel
- Week 10 (original, now Week 11): QA, production deploy
- The `mcp.txt` file in the repo root contains a live GitHub PAT — **revoke it at `github.com/settings/tokens`**
- `bombaytigeryyc` Instagram is private/restricted — audit will always return sparse data until the account is made public
