# LocalPulse AI — Product Requirements Document

**Version:** 1.0
**Status:** Draft for V1 build
**Date:** April 2026
**Owner:** Founder

---

## 1. Overview

LocalPulse AI is an AI marketing strategist for local small businesses. It does what a good human marketing consultant does — analyses the market, watches the competition, weighs trade-offs, and recommends moves with reasoning — except it does it continuously, on demand, and at a price an SMB owner can sustain.

Most AI tools in the SMB marketing space are content generators or recommendation feeds. LocalPulse takes a different posture. It does not predict outcomes or issue verdicts. It thinks through situations the way a strategist would, presents options with trade-offs, and gives the owner reasoning they can argue with.

## 2. The problem

Independent local business owners face strategic marketing decisions weekly — promotions, timing, positioning, response to competitors, allocation of limited budget — and have nowhere good to turn for help.

Their current options:

- A marketing agency, at $1,500+/month, more than most can afford.
- A consultant, at $150–$400/hour, used sporadically at best.
- Generic AI tools (ChatGPT and similar), which lack market context and don't know their business.
- Their own gut, often combined with copying what the competitor down the street is doing.

The gap is real and articulable. Owners want strategic guidance. They cannot afford a strategist on retainer. The tools that exist do not fill the gap.

## 3. Who this is for

**V1 target:** Independent local business owners — restaurants, cafes, salons, fitness studios, retail boutiques, and similar SMBs. Single-city pilot to start, geography chosen by the founder based on early traction. The decision to start in one city is deliberate — concentrated learning, owners who talk to each other, dense data per geography.

**Owner profile:**

- Owns 1–3 locations, makes their own marketing decisions.
- Active enough on social media to have something to compare against, not so polished they've already hired a team.
- Time-starved, marketing-curious, skeptical of generic AI tools.
- Comfortable spending $150–$300/month on a tool that demonstrably helps.

**Beyond V1:** Additional cities, deeper niche specialisation within verticals, and multi-city rollout. Out of scope for V1 planning.

## 4. Positioning

LocalPulse is a **marketing strategist that happens to be powered by AI**. The word order matters. Owners are not buying "AI for marketing" — they're buying strategic guidance, delivered by a system that is fast, always available, and cheaper than a human consultant on retainer.

**What LocalPulse is not:**

- Not a content generator. We don't write social posts.
- Not a dashboard. We don't show metrics and leave interpretation to the owner.
- Not a predictor. We don't forecast outcomes with numerical confidence.
- Not a verdict engine. We give recommendations with reasoning, not GO / DON'T DO IT calls.

## 5. Goals and success criteria

**V1 goals (first 6 months):**

- Ship the four flagship features described in section 7.
- Onboard 8–12 founding members across local business verticals in the pilot city.
- Reach a state where founding members log in unprompted at least weekly, act on at least one recommendation, and tell at least one peer about the product.
- Convert at least 30% of founding members to paid plans at the end of pilot.

**V1 anti-goals (explicitly not pursued):**

- Multi-city expansion.
- Multiple pricing tiers.
- Content generation.
- Numerical forecasting.
- White-label or agency products.

**Success measure for the product itself:** A founding member, after 6 weeks, says some version of "I'd be embarrassed to lose access to this." Anything weaker is signal that the product isn't earning the price it's positioned at.

## 6. Core principles

These guide every product decision when trade-offs arise.

**Strategist, not predictor.** Output is recommendations with reasoning, not verdicts or forecasts. False precision is a credibility killer; honest reasoning compounds trust.

**Quality over surface area.** Two flagship features that feel genuinely smart beat eight features that feel generic. AI quality is the USP.

**Honest about uncertainty.** When data is sparse or stale, the system says so. When a competitor scrape failed, the analysis names the gap. Confident output requires confident input.

**Owner has final say, always.** The system never locks the owner out of overriding a recommendation. Strategists advise; clients decide.

**Hyper-local, deeply.** Generic insights are commodity. The moat is local occasion awareness, local geography, local competitor behaviour — specific to the owner's city and market, not a generic feed.

## 7. Flagship features

Four features carry the entire V1 product. All four are AI-heavy, all four are strategist-shaped, all four share data infrastructure. Conceptually they cover the four directions an owner needs strategic help in: outward at the market (7.1), inward on a specific question (7.2), sideways at the competition (7.3), and inward on themselves (7.5).

### 7.1 Weekly Strategic Brief

A Monday-morning read on the owner's local market with one or two opinionated, evidence-backed recommendations for the week ahead.

**What it contains:**

- Short read on what's shifting in the local market this week — demand signals, occasions on the horizon, weather and event context, broader competitive patterns in the niche.
- One or two specific recommendations for the week with reasoning.
- What to watch for as the week unfolds.
- "From your competitor watch" section if there's anything notable from the named competitor set.

