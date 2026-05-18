"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  ChevronRight,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Instagram,
  Facebook,
  Star,
  ArrowRight,
  Plus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditActionItem, PlatformState, WorkingItem, NotWorkingItem, PriorPlanProgress } from "@/lib/api";

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockAccounts = [
  { id: "1", platform: "instagram", handle: "@casaverde_yyc", last_scrape_status: "success", last_scraped_at: "2026-05-18T06:00:00Z" },
  { id: "2", platform: "facebook", handle: "Casa Verde Calgary", last_scrape_status: "success", last_scraped_at: "2026-05-18T06:00:00Z" },
  { id: "3", platform: "google_business", handle: "ChIJ...", last_scrape_status: "success", last_scraped_at: "2026-05-17T06:00:00Z" },
];

const mockPresence: PlatformState[] = [
  {
    platform: "instagram",
    assessment: "Active presence — 5 posts/week average over the past month. Content leans heavily on food photography with strong product shots.",
    cadence_observation: "Consistent Monday-Friday posting. Weekends are mostly quiet, which is unusual for a restaurant.",
    content_mix_observation: "80% food product shots, 15% Reels (behind-the-scenes), 5% events. Recent shift toward Reels is working.",
    recent_direction: "Last 3 Reels significantly outperformed static posts — this is a signal worth leaning into.",
  },
  {
    platform: "facebook",
    assessment: "Low activity — averaging 2 posts/week, mostly reposts from Instagram. Engagement is minimal.",
    cadence_observation: "No consistent schedule. Posts cluster around special events then go quiet for days.",
    content_mix_observation: "Almost entirely Instagram reposts. No Facebook-native content in the past 30 days.",
    recent_direction: "No meaningful change. Effectively a dormant channel despite 400+ followers.",
  },
  {
    platform: "google_business",
    assessment: "Profile is current but review response rate is low. 4.2 star average across 84 reviews.",
    cadence_observation: "No regular activity. Last update was 3 weeks ago.",
    content_mix_observation: "12 reviews in the last 30 days. Only 4 received a response.",
    recent_direction: "2 recent 2-star reviews about wait times are unanswered and publicly visible.",
  },
];

const mockWorking: WorkingItem[] = [
  {
    observation: "Friday behind-the-scenes Reels consistently outperform all other content formats",
    why_it_works: "Authenticity resonates with the local community audience. The Reels show craft and personality, which differentiates you from chain competitors. Friday timing aligns with people planning weekend dining — they see the prep and it builds anticipation.",
    theme: "timing",
  },
  {
    observation: "Local hashtag strategy on Instagram is well-targeted",
    why_it_works: "Using #yycfood and #calgaryfoodie alongside dish-specific tags (#tacoyyc, #casaverde) catches both discovery traffic and engaged local followers. This explains why your Instagram reach has been growing despite a modest following.",
    theme: "content_type",
  },
  {
    observation: "Mother's Day week posts performed significantly above average",
    why_it_works: "You posted 3 days in advance with reservation-focused copy — giving people time to act. The local occasion alignment and clear CTA (book now) were both present. This is the template for future event-tied content.",
    theme: "occasion",
  },
];

const mockNotWorking: NotWorkingItem[] = [
  {
    observation: "Facebook engagement is near-zero despite 400+ followers",
    hypothesis: "Instagram reposts don't translate to Facebook — the algorithm deprioritises cross-posted content and the audience expects different content (community, events, announcements) rather than food photography. Your Facebook followers are likely older and local, which is valuable but requires native content.",
    category: "content",
  },
  {
    observation: "70% of Google Reviews go unanswered, including 2 recent negative ones",
    hypothesis: "Unanswered reviews — especially negative ones — are publicly visible and signal to potential customers that feedback isn't valued. Google also appears to weight owner responsiveness in local search ranking. The 2 unanswered 2-star reviews are a specific reputational risk.",
    category: "reviews",
  },
  {
    observation: "No weekend posts despite weekends being peak dining days",
    hypothesis: "The content calendar appears to be a workweek habit — posts drop off Friday afternoon and don't resume until Monday. Weekend diners — exactly the audience you want — are browsing Saturday and Sunday, but your feed goes quiet. This is a missed reach window.",
    category: "cadence",
  },
];

