"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Activity, CheckCircle2, Circle, Loader2, Plus, RefreshCw, Users, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getCompetitors,
  getAllAnalyses,
  getCrossPatterns,
  analyzeAllCompetitors,
  type PatternItem,
} from "@/lib/api";
import { useWorkspaceData, errorMessage } from "@/lib/workspace";
import { demoAnalyses, demoCompetitors, demoPatterns } from "@/lib/demo-workspace";
import { DemoBanner, EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/ui/states";
import { PatternCard, SummaryTile, avatarColor, daysAgo, getInitials } from "@/components/competitors/shared";
import { CompetitorDetail, type UICompetitor } from "@/components/competitors/CompetitorDetail";

const PAGE = "px-4 py-6 sm:px-6 lg:px-8 lg:py-8";

type CompetitorData = { competitors: UICompetitor[]; patterns: PatternItem[] };

function mergeAnalyses(comps: typeof demoCompetitors, analyses: typeof demoAnalyses): UICompetitor[] {
  const map = new Map(analyses.map((a) => [a.competitor_id, a]));
  return comps.map((c) => ({ ...c, analysis: map.get(c.id) ?? null }));
}

const DEMO_DATA: CompetitorData = {
  competitors: mergeAnalyses(demoCompetitors, demoAnalyses),
  patterns: demoPatterns,
};

async function loadLive(): Promise<CompetitorData> {
  const [comps, analysesRes, patternsRes] = await Promise.all([
    getCompetitors(),
    getAllAnalyses(),
    getCrossPatterns(30),
  ]);
  return { competitors: mergeAnalyses(comps, analysesRes.analyses ?? []), patterns: patternsRes.patterns ?? [] };
}

type Tab = "overview" | "patterns";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Per competitor" },
  { id: "patterns", label: "Cross-competitor patterns" },
];

