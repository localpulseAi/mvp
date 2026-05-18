# LocalPulse AI — Development Plan

**Version:** 1.0
**Status:** V1 build plan
**Date:** April 2026
**Target ship:** Week 11 from kick-off (founding-member pilot start)

---

## 1. Overview

This is the engineering plan to ship LocalPulse AI V1 in 11 weeks of solo founder work, with AI-assisted coding throughout. It assumes the PRD as fixed and focuses on how to actually build it.

The build is divided into 11 weeks, each with one focus. No week tries to do two big things. Compression happens by being ruthless about scope, not by parallelising.

After the V1 ships at end of week 11, the founding-member pilot begins. The next 6 weeks of pilot operation are not on this dev plan — they're operational, with tactical fixes and quality iteration based on real usage.

## 2. Stack decisions

These are locked at the start. Changing any of them mid-build is expensive.

**Backend:** Python with FastAPI. Async by default (the agent orchestration needs concurrent tool calls).

**Database:** PostgreSQL for structured data (owner profiles, sessions, competitor records, scrape history). Redis for caching, rate-limiting, and the job queue.

**Frontend:** Next.js (React). Server-rendered where possible for speed. Tailwind for styling.

**Hosting:** Vercel for the Next.js frontend, Railway or Fly.io for the Python backend and worker processes. PostgreSQL managed (Neon or Supabase).

**LLM provider:** Anthropic Claude as primary. Provider abstraction layer in place from day one so we can switch or fall back. Use the latest Claude family model for the Strategist agent (synthesis is the highest quality bar); a smaller, cheaper model for analyst agents where appropriate.

**Scraping:** Apify as primary scraping infrastructure. Direct API calls (Google Places, Meta Ad Library) where official APIs exist.

**Search API:** Tavily or Brave Search for live web search.

**Background jobs:** Celery or Arq for scheduled scrapes and weekly brief generation.

**Observability:** Structured logging from day one. Sentry for errors. Custom agent-run logging that captures inputs, outputs, tool calls, latency, and cost per run.

## 3. The 11-week plan

Each week has a single focus, a defined deliverable, and a "done means" criterion. If a week's deliverable slips, the next week's plan should be re-evaluated, not just compressed.

### Week 1 — Foundation

**Focus:** Project skeleton, no AI yet.

**Deliverables:**

- Repo set up (mono-repo, frontend and backend in same repo).
- Auth flow (email-based, magic links, no passwords).
- Empty dashboard shell with three placeholder routes (Brief, Strategy Session, Competitor Analyzer).
- Owner profile data model and CRUD.
- Job queue plumbing in place.
- Logging and error reporting wired up.

**Done means:** A founder can sign up, get into a dashboard, and log out. Nothing else works yet.

### Week 2 — Market-level data layer

**Focus:** The data inputs that feed the Weekly Strategic Brief.

**Deliverables:**

- Local occasion calendar curated (200+ tagged occasions with seasonality, niche relevance weights — city-configurable for each pilot market).
- Weather API integrated (Open-Meteo or similar, free tier sufficient).
- Local events feed (Eventbrite, city event APIs where available, manual curation as fallback for V1).
- Google Trends integration (pytrends or scraped if API limited).
- Niche-level signal storage and retrieval.

**Done means:** Given an owner profile (niche + location), the system can return all market-level signals relevant to them for any given week. No agent layer yet — these are tools the agents will call.

### Week 3 — Competitor scraping pipeline

**Focus:** The data inputs that feed the Competitor Analyzer.

**Deliverables:**

- Apify integration with scrape orchestration.
- Per-source scrapers wired: Instagram, Facebook, Google Reviews, Google Business, Meta Ad Library.
- Per-source cadence scheduling (Instagram weekly, reviews bi-weekly, Google Business monthly, Meta Ads weekly).
- Raw scrape storage with full history retention.
- Per-source retry logic and graceful failure handling.

**Done means:** Given a list of 5 competitor URLs/handles, the system pulls fresh data on the right cadence and stores it with timestamps. Falls back gracefully when a source fails.

### Week 4 — Normalisation and change detection

**Focus:** Turning raw scrapes into analysis-ready data.

**Deliverables:**

- Normalised data model for competitor data (post, review, business listing, ad creative, all share schemas across sources).
- Normaliser pipeline running on every scrape.
- Change detection across windows (7-day, 30-day, 60-day, 90-day baselines).
- Cross-competitor pattern detection (what 3+ competitors share, outliers).
- Indexed retrieval for downstream agent tools.

**Done means:** The system can answer "what changed for competitor X in the last 30 days" and "what are 3+ of these 5 competitors doing in common right now" with structured data, no LLM involved yet.

### Week 5 — Multi-agent framework

**Focus:** The orchestration layer that all subsequent agents will plug into.

**Deliverables:**

- Agent harness with structured input/output schemas.
- Parallel execution of multiple agents with per-agent timeouts.
- Schema validation on agent outputs (retry once on validation failure, drop on second).
- Cost budget per request and per owner.
- Tool layer abstraction (agents call tools by name, tools are versioned).
- First two analyst agents wired and producing output: Market Analyst, Competitor Analyst.

