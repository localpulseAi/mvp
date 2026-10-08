"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Activity, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSocialAccounts,
  getCurrentAudit,
  listAudits,
  triggerAuditGenerate,
  updateActionItemStatus,
} from "@/lib/api";
import type { SocialAuditAccount, AuditActionItem, SocialAuditDetail, AuditSummary } from "@/lib/api";
import { tabMotion, weekRange, type ItemStatus, type Tab } from "@/components/audit/meta";
import { ActionItemCard } from "@/components/audit/ActionItemCard";
import { AuditReport } from "@/components/audit/AuditReport";
import { NoAccountsState, NoAuditState } from "@/components/audit/EmptyStates";

const PAGE = "px-4 py-6 sm:px-6 lg:px-8 lg:py-8";

function Header({ subtitle, action }: { subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="eyebrow">Social presence audit</p>
        <h1 className="page-title mt-1.5">How your presence is landing</h1>
        {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

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
  const dismissed = items.filter((i) => i.status === "dismissed");

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <span className="sr-only">Loading audit…</span>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={cn(PAGE, "space-y-6")}>
        <Header subtitle="Connect your own accounts to get a qualitative read and a short plan." />
        <NoAccountsState onConnected={handleAccountConnected} />
      </div>
    );
  }

  if (!audit && !generating) {
    return (
      <div className={cn(PAGE, "space-y-6")}>
        <Header />
        <NoAuditState onGenerate={handleGenerate} generating={generating} />
      </div>
    );
  }

  const weekLabel = audit ? weekRange(audit.week_start, audit.week_end) : "Generating…";
  const generatedLabel = audit?.generated_at
    ? `Generated ${new Date(audit.generated_at).toLocaleString("en-CA", { weekday: "long", hour: "numeric", minute: "2-digit" })}`
    : null;
  const isGenerating = generating || audit?.status === "generating" || audit?.status === "regenerating";

  const tabs: { id: Tab; label: string; badge?: number; onClick: () => void }[] = [
    { id: "audit", label: "Audit report", onClick: () => setActiveTab("audit") },
    { id: "plan", label: "Action plan", badge: pendingCount > 0 ? pendingCount : undefined, onClick: () => setActiveTab("plan") },
    { id: "history", label: "History", onClick: handleHistoryTab },
  ];

  return (
    <div className={cn(PAGE, "space-y-6")}>
      <Header
        subtitle={`${weekLabel}${generatedLabel ? ` · ${generatedLabel}` : ""}`}
        action={
          audit?.status === "completed" && (
            <button onClick={handleGenerate} disabled={generating} className="btn-secondary shrink-0 self-start sm:self-auto">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {generating ? "Generating…" : "Re-generate"}
            </button>
          )
        }
      />

      {isGenerating && (
        <div className="card-lilac flex items-center gap-4 p-5 sm:p-6" role="status">
          <Loader2 className="h-6 w-6 shrink-0 animate-spin text-brand-600" />
          <div>
            <p className="text-sm font-semibold text-ink">Analysing your social presence…</p>
            <p className="mt-0.5 text-sm text-gray-600">This takes 30–60 seconds. The page updates automatically.</p>
          </div>
        </div>
      )}

      {audit?.status === "completed" && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { label: "High priority", value: highCount, dot: "bg-red-500", sub: "need attention" },
              { label: "To do", value: pendingCount, dot: "bg-brand-600", sub: "action items" },
              { label: "Completed", value: doneCount, dot: "bg-lime-400", sub: "from this audit" },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" as const }}
                className="card p-4 sm:p-5"
              >
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", m.dot)} />
                  <p className="text-xs font-medium text-gray-500">{m.label}</p>
                </div>
                <p className="tabular mt-2 font-display text-3xl font-semibold text-ink">{m.value}</p>
                <p className="hidden text-xs text-gray-500 sm:block">{m.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div role="tablist" className="inline-flex gap-1 rounded-control border border-gray-200/70 bg-white p-1 shadow-soft">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={tab.onClick}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                    activeTab === tab.id ? "bg-lilac text-brand-700" : "text-gray-500 hover:text-ink"
                  )}
                >
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="tabular rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "audit" && <AuditReport audit={audit} accounts={accounts} />}

          {activeTab === "plan" && (
            <motion.div {...tabMotion} className="space-y-3">
              <p className="text-sm text-gray-500">
                <span className="tabular font-medium text-ink">{pendingCount}</span> to do ·{" "}
                <span className="tabular font-medium text-ink">{doneCount}</span> done · mark items as you work through them
              </p>
              {items.filter((i) => i.status !== "dismissed").map((item) => (
                <ActionItemCard key={item.id} item={item} onStatusChange={handleStatusChange} />
              ))}
              {dismissed.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer rounded text-xs font-medium text-gray-500 hover:text-ink">
                    Show dismissed items ({dismissed.length})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {dismissed.map((item) => (
                      <ActionItemCard key={item.id} item={item} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </details>
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div {...tabMotion} className="space-y-3">
              {history.length === 0 && <p className="py-8 text-center text-sm text-gray-500">No audit history yet.</p>}
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setActiveTab("audit")}
                  className="card-hover flex w-full items-center gap-4 p-4 text-left sm:p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-lilac">
                    <Activity className="h-5 w-5 text-brand-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{weekRange(h.week_start, h.week_end)}</p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {h.action_item_count} action items
                      {h.has_prior_plan_progress && " · includes plan progress"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "hidden rounded-full px-2.5 py-1 text-xs font-semibold capitalize sm:inline",
                      h.status === "completed" ? "bg-lime-300 text-ink" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {h.status}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