const mockActionItems: AuditActionItem[] = [
  {
    id: "1",
    title: "Respond to all unanswered Google Reviews this week",
    priority: "high",
    category: "reviews",
    why: "You have 12 unanswered reviews from the past 30 days, including 2 recent 2-star reviews that are publicly visible. Unanswered negative reviews are a direct reputational risk and may affect your local search ranking.",
    how: "Open Google Business → Reviews → filter 'Unanswered'. For positive reviews: 1–2 sentence thank-you mentioning a specific detail from their review. For negative reviews: acknowledge the issue, apologize briefly, offer to resolve offline ('please reach us at [email]'). Don't argue or over-explain.",
    watch_for: "Your response rate in Google Business dashboard. Aim for 100% of reviews from this week forward. Also watch for follow-up from the 2-star reviewers.",
    effort_band: "under_15_min",
    status: "pending",
    display_order: 0,
  },
  {
    id: "2",
    title: "Post one native Facebook update per week (not a repost)",
    priority: "high",
    category: "content",
    why: "Your Facebook page has 400+ followers but near-zero engagement because Instagram reposts don't work there. One native Facebook post per week will outperform all your current Facebook reposts combined.",
    how: "Use Facebook for local context that your followers care about: this week's specials in prose form (not a photo), shout-outs to local events near you, or quick community news. 3–5 sentences + one photo taken on your phone. Post Tuesday or Wednesday — avoid weekends when organic reach drops.",
    watch_for: "Likes and comments on native posts vs reposts. Expect native posts to get 3–5x more engagement within 2 weeks.",
    effort_band: "15_to_60_min",
    status: "in_progress",
    display_order: 1,
  },
  {
    id: "3",
    title: "Add one Saturday or Sunday post to your weekly schedule",
    priority: "high",
    category: "cadence",
    why: "Your Instagram goes quiet on weekends — exactly when your potential diners are browsing for where to eat. Even one weekend post would give you presence during peak discovery time.",
    how: "Pick Saturday morning (9–10am) as your consistent weekend slot. Content can be simple: a photo of the day's specials with 2-3 sentences. Prepare it Friday afternoon so you don't have to think about it on the weekend.",
    watch_for: "Reach and saves on weekend posts vs weekday posts. Track for 4 weeks before drawing conclusions.",
    effort_band: "under_15_min",
    status: "pending",
    display_order: 2,
  },
  {
    id: "4",
    title: "Create a Reels template you can repeat weekly",
    priority: "medium",
    category: "content",
    why: "Your behind-the-scenes Reels are your top-performing content format but you produce them inconsistently. A simple repeatable template removes the creative friction — you just need to record, not reinvent.",
    how: "Use your Friday kitchen prep as the subject. Keep it 15–30 seconds: 3–4 clips of prep work + one clip of the finished dish. Use the same song or audio for brand consistency. Add your location tag and 3–4 hashtags. This can be filmed and posted in 20 minutes once you have the template.",
    watch_for: "Reel views vs static post reach over 4 weeks. Also watch for saves — saved Reels compound reach over time.",
    effort_band: "15_to_60_min",
    status: "pending",
    display_order: 3,
  },
  {
    id: "5",
    title: "Update your Google Business hours for summer",
    priority: "medium",
    category: "profile",
    why: "Your Google Business hours still show winter hours. With summer patio season starting, incorrect hours lead to customers arriving when you're closed — a frustrating experience that often converts to a negative review.",
    how: "Go to Google Business → Info → Hours. Update weekday and weekend hours to reflect your summer schedule. Also update the 'Special hours' section for any holiday weekends.",
    watch_for: "Fewer 'arrived when closed' mentions in future reviews.",
    effort_band: "under_15_min",
    status: "done",
    display_order: 4,
  },
];

const mockPriorProgress: PriorPlanProgress[] = [
  {
    title: "Update Google Business hours for summer",
    status: "done",
    signal_observed: "Google Business profile now shows updated hours. Change was detected in the most recent scrape.",
  },
  {
    title: "Post at least 3x per week on Instagram",
    status: "done",
    signal_observed: "5 posts this week, up from 3 the prior week. Cadence target met and exceeded.",
  },
  {
    title: "Start responding to Google Reviews",
    status: "in_progress",
    signal_observed: "Response rate improved from 15% to 30% — moving in the right direction but still 70% of reviews unanswered.",
  },
];

