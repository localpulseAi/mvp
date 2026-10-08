/**
 * Demo workspace — a coherent, entirely FICTIONAL business used when the
 * public prototype has no connected workspace (see `workspace.ts`).
 *
 * Rules:
 * - Every name here is invented. Do not swap in real businesses.
 * - Nothing here is a customer result, live market observation, or a
 *   generated Claude output. UI must keep the "Demo workspace" label visible.
 * - Shapes match the real API types so pages render one code path.
 */
import type {
  AnalysisItem,
  AuditActionItem,
  ChangeItem,
  CompetitorOut,
  OccasionItem,
  OwnerProfile,
  PatternItem,
  SessionDetail,
  SessionSummary,
  SocialAuditAccount,
  SocialAuditDetail,
  WeeklyBriefOut,
} from "@/lib/api";

const DAY = 86_400_000;
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * DAY).toISOString();
/** Local calendar date (YYYY-MM-DD) — avoids UTC shifting the day. */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dateOnly = (offsetDays: number) => ymd(new Date(Date.now() + offsetDays * DAY));

function weekBounds() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: ymd(monday), end: ymd(sunday) };
}
const week = weekBounds();

export const DEMO_LABEL = "Demo workspace · fictional business and sample data";

/* ── Owner ──────────────────────────────────────────────────────────────── */

export const demoOwner: OwnerProfile = {
  id: "demo-owner",
  email: "owner@example.com",
  onboarding_completed: true,
  onboarding_step: 5,
  business_name: "Juniper Lane Café",
  address: "Juniper Lane, Riverside (fictional)",
  niche: "cafe",
  instagram_handle: "juniperlanecafe",
  facebook_page: "juniperlanecafe",
  business_description:
    "A 30-seat neighbourhood café serving espresso, house-baked pastries, and a short brunch menu. Busy on weekends, quieter Tuesday to Thursday mornings.",
  brand_voice: "Warm, unfussy, a little playful",
  quarter_goal: "Grow midweek morning visits without discounting the whole menu",
  gross_margin_band: "60-70%",
  fixed_cost_band: "$8k-$15k/month",
  price_range: "$$",
  capacity: "Room for more covers Tue–Thu before 11am",
  staff_size: "4-6",
  peak_hours: "Sat–Sun 9am–1pm",
  subscription_active: false,
  is_founding_member: false,
};

/* ── Weekly brief ───────────────────────────────────────────────────────── */

export const demoBrief: WeeklyBriefOut = {
  id: "demo-brief-current",
  week_start: week.start,
  week_end: week.end,
  status: "completed",
  market_read:
    "Weekends are already full, but Tuesday to Thursday mornings have spare seats. A neighbourhood festival is 12 days away and will bring passing visitors along Juniper Lane. One nearby café has started a weekday price promotion, so a value-led offer is more distinctive than another discount.",
  recommendations: [
    {
      title: "Give Tuesday its own reason to visit",
      body: "Launch a coffee + pastry bundle available before 11am, Tuesday to Thursday only. Mention it to regulars at the counter and in one Instagram story.",
      reasoning:
        "A time-limited bundle concentrates the incentive where you have spare capacity, instead of discounting weekends that already sell out.",
      watch_for: ["Bundle orders per morning", "Gross profit per order", "Repeat midweek visits"],
    },
    {
      title: "Get festival-ready before the foot traffic arrives",
      body: "Pick one grab-and-go item to feature on festival weekend, put it in the window, and plan stock and staffing for the extra walk-ins you can actually serve.",
      reasoning: "An event creates attention, not guaranteed sales. A single clear offer is easy to test and easy to staff.",
      watch_for: ["Featured item sales", "Stock-outs before 2pm"],
    },
    {
      title: "Don't match the price cut yet",
      body: "Corner Grind's weekday promo is public, but its audience and terms are unclear. Hold your prices this week and see whether your midweek bundle changes the picture.",
      reasoning: "A competitor's discount doesn't tell you it's working, or that it's aimed at your customers.",
      watch_for: ["Midweek transactions vs. last month"],
    },
  ],
  watch_for: ["Bundle orders per morning", "Gross profit per order", "Festival weekend stock-outs"],
  competitor_section: {
    entries: [
      {
        name: "Corner Grind Coffee",
        observation: "Posted a weekday 15% off promotion on Instagram and in its window.",
        implication: "Price is now crowded midweek. Lead with convenience and quality, not a matching discount.",
      },
      {
        name: "Sunday Loaf Bakery",
        observation: "Added a seasonal pastry range and started replying to most Google reviews.",
        implication: "Your pastry case is a strength. Make it visible in the bundle and in your posts.",
      },
    ],
  },
  data_freshness: {
    "Local occasions": iso(-1),
    "Competitor social posts": iso(-2),
    "Google reviews": iso(-3),
  },
  generated_at: iso(-1),
};

