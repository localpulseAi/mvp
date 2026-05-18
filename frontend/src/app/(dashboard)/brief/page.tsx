"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Newspaper,
  Clock,
  RefreshCw,
  Users,
  TrendingUp,
  Eye,
  Calendar,
  Loader2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getCurrentBrief, generateBrief, listBriefs, type WeeklyBriefOut } from "@/lib/api";

type PastBriefSummary = { id: string; week_start: string; week_end: string; status: string };

function formatWeekLabel(weekStart: string) {
  const d = new Date(weekStart);
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

export default function BriefPage() {
  const [brief, setBrief] = useState<WeeklyBriefOut | null>(null);
  const [pastBriefs, setPastBriefs] = useState<PastBriefSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function loadBrief() {
    setLoading(true);
    setError("");
    try {
      const [currentRes, listRes] = await Promise.all([
        getCurrentBrief(),
        listBriefs(),
      ]);
      setBrief(currentRes?.brief ?? null);
      setPastBriefs((listRes.briefs ?? []).slice(1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brief.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBrief();
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateBrief();
      // Brief runs in background (~45s). Poll once after delay.
      setTimeout(() => {
        loadBrief().finally(() => setGenerating(false));
      }, 50000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="min-h-screen p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-gray-500">Weekly Strategic Brief</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">No brief yet</h1>
        </div>
        <div className="card max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
            <Zap className="h-7 w-7 text-brand-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Generate your first brief</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Your weekly strategic brief analyses market signals, competitor moves, and your business
            context to produce actionable recommendations.
          </p>
          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-primary mt-6"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating… ~45s
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Generate brief
              </>
            )}
          </button>
          {generating && (
            <p className="mt-3 text-xs text-gray-400">
              Running 2 analyst agents. This page will refresh automatically.
            </p>
          )}
        </div>
      </div>
    );
  }

  const recommendations = brief.recommendations ?? [];
  const watchFor = brief.watch_for ?? [];
  const competitorEntries = brief.competitor_section?.entries ?? [];

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-gray-500">Weekly Strategic Brief</span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Week of {formatWeekLabel(brief.week_start)}
          </h1>
          <div className="mt-1 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Generated {new Date(brief.generated_at).toLocaleDateString("en-CA", {
                weekday: "long", month: "short", day: "numeric",
              })}
            </div>
            <Badge variant="green" dot>Live</Badge>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-secondary gap-2 text-sm py-2"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {generating ? "Generating…" : "Re-generate"}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Brief history sidebar */}
        <aside className="w-48 shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Past Briefs
          </p>
          <div className="space-y-1">
            <div className="rounded-xl bg-brand-50 px-3 py-2.5 border border-brand-200">
              <p className="text-xs font-semibold text-brand-700">This week</p>
              <p className="text-[11px] text-brand-600">{formatWeekLabel(brief.week_start)}</p>
            </div>
            {pastBriefs.map((b) => (
              <button
                key={b.id}
                className="w-full rounded-xl px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="text-xs font-medium text-gray-700">
                  Week of {formatWeekLabel(b.week_start)}
                </p>
                <p className="text-[11px] text-gray-400">{formatWeekLabel(b.week_start)}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Brief content */}
        <div className="flex-1 max-w-2xl">
          {/* Data freshness */}
          {brief.data_freshness && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">
                Based on data through {formatWeekLabel(brief.week_end)}
              </span>
            </div>
          )}

          {/* Market Read */}
          {brief.market_read && (
            <div className="card mb-5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-brand-600" />
                <h2 className="text-base font-bold text-gray-900">Market Read</h2>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {brief.market_read}
              </p>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="card mb-5 overflow-hidden">
              <div className="bg-brand-600 px-6 py-4">
                <h2 className="text-base font-bold text-white">This Week's Recommendations</h2>
                <p className="text-xs text-brand-200 mt-0.5">
                  {recommendations.length} move{recommendations.length !== 1 ? "s" : ""} for the week ahead
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-6">
                    <div className="flex items-start gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{rec.title}</p>
                        <p className="mt-2 text-sm text-gray-700 leading-relaxed">{rec.body}</p>
                        {rec.reasoning && (
                          <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 p-3">
                            <p className="text-xs font-semibold text-amber-700">Reasoning</p>
                            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                              {rec.reasoning}
                            </p>
                          </div>
                        )}
                        {rec.watch_for && rec.watch_for.length > 0 && (
                          <div className="mt-3 rounded-lg bg-gray-50 p-3">
                            <p className="text-xs font-semibold text-gray-600">What to watch for</p>
                            <ul className="mt-1 space-y-1">
                              {rec.watch_for.map((w, j) => (
                                <li key={j} className="text-xs text-gray-600 flex gap-1.5">
                                  <span className="mt-1.5 h-1 w-1 rounded-full bg-gray-400 shrink-0" />
                                  {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watch for */}
          {watchFor.length > 0 && (
            <div className="card mb-5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-4 w-4 text-gray-600" />
                <h2 className="text-base font-bold text-gray-900">What to Watch This Week</h2>
              </div>
              <ul className="space-y-2">
                {watchFor.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Competitor watch */}
          {competitorEntries.length > 0 && (
            <div className="card p-6 border-brand-100 bg-brand-50/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-600" />
                  <h2 className="text-base font-bold text-gray-900">From Your Competitor Watch</h2>
                </div>
                <Link href="/competitors" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  Full analysis →
                </Link>
              </div>
              <div className="space-y-3">
                {competitorEntries.map((entry, i) => (
                  <div key={i} className="rounded-xl bg-white border border-brand-100 p-4">
                    <p className="text-sm font-bold text-gray-900">{entry.name}</p>
                    <p className="mt-1 text-xs text-gray-700 leading-relaxed">{entry.observation}</p>
                    <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2">
                      <p className="text-xs font-semibold text-brand-700">Strategic implication</p>
                      <p className="text-xs text-brand-700 mt-0.5 leading-relaxed">
                        {entry.implication}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: upcoming occasions */}
        <aside className="hidden xl:block w-56 shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Upcoming Occasions
          </p>
          <div className="space-y-2">
            {[
              { label: "Mother's Day", date: "May 11", badge: "7 days", color: "brand" },
              { label: "Victoria Day", date: "May 19", badge: "15 days", color: "amber" },
              { label: "Lilac Festival", date: "May 24–25", badge: "20 days", color: "gray" },
              { label: "Stampede", date: "Jul 4", badge: "61 days", color: "amber" },
            ].map((o) => (
              <div key={o.label} className="card p-3.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-900">{o.label}</p>
                  <Badge variant={o.color as "brand" | "amber" | "gray"} className="text-[10px]">
                    {o.badge}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {o.date}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
