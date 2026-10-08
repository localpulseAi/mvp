"use client";
import { parseApiDate } from "@/lib/utils";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { Newspaper, MessageSquare, Users, TrendingUp, Calendar, Sparkles, Eye, Activity, ArrowRight } from "lucide-react";
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
import { DemoBanner, ErrorState, LoadingState, PageHeader } from "@/components/ui/states";
import { SectionCard, SectionError, StatCard } from "@/components/dashboard/primitives";
import { PlaysList, SessionsList, CalendarList, PulseList } from "@/components/dashboard/widgets";
import { SetupChecklist, TopMove } from "@/components/dashboard/TopMove";

/* ─── data ─────────────────────────────────────────────────── */

/** Each section loads independently; a failure stays visible as a failure. */
type Section<T> = { ok: true; data: T } | { ok: false; error: string };

type DashboardData = {
  owner: Section<OwnerProfile>;
  brief: Section<WeeklyBriefOut | null>;
  sessions: Section<SessionSummary[]>;
  changes: Section<ChangeItem[]>;
  occasions: Section<OccasionItem[]>;
  competitorCount: Section<number>;
};

const ok = <T,>(data: T): Section<T> => ({ ok: true, data });

function settle<T>(p: Promise<T>): Promise<Section<T>> {
  return p.then(ok, (err) => ({ ok: false as const, error: errorMessage(err) }));
}

async function loadLive(): Promise<DashboardData> {
  const [owner, brief, sessions, changes, occasions, competitorCount] = await Promise.all([
    settle(getMe()),
    settle(getCurrentBrief().then((r) => r?.brief ?? null)),
    settle(listSessions().then((r) => r.sessions)),
    settle(getRecentChanges(7).then((r) => r.changes ?? [])),
    settle(getOccasions().then((r) => r.occasions ?? [])),
    settle(getCompetitors().then((cs) => cs.length)),
  ]);
  return { owner, brief, sessions, changes, occasions, competitorCount };
}

const demoData: DashboardData = {
  owner: ok(demoOwner),
  brief: ok(demoBrief),
  sessions: ok(demoSessions),
  changes: ok(demoChanges),
  occasions: ok(demoOccasions),
  competitorCount: ok(demoCompetitors.length),
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
  const { owner, brief, sessions, changes, occasions, competitorCount } = data;
  const isDemo = mode === "demo";

  const businessName = owner.ok ? owner.data.business_name : null;
  const currentBrief = brief.ok ? brief.data : null;
  const topRec = currentBrief?.recommendations?.[0] ?? null;
  const otherPlays = (currentBrief?.recommendations ?? []).slice(1, 3);
  const urgentChange = changes.ok ? changes.data.find((c) => c.severity === "high") : undefined;

  const stats = [
    {
      label: "Weekly brief",
      value: !brief.ok ? "Unavailable" : currentBrief ? "Ready" : "Not yet",
      sub: !brief.ok
        ? "Couldn't check status"
        : currentBrief
        ? `Week of ${shortDate(currentBrief.week_start)}`
        : "Complete setup to generate",
      icon: Newspaper,
    },
    {
      label: "Sessions",
      value: sessions.ok ? String(sessions.data.length) : "Unavailable",
      sub: sessions.ok ? "strategy sessions" : "Couldn't load sessions",
      icon: MessageSquare,
    },
    {
      label: "Following",
      value: competitorCount.ok ? String(competitorCount.data) : "Unavailable",
      sub: competitorCount.ok ? "nearby businesses" : "Couldn't load competitors",
      icon: Users,
    },
    {
      label: "Changes",
      value: changes.ok ? String(changes.data.length) : "Unavailable",
      sub: !changes.ok ? "Couldn't load changes" : changes.data.length > 0 ? "public changes this week" : "none this week",
      icon: Activity,
      tone: changes.ok && changes.data.some((c) => c.severity === "high") ? ("alert" as const) : ("default" as const),
    },
  ];

  const setupSteps = [
    {
      label: "Add your business name and location",
      done: owner.ok && !!owner.data.business_name && !!owner.data.address,
      href: "/settings",
      cta: "Complete profile",
    },
    {
      label: "Follow at least one nearby business",
      done: competitorCount.ok && competitorCount.data > 0,
      href: "/settings#competitors",
      cta: "Add a business",
    },
    { label: "Generate your first weekly brief", done: false, href: "/brief", cta: "Go to Weekly Brief" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {isDemo && <DemoBanner what="a sample dashboard" />}

        <PageHeader
          eyebrow={todayLabel()}
          title={businessName ? `${greeting()}, ${businessName}` : "Your next moves"}
          description={businessName ? "Your next moves for this week, most important first." : "What deserves your attention this week."}
          action={
            <Link href="/session" className="btn-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              New strategy session
            </Link>
          }
        />

        {/* Lead: one actionable recommendation */}
        {!brief.ok ? (
          <ErrorState title="We couldn't load this week's brief" message={brief.error} onRetry={reload} />
        ) : topRec && currentBrief ? (
          <TopMove rec={topRec} weekLabel={`Week of ${shortDate(currentBrief.week_start)}`} />
        ) : (
          <SetupChecklist steps={setupSteps} />
        )}

        {/* High-priority competitor signal */}
        {urgentChange && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className="card-ink flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-lime-300">
              <Eye className="h-5 w-5 text-ink" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />
                High-priority signal
              </p>
              <p className="mt-1 text-sm font-semibold text-white">
                {urgentChange.competitor_name}:{" "}
                <span className="font-normal text-white/80">{urgentChange.description}</span>
              </p>
            </div>
            <Link href="/session" className="btn-lime shrink-0 self-start sm:self-auto">
              Plan a response <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>
        )}

        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s, i) => (
            <StatCard key={s.label} index={i} {...s} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
            {currentBrief && (
              <SectionCard
                icon={TrendingUp}
                title="More moves this week"
                footer={{ href: "/brief", label: "Read full brief" }}
                index={4}
              >
                <PlaysList plays={otherPlays} />
              </SectionCard>
            )}

            <SectionCard
              icon={MessageSquare}
              title="Recent sessions"
              meta={
                <Link href="/session" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Ask something
                </Link>
              }
              index={5}
            >
              {sessions.ok ? (
                <SessionsList sessions={sessions.data.slice(0, 3)} />
              ) : (
                <SectionError message={sessions.error} onRetry={reload} />
              )}
            </SectionCard>
          </div>

          <div className="flex flex-col gap-6">
            <SectionCard icon={Calendar} title="Market calendar" index={6}>
              {occasions.ok ? (
                <CalendarList occasions={occasions.data.slice(0, 4)} />
              ) : (
                <SectionError message={occasions.error} onRetry={reload} />
              )}
            </SectionCard>

            <SectionCard icon={Eye} title="Competitor pulse" footer={{ href: "/competitors", label: "View competitors" }} index={7}>
              {changes.ok ? (
                <PulseList
                  changes={changes.data.slice(0, 3)}
                  trackedCount={competitorCount.ok ? competitorCount.data : null}
                />
              ) : (
                <SectionError message={changes.error} onRetry={reload} />
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
