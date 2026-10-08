"use client";
import { parseApiDate } from "@/lib/utils";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { Clock, Loader2, RefreshCw, Sparkles, Newspaper, CheckCircle2 } from "lucide-react";
import {
  generateBrief,
  getCurrentBrief,
  getOccasions,
  listBriefs,
  type OccasionItem,
  type WeeklyBriefOut,
} from "@/lib/api";
import { errorMessage, useWorkspaceData } from "@/lib/workspace";
import { demoBrief, demoBriefHistory, demoOccasions } from "@/lib/demo-workspace";
import { DemoBanner, ErrorState, LoadingState, PageHeader } from "@/components/ui/states";
import {
  CompetitorWatch,
  DataFreshness,
  MarketRead,
  Recommendations,
  UpcomingOccasions,
  WatchList,
} from "@/components/brief/BriefSections";

type PastBriefSummary = { id: string; week_start: string; week_end: string; status: string };

type BriefData = {
  brief: WeeklyBriefOut | null;
  history: PastBriefSummary[];
  /** null = occasions failed to load (shown as such, never as "none") */
  occasions: OccasionItem[] | null;
};

async function loadLive(): Promise<BriefData> {
  const [current, list, occasions] = await Promise.all([
    getCurrentBrief(),
    listBriefs(),
    getOccasions().then((r) => r.occasions ?? [], () => null),
  ]);
  return { brief: current?.brief ?? null, history: (list.briefs ?? []).slice(1), occasions: occasions?.slice(0, 4) ?? null };
}

const demoData: BriefData = { brief: demoBrief, history: demoBriefHistory.slice(1), occasions: demoOccasions };

function fmt(d: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return parseApiDate(d).toLocaleDateString("en-CA", opts);
}

const POLL_MS = 10_000;
const POLL_LIMIT = 12; // ~2 minutes

export default function BriefPage() {
  const { state, reload } = useWorkspaceData(loadLive, demoData);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const polls = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  // Stop the progress indicator once a new brief arrives.
  const startedWith = useRef<string | null>(null);
  useEffect(() => {
    if (!generating || state.status !== "ready") return;
    const id = state.data.brief?.id ?? null;
    if (id && id !== startedWith.current) setGenerating(false);
  }, [generating, state]);

  async function handleGenerate() {
    setGenError("");
    startedWith.current = state.status === "ready" ? state.data.brief?.id ?? null : null;
    setGenerating(true);
    try {
      await generateBrief();
      polls.current = 0;
      const poll = () => {
        polls.current += 1;
        reload();
        if (polls.current < POLL_LIMIT) timer.current = setTimeout(poll, POLL_MS);
        else {
          setGenerating(false);
          setGenError("This is taking longer than usual. Your brief will appear here when it's ready.");
        }
      };
      timer.current = setTimeout(poll, POLL_MS);
    } catch (err) {
      setGenerating(false);
      setGenError(errorMessage(err));
    }
  }

  const wrap = (children: React.ReactNode) => (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </MotionConfig>
  );

  if (state.status === "loading") return wrap(<LoadingState label="Loading your brief" />);
  if (state.status === "error") {
    return wrap(
      <>
        <PageHeader eyebrow="Weekly strategic brief" title="This week's brief" />
        <ErrorState title="We couldn't load your brief" message={state.error} onRetry={reload} />
      </>
    );
  }

  const { mode, data } = state;
  const isDemo = mode === "demo";
  const { brief, history, occasions } = data;

  const genStatus = (generating || genError) && (
    <p role="status" aria-live="polite" className={genError ? "text-sm text-red-700" : "flex items-center gap-2 text-sm text-gray-600"}>
      {genError || (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden="true" />
          Generating your brief. This usually takes about a minute; you can leave this page.
        </>
      )}
    </p>
  );

  /* ── Live, not yet generated ─────────────────────────────── */
  if (!brief) {
    return wrap(
      <>
        <PageHeader
          eyebrow="Weekly strategic brief"
          title="No brief yet"
          description="Briefs arrive every Monday once your workspace has enough context."
        />
        <section className="card-lilac max-w-3xl p-6 sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-violet">
            <Newspaper className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-xl font-semibold text-ink">
            Your brief starts <span className="highlight">here</span>
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            Agenzy builds each brief from your business profile, the nearby businesses you follow, and upcoming local
            occasions. Check these are in place before generating:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            {[
              { label: "Business name, location, and category", href: "/settings" },
              { label: "At least one nearby business to follow", href: "/settings#competitors" },
            ].map((p) => (
              <li key={p.label} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="flex-1">{p.label}</span>
                <Link href={p.href} className="font-semibold text-brand-700 hover:underline">Review</Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={handleGenerate} disabled={generating} className="btn-primary">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
              {generating ? "Generating…" : "Generate this week's brief"}
            </button>
          </div>
          <div className="mt-3">{genStatus}</div>
        </section>
      </>
    );
  }

  /* ── Ready ───────────────────────────────────────────────── */
  const recommendations = brief.recommendations ?? [];
  const watchFor = brief.watch_for ?? [];
  const competitorEntries = brief.competitor_section?.entries ?? [];

  return wrap(
    <>
      {isDemo && <DemoBanner what="a sample weekly brief" />}

      <PageHeader
        eyebrow="Weekly strategic brief"
        title={`Week of ${fmt(brief.week_start, { month: "long", day: "numeric" })}`}
        description={`${fmt(brief.week_start)} – ${fmt(brief.week_end, { month: "short", day: "numeric", year: "numeric" })}`}
        action={
          !isDemo && (
            <button onClick={handleGenerate} disabled={generating} className="btn-secondary">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
              {generating ? "Regenerating…" : "Regenerate"}
            </button>
          )
        }
      />
      <div className="-mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Generated {fmt(brief.generated_at, { weekday: "long", month: "short", day: "numeric" })}
        </span>
        <span>{isDemo ? "Sample brief · fictional café" : "From your workspace data"}</span>
      </div>
      {genStatus}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-6">
          {brief.market_read && <MarketRead text={brief.market_read} />}
          {recommendations.length > 0 && <Recommendations items={recommendations} />}
          {watchFor.length > 0 && <WatchList items={watchFor} />}
          {competitorEntries.length > 0 && <CompetitorWatch entries={competitorEntries} />}
        </div>

        <aside className="space-y-6">
          {brief.data_freshness && <DataFreshness freshness={brief.data_freshness} />}

          {occasions ? (
            <UpcomingOccasions occasions={occasions} />
          ) : (
            <p className="text-sm text-gray-500">Upcoming occasions couldn&apos;t be loaded.</p>
          )}

          <section aria-labelledby="past-title">
            <h2 id="past-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">
              Past briefs
            </h2>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">This is your first brief.</p>
            ) : (
              <ul className="mt-3 space-y-1">
                {history.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-control px-3 py-2 text-sm">
                    <span className="text-gray-700">Week of {fmt(b.week_start)}</span>
                    <span className="text-xs capitalize text-gray-500">{b.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
