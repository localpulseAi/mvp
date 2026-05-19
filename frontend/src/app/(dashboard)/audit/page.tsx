"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import {
  getSocialAccounts,
  getCurrentAudit,
  listAudits,
  triggerAuditGenerate,
  updateActionItemStatus,
  connectSocialAccount,
} from "@/lib/api";
import type {
  SocialAuditAccount,
  AuditActionItem,
  SocialAuditDetail,
  AuditSummary,
} from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

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

function PriorProgressSection({ items }: { items: { title: string; status: string; signal_observed: string }[] }) {
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

// ── Connect account modal (inline) ────────────────────────────────────────────

function ConnectAccountRow({
  platform,
  onConnected,
}: {
  platform: string;
  onConnected: (account: SocialAuditAccount) => void;
}) {
  const meta = PLATFORM_META[platform];
  const [handle, setHandle] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleConnect = async () => {
    if (!handle.trim()) return;
    setConnecting(true);
    try {
      const res = await connectSocialAccount(platform, handle.trim());
      onConnected(res.account);
      setHandle("");
      setOpen(false);
    } catch {
      // surface error inline would be ideal; for now just reset
    } finally {
      setConnecting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
      >
        <Plus className="h-4 w-4" />
        Connect {meta?.label ?? platform}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        className="input px-3 py-1.5 text-sm w-48"
        placeholder={platform === "google_business" ? "Place ID or @handle" : "@handle"}
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleConnect()}
        autoFocus
      />
      <button
        onClick={handleConnect}
        disabled={connecting || !handle.trim()}
        className="btn-primary px-3 py-1.5 text-sm"
      >
        {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
      </button>
      <button onClick={() => setOpen(false)} className="text-sm text-gray-400 hover:text-gray-600">
        Cancel
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function NoAccountsState({ onConnected }: { onConnected: (a: SocialAuditAccount) => void }) {
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
        {["instagram", "facebook", "google_business"].map((p) => (
          <ConnectAccountRow key={p} platform={p} onConnected={onConnected} />
        ))}
      </div>
      <p className="text-xs text-gray-400">You can also connect accounts from Settings → Integrations</p>
    </div>
  );
}

function NoAuditState({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <div className="card p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <RefreshCw className="h-7 w-7 text-brand-600" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">No audit for this week yet</h2>
      <p className="muted max-w-sm mx-auto mb-6">
        Generate your first Social Presence Audit. The AI will analyse your connected accounts and build your action plan.
      </p>
      <button
        onClick={onGenerate}
        disabled={generating}
        className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
      >
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
        {generating ? "Generating…" : "Generate audit"}
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState<Tab>("audit");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [accounts, setAccounts] = useState<SocialAuditAccount[]>([]);
  const [audit, setAudit] = useState<SocialAuditDetail | null>(null);
  const [items, setItems] = useState<AuditActionItem[]>([]);
  const [history, setHistory] = useState<AuditSummary[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadAudit = useCallback(async () => {
    try {
      const res = await getCurrentAudit();
      if (res.audit) {
        setAudit(res.audit);
        setItems(res.audit.action_items);
        if (res.audit.status === "completed" || res.audit.status === "failed") {
          setGenerating(false);
          stopPolling();
        }
      } else {
        setAudit(null);
      }
    } catch {
      setGenerating(false);
      stopPolling();
    }
  }, [stopPolling]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const [accsRes] = await Promise.all([getSocialAccounts()]);
        setAccounts(accsRes.accounts);
        if (accsRes.accounts.length > 0) {
          await loadAudit();
        }
      } finally {
        setLoading(false);
      }
    }
    init();
    return () => stopPolling();
  }, [loadAudit, stopPolling]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await triggerAuditGenerate();
      pollRef.current = setInterval(loadAudit, 5000);
    } catch {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id: string, status: ItemStatus) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      await updateActionItemStatus(id, status);
    } catch {
      await loadAudit();
    }
  };

  const handleHistoryTab = async () => {
    setActiveTab("history");
    if (!historyLoaded) {
      try {
        const res = await listAudits(20);
        setHistory(res.audits);
        setHistoryLoaded(true);
      } catch {
        // leave empty
      }
    }
  };

  const handleAccountConnected = (account: SocialAuditAccount) => {
    setAccounts((prev) => [...prev, account]);
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const highCount = items.filter((i) => i.priority === "high" && i.status !== "done" && i.status !== "dismissed").length;

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-gray-900">Social Presence Audit</h1>
          <NoAccountsState onConnected={handleAccountConnected} />
        </div>
      </div>
    );
  }

  if (!audit && !generating) {
    return (
      <div className="min-h-screen p-8">
        <div className="space-y-6">
          <h1 className="text-xl font-bold text-gray-900">Social Presence Audit</h1>
          <NoAuditState onGenerate={handleGenerate} generating={generating} />
        </div>
      </div>
    );
  }

  const weekLabel = audit
    ? `Week of ${parseDate(audit.week_start).toLocaleDateString("en-CA", { month: "long", day: "numeric" })} – ${parseDate(audit.week_end).toLocaleDateString("en-CA", { day: "numeric", year: "numeric" })}`
    : "Generating…";

  const generatedLabel = audit?.generated_at
    ? `Generated ${new Date(audit.generated_at).toLocaleString("en-CA", { weekday: "long", hour: "numeric", minute: "2-digit" })}`
    : null;

  return (
    <div className="min-h-screen p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Social Presence Audit</h1>
            <p className="muted mt-0.5">
              {weekLabel}
              {generatedLabel && ` · ${generatedLabel}`}
            </p>
          </div>
          {audit?.status === "completed" && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {generating ? "Generating…" : "Re-generate"}
            </button>
          )}
        </div>

        {/* Generating skeleton */}
        {(generating || audit?.status === "generating" || audit?.status === "regenerating") && (
          <div className="card p-6 flex items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Analysing your social presence…</p>
              <p className="muted mt-0.5">This takes 30–60 seconds. The page will update automatically.</p>
            </div>
          </div>
        )}

        {audit?.status === "completed" && (
          <>
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
                { id: "audit", label: "Audit Report", onClick: () => setActiveTab("audit") },
                { id: "plan", label: "Action Plan", badge: pendingCount > 0 ? pendingCount : undefined, onClick: () => setActiveTab("plan") },
                { id: "history", label: "History", onClick: handleHistoryTab },
              ] as { id: Tab; label: string; badge?: number; onClick: () => void }[]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={tab.onClick}
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

            {/* ── Audit Report tab ────────────────────────────────────────────── */}
            {activeTab === "audit" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" as const }}
                className="space-y-5"
              >
                {/* Accounts strip */}
                <div className="flex flex-wrap gap-2">
                  {accounts.filter((a) => a.is_active).map((a) => (
                    <div key={a.id} className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full", a.last_scrape_status === "success" ? "bg-green-500" : "bg-amber-400")} />
                      <PlatformBadge platform={a.platform} />
                    </div>
                  ))}
                </div>

                {/* Prior plan progress */}
                {audit.prior_plan_progress && audit.prior_plan_progress.length > 0 && (
                  <PriorProgressSection items={audit.prior_plan_progress as { title: string; status: string; signal_observed: string }[]} />
                )}

                {/* State of presence */}
                {audit.state_of_presence && audit.state_of_presence.length > 0 && (
                  <div className="card p-5">
                    <h3 className="section-title mb-4">State of presence</h3>
                    <div className="space-y-4">
                      {(audit.state_of_presence as { platform: string; assessment: string; cadence_observation: string; content_mix_observation: string; recent_direction: string }[]).map((p) => (
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
                )}

                {/* What's working */}
                {audit.what_working && audit.what_working.length > 0 && (
                  <div className="card p-5">
                    <h3 className="section-title mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      What&rsquo;s working
                    </h3>
                    <div className="space-y-3">
                      {(audit.what_working as { observation: string; why_it_works: string; theme: string }[]).map((w, i) => (
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
                )}

                {/* What's not working */}
                {audit.what_not_working && audit.what_not_working.length > 0 && (
                  <div className="card p-5">
                    <h3 className="section-title mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      What&rsquo;s not working
                    </h3>
                    <div className="space-y-3">
                      {(audit.what_not_working as { observation: string; hypothesis: string; category: string }[]).map((n, i) => (
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
                )}

                {/* Market connection */}
                {audit.market_connection && (
                  <div className="flex gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
                    <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <div>
                      <p className="text-sm font-semibold text-brand-900 mb-1">From your market</p>
                      <p className="text-sm text-brand-800 leading-relaxed">{audit.market_connection}</p>
                    </div>
                  </div>
                )}

                {/* Data freshness */}
                {audit.data_freshness && (
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(audit.data_freshness).map(([src, ts]) => (
                      <span key={src} className="text-xs text-gray-400">
                        {PLATFORM_META[src]?.label ?? src}: data through {new Date(ts).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Action Plan tab ─────────────────────────────────────────────── */}
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

            {/* ── History tab ─────────────────────────────────────────────────── */}
            {activeTab === "history" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" as const }}
                className="space-y-3"
              >
                {history.length === 0 && (
                  <p className="muted text-center py-8">No audit history yet.</p>
                )}
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setActiveTab("audit")}
                    className="card-hover w-full p-5 flex items-center gap-4 text-left"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                      <Activity className="h-5 w-5 text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        Week of {parseDate(h.week_start).toLocaleDateString("en-CA", { month: "long", day: "numeric" })} – {parseDate(h.week_end).toLocaleDateString("en-CA", { day: "numeric", year: "numeric" })}
                      </p>
                      <p className="muted mt-0.5">
                        {h.action_item_count} action items
                        {h.has_prior_plan_progress && " · includes plan progress"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        h.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      )}>
                        {h.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
