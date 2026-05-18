# LocalPulse AI — Requirement Specifications

**Version:** 1.0
**Status:** V1 specification
**Date:** April 2026

---

## 1. Document purpose

This document defines what the V1 system must do, in concrete and testable terms. It is the contract between product intent (PRD) and engineering reality (Dev Plan). Each requirement is numbered, categorised, and stated as a verifiable assertion.

Requirement levels:

- **MUST:** required for V1 ship.
- **SHOULD:** strongly preferred for V1 ship; may slip to early V2 if necessary.
- **MAY:** nice to have; explicitly optional.

---

## 2. Functional requirements

### 2.1 Account and authentication

- **FR-AUTH-01 (MUST):** The system shall allow a new user to sign up using an email address only, with verification via a one-time link sent to that email.
- **FR-AUTH-02 (MUST):** The system shall not require passwords. Authentication is via magic link or persistent session.
- **FR-AUTH-03 (MUST):** Sessions shall remain valid for 30 days unless explicitly logged out.
- **FR-AUTH-04 (MUST):** A user shall be able to log out from any device, terminating that session.
- **FR-AUTH-05 (SHOULD):** A user shall be able to view a list of active sessions and terminate any of them.

### 2.2 Onboarding

- **FR-ONB-01 (MUST):** Onboarding shall complete in a target time of 9 minutes for a typical owner.
- **FR-ONB-02 (MUST):** Onboarding shall be resumable. If the user closes the browser mid-flow, returning to the site shall resume at the last completed step.
- **FR-ONB-03 (MUST):** Onboarding shall collect business basics: business name, address (with map confirmation), niche category, what the business sells (free text), brand voice description (one open prompt), and existing social handles where applicable.
- **FR-ONB-04 (MUST):** Onboarding shall collect cost structure as ranges, never as exact figures. Specifically: gross margin band (slider with discrete bands), monthly fixed cost ballpark (slider with bands), key product/service price ranges.
- **FR-ONB-05 (MUST):** Onboarding shall collect capacity profile: peak service load (units appropriate to niche, e.g. covers per service for restaurants, appointments per day for salons, clients per week for fitness studios), staff size, peak operating hours.
- **FR-ONB-06 (MUST):** Onboarding shall run Competitor Discovery (see 2.6) and present 8–12 ranked candidates for the owner to confirm or edit.
- **FR-ONB-07 (MUST):** Onboarding shall offer optional integrations: Instagram (read-only), Facebook page (read-only), Google Business profile claim (read-only). Each integration is independently optional; none is required to complete onboarding. The onboarding step shall explain that connecting at least one account unlocks the Social Presence Audit (see 2.9).
- **FR-ONB-08 (MUST):** Onboarding shall not request any banking, accounting, POS, or financial system credentials.
- **FR-ONB-09 (SHOULD):** Onboarding shall ask one open-ended question about the owner's most important goal for the current quarter, with the answer used by the Strategist agent for synthesis context.

### 2.3 Weekly Strategic Brief

- **FR-WSB-01 (MUST):** The system shall generate a Weekly Strategic Brief for every active owner once per week.
- **FR-WSB-02 (MUST):** The brief shall be generated and delivered before 7am local time on Monday.
- **FR-WSB-03 (MUST):** The brief shall be available in the dashboard and shall be sent via email.
- **FR-WSB-04 (MUST):** The brief shall contain: a market read for the upcoming week, one or two specific recommendations with reasoning, signals to watch for during the week.
- **FR-WSB-05 (MUST):** The brief shall conditionally include a "From your competitor watch" section if any meaningful changes occurred in the named competitor set during the prior week.
- **FR-WSB-06 (MUST):** The brief shall display the data freshness window for the underlying signals (e.g. "based on data through Sunday April 26").
- **FR-WSB-07 (MUST):** Past briefs shall be accessible via a brief history view, with no time limit on retention during a paid subscription.
- **FR-WSB-08 (SHOULD):** The brief shall be readable in under 3 minutes for an average owner.
- **FR-WSB-09 (SHOULD):** The owner shall be able to request a re-generation of the current week's brief, rate-limited to one re-generation per week.

### 2.4 Strategy Session

