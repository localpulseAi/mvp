"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Eye,
  BarChart2,
  ChevronRight,
  Loader2,
  Zap,
  Hash,
  Megaphone,
  Tag,
  Activity,
  Star,
  Lightbulb,
  CheckCircle2,
  Circle,
} from "lucide-react";
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
import Link from "next/link";

type UICompetitor = CompetitorOut & { analysis: AnalysisItem | null };

function daysAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function PatternIcon({ type, className }: { type: string; className?: string }) {
  const props = { className: cn("h-4 w-4", className) };
  if (type === "simultaneous_promos") return <Tag {...props} />;
  if (type === "ad_wave") return <Megaphone {...props} />;
  if (type === "hashtag_cluster") return <Hash {...props} />;
  if (type === "cadence_drop") return <TrendingDown {...props} />;
  if (type === "review_surge") return <Star {...props} />;
  return <Activity {...props} />;
}

const severityConfig = {
  high: {
    border: "border-l-red-500",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    badge: "amber" as const,
    label: "High priority",
    dot: "bg-red-500",
  },
  medium: {
    border: "border-l-amber-400",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    badge: "amber" as const,
    label: "Medium signal",
    dot: "bg-amber-400",
  },
  low: {
    border: "border-l-gray-300",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
    badge: "gray" as const,
    label: "Watch",
    dot: "bg-gray-400",
  },
};

// ── Pattern card ──────────────────────────────────────────────────────────────

