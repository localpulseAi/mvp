"use client";
import { parseApiDate } from "@/lib/utils";

import { MotionConfig } from "framer-motion";
import {
  getMe,
  getCurrentBrief,
  listSessions,
  getRecentChanges,
  getOccasions,
  getCompetitors,
  type OwnerProfile,
  type WeeklyBriefOut,
  type SessionSummary,
  type ChangeItem,
  type OccasionItem,
} from "@/lib/api";
import { errorMessage, useWorkspaceData } from "@/lib/workspace";
import { demoBrief, demoChanges, demoCompetitors, demoOccasions, demoOwner, demoSessions } from "@/lib/demo-workspace";
import { DemoBanner, ErrorState, LoadingState } from "@/components/ui/states";
import { SectionError } from "@/components/dashboard/primitives";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { Glance, Greeting } from "@/components/dashboard/Glance";
import { MovesBoard, useTriedMoves } from "@/components/dashboard/MovesBoard";
import { OccasionTimeline } from "@/components/dashboard/OccasionTimeline";
import { SignalStrip } from "@/components/dashboard/SignalStrip";
import { AskPip } from "@/components/dashboard/AskPip";

/* ─── data ─────────────────────────────────────────────────── */

/** Each section loads independently; a failure stays visible as a failure. */
type Section<T> = { ok: true; data: T } | { ok: false; error: string };

type DashboardData = {
  owner: Section<OwnerProfile>;
  brief: Section<WeeklyBriefOut | null>;
  sessions: Section<SessionSummary[]>;
  changes: Section<ChangeItem[]>;
  occasions: Section<OccasionItem[]>;
  competitors: Section<string[]>;
};

const ok = <T,>(data: T): Section<T> => ({ ok: true, data });

function settle<T>(p: Promise<T>): Promise<Section<T>> {
  return p.then(ok, (err) => ({ ok: false as const, error: errorMessage(err) }));
}

async function loadLive(): Promise<DashboardData> {
  const [owner, brief, sessions, changes, occasions, competitors] = await Promise.all([
    settle(getMe()),
    settle(getCurrentBrief().then((r) => r?.brief ?? null)),
    settle(listSessions().then((r) => r.sessions)),
    settle(getRecentChanges(7).then((r) => r.changes ?? [])),
    settle(getOccasions().then((r) => r.occasions ?? [])),
    settle(getCompetitors().then((cs) => cs.map((c) => c.name))),
  ]);
  return { owner, brief, sessions, changes, occasions, competitors };
}

const demoData: DashboardData = {
  owner: ok(demoOwner),
  brief: ok(demoBrief),
  sessions: ok(demoSessions),
  changes: ok(demoChanges),
  occasions: ok(demoOccasions),
  competitors: ok(demoCompetitors.map((c) => c.name)),
};

/* ─── helpers ──────────────────────────────────────────────── */

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

function shortDate(iso: string) {
  return parseApiDate(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

/* ─── page ─────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { state, reload } = useWorkspaceData(loadLive, demoData);
  const ready = state.status === "ready" ? state : null;
  const currentBrief = ready && ready.data.brief.ok ? ready.data.brief.data : null;
  const recs = currentBrief?.recommendations ?? [];
  const { tried, toggle } = useTriedMoves(currentBrief?.id ?? null, recs.length);

  if (state.status === "loading") {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <LoadingState label="Loading your workspace" />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <ErrorState message={state.error} onRetry={reload} />
      </div>
    );
  }

  const { mode, data } = state;
  const { owner, brief, sessions, changes, occasions, competitors } = data;
  const isDemo = mode === "demo";

  const businessName = owner.ok ? owner.data.business_name : null;
  const upcoming = occasions.ok ? [...occasions.data].sort((a, b) => a.days_out - b.days_out) : null;
  const nextOccasion = upcoming ? upcoming.find((o) => o.days_out >= 0) ?? null : undefined;
  const highCount = changes.ok ? changes.data.filter((c) => c.severity === "high").length : 0;

  const chips: { label: string; tone?: "alert" | "lime" | "plain" }[] = [];
  if (recs.length) chips.push({ label: `${recs.length} moves this week`, tone: "lime" });
  if (highCount) chips.push({ label: `${highCount} urgent signal${highCount > 1 ? "s" : ""}`, tone: "alert" });
  if (nextOccasion && nextOccasion.days_out <= 21) chips.push({ label: `${nextOccasion.name.split(":")[0]} in ${nextOccasion.days_out}d` });
  if (!chips.length) chips.push({ label: "Here's your week" });

  const setupSteps = [
    {
      label: "Add your business name and location",
      done: owner.ok && !!owner.data.business_name && !!owner.data.address,
      href: "/settings#profile",
      cta: "Complete profile",
    },
    {
      label: "Follow at least one nearby business",
      done: competitors.ok && competitors.data.length > 0,
      href: "/settings#competitors",
      cta: "Add a business",
    },
    { label: "Generate your first weekly brief", done: false, href: "/brief", cta: "Go to Weekly Brief" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {isDemo && <DemoBanner what="a sample dashboard" />}

        <Greeting
          eyebrow={todayLabel()}
          title={businessName ? `${greeting()}, ${businessName}` : "Your next moves"}
          chips={chips}
        />

        <Glance
          moves={brief.ok ? { tried: tried.length, total: recs.length } : null}
          changes={changes.ok ? changes.data : null}
          nextOccasion={nextOccasion}
          following={competitors.ok ? { names: competitors.data } : null}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="min-w-0 lg:col-span-3">
            {!brief.ok ? (
              <ErrorState title="We couldn't load this week's brief" message={brief.error} onRetry={reload} />
            ) : currentBrief && recs.length ? (
              <MovesBoard
                recs={recs}
                weekLabel={`Week of ${shortDate(currentBrief.week_start)}`}
                tried={tried}
                onToggle={toggle}
              />
            ) : (
              <SetupChecklist steps={setupSteps} />
            )}
          </div>
          <div className="min-w-0 lg:col-span-2">
            <AskPip sessions={sessions.ok ? sessions.data : null} sessionsError={sessions.ok ? undefined : sessions.error} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {occasions.ok ? (
            <OccasionTimeline occasions={occasions.data} />
          ) : (
            <div className="card"><SectionError message={occasions.error} onRetry={reload} /></div>
          )}
          {changes.ok ? (
            <SignalStrip changes={changes.data} competitors={competitors.ok ? competitors.data : []} />
          ) : (
            <div className="card"><SectionError message={changes.error} onRetry={reload} /></div>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
