"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditActionItem, AuditSummary, SocialAuditAccount, SocialAuditDetail } from "@/lib/api";
import { errorMessage } from "@/lib/workspace";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { ActionItemCard } from "./ActionItemCard";
import { AuditReport } from "./AuditReport";
import { weekRange, type ItemStatus, type Tab } from "./meta";

interface AuditViewProps {
  audit: SocialAuditDetail;
  items: AuditActionItem[];
  accounts: SocialAuditAccount[];
  onStatusChange: (id: string, status: ItemStatus) => void;
  /** Sample/demo audit: status changes are local only and labelled. */
  sample?: boolean;
  loadHistory: () => Promise<AuditSummary[]>;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "audit", label: "Audit report" },
  { id: "plan", label: "Action plan" },
  { id: "history", label: "History" },
];

export function AuditView({ audit, items, accounts, onStatusChange, sample = false, loadHistory }: AuditViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("audit");
  const [history, setHistory] = useState<AuditSummary[] | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const reduced = useReducedMotion();

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const highCount = items.filter((i) => i.priority === "high" && i.status !== "done" && i.status !== "dismissed").length;
  const dismissed = items.filter((i) => i.status === "dismissed");

  async function fetchHistory() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      setHistory(await loadHistory());
    } catch (err) {
      setHistoryError(errorMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }

  function selectTab(id: Tab) {
    setActiveTab(id);
    if (id === "history" && history === null && !historyLoading) fetchHistory();
  }

  function onTabKey(e: React.KeyboardEvent, i: number) {
    let n: number | undefined;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    if (e.key === "ArrowLeft") n = (i + TABS.length - 1) % TABS.length;
    if (n === undefined) return;
    e.preventDefault();
    selectTab(TABS[n].id);
    document.getElementById(`audit-tab-${TABS[n].id}`)?.focus();
  }

  const panelMotion = {
    initial: { opacity: 0, y: reduced ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.2, ease: "easeOut" as const },
  };

  return (
    <>
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "High priority", value: highCount, dot: "bg-red-500", sub: "still open" },
          { label: "To do", value: pendingCount, dot: "bg-brand-600", sub: "action items" },
          { label: "Completed", value: doneCount, dot: "bg-lime-400", sub: "from this audit" },
        ].map((m) => (
          <div key={m.label} className="card p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full", m.dot)} aria-hidden="true" />
              <p className="text-xs font-medium text-gray-500">{m.label}</p>
            </div>
            <p className="tabular mt-2 font-display text-3xl font-semibold text-ink">{m.value}</p>
            <p className="hidden text-xs text-gray-500 sm:block">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Audit views" className="inline-flex gap-1 rounded-control border border-gray-200/70 bg-white p-1 shadow-soft">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              id={`audit-tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`audit-panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={cn(
                "flex min-h-[40px] items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                activeTab === tab.id ? "bg-lilac text-brand-700" : "text-gray-500 hover:text-ink"
              )}
            >
              {tab.label}
              {tab.id === "plan" && pendingCount > 0 && (
                <span className="tabular rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div id={`audit-panel-${activeTab}`} role="tabpanel" aria-labelledby={`audit-tab-${activeTab}`}>
        {activeTab === "audit" && <AuditReport audit={audit} accounts={accounts} />}

        {activeTab === "plan" && (
          <motion.div {...panelMotion} className="space-y-3">
            <p className="text-sm text-gray-500">
              <span className="tabular font-medium text-ink">{pendingCount}</span> to do ·{" "}
              <span className="tabular font-medium text-ink">{doneCount}</span> done
              {sample ? " · sample plan, changes aren't saved" : " · mark items as you work through them"}
            </p>
            {items.filter((i) => i.status !== "dismissed").map((item) => (
              <ActionItemCard key={item.id} item={item} onStatusChange={onStatusChange} sample={sample} />
            ))}
            {dismissed.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer rounded text-xs font-medium text-gray-500 hover:text-ink">
                  Show dismissed items ({dismissed.length})
                </summary>
                <div className="mt-3 space-y-3">
                  {dismissed.map((item) => (
                    <ActionItemCard key={item.id} item={item} onStatusChange={onStatusChange} sample={sample} />
                  ))}
                </div>
              </details>
            )}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div {...panelMotion} className="space-y-3">
            {historyLoading && <LoadingState label="Loading audit history" className="py-10" />}
            {historyError && <ErrorState title="We couldn't load your audit history" message={historyError} onRetry={fetchHistory} />}
            {history && history.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">This is your first audit. Earlier weeks will appear here.</p>
            )}
            {history?.map((h) => (
              <button
                key={h.id}
                onClick={() => setActiveTab("audit")}
                className="card-hover flex w-full items-center gap-4 p-4 text-left sm:p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-lilac">
                  <Activity className="h-5 w-5 text-brand-600" aria-hidden="true" />
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
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </>
  );
}