function PatternCard({ pattern, index }: { pattern: PatternItem; index: number }) {
  const severity = (pattern.severity as keyof typeof severityConfig) ?? "low";
  const cfg = severityConfig[severity] ?? severityConfig.low;
  const type = pattern.pattern_type ?? "pattern";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" as const }}
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-sm border-l-4 overflow-hidden",
        cfg.border
      )}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3.5">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", cfg.iconBg)}>
            <PatternIcon type={type} className={cfg.iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-gray-900 capitalize">
                {type.replace(/_/g, " ")}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  severity === "high"
                    ? "bg-red-50 text-red-600"
                    : severity === "medium"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-gray-100 text-gray-500"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{pattern.description}</p>
          </div>
        </div>

        {/* Competitor chips */}
        {(pattern.competitors_involved?.length ?? 0) > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5 pl-[52px]">
            {pattern.competitors_involved.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                    avatarColor(name)
                  )}
                >
                  {getInitials(name)[0]}
                </span>
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Strategic implication */}
        {pattern.strategic_implication && (
          <div className="mt-4 rounded-xl bg-brand-50 border border-brand-100 p-4">
            <div className="flex gap-2.5">
              <Lightbulb className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-1">
                  What this means for you
                </p>
                <p className="text-sm text-brand-800 leading-relaxed">
                  {pattern.strategic_implication}
                </p>
                <Link
                  href="/session"
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Discuss in Strategy Session
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

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
      const analysisMap = new Map(
        (analysesRes.analyses ?? []).map((a) => [a.competitor_id, a])
      );
      const merged: UICompetitor[] = comps.map((c) => ({
        ...c,
        analysis: analysisMap.get(c.id) ?? null,
      }));
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="min-h-screen p-8">
        <PageHeader analyzing={analyzing} onAnalyze={handleAnalyze} error={error} />
        <div className="card max-w-md p-10 text-center mt-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
            <Users className="h-6 w-6 text-brand-600" />
          </div>
          <p className="text-base font-semibold text-gray-900">No competitors tracked yet</p>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            Add competitors during onboarding or from Settings.
          </p>
          <Link href="/settings" className="btn-primary mt-6 inline-flex">
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <PageHeader
        analyzing={analyzing}
        onAnalyze={handleAnalyze}
        error={error}
        count={competitors.length}
      />

      {/* Tabs */}
      <div className="mt-6 mb-6 flex gap-1 rounded-xl bg-gray-100/80 p-1 w-fit">
        {(["overview", "patterns"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {t === "overview" ? "Per-Competitor" : "Cross-Competitor Patterns"}
            {t === "patterns" && patterns.length > 0 && (
              <span
                className={cn(
                  "ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  tab === "patterns"
                    ? "bg-brand-600 text-white"
                    : "bg-gray-300 text-gray-600"
                )}
              >
                {patterns.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex gap-5"
          >
            {/* Competitor sidebar */}
            <div className="w-60 shrink-0 space-y-1">
              {competitors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all",
                    selectedId === c.id
                      ? "bg-brand-600 text-white shadow-sm"
                      : "hover:bg-white hover:shadow-sm"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      selectedId === c.id ? "bg-white/20 text-white" : avatarColor(c.name)
                    )}
                  >
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", selectedId === c.id ? "text-white" : "text-gray-900")}>
                      {c.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {c.analysis ? (
                        <CheckCircle2 className={cn("h-3 w-3", selectedId === c.id ? "text-white/70" : "text-emerald-500")} />
                      ) : (
                        <Circle className={cn("h-3 w-3", selectedId === c.id ? "text-white/50" : "text-gray-300")} />
                      )}
                      <span className={cn("text-[11px]", selectedId === c.id ? "text-white/70" : "text-gray-400")}>
                        {c.analysis ? daysAgo(c.analysis.generated_at) : "No analysis"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Detail panel */}
            {selected && (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" as const }}
                className="flex-1 space-y-4 min-w-0"
              >
                {/* Header card */}
                <div className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold", avatarColor(selected.name))}>
                        {getInitials(selected.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg font-extrabold text-gray-900">{selected.name}</h2>
                          {selected.analysis ? (
                            <Badge variant="green" dot>Analysed</Badge>
                          ) : (
                            <Badge variant="gray" dot>Pending</Badge>
                          )}
                          {selected.baseline_complete && (
                            <Badge variant="brand">Baseline</Badge>
                          )}
                        </div>
                        {selected.address && (
                          <p className="text-sm text-gray-500 mt-0.5">{selected.address}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            Added {daysAgo(selected.added_at)}
                          </span>
                          {selected.analysis && (
                            <span className="text-xs text-gray-400">
                              · Analysis {daysAgo(selected.analysis.generated_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Data sources */}
                    <div className="flex gap-1.5 shrink-0">
                      {selected.instagram_handle && (
                        <span className="rounded-lg bg-pink-50 px-2 py-1 text-[10px] font-semibold text-pink-600">IG</span>
                      )}
                      {selected.facebook_page && (
                        <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600">FB</span>
                      )}
                      {selected.google_place_id && (
                        <span className="rounded-lg bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-600">G</span>
                      )}
                    </div>
                  </div>
                </div>

                {selected.analysis ? (
                  <>
                    {/* Positioning */}
                    {selected.analysis.positioning_summary && (
                      <div className="card p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <BarChart2 className="h-4 w-4 text-brand-600" />
                          <p className="text-sm font-bold text-gray-900">Market Positioning</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selected.analysis.positioning_summary}
                        </p>
                      </div>
                    )}

                    {/* Strengths + Vulnerabilities */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="card p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-3">
                          Strengths
                        </p>
                        {(selected.analysis.strengths ?? []).length > 0 ? (
                          <ul className="space-y-2.5">
                            {selected.analysis.strengths!.map((s, i) => (
                              <li key={i} className="flex gap-2 text-sm text-gray-700">
                                <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span className="leading-relaxed">{s}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-400">None identified</p>
                        )}
                      </div>
                      <div className="card p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 mb-3">
                          Vulnerabilities
                        </p>
                        {(selected.analysis.vulnerabilities ?? []).length > 0 ? (
                          <ul className="space-y-2.5">
                            {selected.analysis.vulnerabilities!.map((v, i) => (
                              <li key={i} className="flex gap-2 text-sm text-gray-700">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                                <span className="leading-relaxed">{v}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-400">None identified</p>
                        )}
                      </div>
                    </div>

                    {/* Recent activity */}
                    {selected.analysis.recent_shifts && (
                      <div className="card p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-bold text-gray-900">Recent Activity</p>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selected.analysis.recent_shifts}
                        </p>
                      </div>
                    )}

                    {/* Strategic implication */}
                    {selected.analysis.strategic_implication && (
                      <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5">
                        <div className="flex gap-2.5">
                          <Eye className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 mb-1.5">
                              Strategic implication for you
                            </p>
                            <p className="text-sm text-brand-800 leading-relaxed">
                              {selected.analysis.strategic_implication}
                            </p>
                            <Link
                              href="/session"
                              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                            >
                              Discuss in a Strategy Session
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="card p-10 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100">
                      <Zap className="h-6 w-6 text-brand-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">No analysis yet</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Click &ldquo;Run analysis&rdquo; to generate AI insights.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
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
            {/* Summary strip — full width, 3 equal columns */}
            {patterns.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                <SummaryTile
                  count={highCount}
                  label="High priority"
                  color="text-red-600"
                  bg="bg-red-50"
                  border="border-red-100"
                />
                <SummaryTile
                  count={mediumCount}
                  label="Market signals"
                  color="text-amber-600"
                  bg="bg-amber-50"
                  border="border-amber-100"
                />
                <SummaryTile
                  count={lowCount}
                  label="Watch items"
                  color="text-gray-500"
                  bg="bg-gray-50"
                  border="border-gray-200"
                />
              </div>
            )}

            {/* Pattern cards — 2 columns when 2+ patterns */}
            {patterns.length > 0 ? (
              <div className={cn(
                "grid gap-4",
                patterns.length === 1 ? "grid-cols-1 max-w-2xl" : "grid-cols-2"
              )}>
                {patterns.map((pattern, i) => (
                  <PatternCard key={i} pattern={pattern} index={i} />
                ))}
              </div>
            ) : (
              <div className="card p-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-900">No patterns detected yet</p>
                <p className="mt-1 text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Patterns emerge after running analysis on your competitor set.
                </p>
                <button onClick={handleAnalyze} disabled={analyzing} className="btn-secondary mt-5 text-sm gap-2">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Run analysis
                </button>
              </div>
            )}

            {patterns.length > 0 && (
              <p className="text-xs text-gray-400 text-center pt-1">
                Pattern analysis strengthens from week 4+ as baseline data accumulates.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PageHeader({
  analyzing,
  onAnalyze,
  error,
  count,
}: {
  analyzing: boolean;
  onAnalyze: () => void;
  error: string;
  count?: number;
}) {
  return (
    <div className="flex items-start justify-between mb-0">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-brand-600" />
          <span className="text-sm font-semibold text-gray-500">Competitor Analyzer</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900">Your competitive set</h1>
        {count !== undefined && (
          <p className="mt-1 text-sm text-gray-500">
            {count} competitor{count !== 1 ? "s" : ""} tracked
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {error && (
          <p className="text-xs text-red-600 max-w-[180px] text-right leading-tight">{error}</p>
        )}
        <button
          onClick={onAnalyze}
          disabled={analyzing}
          className="btn-primary gap-2 text-sm py-2"
        >
          {analyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {analyzing ? "Analysing…" : "Run analysis"}
        </button>
      </div>
    </div>
  );
}

function SummaryTile({
  count,
  label,
  color,
  bg,
  border,
}: {
  count: number;
  label: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={cn("rounded-xl border p-3.5 text-center", bg, border)}>
      <p className={cn("text-2xl font-black tabular-nums", color)}>{count}</p>
      <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{label}</p>
    </div>
  );
}