export const demoBriefHistory = [
  { id: "demo-brief-current", week_start: week.start, week_end: week.end, status: "completed" },
  { id: "demo-brief-prev-1", week_start: dateOnly(-7), week_end: dateOnly(-1), status: "completed" },
  { id: "demo-brief-prev-2", week_start: dateOnly(-14), week_end: dateOnly(-8), status: "completed" },
];

/* ── Strategy sessions ──────────────────────────────────────────────────── */

export const demoSessionDetail: SessionDetail = {
  id: "demo-session-1",
  status: "completed",
  original_question: "Should I run 20% off everything to get more people in midweek?",
  parsed_type: "promotion",
  turn_count: 1,
  total_cost_cents: 0,
  created_at: iso(-2),
  implicit_goal: "Increase midweek visits while protecting margin",
  turns: [
    {
      turn_number: 1,
      question: "Should I run 20% off everything to get more people in midweek?",
      is_followup: false,
      cost_cents: 0,
      latency_ms: 0,
      strategist_output: {
        restated_question: "Is a 20% store-wide discount the best way to grow Tuesday–Thursday visits?",
        recommendation:
          "Test a focused coffee + pastry bundle before 11am on Tuesday to Thursday instead of 20% off everything.",
        reasoning:
          "At a $20 average order and roughly $12 variable cost, 20% off halves gross profit per order, so you'd need about twice the orders just to stand still. A time-limited bundle targets the hours where you have spare seats and leaves weekend prices alone.",
        alternatives: [
          {
            option: "Loyalty stamp for midweek visits",
            rationale: "Rewards the regulars most likely to shift a visit to a quieter day.",
            tradeoffs: "Slower to show results; needs a simple way to track stamps.",
          },
          {
            option: "Midweek-only menu item",
            rationale: "Creates a reason to visit without lowering prices.",
            tradeoffs: "Adds prep and stock complexity for a small team.",
          },
        ],
        watch_for: ["Bundle orders per morning", "Gross profit per order", "Weekend sales unchanged"],
        key_assumptions: [
          "Average order around $20 with ~$12 variable cost (illustrative).",
          "Spare seating capacity Tuesday–Thursday before 11am.",
        ],
      },
    },
  ],
};

export const demoSessions: SessionSummary[] = [
  {
    id: demoSessionDetail.id,
    status: "completed",
    original_question: demoSessionDetail.original_question,
    parsed_type: "promotion",
    turn_count: 1,
    total_cost_cents: 0,
    created_at: demoSessionDetail.created_at,
  },
  {
    id: "demo-session-2",
    status: "completed",
    original_question: "What should I do for the neighbourhood festival?",
    parsed_type: "timing",
    turn_count: 2,
    total_cost_cents: 0,
    created_at: iso(-6),
  },
];

/** Canned reply used when someone asks a new question in demo mode. */
export const demoSampleReply = demoSessionDetail.turns[0].strategist_output!;

/* ── Market calendar ────────────────────────────────────────────────────── */

export const demoOccasions: OccasionItem[] = [
  { id: "occ-1", name: "Riverside neighbourhood festival", date: dateOnly(12), days_out: 12, category: "community", niche_tags: ["cafe", "retail"] },
  { id: "occ-2", name: "Back-to-school week", date: dateOnly(26), days_out: 26, category: "seasonal", niche_tags: ["cafe"] },
  { id: "occ-3", name: "Long weekend", date: dateOnly(40), days_out: 40, category: "holiday", niche_tags: ["cafe", "restaurant"] },
  { id: "occ-4", name: "First frost: warm drinks season", date: dateOnly(55), days_out: 55, category: "seasonal", niche_tags: ["cafe"] },
];

