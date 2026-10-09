"use client";
import { parseApiDate } from "@/lib/utils";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MotionConfig } from "framer-motion";
import { Loader2, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
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
import { BriefHero } from "@/components/brief/BriefHero";
import { WeekSignals } from "@/components/brief/WeekSignals";
import { MovesExplorer } from "@/components/brief/MovesExplorer";
import { CompetitorCards, EvidenceMeters, WatchStrip } from "@/components/brief/BriefExtras";
import { OccasionTimeline } from "@/components/dashboard/OccasionTimeline";
import { useTriedMoves } from "@/components/dashboard/MovesBoard";
import { PipImg } from "@/components/dashboard/viz";

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
  return { brief: current?.brief ?? null, history: (list.briefs ?? []).slice(1), occasions: occasions ?? null };
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

  const readyBrief = state.status === "ready" ? state.data.brief : null;
  const { tried, toggle } = useTriedMoves(readyBrief?.id ?? null, readyBrief?.recommendations?.length ?? 0);

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
          <PipImg pose="checklist" size={96} />
          <h2 className="mt-3 font-display text-xl font-semibold text-ink">
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
  const chips: { label: string; tone?: "lime" | "plain" }[] = [];
  if (recommendations.length) chips.push({ label: `${recommendations.length} moves`, tone: "lime" });
  if (competitorEntries.length) chips.push({ label: `${competitorEntries.length} competitor signals` });
  if (brief.data_freshness) chips.push({ label: `${Object.keys(brief.data_freshness).length} sources` });
  chips.push({ label: isDemo ? "Sample · fictional café" : "From your workspace" });

  return wrap(
    <>
      {isDemo && <DemoBanner what="a sample weekly brief" />}

      <BriefHero
        title={`Week of ${fmt(brief.week_start, { month: "long", day: "numeric" })}`}
        range={`${fmt(brief.week_start)} – ${fmt(brief.week_end, { month: "short", day: "numeric", year: "numeric" })}`}
        generated={`Generated ${fmt(brief.generated_at, { weekday: "short", month: "short", day: "numeric" })}`}
        chips={chips}
        action={
          !isDemo && (
            <button onClick={handleGenerate} disabled={generating} className="btn-lime">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
              {generating ? "Regenerating…" : "Regenerate"}
            </button>
          )
        }
      />
      {genStatus}

      {brief.market_read && <WeekSignals text={brief.market_read} />}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-5">
          {recommendations.length > 0 && <MovesExplorer recs={recommendations} tried={tried} onToggle={toggle} />}
          {watchFor.length > 0 && <WatchStrip items={watchFor} />}
          {competitorEntries.length > 0 && <CompetitorCards entries={competitorEntries} />}
          {occasions ? (
            <OccasionTimeline occasions={occasions} />
          ) : (
            <p className="text-sm text-gray-500">Upcoming occasions couldn&apos;t be loaded.</p>
          )}
        </div>

        <aside className="space-y-5">
          {brief.data_freshness && <EvidenceMeters freshness={brief.data_freshness} />}

          <section className="card p-4" aria-labelledby="past-title">
            <h2 id="past-title" className="font-display text-sm font-semibold text-ink">
              Past briefs
            </h2>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">This is your first brief.</p>
            ) : (
              <ol className="relative mt-3 space-y-3 border-l-2 border-lilac pl-4">
                {history.map((b) => (
                  <li key={b.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-300" aria-hidden="true" />
                    <p className="text-sm font-medium text-ink">Week of {fmt(b.week_start)}</p>
                    <p className="text-[11px] capitalize text-gray-500">{b.status}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