**Done means:** Given an owner profile and a question, the system can dispatch Market Analyst and Competitor Analyst in parallel, get structured output back from both within time budget, and store the run with full observability.

### Week 6 — Remaining agents and eval harness

**Focus:** The other four analyst agents plus the Strategist, plus the eval harness that tells us if any of them are actually working.

**Deliverables:**

- Brand & Positioning Analyst.
- Timing Analyst.
- Financial Sense-Check Agent (with range-based reasoning, not point estimates).
- Risk Analyst.
- Strategist (synthesis) Agent with full prompt including alternatives logic, what-to-watch-for, recommendation format.
- Eval harness: held-out scenario set per agent, end-to-end scenarios for full pipeline, LLM-judge with rubric and human spot-check protocol.
- First eval pass on real local business scenarios across verticals (founder hand-scores 30+ scenarios).

**Done means:** All seven agents are wired. End-to-end pipeline runs on a real scenario in target latency. Eval harness produces scores. We can compare prompt versions and tell which one is better.

### Week 7 — Weekly Strategic Brief feature

**Focus:** First user-facing feature shipped.

**Deliverables:**

- Brief generation orchestration (Sunday night cron per owner).
- Brief rendering in dashboard.
- Brief email delivery (transactional email service — Resend or Postmark).
- Brief history page.
- "From your competitor watch" section conditional rendering.

**Done means:** A founder, sitting at their dashboard, gets a real Weekly Strategic Brief every Monday morning that's actually about their (test) business and reads like a strategist wrote it.

### Week 8 — Strategy Session feature

**Focus:** The USP-carrying feature.

**Deliverables:**

- Conversational input UI.
- Question parsing (extract type, magnitude, scope, implicit goal; ask one clarifying question if needed).
- Full-pipeline dispatch (all six analysts plus Strategist).
- Session output rendering with restated question, context, analysis, recommendation, alternatives, what-to-watch-for.
- Follow-up question handling (preserve session context, only re-run Strategist).
- Session history per owner.

**Done means:** A founder can ask a real strategic question, get a response in under 45 seconds, ask a follow-up, and see the full session in their history. The output reads like a strategist thought about it.

### Week 9 — Competitor Analyzer feature

**Focus:** The third flagship feature, including Competitor Discovery.

**Deliverables:**

- Google Places API integration for Competitor Discovery.
- Two-phase competitor scoring (heuristic prune + LLM evaluation against five dimensions).
- Discovery UI: 8–12 ranked candidates with rationale, owner edit controls, search-and-add for missing competitors.
- Re-run discovery flow with current 5 excluded.
- Bi-weekly competitor update generation orchestration.
- Per-competitor and cross-competitor view rendering.
- Competitor set edit flow (add, remove, swap).
- Edit triggers re-baselining for changed competitors.

**Done means:** A founder can complete onboarding through Discovery, see their 5 competitors set up, see baseline scraping start, and see their first competitor update render. Discovery suggestions feel reasonable, not random.

### Week 10 — Social Presence Audit

**Focus:** The fourth flagship feature — the owner-facing read on their own social presence.

**Deliverables:**

