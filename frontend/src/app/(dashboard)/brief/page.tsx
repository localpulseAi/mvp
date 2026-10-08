"use client";

import { useEffect, useState } from "react";
import { Clock, RefreshCw, Loader2, Sparkles, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { getCurrentBrief, generateBrief, listBriefs, type WeeklyBriefOut } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  MarketRead,
  Recommendations,
  WatchList,
  CompetitorWatch,
  SampleOccasions,
  SampleBriefCard,
} from "@/components/brief/BriefSections";

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
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-gray-700">Loading the brief workspace…</p>
        <p className="text-xs text-gray-500">If no workspace data is connected, an illustrative sample will be shown.</p>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <p className="eyebrow">Weekly strategic brief</p>
        <h1 className="page-title mt-1.5">No workspace brief yet</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <div className="card-lilac flex flex-col p-6 sm:p-8">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-violet">
              <Newspaper className="h-6 w-6 text-white" />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold text-ink">
              Your brief starts <span className="highlight">here</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              This prototype can display briefs when a workspace and its data sources are configured.
              The example alongside is illustrative product content, not a customer result, live market
              data, or a Claude-generated output.
            </p>
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={handleGenerate} disabled={generating} className="btn-primary">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Requesting brief…" : "Generate workspace brief"}
              </button>
              <button onClick={loadBrief} className="btn-secondary">Try again</button>
            </div>
            {generating && (
              <p className="mt-3 text-xs text-gray-500">
                The request may take a short time; this page will check once it completes.
              </p>
            )}
          </div>
          <SampleBriefCard />
        </div>
      </div>
    );
  }

  const recommendations = brief.recommendations ?? [];
  const watchFor = brief.watch_for ?? [];
  const competitorEntries = brief.competitor_section?.entries ?? [];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Weekly strategic brief</p>
          <h1 className="page-title mt-1.5">Week of {formatWeekLabel(brief.week_start)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              Generated{" "}
              {new Date(brief.generated_at).toLocaleDateString("en-CA", {
                weekday: "long", month: "short", day: "numeric",
              })}
            </span>
            <Badge variant="green" dot>Workspace data</Badge>
            {brief.data_freshness && (
              <span className="text-xs text-gray-500">
                Data through {formatWeekLabel(brief.week_end)}
              </span>
            )}
          </div>
        </div>
        <button onClick={handleGenerate} disabled={generating} className="btn-secondary self-start sm:self-auto">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {generating ? "Generating…" : "Regenerate"}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_240px]">
        {/* Brief history */}
        <aside>
          <p className="eyebrow text-gray-500">Past briefs</p>
          <div className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            <div className="rounded-control border border-brand-200 bg-lilac px-3 py-2.5">
              <p className="text-sm font-semibold text-brand-700">This week</p>
              <p className="tabular text-xs text-brand-600">{formatWeekLabel(brief.week_start)}</p>
            </div>
            {pastBriefs.map((b) => (
              <button
                key={b.id}
                className={cn(
                  "rounded-control px-3 py-2.5 text-left transition-colors hover:bg-white hover:shadow-soft"
                )}
              >
                <p className="text-sm font-medium text-gray-700">Week of</p>
                <p className="tabular text-xs text-gray-500">{formatWeekLabel(b.week_start)}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Brief content */}
        <div className="min-w-0 space-y-6">
          {brief.market_read && <MarketRead text={brief.market_read} />}
          {recommendations.length > 0 && <Recommendations items={recommendations} />}
          {watchFor.length > 0 && <WatchList items={watchFor} />}
          {competitorEntries.length > 0 && <CompetitorWatch entries={competitorEntries} />}
        </div>

        <aside className="hidden xl:block">
          <SampleOccasions />
        </aside>
      </div>
    </div>
  );
}