- **FR-SS-01 (MUST):** An owner shall be able to start a Strategy Session at any time from the dashboard.
- **FR-SS-02 (MUST):** Input to a Strategy Session shall be free-form text (typed natural language). No structured forms in V1.
- **FR-SS-03 (MUST):** The system shall ask up to one clarifying question if the question's structure is meaningfully ambiguous. It shall not ask clarifying questions otherwise.
- **FR-SS-04 (MUST):** The first response to a Strategy Session shall be delivered in 45 seconds or less for 95% of requests.
- **FR-SS-05 (MUST):** The output shall include: restated question, strategic context, analysis, recommendation with reasoning, two to three ranked alternatives, signals to watch for.
- **FR-SS-06 (MUST):** The output shall not contain numerical confidence scores or point forecasts. Reasoning is shown; numerical confidence is not.
- **FR-SS-07 (MUST):** The output shall not use verdict language (GO, DON'T DO IT, RECONSIDER, etc.). Recommendations are stated as recommendations.
- **FR-SS-08 (MUST):** Within the same session, an owner shall be able to ask follow-up questions. Follow-up responses shall preserve session context and shall be delivered in 15 seconds or less for 95% of requests.
- **FR-SS-09 (MUST):** Sessions shall be saved per owner with full input and output history.
- **FR-SS-10 (SHOULD):** An owner shall be able to revisit any past session and continue the conversation.
- **FR-SS-11 (MUST):** When an analyst agent times out or fails, the Strategist agent shall produce output using the available analyst outputs and shall note the gap explicitly in the response if the missing analyst would have meaningfully affected the recommendation.

### 2.5 Competitor Analyzer

- **FR-CA-01 (MUST):** Each owner shall have a competitor set of between 1 and 5 competitors.
- **FR-CA-02 (MUST):** The owner shall be able to add, remove, or swap competitors in the set at any time.
- **FR-CA-03 (MUST):** Adding a competitor shall trigger initial baseline scraping for that competitor across all configured sources.
- **FR-CA-04 (MUST):** The system shall scrape competitor sources on the following cadences: Instagram weekly, Facebook weekly, Google Reviews bi-weekly, Google Business monthly, Meta Ad Library weekly.
- **FR-CA-05 (MUST):** The system shall generate a bi-weekly competitor update for each owner with at least one competitor in their set.
- **FR-CA-06 (MUST):** The competitor update shall contain: top three strategic observations with recommendations, per-competitor analysis (positioning, strengths, vulnerabilities, recent shifts, strategic implication), cross-competitor patterns.
- **FR-CA-07 (MUST):** The first competitor update shall be delivered no earlier than 14 days after the owner completes onboarding (baseline data requirement).
- **FR-CA-08 (MUST):** The owner shall never see raw scraped data. They see analysis only.
- **FR-CA-09 (MUST):** Each competitor analysis shall display the data freshness window per source.
- **FR-CA-10 (MUST):** When a source scrape has failed for more than 14 days for a given competitor, the analysis shall explicitly note the missing data rather than silently producing analysis without it.
- **FR-CA-11 (SHOULD):** The owner shall be able to request an on-demand competitor refresh, rate-limited to once per competitor per 7 days.

### 2.6 Competitor Discovery

- **FR-CD-01 (MUST):** During onboarding, after collecting business basics and niche, the system shall run Competitor Discovery automatically.
- **FR-CD-02 (MUST):** Competitor Discovery shall query Google Places API within a niche-appropriate radius (configurable per niche and city density; default 1.5 km, adjustable).
- **FR-CD-03 (MUST):** Competitor Discovery shall return 8–12 ranked candidates per run.
- **FR-CD-04 (MUST):** Each candidate shall display: business name, address, and a one-line rationale (e.g. "0.4 km away, similar price tier, same category").
- **FR-CD-05 (MUST):** The owner shall be able to confirm or remove any candidate from the list.
- **FR-CD-06 (MUST):** The owner shall be able to search for and add a competitor not in the candidate list.
- **FR-CD-07 (MUST):** The owner shall be able to lock in a final set of 1–5 competitors.
- **FR-CD-08 (MUST):** Competitor Discovery shall be re-runnable from settings at any time after onboarding.
- **FR-CD-09 (MUST):** When re-run, Competitor Discovery shall exclude the current competitor set from candidate suggestions and surface the next ranked candidates.
- **FR-CD-10 (MUST):** When Google Places returns fewer than 8 candidates within the niche-appropriate radius, the system shall expand the radius or surface what was found and prompt the owner to add their own competitors. The system shall not present an empty list.
- **FR-CD-11 (SHOULD):** When the owner removes a candidate, the system shall offer an optional one-line reason input. The reason is stored to improve future discovery runs.

### 2.7 Friday check-in

- **FR-FC-01 (MUST):** During the founding-member pilot phase, the system shall send a check-in message every Friday afternoon to each owner.
- **FR-FC-02 (MUST):** The message shall ask "How did this week go? Anything you want to talk through before Monday's brief?" or equivalent.
- **FR-FC-03 (MUST):** The owner's reply shall be captured and made available to the Strategist agent during synthesis of the next Weekly Strategic Brief.
- **FR-FC-04 (SHOULD):** The owner may opt out of Friday check-ins via settings.

### 2.8 Settings and account management

- **FR-SET-01 (MUST):** An owner shall be able to view and edit all profile information collected during onboarding.
- **FR-SET-02 (MUST):** An owner shall be able to edit their competitor set or re-run Competitor Discovery.
- **FR-SET-03 (MUST):** An owner shall be able to delete their account, which permanently removes all owner data.
- **FR-SET-04 (MUST):** An owner shall be able to export all their data (briefs, sessions, competitor analyses) in a portable format.
- **FR-SET-05 (MUST):** An owner shall be able to manage notification preferences (email on/off per feature).
- **FR-SET-06 (MUST):** An owner shall be able to connect, disconnect, and re-connect their own social accounts (see 2.10) from settings.

### 2.9 Social Presence Audit

- **FR-SPA-01 (MUST):** The system shall generate a Social Presence Audit once per week for every owner with at least one connected social account (see 2.10).
- **FR-SPA-02 (MUST):** The audit shall be generated and made available on Monday morning. It may be delivered alongside or shortly after the Weekly Strategic Brief.
- **FR-SPA-03 (MUST):** The audit shall be available in the dashboard via a dedicated top-level page and shall be linked from the Weekly Strategic Brief.
- **FR-SPA-04 (MUST):** The audit shall contain: a state-of-presence read per connected platform, a "what's working" section with reasoning, a "what's not working" section with hypotheses, a prioritised action plan, and a progress report against the prior audit's action plan.
- **FR-SPA-05 (MUST):** The audit shall produce between 3 and 7 action items per run. Producing fewer or more is treated as a quality regression.
- **FR-SPA-06 (MUST):** Each action item shall include: title, priority (high/medium/low), category (content, cadence, engagement, positioning, reviews, profile, other), why this matters, how to execute (owner-doable steps), what to watch for as the signal it is working, estimated effort band (under 15 minutes, 15–60 minutes, over an hour).
- **FR-SPA-07 (MUST):** Each action item shall track status (pending, in progress, done, dismissed). The owner shall be able to update the status from the dashboard.
- **FR-SPA-08 (MUST):** When generating a new audit, the system shall reference the prior audit's action items, report what changed (done, in progress, stalled, dismissed) and what observable signal it saw. Continuity between audits is required.
- **FR-SPA-09 (MUST):** The audit shall display data freshness per connected platform.
- **FR-SPA-10 (MUST):** When data is stale for any connected source beyond the thresholds in DATA-F-02, the audit shall explicitly note the gap rather than silently producing analysis without it.
- **FR-SPA-11 (MUST):** The audit shall not display raw metrics as the primary surface. Metrics may appear as supporting context within reasoning paragraphs; they shall not be the headline.
- **FR-SPA-12 (MUST):** The audit shall not produce numerical confidence scores or point forecasts. The audit shall not use verdict language. Strategist voice is enforced (consistent with AGENT-ST-03 and AGENT-ST-04).
- **FR-SPA-13 (MUST):** An owner shall be able to request an on-demand audit refresh, rate-limited to one re-generation per 3 days.
- **FR-SPA-14 (MUST):** Past audits shall be accessible via an audit history view, with no time limit on retention during an active subscription.
- **FR-SPA-15 (MUST):** When the owner has no connected accounts, the audit page shall surface a clear connect-account prompt and shall not display a placeholder audit or stale data.
- **FR-SPA-16 (SHOULD):** The audit shall be readable in under 5 minutes for an average owner.
- **FR-SPA-17 (SHOULD):** Each action item shall include a "Discuss in Strategy Session" link that pre-fills a session question scoped to that item.
- **FR-SPA-18 (SHOULD):** The Weekly Strategic Brief shall optionally reference current audit findings where they meaningfully affect the brief's recommendations.

### 2.10 Owner social accounts

- **FR-SOC-01 (MUST):** An owner shall be able to connect their own Instagram account in read-only mode.
- **FR-SOC-02 (MUST):** An owner shall be able to link their Facebook page in read-only mode.
- **FR-SOC-03 (MUST):** An owner shall be able to claim their Google Business Profile in read-only mode.
- **FR-SOC-04 (MUST):** Each connected account shall be scraped on the same cadence used for competitor sources (see FR-CA-04). Owner-account data is stored separately from competitor data.
- **FR-SOC-05 (MUST):** Connecting at least one account is a prerequisite for generating a Social Presence Audit. The product shall continue to function without any connected account; the Audit feature is the only one gated.
- **FR-SOC-06 (MUST):** An owner shall be able to disconnect any account at any time. Disconnection halts future scraping for that source. Existing scraped data is retained for historical audits and can be deleted via account deletion (FR-SET-03).
- **FR-SOC-07 (MUST):** Adding a connected account shall trigger initial baseline scraping for that source.
- **FR-SOC-08 (MUST):** Owner social data shall never be exposed in raw form in the UI. Only analysis derived from it is shown (consistent with FR-CA-08 for competitors).

---

## 3. AI agent requirements

These define what each agent must do. Implementation details (prompt construction, model choice, tool usage) are in the Dev Plan and the AI Architecture section of the build plan.

### 3.1 Market Analyst

- **AGENT-MA-01 (MUST):** The agent shall accept owner profile and target time window as input.
- **AGENT-MA-02 (MUST):** The agent shall produce structured output containing top market signals for the time window with relevance reasoning.
- **AGENT-MA-03 (MUST):** The agent shall have access to: occasion calendar, weather forecast, events feed, trends data, web search.
- **AGENT-MA-04 (MUST):** The agent shall complete within 15 seconds for 95% of runs.

### 3.2 Competitor Analyst

- **AGENT-CA-01 (MUST):** The agent shall accept owner profile and competitor set as input.
- **AGENT-CA-02 (MUST):** The agent shall produce per-competitor and cross-competitor structured output.
- **AGENT-CA-03 (MUST):** The agent shall have access to: competitor data retrieval, change-detection diffs, on-demand scrape (rate-limited), pattern matching.
- **AGENT-CA-04 (MUST):** The agent shall handle Competitor Discovery via the same agent role with discovery-specific tools.
- **AGENT-CA-05 (MUST):** The agent shall complete within 25 seconds for 95% of runs (longer than market analyst due to deeper competitor reasoning).

### 3.3 Brand & Positioning Analyst

- **AGENT-BP-01 (MUST):** The agent shall accept owner profile, brand voice, and positioning context as input.
- **AGENT-BP-02 (MUST):** The agent shall produce structured output on brand fit and positioning differentiation for the situation at hand.
- **AGENT-BP-03 (MUST):** The agent shall have access to: owner profile, owner reviews with theme classification, competitor positioning summaries.
- **AGENT-BP-04 (MUST):** The agent shall complete within 15 seconds for 95% of runs.

### 3.4 Timing Analyst

- **AGENT-TA-01 (MUST):** The agent shall accept proposed action and target time window as input.
- **AGENT-TA-02 (MUST):** The agent shall produce timing fit assessment with specific conflicts named where applicable.
- **AGENT-TA-03 (MUST):** The agent shall have access to: occasion calendar, weather forecast, events feed.
- **AGENT-TA-04 (MUST):** The agent shall complete within 10 seconds for 95% of runs.

### 3.5 Financial Sense-Check Agent

- **AGENT-FS-01 (MUST):** The agent shall accept owner cost ranges, capacity profile, and proposed action financial implications as input.
- **AGENT-FS-02 (MUST):** The agent shall produce directional findings expressed in qualitative bands (e.g. "would meaningfully compress margin", "math is roughly fine") rather than point estimates.
- **AGENT-FS-03 (MUST):** The agent shall refuse to produce point estimates or specific numerical forecasts. This refusal is a hard constraint.
- **AGENT-FS-04 (MUST):** The agent shall have access to: owner profile, range arithmetic calculator, capacity simulator.
- **AGENT-FS-05 (MUST):** The agent shall complete within 10 seconds for 95% of runs.

### 3.6 Risk Analyst

- **AGENT-RA-01 (MUST):** The agent shall accept proposed action and owner operational context as input.
- **AGENT-RA-02 (MUST):** The agent shall produce ranked failure modes with severity assessment and proposed mitigations.
- **AGENT-RA-03 (MUST):** The agent shall have access to: owner reviews (complaints filtered), capacity simulator, failure-mode pattern matcher.
- **AGENT-RA-04 (MUST):** The agent shall complete within 10 seconds for 95% of runs.

### 3.7 Strategist (Synthesis) Agent

- **AGENT-ST-01 (MUST):** The agent shall accept structured outputs from all six analyst agents plus the original owner question.
- **AGENT-ST-02 (MUST):** The agent shall produce final owner-facing output with restated question, context, analysis, recommendation, alternatives, watch-for signals.
- **AGENT-ST-03 (MUST):** The agent shall not use verdict language. This is a hard constraint enforced in the prompt.
- **AGENT-ST-04 (MUST):** The agent shall not produce numerical confidence scores. This is a hard constraint enforced in the prompt.
- **AGENT-ST-05 (MUST):** The agent shall produce two to three ranked alternatives when the original idea has identified issues.
- **AGENT-ST-06 (MUST):** The agent shall have access to: alternatives bank, owner history.
- **AGENT-ST-07 (MUST):** The agent shall complete within 20 seconds for 95% of runs.

### 3.8 Social Presence Analyst

- **AGENT-SP-01 (MUST):** The agent shall accept owner profile, owner's own normalised social data, owner reviews, prior audit and prior action plan, and relevant market context (occasion calendar slice, competitor positioning summaries) as input.
- **AGENT-SP-02 (MUST):** The agent shall produce structured output containing: state-of-presence per platform, what's-working items with reasoning, what's-not-working items with hypotheses, a ranked action plan of 3–7 items conforming to FR-SPA-06, and a progress assessment against the prior plan.
- **AGENT-SP-03 (MUST):** The agent shall have access to: owner social data retrieval, owner-content change detection, occasion calendar, owner reviews with theme classification, brand voice profile, competitor positioning summaries (for differentiation framing only).
- **AGENT-SP-04 (MUST):** The agent shall not produce numerical confidence scores. Hard constraint.
- **AGENT-SP-05 (MUST):** The agent shall not use verdict language. Hard constraint.
- **AGENT-SP-06 (MUST):** The agent shall reference the prior audit's action plan in its output and assign a status assessment to each prior item (done, in progress, stalled, dismissed, no longer relevant) based on observable signal in the new data.
- **AGENT-SP-07 (MUST):** When a connected source has failed beyond the staleness threshold, the agent shall note the gap explicitly and shall not fabricate analysis from absent data.
- **AGENT-SP-08 (MUST):** The agent shall complete within 30 seconds for 95% of runs.

### 3.9 Cross-cutting agent requirements

- **AGENT-X-01 (MUST):** Every agent run shall be logged with inputs, outputs, tool calls, latency, model used, and cost.
- **AGENT-X-02 (MUST):** Every agent shall produce output conforming to a versioned schema. Schema validation failures result in one retry; second failure drops the agent's output from synthesis with a noted gap.
- **AGENT-X-03 (MUST):** Agent prompts shall be versioned. Version diffs shall be reviewable.
- **AGENT-X-04 (MUST):** No agent shall run without a per-request cost budget. Budgets exceeded shall terminate the agent gracefully with partial output.

---

## 4. Data requirements

### 4.1 Data the system stores

- **DATA-01 (MUST):** Owner profile data including all onboarding inputs.
- **DATA-02 (MUST):** Competitor data (raw scrapes, normalised data, change diffs) per competitor per source per scrape timestamp, with full historical retention during active subscription.
- **DATA-03 (MUST):** Strategy Session history including question, all analyst outputs, final synthesis output, timestamp.
- **DATA-04 (MUST):** Weekly Strategic Brief history per owner.
- **DATA-05 (MUST):** Competitor Analyzer update history per owner.
- **DATA-06 (MUST):** Friday check-in messages and replies.
- **DATA-07 (MUST):** Calgary occasion calendar with niche-relevance weights.
- **DATA-08 (MUST):** Owner's own reviews with theme classification (separate from competitor reviews).
- **DATA-09 (SHOULD):** Outcome tracking when manually captured during pilot.
- **DATA-10 (MUST):** Owner's own social data per connected source per scrape timestamp (raw scrapes, normalised data, change diffs), with full historical retention during active subscription. Stored separately from competitor data.
- **DATA-11 (MUST):** Social Presence Audit history per owner — full structured output, generation timestamp, model used, cost.
- **DATA-12 (MUST):** Social Presence action plan items with full history of status transitions (timestamps for pending → in progress → done / dismissed), linkage to the audit that produced them, and linkage to any audit that subsequently reported on them.

### 4.2 Data the system does not store

- **DATA-N-01 (MUST):** No banking, accounting, POS credentials.
- **DATA-N-02 (MUST):** No payment card numbers (handled by payment processor only).
- **DATA-N-03 (MUST):** No raw competitor data shall be exposed to the owner via the UI or API.

### 4.3 Data freshness

- **DATA-F-01 (MUST):** Every analysis output shall display its underlying data freshness window.
- **DATA-F-02 (MUST):** When source data is stale beyond defined thresholds (configurable per source, default 14 days for social, 30 days for reviews, 60 days for business listings), the system shall flag this in any analysis using that data.

---

## 5. Integration requirements

- **INT-01 (MUST):** Google Places API integration for Competitor Discovery.
- **INT-02 (MUST):** Apify integration for competitor scraping.
- **INT-03 (MUST):** Anthropic API for LLM agent calls.
- **INT-04 (MUST):** Weather API (Open-Meteo or equivalent) for timing analysis.
- **INT-05 (MUST):** Search API (Tavily, Brave, or equivalent) for live web search.
- **INT-06 (MUST):** Email service (Resend, Postmark, or equivalent) for transactional and digest emails.
- **INT-07 (SHOULD):** Google Trends API or equivalent for demand signal data.
- **INT-08 (SHOULD):** Eventbrite or city events feed integration.
- **INT-09 (SHOULD):** Instagram read access for owner's own account, via Instagram Basic Display API or public-profile scraping fallback. Required path (one of the two) for owners who connect Instagram as their Social Presence Audit source.
- **INT-10 (SHOULD):** Google Business Profile read access for the owner's own listing. Required path for owners who connect Google Business as their Social Presence Audit source.
- **INT-11 (SHOULD):** Facebook page read access for the owner's own page, via public-page scraping. Required path for owners who connect Facebook as their Social Presence Audit source.

Integrations marked MUST shall have failure modes that do not crash the system. Each shall have a defined fallback or graceful degradation path.

---

## 6. Non-functional requirements

### 6.1 Performance

- **NFR-PERF-01 (MUST):** Strategy Session first response latency: 95th percentile under 45 seconds.
- **NFR-PERF-02 (MUST):** Strategy Session follow-up latency: 95th percentile under 15 seconds.
- **NFR-PERF-03 (MUST):** Weekly Brief generation: completes for all active owners within the 1-hour window before delivery.
- **NFR-PERF-04 (MUST):** Competitor Discovery candidate render: 95th percentile under 15 seconds.
- **NFR-PERF-05 (MUST):** Dashboard initial load: under 2 seconds.
- **NFR-PERF-06 (MUST):** Social Presence Audit generation: 95th percentile under 60 seconds end-to-end (scraping freshness check, agent run, action-plan resolution against prior audit).
- **NFR-PERF-07 (MUST):** Action-item status update (mark done, in progress, dismissed): server round-trip under 500 milliseconds.

### 6.2 Reliability

- **NFR-REL-01 (MUST):** Agent runs that fail shall not silently corrupt downstream output. Failure is observable in logs and surfaced to the user where it would affect their analysis.
- **NFR-REL-02 (MUST):** No single source scraping failure shall block delivery of analysis. Per-source graceful degradation.
- **NFR-REL-03 (MUST):** Database backups daily, with 30-day retention.
- **NFR-REL-04 (SHOULD):** Service uptime target during business hours: 99.0%. (Higher targets are V2.)

### 6.3 Security

- **NFR-SEC-01 (MUST):** All traffic over HTTPS.
- **NFR-SEC-02 (MUST):** Sensitive data encrypted at rest in the database.
- **NFR-SEC-03 (MUST):** Rate limiting on all public-facing endpoints.
- **NFR-SEC-04 (MUST):** Authentication tokens stored securely client-side (httpOnly cookies).
- **NFR-SEC-05 (MUST):** No third-party JavaScript on authenticated pages beyond essential service providers (analytics, error reporting).

### 6.4 Privacy

- **NFR-PRIV-01 (MUST):** Privacy policy published before any owner signs up.
- **NFR-PRIV-02 (MUST):** Account deletion permanently removes all owner data within 30 days.
- **NFR-PRIV-03 (MUST):** Data export available to any owner on request, machine-readable format.
- **NFR-PRIV-04 (MUST):** No sale of owner data to third parties. Ever. This is a hard product policy.

### 6.5 Observability

- **NFR-OBS-01 (MUST):** Every agent run logged with full input, output, tool calls, latency, cost.
- **NFR-OBS-02 (MUST):** Errors captured in error reporting service with stack traces.
- **NFR-OBS-03 (MUST):** Cost per owner per month trackable and reportable.
- **NFR-OBS-04 (SHOULD):** User analytics for funnel events (signup, onboarding completion, first session, weekly login).

### 6.6 Cost ceilings

- **NFR-COST-01 (MUST):** Per-Strategy-Session inference cost shall not exceed $3.00 in 99% of runs.
- **NFR-COST-02 (MUST):** Per-owner-per-month total inference plus scraping cost shall not exceed $80 at the founding-member pricing tier.
- **NFR-COST-03 (MUST):** Cost overruns shall trigger alerts to the founder, not silent budget escalation.

---

## 7. Acceptance criteria for V1 ship

The V1 is shippable when all MUST requirements above are met, plus:

- **ACC-01:** A founding member can complete signup, onboarding (including Competitor Discovery), and reach the dashboard with no founder intervention.
- **ACC-02:** A complete Weekly Strategic Brief generates and delivers correctly for at least 5 test owners across multiple weeks.
- **ACC-03:** A Strategy Session completes end-to-end across at least 30 different test scenarios with output rated acceptable on the eval rubric in 80%+ of cases.
- **ACC-04:** Competitor Discovery produces sensible suggestions for at least 10 test Calgary restaurant scenarios.
- **ACC-05:** A bi-weekly Competitor Analyzer update generates correctly for at least 5 test owners with at least 4 weeks of baseline data.
- **ACC-06:** The Friday check-in feature delivers correctly to all active owners in a test cohort.
- **ACC-07:** Onboarding completes in under 12 minutes for at least 8 of 10 test users (with 9 minutes as the design target, allowing 33% margin for real-world variance).
- **ACC-08:** Social Presence Audit generates correctly for at least 5 test owners across multiple weeks, with continuity preserved between audits (each new audit cites prior plan items and assigns observable status).
- **ACC-09:** Social Presence Audit action plan is owner-doable — at least 80% of items in a sample of 30 generated items are rated by a reviewer as concrete, owner-doable, and tied to a hypothesis the owner could verify.

---

## 8. Out of scope for V1 specification

The following are explicitly not specified for V1 and any requirements implied here are deferred:

- Mobile native apps.
- Multi-tenant or organisation accounts.
- Localisation or non-English support.
- Multiple pricing tiers or upgrade flows.
- White-label or agency products.
- Outcome tracking automation (manual capture only).
- Cohort benchmarking.
- Causal inference attribution.
- Indirect competitor discovery.
- Content generation features.
- Voice or image generation.

---

## 9. Open questions

These need decisions before or during the build, but are not yet specified:

- **Q-01:** Niche-appropriate radius defaults for Competitor Discovery beyond restaurants. Will be needed for V2 vertical expansion, not V1.
- **Q-02:** Eval rubric specifics for Strategy Session quality scoring. To be drafted in week 6 during eval harness build.
- **Q-03:** Exact thresholds for "meaningful change" in change detection (cadence shifts, sentiment shifts). To be calibrated in week 4 against real Calgary data.
- **Q-04:** Whether Friday check-ins continue post-pilot or only during pilot phase. Decide based on pilot data.
- **Q-05:** Trigger logic for re-baselining when an owner adds a competitor mid-period. Default plan: full baseline rebuild for the new competitor only, others unaffected. Confirm in week 9.