- Owner social account connection flow: Instagram, Facebook page, Google Business Profile. Connect, disconnect, and re-connect from settings. Onboarding step updated to offer connections and explain the audit value.
- Owner-account scraping pipeline reusing the competitor scraper infrastructure (Apify actors), pointed at owner handles. Cadence matches competitor cadence by source. Raw scrapes and normalised data stored in owner-data tables, separate from competitor tables.
- Owner-content change detection (cadence, theme, sentiment shifts on the owner's own reviews) reusing the change-detection layer from Week 4.
- New analyst agent: **Social Presence Analyst**. Input: owner profile, normalised owner social data, owner reviews, prior audit, prior action plan, relevant market context. Output: state-of-presence, what's-working, what's-not-working, action plan, prior-plan progress.
- Audit orchestration job: weekly cron per owner with at least one connected account. Manual on-demand re-run endpoint, rate-limited.
- Action-plan tracking model and APIs: status transitions, history, references between audits.
- New dashboard page: **/audit** (or equivalent). Tabs for current audit, action plan, history, connected accounts. Action items rendered as cards with status controls and "Discuss in Strategy Session" deep-link.
- Eval pass: 20+ hand-scored audits across vertical scenarios. Action-plan quality is the primary metric — concrete, owner-doable, tied to a verifiable hypothesis.
- Wire audit findings into the Weekly Strategic Brief synthesizer so the brief can reference current audit signals where they matter.

**Done means:** An owner with one or more connected accounts gets a real Social Presence Audit on Monday with a 3–7 item action plan. They can mark items done. The next week's audit references the previous plan and reports observable progress. Output reads like a strategist wrote it.

### Week 11 — Onboarding polish and launch prep

**Focus:** Everything that's not a flagship feature but determines whether the pilot works.

**Deliverables:**

- Onboarding flow polish (9-minute target, save and resume, progress indicators).
- Friday check-in feature (cron job, email, response handling, feedback into next brief).
- Settings pages (profile edit, competitor set edit, notification preferences).
- End-to-end QA on real Calgary restaurant data.
- Eval pass against final prompt versions.
- Founding-member landing page and signup flow.
- Founding-member onboarding email sequence drafted.
- Demo flow rehearsed end-to-end (the founder doing a live demo, not the product alone).

**Done means:** Onboarding works. The product runs end-to-end. The founder is ready to begin recruiting founding members for week 11+.

## 4. What runs in parallel with the build

Some things should not wait until the product ships.

**Owner conversations from week 1.** Visit 10–15 Calgary restaurants in week 1, before the product is anywhere near ready. The conversations are about understanding their problems, not selling anything. By week 4, founding-member recruitment conversations begin.

**Calgary occasion calendar curation.** Weekend project in week 1–2. 200+ tagged occasions with seasonality and niche relevance.

**Competitor target list curation.** As founding members commit, build the test data set against their actual competitors so the build phase is testing against real data.

**Prompt engineering.** From week 5 onwards, the prompts are the highest-leverage iteration target. Every week of weeks 5–10 should include some prompt iteration based on eval results.

## 5. Critical path and risks

The critical path is: Foundation (W1) → Market data (W2) → Competitor pipeline (W3-4) → Agent framework (W5) → All agents (W6) → Brief (W7) → Strategy Session (W8) → Competitor Analyzer (W9) → Social Presence Audit (W10) → Polish (W11).

The Social Presence Audit reuses the scraping pipeline, normaliser, change detection, and agent harness from prior weeks. Its dependencies are wide but shallow — the new build surface is a single analyst agent plus action-plan tracking plus a dashboard page. It does not extend the critical path materially, but it cannot run earlier than W10 because the eval discipline established in W6 needs to be applied to its prompt before launch.

**Highest-risk weeks:**

- **Week 5** — agent framework. Bugs here cascade into every subsequent week. Spend extra care on the harness, schemas, and observability.
- **Week 6** — Strategist prompt quality. This is the make-or-break for the USP. Allocate as much eval iteration time as possible.
- **Week 9** — Google Places integration plus scoring. The scoring quality determines whether Discovery suggestions feel smart or random. Test against known restaurants and known competitive sets before week 9 ends.

**Slip plan:** If a week slips, do not move forward — slip the subsequent weeks. Compressing the framework or eval weeks to "catch up" produces a worse product, not a faster one. Better to push the pilot start by 1–2 weeks than ship a flagship feature whose AI quality hasn't been properly validated.

**Triggers to re-plan:**

- If by end of week 6, end-to-end Strategy Session eval scores are below 70% on the rubric, pause and iterate before ramping up other features.
- If by end of week 4, scraping reliability is below 90% per source, deal with reliability before moving to agents.
- If by end of week 1, the founder has done zero owner conversations, pause build and start them — no point optimising a product nobody confirms wants help.

## 6. After V1 ships (weeks 12–17)

Pilot operations, not feature build:

- Founding member recruitment to 8–12.
- Onboarding each member, watching for friction.
- Daily prompt iteration based on real Strategy Sessions.
- Weekly synthesis of pilot feedback into prioritised improvement list.
- Hand-tracking outcomes during pilot (this is the seed for V2's automated outcome tracking).
- At week 17: conversion conversations with founding members.

## 7. V2 candidate work (months 4–6)

Surfaced from pilot data, not pre-planned. Plausible candidates:

- Auto-trigger when owner drafts promo content elsewhere.
- Outcome tracking automation (built once we know what's worth tracking).
- Per-client confidence calibration.
- TikTok scraping if pilot owners ask repeatedly.
- Indirect competitor discovery if pilot owners describe the need clearly.
- Tier introduction with a higher-priced power-user tier.

The exact V2 priorities should come out of pilot data. Locking them now is premature.

## 8. Cost during build

Rough monthly costs during the build phase (weeks 1–11):

- Hosting (Vercel + Railway + DB): $50–$100.
- Apify (limited scraping during build): $20–$50.
- LLM API calls (eval runs and dev): $100–$300.
- Google Places, weather, search APIs: $20–$50.
- Domain, email service, monitoring: $30–$60.

**Total during build:** roughly $220–$560/month.

Cost ramps during pilot phase as real owners use the product. Pilot-phase cost per owner per month is estimated at $30–$60 in inference plus scraping. At 10 founding members, total ongoing cost is roughly $400–$800/month.

## 9. What this plan deliberately does not include

To keep the plan honest:

- No mobile native app.
- No multi-tenant or organisation accounts (single-owner per account in V1).
- No payment processing infrastructure during build (founding members are credit-card-on-file, no charge until pilot conversion; payment processing builds in week 12–13 of pilot).
- No internationalisation. English, Calgary-area, USD/CAD billing only.
- No SOC 2, no enterprise security infrastructure. Standard hygiene only (HTTPS, encrypted at rest, password hashing, rate-limiting).

These are not "won't ever do." They are "not in V1 build."