const mockAudit = {
  id: "audit-1",
  week_start: "2026-05-12",
  week_end: "2026-05-18",
  status: "completed",
  generated_at: "2026-05-18T07:00:00Z",
  state_of_presence: mockPresence,
  what_working: mockWorking,
  what_not_working: mockNotWorking,
  prior_plan_progress: mockPriorProgress,
  market_connection: "Mother's Day weekend passed strong — carry that occasion-tied content approach into June (Grad season starts May 24, Father's Day June 21). Your competitors are not doing occasion-specific content well; this is a gap you can own.",
  data_freshness: { instagram: "2026-05-18T06:00:00Z", facebook: "2026-05-18T06:00:00Z", google_business: "2026-05-17T06:00:00Z" },
  action_items: mockActionItems,
};

const mockHistoryItems = [
  { id: "audit-1", week_start: "2026-05-12", week_end: "2026-05-18", status: "completed", generated_at: "2026-05-18T07:00:00Z", action_item_count: 5, has_prior_plan_progress: true },
  { id: "audit-0", week_start: "2026-05-05", week_end: "2026-05-11", status: "completed", generated_at: "2026-05-11T07:00:00Z", action_item_count: 4, has_prior_plan_progress: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLATFORM_META: Record<string, { label: string; color: string; bg: string }> = {
  instagram: { label: "Instagram", color: "text-pink-600", bg: "bg-pink-50" },
  facebook: { label: "Facebook", color: "text-blue-600", bg: "bg-blue-50" },
  google_business: { label: "Google Business", color: "text-green-600", bg: "bg-green-50" },
};

const PRIORITY_META = {
  high: { label: "HIGH", color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500" },
  medium: { label: "MEDIUM", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  low: { label: "LOW", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" },
};

const STATUS_META = {
  pending: { label: "To do", icon: Circle, color: "text-gray-500" },
  in_progress: { label: "In progress", icon: Clock, color: "text-blue-600" },
  done: { label: "Done", icon: CheckCircle2, color: "text-green-600" },
  dismissed: { label: "Dismissed", icon: XCircle, color: "text-gray-400" },
};

const EFFORT_LABELS: Record<string, string> = {
  under_15_min: "< 15 min",
  "15_to_60_min": "15–60 min",
  over_1_hour: "1+ hour",
};

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  cadence: "Cadence",
  engagement: "Engagement",
  positioning: "Positioning",
  reviews: "Reviews",
  profile: "Profile",
  other: "Other",
};

type Tab = "audit" | "plan" | "history";
type ItemStatus = "pending" | "in_progress" | "done" | "dismissed";

// ── Sub-components ────────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  const meta = PLATFORM_META[platform] ?? { label: platform, color: "text-gray-600", bg: "bg-gray-100" };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", meta.bg, meta.color)}>
      {platform === "instagram" && <Instagram className="h-3 w-3" />}
      {platform === "facebook" && <Facebook className="h-3 w-3" />}
      {platform === "google_business" && <Star className="h-3 w-3" />}
      {meta.label}
    </span>
  );
}

function PriorProgressSection({ items }: { items: PriorPlanProgress[] }) {
  if (!items.length) return null;
  const STATUS_STYLES: Record<string, string> = {
    done: "text-green-600 bg-green-50",
    in_progress: "text-blue-600 bg-blue-50",
    stalled: "text-amber-600 bg-amber-50",
    dismissed: "text-gray-400 bg-gray-50",
    no_longer_relevant: "text-gray-400 bg-gray-50",
  };
  return (
    <div className="card p-5">
      <h3 className="section-title mb-4 flex items-center gap-2">
        <RefreshCw className="h-4 w-4 text-brand-600" />
        Progress on last week&rsquo;s plan
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
            <span className={cn("mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase whitespace-nowrap", STATUS_STYLES[item.status] ?? "text-gray-500 bg-gray-100")}>
              {item.status.replace(/_/g, " ")}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="muted mt-0.5">{item.signal_observed}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionItemCard({
  item,
  onStatusChange,
}: {
  item: AuditActionItem;
  onStatusChange: (id: string, status: ItemStatus) => void;
}) {
  const priority = PRIORITY_META[item.priority] ?? PRIORITY_META.low;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn(
      "card p-5 border-l-4 transition-all",
      item.priority === "high" ? "border-l-red-400" : item.priority === "medium" ? "border-l-amber-400" : "border-l-gray-300",
      item.status === "done" ? "opacity-60" : "",
      item.status === "dismissed" ? "opacity-40" : "",
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", priority.bg, priority.color)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
              {priority.label}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 uppercase">
              {CATEGORY_LABELS[item.category] ?? item.category}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
              {EFFORT_LABELS[item.effort_band] ?? item.effort_band}
            </span>
          </div>
          <p className={cn("text-sm font-semibold text-gray-900", item.status === "done" && "line-through text-gray-400")}>
            {item.title}
          </p>
          <p className="muted mt-1">{item.why}</p>

          {expanded && (
            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">How to do it</p>
                <p className="text-sm text-gray-700 leading-relaxed">{item.how}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Watch for</p>
                <p className="text-sm text-gray-600">{item.watch_for}</p>
              </div>
              <a href="/session" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
                <ArrowRight className="h-3 w-3" />
                Discuss in Strategy Session
              </a>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Status selector */}
          <div className="flex items-center gap-1">
            {(["pending", "in_progress", "done"] as ItemStatus[]).map((s) => {
              const meta = STATUS_META[s];
              const Icon = meta.icon;
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(item.id, s)}
                  title={meta.label}
                  className={cn(
                    "rounded-lg p-1.5 transition-all",
                    item.status === s ? "bg-brand-100 text-brand-700" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
            <button
              onClick={() => onStatusChange(item.id, "dismissed")}
              title="Dismiss"
              className={cn(
                "rounded-lg p-1.5 transition-all",
                item.status === "dismissed" ? "bg-gray-100 text-gray-500" : "text-gray-200 hover:text-gray-400 hover:bg-gray-50"
              )}
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
          >
            {expanded ? "Less" : "How to"}
            <ChevronRight className={cn("h-3 w-3 transition-transform", expanded && "rotate-90")} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function NoAccountsState() {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <Activity className="h-7 w-7 text-brand-600" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Connect a social account to unlock your audit</h2>
      <p className="muted max-w-md mx-auto mb-6">
        The Social Presence Audit analyses your own Instagram, Facebook, and Google Business presence — not just numbers, but what&rsquo;s working, what isn&rsquo;t, and a prioritised plan to improve it.
      </p>
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {["Instagram", "Facebook", "Google Business"].map((p) => (
          <button key={p} className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus className="h-4 w-4" />
            Connect {p}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400">You can also connect accounts from Settings → Integrations</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState<Tab>("audit");
  const [generating, setGenerating] = useState(false);
  const [items, setItems] = useState<AuditActionItem[]>(mockActionItems);
  const hasAccounts = true; // set to false to preview empty state

  const handleStatusChange = (id: string, status: ItemStatus) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2500);
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const highCount = items.filter((i) => i.priority === "high" && i.status !== "done" && i.status !== "dismissed").length;

  if (!hasAccounts) return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Social Presence Audit</h1>
      <NoAccountsState />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Social Presence Audit</h1>
          <p className="muted mt-0.5">Week of May 12 – 18, 2026 · Generated Monday 7:00 AM</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {generating ? "Generating…" : "Re-generate"}
        </button>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "High priority", value: highCount, color: "text-red-600", sub: "need attention" },
          { label: "To do", value: pendingCount, color: "text-amber-600", sub: "action items" },
          { label: "Completed", value: doneCount, color: "text-green-600", sub: "from this audit" },
        ].map((m) => (
          <div key={m.label} className="card p-4 text-center">
            <div className={cn("text-2xl font-extrabold", m.color)}>{m.value}</div>
            <div className="mt-0.5 text-sm font-semibold text-gray-900">{m.label}</div>
            <div className="text-xs text-gray-400">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {([
          { id: "audit", label: "Audit Report" },
          { id: "plan", label: `Action Plan`, badge: pendingCount > 0 ? pendingCount : undefined },
          { id: "history", label: "History" },
        ] as { id: Tab; label: string; badge?: number }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Audit Report tab ────────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" as const }}
          className="space-y-5"
        >
          {/* Accounts strip */}
          <div className="flex flex-wrap gap-2">
            {mockAccounts.map((a) => (
              <div key={a.id} className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <PlatformBadge platform={a.platform} />
              </div>
            ))}
          </div>

          {/* Prior plan progress */}
          <PriorProgressSection items={mockAudit.prior_plan_progress} />

          {/* State of presence */}
          <div className="card p-5">
            <h3 className="section-title mb-4">State of presence</h3>
            <div className="space-y-4">
              {mockAudit.state_of_presence.map((p) => (
                <div key={p.platform} className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PlatformBadge platform={p.platform} />
                  </div>
                  <p className="text-sm text-gray-800 mb-2">{p.assessment}</p>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    <p className="text-xs text-gray-500"><span className="font-medium text-gray-700">Cadence: </span>{p.cadence_observation}</p>
                    <p className="text-xs text-gray-500"><span className="font-medium text-gray-700">Content mix: </span>{p.content_mix_observation}</p>
                  </div>
                  <p className="mt-2 text-xs font-medium text-brand-700 bg-brand-50 rounded-lg px-3 py-1.5">{p.recent_direction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* What's working */}
          <div className="card p-5">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              What&rsquo;s working
            </h3>
            <div className="space-y-3">
              {mockAudit.what_working.map((w, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{w.observation}</p>
                    <p className="muted mt-1 leading-relaxed">{w.why_it_works}</p>
                    <span className="mt-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 uppercase">
                      {w.theme.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What's not working */}
          <div className="card p-5">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              What&rsquo;s not working
            </h3>
            <div className="space-y-3">
              {mockAudit.what_not_working.map((n, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{n.observation}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 mt-2 mb-1">Why this is likely happening</p>
                    <p className="muted leading-relaxed">{n.hypothesis}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market connection */}
          {mockAudit.market_connection && (
            <div className="flex gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-brand-900 mb-1">From your market</p>
                <p className="text-sm text-brand-800 leading-relaxed">{mockAudit.market_connection}</p>
              </div>
            </div>
          )}

          {/* Data freshness */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(mockAudit.data_freshness ?? {}).map(([src, ts]) => (
              <span key={src} className="text-xs text-gray-400">
                {PLATFORM_META[src]?.label ?? src}: data through {new Date(ts).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Action Plan tab ─────────────────────────────────────────────────── */}
      {activeTab === "plan" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" as const }}
          className="space-y-3"
        >
          <p className="muted">
            {pendingCount} items to do · {doneCount} done · mark items as you work through them
          </p>
          {items.filter((i) => i.status !== "dismissed").map((item) => (
            <ActionItemCard key={item.id} item={item} onStatusChange={handleStatusChange} />
          ))}
          {items.some((i) => i.status === "dismissed") && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                Show dismissed items ({items.filter((i) => i.status === "dismissed").length})
              </summary>
              <div className="mt-2 space-y-2">
                {items.filter((i) => i.status === "dismissed").map((item) => (
                  <ActionItemCard key={item.id} item={item} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </details>
          )}
        </motion.div>
      )}

      {/* ── History tab ─────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" as const }}
          className="space-y-3"
        >
          {mockHistoryItems.map((audit) => (
            <button
              key={audit.id}
              onClick={() => setActiveTab("audit")}
              className="card-hover w-full p-5 flex items-center gap-4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <Activity className="h-5 w-5 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  Week of {new Date(audit.week_start).toLocaleDateString("en-CA", { month: "long", day: "numeric" })} – {new Date(audit.week_end).toLocaleDateString("en-CA", { day: "numeric", year: "numeric" })}
                </p>
                <p className="muted mt-0.5">
                  {audit.action_item_count} action items
                  {audit.has_prior_plan_progress && " · includes plan progress"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  audit.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {audit.status}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