**Cadence:** Weekly, delivered Monday morning. Always on, no setup beyond onboarding.

**Why it matters:** The renewal driver. Owners pay monthly for something that shows up monthly with value. Weekly cadence creates the habit that makes the subscription feel essential.

### 7.2 Strategy Session

On-demand strategic analysis. The owner brings a question; the system thinks it through.

**Example questions:**

- "Should I run a 30% off lunch promo for two weeks?"
- "Is now the right time to launch a new service offering?"
- "Should I sponsor a local event this month?"
- "What should I do with my marketing during the summer festival season?"

**What the output contains:**

- Restatement of what the owner is really asking.
- Strategic context — what's happening in the market and the named competitor set that's relevant.
- Analysis across the relevant strategic frames.
- A clear recommendation with reasoning visible.
- Two to three ranked alternatives if the original idea has issues.
- What to watch for — signals that will tell the owner whether the move is working.

**Why it matters:** This is the feature that carries the USP. If this is excellent, the rest of the product can be modest and the business works. If this is mediocre, nothing else saves us.

### 7.3 Competitor Analyzer

The owner names up to 5 specific competitors. The system tracks them, analyses their behaviour, and delivers strategic reads on what they're doing and what it means.

**Two analytical layers:**

- **Per-competitor analysis:** positioning summary, strengths, vulnerabilities, recent shifts, strategic implication for the owner.
- **Cross-competitor trend analysis:** patterns across the named set — what 3+ competitors are doing in common, outliers, sentiment shifts, offer patterns.

**Cadence:** Bi-weekly competitor update. Trend analysis becomes meaningful from week 4 of pilot (after baseline data is built).

**Setup flow:** Competitor Discovery (see 7.4) runs during onboarding to suggest the initial set.

**Why it matters:** Owners are intensely interested in what their competitors are doing but have no good way to systematically watch them. This feature is what makes the strategic guidance feel grounded in their actual competitive reality.

### 7.4 Competitor Discovery (a sub-feature of 7.3)

A system-driven flow for proposing the owner's competitor set during onboarding. The default flow for every owner, not a fallback for confused ones.

**Five dimensions considered:** location, scale, geography, product type, position tier and brand voice signals.

**Output:** 8–12 ranked candidates with one-line reasoning per suggestion ("0.4 km away, similar price tier, same category"). The owner reviews, removes anything that doesn't fit, adds anyone the system missed, locks in their final 5.

**Re-runnable:** Anytime from settings, with the current 5 excluded to surface the next ranked candidates.

**Why it matters:** Most owners can name 1–2 obvious competitors but get fuzzy beyond that. Some name competitors who aren't actually competitive; some miss real threats. Discovery improves the competitor set quality for every owner.

### 7.5 Social Presence Audit

The owner connects their own social accounts. The system reads their social presence the way a strategist would read it — not as a dashboard of numbers but as a narrative of what they're putting out, how it's landing, and what to do differently. Refreshed weekly. Carries an action plan forward across audits.

**Why this is not a Meta dashboard:**

- Meta tells the owner *what* their numbers are. LocalPulse tells them *what's behind the numbers* and what to do.
- Meta surfaces top posts by engagement. LocalPulse explains *why* a post worked — timing, theme, tone, occasion alignment — so the owner can reproduce the conditions.
- Meta has no opinion. LocalPulse forms a view and recommends action with reasoning.
- Meta doesn't know the owner's business. LocalPulse does, plus knows the competitor set, the local market, the occasion calendar, and the owner's brand voice. Analysis is grounded in the owner's actual situation.

**What the audit contains:**

- **State of presence:** plain-language read on where the owner stands on each connected platform — cadence, content mix, recent direction.
- **What's working:** specific patterns in the owner's content over the past period that are driving outcomes, with reasoning. Not "your video did well" but *why* it did well.
- **What's not working:** content patterns, cadence issues, positioning misfires, sentiment shifts in their own reviews — each with a hypothesis for why.
- **Action plan:** 3–7 ranked, specific recommendations. Each item has: priority, why this matters, how to execute (concrete enough that an owner can do it without a marketer), what to watch for to know it's working.
- **Progress on prior plan:** which items from the last audit moved, which stalled, what the system observed change. Continuity is the point — audits build on each other.
- **From your market:** brief tie-in to occasion calendar and competitor positioning where it shapes the recommendations.

**Cadence:** Weekly, auto-generated. Manual re-run available, rate-limited. Continuous in the sense that each audit references the previous one and tracks action items across audits.

**Setup:** Requires at least one connected social account (Instagram, Facebook, or Google Business Profile). Onboarding offers the connections; the audit is unlocked once at least one is connected.