/* ── Competitors ────────────────────────────────────────────────────────── */

export const demoCompetitors: CompetitorOut[] = [
  { id: "comp-1", name: "Corner Grind Coffee", address: "2 blocks east (fictional)", google_place_id: null, instagram_handle: "cornergrind", facebook_page: null, google_business_url: null, is_active: true, baseline_complete: true, added_at: iso(-40) },
  { id: "comp-2", name: "Sunday Loaf Bakery", address: "Juniper Lane (fictional)", google_place_id: null, instagram_handle: "sundayloaf", facebook_page: "sundayloaf", google_business_url: null, is_active: true, baseline_complete: true, added_at: iso(-40) },
  { id: "comp-3", name: "Maple & Rye Kitchen", address: "Riverside Market (fictional)", google_place_id: null, instagram_handle: "mapleandrye", facebook_page: null, google_business_url: null, is_active: true, baseline_complete: true, added_at: iso(-32) },
];

export const demoAnalyses: AnalysisItem[] = [
  {
    id: "an-1",
    competitor_id: "comp-1",
    generated_at: iso(-2),
    positioning_summary: "Fast, value-led coffee for commuters. Public messaging is mostly about price and speed.",
    strengths: ["Clear, repeated weekday offer", "Convenient corner location for commuters"],
    vulnerabilities: ["Little to say beyond price", "Few food options in public posts"],
    recent_shifts: "Started a weekday 15% off promotion this week.",
    strategic_implication: "Avoid a price war. Lead with your pastry case and a calmer place to sit.",
    data_freshness: { "Instagram posts": iso(-2), "Google reviews": iso(-4) },
  },
  {
    id: "an-2",
    competitor_id: "comp-2",
    generated_at: iso(-2),
    positioning_summary: "Craft bakery with a loyal weekend crowd and strong product photography.",
    strengths: ["Distinctive seasonal range", "Now replying to most reviews"],
    vulnerabilities: ["Limited seating", "Closes early on weekdays"],
    recent_shifts: "Launched a seasonal pastry range.",
    strategic_implication: "Midweek mornings after they close early are an opening for a sit-down bundle.",
    data_freshness: { "Instagram posts": iso(-1), "Google reviews": iso(-3) },
  },
  {
    id: "an-3",
    competitor_id: "comp-3",
    generated_at: iso(-3),
    positioning_summary: "Brunch-first kitchen pitching weekend groups.",
    strengths: ["Strong weekend brunch reputation"],
    vulnerabilities: ["Quiet public activity midweek"],
    recent_shifts: "No notable public change this fortnight.",
    strategic_implication: "Weekends are contested; midweek is where you can stand out.",
    data_freshness: { "Instagram posts": iso(-5) },
  },
];

export const demoChanges: ChangeItem[] = [
  { competitor_id: "comp-1", competitor_name: "Corner Grind Coffee", change_type: "promotion", description: "Started a weekday 15% off promotion.", severity: "high", detected_at: iso(-2), source: "Instagram" },
  { competitor_id: "comp-2", competitor_name: "Sunday Loaf Bakery", change_type: "product", description: "Added a seasonal pastry range.", severity: "medium", detected_at: iso(-3), source: "Instagram" },
  { competitor_id: "comp-2", competitor_name: "Sunday Loaf Bakery", change_type: "reviews", description: "Began replying to most new Google reviews.", severity: "low", detected_at: iso(-5), source: "Google reviews" },
];

export const demoPatterns: PatternItem[] = [
  {
    pattern_type: "price_pressure",
    description: "Two nearby businesses are leading with weekday price messages.",
    severity: "medium",
    competitors_involved: ["Corner Grind Coffee", "Maple & Rye Kitchen"],
    strategic_implication: "Midweek price messaging is crowded. A value-led bundle will stand out more than a matching discount.",
    detected_at: iso(-2),
  },
  {
    pattern_type: "seasonal_menu",
    description: "Seasonal product launches are appearing ahead of the festival.",
    severity: "low",
    competitors_involved: ["Sunday Loaf Bakery"],
    strategic_implication: "Plan your featured festival item now so it doesn't look like a late copy.",
    detected_at: iso(-3),
  },
];