export default function CompetitorsPage() {
  const { state, reload } = useWorkspaceData(loadLive, DEMO_DATA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const reduced = useReducedMotion();

  const data = state.status === "ready" ? state.data : null;
  const isDemo = state.mode === "demo";
  const competitors = data?.competitors ?? [];
  const patterns = data?.patterns ?? [];

  useEffect(() => {
    if (competitors.length > 0 && !competitors.some((c) => c.id === selectedId)) setSelectedId(competitors[0].id);
  }, [competitors, selectedId]);

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError("");
    try {
      await analyzeAllCompetitors();
      await reload();
    } catch (err) {
      setAnalyzeError(errorMessage(err));
    } finally {
      setAnalyzing(false);
    }
  }

  // Analysis prerequisites: a live workspace with at least one tracked business.
  const analyzeBlockedReason = isDemo
    ? "Analysis runs on your own workspace. This demo shows sample results."
    : competitors.length === 0
      ? "Add at least one business before running analysis."
      : "";

  const analyzeAction = state.status === "ready" && (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        onClick={handleAnalyze}
        disabled={analyzing || Boolean(analyzeBlockedReason)}
        aria-describedby={analyzeBlockedReason ? "analyze-reason" : undefined}
        className="btn-primary"
      >
        {analyzing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
        {analyzing ? "Analysing…" : "Run analysis"}
      </button>
      {analyzeBlockedReason && (
        <p id="analyze-reason" className="flex max-w-xs items-start gap-1.5 text-xs text-gray-500 sm:text-right">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {analyzeBlockedReason}
        </p>
      )}
      {analyzeError && (
        <p role="alert" className="max-w-xs text-xs text-red-600 sm:text-right">{analyzeError}</p>
      )}
    </div>
  );

  const header = (
    <PageHeader
      eyebrow="Competitor intelligence"
      title="Your competitive set"
      description={
        data
          ? `${competitors.length} business${competitors.length !== 1 ? "es" : ""} tracked · public signals only, separated from our interpretation.`
          : "Public signals from the nearby businesses you choose to follow."
      }
      action={analyzeAction}
    />
  );

  if (state.status === "loading") {
    return (
      <div className={PAGE}>
        {header}
        <LoadingState label="Loading your competitive set" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={cn(PAGE, "space-y-6")}>
        {header}
        <ErrorState title="We couldn't load your competitors" message={state.error} onRetry={reload} />
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className={cn(PAGE, "space-y-6")}>
        {header}
        <EmptyState
          icon={Users}
          title="Add the first business you want to follow"
          body="Pick up to five nearby businesses. Agenzy collects their public posts, offers, and reviews so you can see what deserves a response."
          action={
            <Link href="/settings#competitors" className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add a business
            </Link>
          }
        />
      </div>
    );
  }

  const selected = competitors.find((c) => c.id === selectedId) ?? competitors[0];
  const highCount = patterns.filter((p) => p.severity === "high").length;
  const mediumCount = patterns.filter((p) => p.severity === "medium").length;
  const lowCount = patterns.filter((p) => p.severity === "low").length;

  function onTabKey(e: React.KeyboardEvent, i: number) {
    let n: number | undefined;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    if (e.key === "ArrowLeft") n = (i + TABS.length - 1) % TABS.length;
    if (n === undefined) return;
    e.preventDefault();
    setTab(TABS[n].id);
    document.getElementById(`comp-tab-${TABS[n].id}`)?.focus();
  }

  const fade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: reduced ? 0 : 0.15 } };

  return (
    <div className={cn(PAGE, "space-y-6")}>
      {isDemo && <DemoBanner what="a sample competitive set" />}
      {header}

      {/* Tabs */}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" aria-label="Competitor views" className="inline-flex gap-1 rounded-control border border-gray-200/70 bg-white p-1 shadow-soft">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              id={`comp-tab-${t.id}`}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`comp-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
              className={cn(
                "min-h-[40px] whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                tab === t.id ? "bg-lilac text-brand-700" : "text-gray-500 hover:text-ink"
              )}
            >
              {t.label}
              {t.id === "patterns" && patterns.length > 0 && (
                <span
                  className={cn(
                    "tabular ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                    tab === "patterns" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {patterns.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div
            key="overview"
            id="comp-panel-overview"
            role="tabpanel"
            aria-labelledby="comp-tab-overview"
            {...fade}
            className="flex flex-col gap-5 lg:flex-row"
          >
            {/* Competitor list — horizontal scroller on mobile, rail on desktop */}
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:w-64 lg:shrink-0 lg:overflow-visible">
              <ul className="flex gap-2 lg:flex-col lg:gap-1" aria-label="Tracked businesses">
                {competitors.map((c) => {
                  const active = selected.id === c.id;
                  return (
                    <li key={c.id} className="shrink-0 lg:shrink">
                      <button
                        onClick={() => setSelectedId(c.id)}
                        aria-pressed={active}
                        className={cn(
                          "flex w-56 items-center gap-3 rounded-control border p-3 text-left transition-all lg:w-full",
                          active
                            ? "border-brand-200 bg-white shadow-soft ring-1 ring-brand-600"
                            : "border-transparent bg-white/60 hover:border-gray-200 hover:bg-white"
                        )}
                      >
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold", avatarColor(c.name))}>
                          {getInitials(c.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-500">
                            {c.analysis ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                            ) : (
                              <Circle className="h-3 w-3 text-gray-300" aria-hidden="true" />
                            )}
                            {c.analysis ? `Analysed ${daysAgo(c.analysis.generated_at)}` : "Awaiting analysis"}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <CompetitorDetail selected={selected} />
          </motion.div>
        )}

        {tab === "patterns" && (
          <motion.div
            key="patterns"
            id="comp-panel-patterns"
            role="tabpanel"
            aria-labelledby="comp-tab-patterns"
            {...fade}
            className="space-y-5"
          >
            {patterns.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <SummaryTile count={highCount} label="High priority" dot="bg-red-500" />
                  <SummaryTile count={mediumCount} label="Market signals" dot="bg-amber-500" />
                  <SummaryTile count={lowCount} label="Watch items" dot="bg-gray-400" />
                </div>
                <div className={cn("grid gap-4", patterns.length > 1 && "xl:grid-cols-2")}>
                  {patterns.map((pattern, i) => (
                    <PatternCard key={i} pattern={pattern} index={i} />
                  ))}
                </div>
                <p className="pt-1 text-center text-xs text-gray-500">
                  Patterns get more reliable after about four weeks of baseline data.
                </p>
              </>
            ) : (
              <EmptyState
                icon={Activity}
                title="No cross-competitor patterns yet"
                body={
                  competitors.some((c) => c.analysis)
                    ? "Nothing stands out across your set in the last 30 days. Patterns appear when several businesses move in the same direction."
                    : "Patterns appear after analysis has run on your competitor set."
                }
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