**Why it matters:** Owners spend hours staring at Meta dashboards trying to make sense of numbers and rarely walk away with a decision. The audit does that interpretive work for them and converts it into action. It also closes the loop with the rest of the product — the Brief tells them what's happening in the market, the Competitor Analyzer tells them what others are doing, the Strategy Session answers their specific questions. The Social Presence Audit tells them about themselves. Four sides covered, no blind spot.

## 8. User experience requirements

**Onboarding (9 minutes target):** Business basics, cost structure as ranges, capacity and operations, competitor set via Discovery, optional integrations (Instagram, Google Business). Save and resume supported.

**Weekly cadence:** Brief delivered Monday 7am local time, available in dashboard and email.

**Strategy Session:** Conversational input (text), follow-up questions in same session preserve context, target first response in under 45 seconds.

**Competitor Analyzer:** Bi-weekly updates available in dashboard, owner can edit competitor set anytime, edit triggers re-baselining for the changed competitor.

**Social Presence Audit:** Weekly audit available in dashboard with a dedicated top-level page, prominent in the main navigation. Action plan items are individually trackable — mark done, mark in progress, dismiss. Past audits accessible via history. Each audit references the prior plan and reports progress before introducing new items. A clear connect-accounts CTA appears when no accounts are connected; the rest of the product continues to work without it.

**Friday check-in:** Every Friday during pilot, system asks "How did this week go? Anything you want to talk through before Monday's brief?" Owner reply feeds into next brief.

**Mobile:** Web-responsive, works on phone. Native app deferred to V2.

**Tone of all output:** Strategist voice. Direct, opinionated where evidence supports it, honest about uncertainty where it doesn't. Never marketing-speak, never hedge-everything corporate writing, never AI-flavoured generic.

## 9. Pricing

**Founding member rate:** $149/month, locked for 12 months.

**Standard rate:** $299/month.

**Single tier in V1.** All four flagship features included. Five competitors tracked. Unlimited Strategy Sessions. Weekly Brief. Weekly Social Presence Audit with action-plan tracking.

**Tier complexity is a Month 4–6 problem,** not a Month 1 problem.

## 10. Out of scope for V1

Explicit scope discipline. The following are deferred and should not creep into V1:

**Deferred to V2 (months 3–5):**

- Auto-trigger when owner drafts promo content.
- Outcome tracking automation (manual capture during V1 pilot).
- Per-client confidence calibration.
- Cohort benchmarking (requires 50+ clients).
- TikTok, website, newsletter, Yelp scraping.
- Indirect competitor discovery (cross-category threats).
- Multiple pricing tiers.
- Native mobile apps.

**Deferred to V3 (months 6–12):**

- Causal inference for clean lift attribution.
- "Reverse decision" mode ("should I stop doing X?").
- Multi-decision interaction analysis.
- Owner-facing scenario sandbox.
- White-label / Agency tier.

**Permanently out of scope:**

- Content generation (writing posts for the owner).
- Image or video generation.
- Numerical revenue forecasting.
- POS or accounting system access.

## 11. Risks to product success

**AI quality risk.** If the strategist output is generic, the entire positioning collapses. Mitigation: disproportionate prompt-engineering investment in the synthesis layer; eval harness from week 6 of build.

**Data quality risk.** Scraped data is noisy, owner-provided cost ranges are imprecise. Mitigation: directional output (compress meaningfully, roughly fine) rather than point estimates; honest staleness labels.

**Pilot conversion risk.** Free-to-paid SMB conversion is the hardest pattern in software. Mitigation: founding-member framing rather than free trial; locked-in pricing; credit card on file at signup; phased rollout to give product room to demonstrate value.

**Scraping fragility.** Platform terms shift, scrapers break. Mitigation: established infrastructure (Apify) primary, graceful per-source degradation, multi-source diversification.

**The "just an LLM wrapper" critique.** Every AI startup faces it. Defence: the moat is data (city-specific occasion calendar, competitor scraping with change detection, outcome data over time), not the agent count.

**Founder energy risk.** Building, recruiting, supporting pilots, and pitching conversion is a lot for one person. Mitigation: 60% time on building after week 4, 40% on owner work; if owner work feels draining after first three pilots, that's important information.

## 12. Success metrics

Three metrics matter during the pilot. Everything else is noise.

- **Unprompted weekly logins.** Did they come back without us reminding them?
- **Action on at least one recommendation.** Did they do something the system suggested?
- **Word of mouth.** Did they tell another owner about it?

Survey scores and kind words are not signals. Owners are polite. The three above predict conversion.

**Quantitative targets at end of 6-week pilot:**

- 70%+ of pilots logging in at least weekly without prompts.
- 50%+ have acted on at least one recommendation traceably.
- 30%+ have referred at least one other owner.
- 30%+ convert to paid at end of pilot.

If all four targets are missed, the product or positioning needs reworking before further build investment.