/* ── Social presence audit ──────────────────────────────────────────────── */

export const demoSocialAccounts: SocialAuditAccount[] = [
  { id: "acc-1", platform: "instagram", handle: "juniperlanecafe", display_name: "Juniper Lane Café", is_active: true, connected_at: iso(-30), last_scraped_at: iso(-1), last_scrape_status: "success" },
  { id: "acc-2", platform: "google_business", handle: "Juniper Lane Café", display_name: "Juniper Lane Café", is_active: true, connected_at: iso(-30), last_scraped_at: iso(-1), last_scrape_status: "success" },
];

const demoActionItems: AuditActionItem[] = [
  {
    id: "item-1",
    title: "Make booking and ordering obvious",
    priority: "high",
    category: "profile",
    why: "Your bio doesn't say where you are or how to order ahead, so interested visitors have no clear next step.",
    how: "Add your street, opening hours, and one link for ordering ahead. Check the link on a phone.",
    watch_for: "Link taps from your profile",
    effort_band: "15 minutes",
    status: "in_progress",
    display_order: 1,
  },
  {
    id: "item-2",
    title: "Post the midweek bundle before 9am",
    priority: "medium",
    category: "timing",
    why: "Your morning posts land after the commute, when people have already chosen where to stop.",
    how: "Schedule one bundle post for 7:30am on Tuesday and Wednesday.",
    watch_for: "Bundle orders on posting days",
    effort_band: "30 minutes / week",
    status: "pending",
    display_order: 2,
  },
  {
    id: "item-3",
    title: "Reply to recent Google reviews",
    priority: "low",
    category: "reviews",
    why: "A short, specific reply shows new visitors the café is cared for.",
    how: "Reply to the last ten reviews, thanking people by what they ordered.",
    watch_for: "New review count and rating trend",
    effort_band: "20 minutes",
    status: "done",
    display_order: 3,
  },
];

export const demoAudit: SocialAuditDetail = {
  id: "demo-audit-1",
  week_start: week.start,
  week_end: week.end,
  status: "completed",
  state_of_presence: [
    {
      platform: "instagram",
      assessment: "Warm, consistent photography; posts rarely tell people what to do next.",
      cadence_observation: "About three posts a week, mostly weekends.",
      content_mix_observation: "Mostly pastry close-ups; few behind-the-scenes or people shots.",
      recent_direction: "Engagement is steady on behind-the-scenes posts.",
    },
    {
      platform: "google_business",
      assessment: "Strong rating, but hours and menu photos are out of date.",
      cadence_observation: "No updates posted in the last month.",
      content_mix_observation: "Customer photos outnumber your own.",
      recent_direction: "New reviews mention the pastries and the quiet midweek atmosphere.",
    },
  ],
  what_working: [
    { observation: "Behind-the-scenes baking posts get the most comments.", why_it_works: "They show the craft and the people behind it.", theme: "Authenticity" },
    { observation: "Reviews frequently praise the calm midweek atmosphere.", why_it_works: "It's a genuine differentiator from the busy weekend spots.", theme: "Atmosphere" },
  ],
  what_not_working: [
    { observation: "Posts rarely include a call to action.", hypothesis: "Interested followers don't know they can order ahead.", category: "Conversion" },
    { observation: "Midweek is almost absent from your feed.", hypothesis: "Followers think of you as a weekend place.", category: "Timing" },
  ],
  prior_plan_progress: [
    { title: "Reply to recent Google reviews", status: "done", signal_observed: "Two new reviews mention the replies." },
  ],
  market_connection:
    "With Corner Grind leading on price, your audit points the same way as this week's brief: show the midweek calm and the pastry case, and make ordering ahead easy.",
  data_freshness: { Instagram: iso(-1), "Google Business": iso(-1) },
  action_items: demoActionItems,
  generated_at: iso(-1),
};

export const demoAuditHistory = [
  { id: demoAudit.id, week_start: week.start, week_end: week.end, status: "completed", generated_at: iso(-1), action_item_count: 3, has_prior_plan_progress: true },
];
