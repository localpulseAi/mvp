# LocalPulse AI — Session Log: 2026-05-18
> Full engineering record: what was done, what broke, how it was fixed, what's still open.

---

## Context Going In

The backend was fully wired end-to-end through Week 7 of the dev plan (agents, scraping pipeline, brief generation, strategy sessions, competitor analyzer). The frontend had been connected to real APIs. Going into this session the remaining blockers were:

1. Facebook posts scraper returning empty data (0/5 competitors)
2. Meta Ads scraper returning 400 errors (0/5 competitors)
3. Cross-competitor patterns showing empty in the UI despite the pipeline existing
4. Weekly Brief generation timing out silently
5. Competitors page UI needed a full redesign

---

## 1. Scraper Pipeline Fixes

### 1a. Facebook Posts — Wrong Actor

**Problem:** `apify~facebook-pages-scraper` was returning empty results for all 5 competitors.

**Root cause:** Meta platform restriction — the Facebook Pages scraper requires authenticated Facebook session cookies (a logged-in user's cookies injected as Apify actor input). We had no session cookie configured, so the actor got no data back.

**Fix:** Switched to `apify~facebook-posts-scraper`, which works without authentication for public posts.

**Input format change** in `backend/app/services/scraper.py`:
```python
# Before
return {"pageUrl": page_url, "maxPosts": 25}

# After
return {"startUrls": [{"url": page_url}], "maxPosts": 25}
```

**Normaliser change** in `backend/app/services/normaliser.py` — new actor returns different field names:
```python
# apify~facebook-posts-scraper fields
text          → post body
time          → post timestamp
likes         → engagement
viewsCount    → reach proxy
isVideo       → content type flag
textReferences → contains /hashtag/ URLs — extract hashtag from path
```

---

### 1b. Meta Ads — Wrong Actor + Wrong Input Format

**Problem:** `curious_coder~facebook-ads-library-scraper` was returning HTTP 400 "do not contain valid URLs" for all URL formats tried.

**Root cause:** The `curious_coder` actor had an incompatible input schema. Tried `pageUrls`, `urls`, and direct ad library URLs — all returned the same error. The actor is poorly maintained (last updated 2 years ago).

**Fix:** Switched to `apify~facebook-ads-scraper` (official Apify actor, 10M+ runs, actively maintained).

**Input format** — uses `startUrls` pointing to the Meta Ads Library keyword search page:
```python
import urllib.parse
query = urllib.parse.quote(name or facebook_page)
ads_url = (
    "https://www.facebook.com/ads/library/"
    "?active_status=active&ad_type=all&country=CA"
    f"&q={query}&search_type=keyword_unordered"
)
return {"startUrls": [{"url": ads_url}], "maxAds": 30}
```

**Normaliser change** — new actor returns a completely different schema:
```python
# apify~facebook-ads-scraper fields
adArchiveID           → unique ad ID
startDateFormatted    → campaign start
endDateFormatted      → campaign end (None = currently active)
isActive              → running now?
snapshot.body         → ad copy text
snapshot.ctaText      → call-to-action button text
snapshot.cards[]      → carousel cards (fallback text source)
publisherPlatform     → ["facebook", "instagram"] etc.
impressionsWithIndex  → {lowerBoundCount, upperBoundCount}
```

---

## 2. Cross-Competitor Patterns — Three Separate Bugs

The patterns tab was showing empty for the entire session. It turned out to be three independent bugs stacked on top of each other.

### 2a. API Field Name Mismatch

**Problem:** Frontend's `PatternItem` type expected `pattern_type` and `competitors_involved`, but `data_retrieval.py` was returning `type` and `competitor_names`.

**Fix** in `backend/app/services/data_retrieval.py`:
```python
# Before
"type": p.pattern_type,
"competitor_names": p.competitor_names.get("names", []),

# After
"pattern_type": p.pattern_type,
"competitors_involved": p.competitor_names.get("names", []),
```

**Also:** Added `strategic_implication` to the API response — it was stored in the DB but not being returned.

### 2b. Pattern Detection Threshold Too High

**Problem:** `MIN_COMPETITORS_FOR_PATTERN = 3` meant at least 3 competitors had to share a hashtag before a `hashtag_cluster` pattern was emitted. With 5 competitors across different niches, none shared 3+ hashtags.

**Fix** in `backend/app/services/pattern_detection.py`:
```python
MIN_COMPETITORS_FOR_PATTERN = 2  # was 3
```

**Also fixed:** `#yyc` (3 chars) was being silently filtered by the `len(tag) >= 4` guard. Lowered to `len(tag) >= 3`. Added explicit skip list for generic tags that add no signal:
```python
_skip_tags = {"food", "eat", "eats", "new", "good", "best", "love", "like"}
```

### 2c. Timezone-Naive vs Timezone-Aware Datetime Comparison (THE MAIN BLOCKER)

**Problem:** Pattern detection + change detection both crashed silently with:
```
TypeError: can't compare offset-naive and offset-aware datetimes
```

**Root cause:** SQLite stores datetime columns as plain strings without timezone info. SQLAlchemy reads them back as Python `datetime` objects **without** tzinfo (naive). But `period_start` was computed as `datetime.now(timezone.utc)` which is timezone-**aware**. Python raises `TypeError` when comparing aware vs naive datetimes — this was caught by a broad `except Exception` in `competitors.py` which swallowed it silently, so the patterns tab always appeared empty with no visible error.

The crash line in `change_detection.py`:
```python
period_start = datetime.now(timezone.utc) - timedelta(days=window_days)
current_scrapes = [s for s in all_scrapes if s.scraped_at >= period_start]  # 💥 crash
```

**Fix** in both `backend/app/services/change_detection.py` and `backend/app/services/pattern_detection.py`:
```python
# Before
from datetime import datetime, timezone, timedelta
now = datetime.now(timezone.utc)

# After
from datetime import datetime, timedelta
now = datetime.now()  # naive — matches SQLite-returned naive datetimes
```

**Why this only affects SQLite (local dev):** PostgreSQL's `TIMESTAMP WITH TIME ZONE` type stores and returns timezone-aware datetimes, so this bug would not exist in production. It only bites in the SQLite dev environment. When migrating to PostgreSQL, both sides become aware and the comparison works.

**Note for production:** When switching to PostgreSQL, revert to `datetime.now(timezone.utc)` for correctness.

### 2d. Pattern Detection Not Wired Into the Analyze-All Endpoint

**Problem:** Even after fixing the above bugs, clicking "Run analysis" didn't trigger pattern detection — it ran the AI analyzer but stopped there.

**Fix** in `backend/app/api/competitors.py` — hooked change + pattern detection into the `POST /competitors/analyze-all` response:
```python
try:
    from app.services.change_detection import run_change_detection
    from app.services.pattern_detection import run_pattern_detection
    competitors_list = await get_competitors(owner.id, db)
    for competitor in competitors_list:
        await run_change_detection(competitor, owner.id, db)
    if len(competitors_list) >= 3:
        new_patterns = await run_pattern_detection(owner.id, competitors_list, db)
        result["new_patterns"] = len(new_patterns)
except Exception as e:
    log.warning("pattern_detection_failed_after_analysis", error=str(e))
```

---

## 3. Weekly Brief Generation — Agent Timeouts

**Problem:** Brief generation was failing with `status=timeout` on the market analyst, then silently producing a fallback brief with empty `market_read`.

**Log evidence:**
```
agent_run_complete agent=market_analyst status=timeout
brief_generation_failed_no_market
```

**Root cause:** All agents had `timeout_seconds = 30`. Claude Sonnet 4.6 with real tool calls (market data retrieval, competitor data retrieval) takes 34–68 seconds with live data. 30s was not enough.

**Fix** — bumped timeouts across the board:

| File | Before | After |
|------|--------|-------|
| `app/agents/market_analyst.py` | `timeout_seconds = 30`, `max_tokens = 2048` | `timeout_seconds = 90`, `max_tokens = 4096` |
| `app/agents/brand_analyst.py` | `timeout_seconds = 30`, `max_tokens = 2048` | `timeout_seconds = 90`, `max_tokens = 4096` |
| `app/agents/timing_analyst.py` | `timeout_seconds = 30`, `max_tokens = 2048` | `timeout_seconds = 90`, `max_tokens = 4096` |
| `app/agents/risk_analyst.py` | `timeout_seconds = 30`, `max_tokens = 2048` | `timeout_seconds = 90`, `max_tokens = 4096` |
| `app/agents/financial_analyst.py` | `timeout_seconds = 30`, `max_tokens = 2048` | `timeout_seconds = 90`, `max_tokens = 4096` |
| `app/orchestrator/brief_generator.py` | `SYNTHESIZER_TIMEOUT = 30`, `max_tokens = 2048` | `SYNTHESIZER_TIMEOUT = 90`, `max_tokens = 4096` |

**Also fixed:** The synthesizer's `asyncio.TimeoutError` was being caught but `str(asyncio.TimeoutError())` returns an empty string, making the log line useless. Changed error logging to `type(e).__name__ + ": " + str(e)`.

**Confirmed working:** After the fix, logs showed:
```
agent_run_complete agent=market_analyst latency_ms=34123 status=completed
agent_run_complete agent=competitor_analyst latency_ms=68456 status=completed
brief_generation_complete cost_cents=... latency_ms=...
```

---

## 4. UI Redesign — Competitors Page

### What Was Wrong
- Cross-Competitor Patterns tab: plain amber banner, pattern cards with no visual hierarchy, competitor names as comma-separated text, `strategic_implication` missing
- Per-competitor tab: competitor sidebar had no active-state differentiation, analysis age was hard to read, data sources showed as generic grey badges
- `max-w-2xl` on patterns tab left half the screen empty

### What Was Built

**Cross-Competitor Patterns tab redesign** (`frontend/src/app/(dashboard)/competitors/page.tsx`):

| Element | Before | After |
|---------|--------|-------|
| Pattern cards | Plain white border | Left-colored border: red=high, amber=medium, gray=low |
| Pattern icons | Single generic icon | Context-specific: `Tag` (promos), `Megaphone` (ads), `Hash` (hashtag), `TrendingDown` (cadence) |
| Severity indicator | Badge only | Colored dot + label (`HIGH PRIORITY`, `MEDIUM SIGNAL`, `WATCH`) |
| Competitor names | Plain comma list | Chips with deterministic-color initials avatar |
| Strategic implication | Missing | Violet `bg-brand-50` callout with Lightbulb icon + "Discuss in Strategy Session" link |
| Summary row | Missing | 3-tile metrics strip: High priority / Market signals / Watch items |
| Layout | `max-w-2xl` single column | Full-width 2-column grid (single col fallback for 1 pattern) |
| Tab | Text only | Badge showing pattern count |

**Per-competitor tab redesign:**

| Element | Before | After |
|---------|--------|-------|
| Active competitor | Light border highlight | Solid `bg-brand-600` (violet fill) |
| Status indicator | Generic icon | `CheckCircle2` (green) if analysed / `Circle` if pending |
| Data source badges | Generic grey "Instagram", "Facebook" | Color-coded `IG` (pink) / `FB` (blue) / `G` (green) |
| Competitor avatar | Gray circle, first letter | Deterministic color per name (5 palette options) |
| Analysis cards | Slight padding inconsistency | Consistent `p-5`, proper icon+label rows |

---

## Current State of the Build

### What's Fully Working (End-to-End)

| Feature | Notes |
|---------|-------|
| Magic link auth | Login → email → verify → session cookie → dashboard |
| Onboarding wizard | 5 steps, saves to Owner model, triggers competitor discovery on step 5 |
| Competitor CRUD | Add (max 5), list, delete, scrape history |
| Instagram scraping | `apify~instagram-profile-scraper` — working |
| Google Reviews scraping | `apify~google-maps-scraper` — working |
| Facebook posts scraping | `apify~facebook-posts-scraper` — working (switched this session) |
| Meta Ads scraping | `apify~facebook-ads-scraper` — working (switched this session) |
| Data normalisation | Instagram, Facebook, Meta Ads, Google Reviews all normalised |
| Change detection | Per-competitor, all windows (3/7/14 days), 5 detectors |
| Cross-competitor patterns | 4 detectors: simultaneous_promos, ad_wave, hashtag_cluster, cadence_drop |
| Per-competitor AI analysis | Competitor Analyst agent, CompetitorAnalysis rows, API served |
| Cross-competitor patterns UI | Fully connected, patterns populating after "Run analysis" |
| Weekly Brief generation | Market Analyst + Competitor Analyst → Synthesizer → WeeklyBrief |
| Strategy Session | 7-agent pipeline (question parser + 5 analysts + Strategist), follow-ups |
| Dashboard | Brief preview, this week's plays, competitor pulse cards |
| Settings | Profile save, competitor management |
| Competitor analysis UI | Per-competitor + cross-competitor, full design system |

### What's Partially Working / Has Known Issues

| Feature | Issue |
|---------|-------|
| TikTok scraping | Actor configured (`clockworks~free-tiktok-scraper`) but never tested — returns 0/5 |
| Brief email delivery | Email service is built, but sending is not triggered on brief completion |
| Scrape scheduling | Manual only — `competitor_cron.py` + `brief_cron.py` exist but not hooked to a real scheduler (APScheduler/cron) |
| Onboarding competitor discovery | Google Places API integration is built in `discovery.py` but Step 5 in the UI wizard calls a mock — not wired to real API |
| `google_business_url` scraping | Competitor model stores it but `GOOGLE_REVIEWS` source uses the `google_place_id`, not the URL — needs review |
| Settings → Integrations tab | UI renders but social account connection (OAuth) is not built |

### What's Not Built (Gaps)

| Gap | Week Target | Priority |
|-----|------------|----------|
| Billing / Stripe integration | Week 9 | High (needed before any real users) |
| Usage caps (per-owner monthly limits) | Week 9 | High |
| Admin panel (owner list, cost dashboard, feature flags) | Week 9 | Medium |
| Onboarding magic link email (real send in prod) | Week 8 | High |
| Scrape scheduler — APScheduler or cron | Week 8 | High |
| Brief email on completion | Week 8 | Medium |
| TikTok scraper verification | — | Medium |
| PostgreSQL migration (prod DB) | Week 10 | Critical |
| Production deployment (Vercel + Railway/Fly) | Week 10 | Critical |
| Rate limiting on API endpoints | Week 10 | High |
| Sentry error tracking (`.env` flag exists, not configured) | Week 10 | Medium |
| Occasions data expansion (currently 36, target 200+) | Backlog | Low |
| Multi-city support (occasions are Calgary-tagged) | Post-launch | Low |

---

## Files Changed This Session

### Backend

| File | Change |
|------|--------|
| `app/services/scraper.py` | Facebook: `apify~facebook-pages-scraper` → `apify~facebook-posts-scraper` with `startUrls` input. Meta Ads: `curious_coder~...` → `apify~facebook-ads-scraper` with Ads Library search URL |
| `app/services/normaliser.py` | `normalise_facebook` rewritten for new actor fields (`text`, `time`, `textReferences` for hashtags). `normalise_meta_ads` rewritten for `snapshot.body/cards`, `impressionsWithIndex`, `adArchiveID` |
| `app/services/data_retrieval.py` | API response fields renamed: `type` → `pattern_type`, `competitor_names` → `competitors_involved`. Added `strategic_implication` to pattern response |
| `app/services/change_detection.py` | `datetime.now(timezone.utc)` → `datetime.now()` (naive). Removed `timezone` import |
| `app/services/pattern_detection.py` | `datetime.now(timezone.utc)` → `datetime.now()` (naive). `MIN_COMPETITORS_FOR_PATTERN = 3 → 2`. Hashtag filter: `len(tag) >= 4 → >= 3`, added `_skip_tags` set |
| `app/agents/market_analyst.py` | `timeout_seconds = 30 → 90`, `max_tokens = 2048 → 4096` |
| `app/agents/brand_analyst.py` | Same timeout/token increase |
| `app/agents/timing_analyst.py` | Same timeout/token increase |
| `app/agents/risk_analyst.py` | Same timeout/token increase |
| `app/agents/financial_analyst.py` | Same timeout/token increase |
| `app/orchestrator/brief_generator.py` | `SYNTHESIZER_TIMEOUT = 30 → 90`, `max_tokens = 2048 → 4096`, error logging improved |
| `app/api/competitors.py` | `POST /competitors/analyze-all` now runs change detection + pattern detection after AI analysis |

### Frontend

| File | Change |
|------|--------|
| `src/lib/api.ts` | Added `strategic_implication?: string` to `PatternItem` type |
| `src/app/(dashboard)/competitors/page.tsx` | Full redesign — severity-colored pattern cards, competitor chips with initials, strategic implication callout, summary metrics strip, 2-column grid layout for patterns, violet active state on competitor sidebar, color-coded data source badges |

---

## Key Lessons / Gotchas for Future Reference

### Apify Actors
- **Never use `curious_coder~*` actors** — outdated, incompatible input schemas, no support.
- **Always use official `apify~*` actors** — maintained, documented, consistent `startUrls` input pattern.
- Facebook posts scraping works without auth via `apify~facebook-posts-scraper`. Facebook Pages scraper requires auth cookies — don't use unless you have a way to inject session cookies.
- Meta Ads: use keyword search URL format (`?search_type=keyword_unordered`) not page URL format.

### SQLite datetime gotcha
- SQLite returns naive datetimes from SQLAlchemy even when the column is declared `DateTime(timezone=True)`.
- **In dev (SQLite):** use `datetime.now()` for all date window calculations.
- **In prod (PostgreSQL):** revert to `datetime.now(timezone.utc)` — PostgreSQL returns aware datetimes.
- This bug is invisible when broad `except Exception` blocks swallow errors silently. Always log `type(e).__name__` not just `str(e)`.

### Agent timeouts
- Claude Sonnet 4.6 with real tool calls takes 30–90 seconds depending on context size and tool count.
- `timeout_seconds = 30` is too low for any real analysis agent. Use 90 as the baseline minimum.
- `asyncio.TimeoutError()` stringifies to `""` — always log `type(e).__name__` alongside `str(e)`.

### Silent error pattern
```python
try:
    # ...
except Exception as e:
    log.warning("something_failed", error=str(e))  # BAD — TimeoutError shows as ""
    
# Better:
except Exception as e:
    log.warning("something_failed", error=type(e).__name__ + ": " + str(e)[:200])
```

---

## How to Run (Updated)

```bash
# Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8990

# Frontend
cd frontend
npm run dev
# → http://localhost:3000

# Seed occasions
cd backend && python -m scripts.seed_occasions

# Trigger a full analysis + pattern detection cycle
curl -X POST http://localhost:8990/api/v1/competitors/analyze-all \
  -H "Cookie: session_token=<your_token>"

# Generate a weekly brief
curl -X POST http://localhost:8990/api/v1/briefs/generate \
  -H "Cookie: session_token=<your_token>"
```

## Environment Variables Required

```bash
# backend/.env
DATABASE_URL=sqlite+aiosqlite:///./localpulse_dev.db
SECRET_KEY=dev-secret-key-change-in-production
ANTHROPIC_API_KEY=sk-ant-...          # all agent calls
RESEND_API_KEY=re_...                 # email delivery (magic links + brief emails)
GOOGLE_PLACES_API_KEY=AIza...         # competitor discovery in onboarding
APIFY_API_TOKEN=apify_api_...         # all scraping (Instagram, Facebook, Meta Ads, Google)
```
