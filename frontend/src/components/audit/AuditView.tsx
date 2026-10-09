"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditActionItem, AuditEvidence, AuditSummary, SocialAuditAccount, SocialAuditDetail } from "@/lib/api";
import { errorMessage } from "@/lib/workspace";
import { ErrorState, LoadingState } from "@/components/ui/states";
import { ActionItemCard } from "./ActionItemCard";
import { AuditReport } from "./AuditReport";
import { weekRange, type ItemStatus, type Tab } from "./meta";
import { AgentTrace } from "./AgentTrace";
import { DataCharts } from "./DataCharts";
import { EvidenceList } from "./EvidenceList";
import { computeStats } from "./evidenceStats";

interface AuditViewProps {
  audit: SocialAuditDetail;
  items: AuditActionItem[];
  accounts: SocialAuditAccount[];
  onStatusChange: (id: string, status: ItemStatus) => void;
  /** Sample/demo audit: status changes are local only and labelled. */
  sample?: boolean;
  loadHistory: () => Promise<AuditSummary[]>;
  /** The data and agent runs behind this audit. */
  loadEvidence: () => Promise<AuditEvidence>;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "audit", label: "Audit report" },
  { id: "evidence", label: "Evidence" },
  { id: "plan", label: "Action plan" },
  { id: "history", label: "History" },
];

export function AuditView({ audit, items, accounts, onStatusChange, sample = false, loadHistory, loadEvidence }: AuditViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("audit");
  const [history, setHistory] = useState<AuditSummary[] | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const reduced = useReducedMotion();
  const [evidence, setEvidence] = useState<AuditEvidence | null>(null);
  const [evidenceError, setEvidenceError] = useState("");

  function fetchEvidence() {
    setEvidenceError("");
    loadEvidence().then(setEvidence, (err) => setEvidenceError(errorMessage(err)));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fetchEvidence, [audit.id]);
  const stats = useMemo(() => (evidence ? computeStats(evidence) : null), [evidence]);
  const collectedLabel = stats
    ? [stats.postCount && `${stats.postCount} posts`, stats.reviewCount && `${stats.reviewCount} reviews`].filter(Boolean).join(" and ")
    : "";

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
        {activeTab === "audit" && (
          <motion.div {...panelMotion} className="space-y-5">
            {evidence && stats ? (
              <>
                <AgentTrace
                  evidence={evidence}
                  stats={stats}
                  items={items}
                  onOpenEvidence={() => selectTab("evidence")}
                  onOpenPlan={() => selectTab("plan")}
                />
                <DataCharts stats={stats} collectedLabel={collectedLabel} />
              </>
            ) : evidenceError ? (
              <ErrorState title="We couldn't load the evidence behind this audit" message={evidenceError} onRetry={fetchEvidence} />
            ) : (
              <LoadingState label="Loading what our agents found" className="py-8" />
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <h2 className="font-display text-base font-semibold text-ink">The analyst&apos;s read</h2>
              <span className="rounded-full bg-lilac px-2 py-0.5 text-[10px] font-semibold text-brand-700 ring-1 ring-brand-200">
                AI interpretation · check against the data above
              </span>
            </div>
            <AuditReport audit={audit} accounts={accounts} />
          </motion.div>
        )}

        {activeTab === "evidence" && (
          <motion.div {...panelMotion}>
            {evidence ? (
              <EvidenceList evidence={evidence} />
            ) : evidenceError ? (
              <ErrorState title="We couldn't load the evidence" message={evidenceError} onRetry={fetchEvidence} />
            ) : (
              <LoadingState label="Loading evidence" className="py-8" />
            )}
          </motion.div>
        )}

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
