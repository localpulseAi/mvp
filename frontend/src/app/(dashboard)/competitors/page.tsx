"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Users, RefreshCw, Loader2, Activity, CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  getCompetitors,
  getAllAnalyses,
  getCrossPatterns,
  analyzeAllCompetitors,
  type CompetitorOut,
  type AnalysisItem,
  type PatternItem,
} from "@/lib/api";
import { sampleCompetitorInsight } from "@/lib/demo-content";
import {
  PageHeader,
  PatternCard,
  InsightList,
  SummaryTile,
  avatarColor,
  daysAgo,
  getInitials,
} from "@/components/competitors/shared";
import { CompetitorDetail } from "@/components/competitors/CompetitorDetail";

type UICompetitor = CompetitorOut & { analysis: AnalysisItem | null };

const PAGE = "px-4 py-6 sm:px-6 lg:px-8 lg:py-8";

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<UICompetitor[]>([]);
  const [patterns, setPatterns] = useState<PatternItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "patterns">("overview");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [comps, analysesRes, patternsRes] = await Promise.all([
        getCompetitors(),
        getAllAnalyses(),
        getCrossPatterns(30),
      ]);
      const analysisMap = new Map((analysesRes.analyses ?? []).map((a) => [a.competitor_id, a]));
      const merged: UICompetitor[] = comps.map((c) => ({ ...c, analysis: analysisMap.get(c.id) ?? null }));
      setCompetitors(merged);
      setPatterns(patternsRes.patterns ?? []);
      if (merged.length > 0 && !selectedId) setSelectedId(merged[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load competitors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      await analyzeAllCompetitors();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  const selected = competitors.find((c) => c.id === selectedId);
  const highCount = patterns.filter((p) => p.severity === "high").length;
  const mediumCount = patterns.filter((p) => p.severity === "medium").length;
  const lowCount = patterns.filter((p) => p.severity === "low").length;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center" role="status">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-gray-700">Loading competitor workspace…</p>
        <p className="text-xs text-gray-500">No connection? The page will show an illustrative example instead.</p>
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className={PAGE}>
        <PageHeader analyzing={analyzing} onAnalyze={handleAnalyze} error={error} />
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="card flex flex-col items-start p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac">
              <Users className="h-6 w-6 text-brand-600" />
            </div>
            <h2 className="font-display text-lg font-semibold text-ink">No tracked businesses yet</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
              Add businesses during onboarding or from Settings to analyse the public signals you choose.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/settings" className="btn-primary">Go to Settings</Link>
              <button onClick={load} className="btn-secondary">Try again</button>
            </div>
          </div>

          <div className="card-lilac p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="lime">Illustrative sample</Badge>
              <p className="text-xs font-semibold text-brand-700">What a competitor insight looks like</p>
            </div>
            <p className="mt-3 font-display text-base font-semibold text-ink">{sampleCompetitorInsight.positioning}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InsightList title="Example strengths" items={sampleCompetitorInsight.strengths} tone="positive" />
              <InsightList title="Example gaps to validate" items={sampleCompetitorInsight.vulnerabilities} tone="caution" />
            </div>
            <div className="mt-3 rounded-control border border-gray-200/70 bg-white p-4">
              <p className="text-xs font-semibold text-ink">Recommendation example</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{sampleCompetitorInsight.implication}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE}>
      <PageHeader analyzing={analyzing} onAnalyze={handleAnalyze} error={error} count={competitors.length} />

      {/* Tabs */}
      <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div role="tablist" className="inline-flex gap-1 rounded-control border border-gray-200/70 bg-white p-1 shadow-soft">
          {(["overview", "patterns"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                tab === t ? "bg-lilac text-brand-700" : "text-gray-500 hover:text-ink"
              )}
            >
              {t === "overview" ? "Per competitor" : "Cross-competitor patterns"}
              {t === "patterns" && patterns.length > 0 && (
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

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-5 lg:flex-row"
            >
              {/* Competitor list — horizontal scroller on mobile, rail on desktop */}
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:w-64 lg:shrink-0 lg:overflow-visible">
                <ul className="flex gap-2 lg:flex-col lg:gap-1">
                  {competitors.map((c) => {
                    const active = selectedId === c.id;
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
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              ) : (
                                <Circle className="h-3 w-3 text-gray-300" />
                              )}
                              {c.analysis ? `Analysed ${daysAgo(c.analysis.generated_at)}` : "No analysis"}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {selected && <CompetitorDetail selected={selected} />}
            </motion.div>
          )}

          {tab === "patterns" && (
            <motion.div
              key="patterns"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {patterns.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <SummaryTile count={highCount} label="High priority" dot="bg-red-500" />
                  <SummaryTile count={mediumCount} label="Market signals" dot="bg-amber-500" />
                  <SummaryTile count={lowCount} label="Watch items" dot="bg-gray-400" />
                </div>
              )}

              {patterns.length > 0 ? (
                <div className={cn("grid gap-4", patterns.length > 1 && "xl:grid-cols-2")}>
                  {patterns.map((pattern, i) => (
                    <PatternCard key={i} pattern={pattern} index={i} />
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center sm:p-10">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="section-title">No patterns detected yet</p>
                  <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-gray-500">
                    Patterns emerge after running analysis on your competitor set.
                  </p>
                  <button onClick={handleAnalyze} disabled={analyzing} className="btn-secondary mt-5">
                    {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Run analysis
                  </button>
                </div>
              )}

              {patterns.length > 0 && (
                <p className="pt-1 text-center text-xs text-gray-500">
                  Pattern analysis strengthens from week 4+ as baseline data accumulates.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
