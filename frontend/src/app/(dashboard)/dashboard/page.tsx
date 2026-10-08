"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Newspaper,
  MessageSquare,
  Users,
  TrendingUp,
  Calendar,
  Sparkles,
  Eye,
  Activity,
  ArrowRight,
  Info,
} from "lucide-react";
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
import { SectionCard, StatCard } from "@/components/dashboard/primitives";
import { PlaysList, SessionsList, CalendarList, PulseList } from "@/components/dashboard/widgets";

/* ─── helpers ──────────────────────────────────────────────── */

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-CA", {
    weekday: "long", month: "short", day: "numeric", year: "numeric",
  });
}

/* ─── page ─────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [brief, setBrief] = useState<WeeklyBriefOut | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [occasions, setOccasions] = useState<OccasionItem[]>([]);
  const [competitorCount, setCompetitorCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      getMe().then(setOwner),
      getCurrentBrief().then((r) => r?.brief && setBrief(r.brief)),
      listSessions().then((r) => setSessions(r.sessions.slice(0, 3))),
      getRecentChanges(7).then((r) => setChanges((r.changes ?? []).slice(0, 3))),
      getOccasions().then((r) => setOccasions((r.occasions ?? []).slice(0, 4))),
      getCompetitors().then((cs) => setCompetitorCount(cs.length)),
    ]).then((results) => {
      setLoadError(results.some((result) => result.status === "rejected"));
    }).finally(() => setLoading(false));
  }, []);

  const businessName = owner?.business_name ?? "your business";
  const plays = (brief?.recommendations ?? []).slice(0, 2);
  const urgentChange = changes.find((c) => c.severity === "high");

  const stats = [
    {
      label: "Weekly brief",
      value: brief ? "Ready" : "Pending",
      sub: brief
        ? `Week of ${new Date(brief.week_start).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`
        : "Next Monday",
      icon: Newspaper,
    },
    { label: "Sessions", value: String(sessions.length), sub: "this month", icon: MessageSquare },
    { label: "Tracked", value: String(competitorCount), sub: "competitors", icon: Users },
    {
      label: "Changes",
      value: String(changes.length),
      sub: changes.length > 0 ? "New this week, review below" : "this week",
      icon: Activity,
      tone: changes.length > 0 ? ("alert" as const) : ("default" as const),
    },
  ];

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{todayLabel()}</p>
          <h1 className="page-title mt-1.5">
            {greeting()}, {businessName}
          </h1>
          <p className="muted mt-1">Here&apos;s what deserves your attention this week.</p>
        </div>
        <Link href="/session" className="btn-primary self-start sm:self-auto">
          <Sparkles className="h-4 w-4" />
          New strategy session
        </Link>
      </div>

      {/* Prototype notice */}
      <div className="flex items-start gap-3 rounded-control border border-brand-200/60 bg-lilac px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-ink">Agenzy prototype demo. </span>
          {loading
            ? "Connecting to workspace data…"
            : loadError
            ? "Workspace data could not be reached; illustrative samples are shown where relevant."
            : "Results shown here depend on the configured workspace and sources."}
        </p>
      </div>

      {/* High-priority competitor signal */}
      {urgentChange && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" as const }}
          className="card-ink flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-lime-300">
            <Eye className="h-5 w-5 text-ink" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              High-priority signal
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {urgentChange.competitor_name}: <span className="font-normal text-white/80">{urgentChange.description}</span>
            </p>
          </div>
          <Link href="/session" className="btn-lime shrink-0 self-start sm:self-auto">
            Plan a response <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} index={i} {...s} />
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <SectionCard
            icon={TrendingUp}
            title="This week's plays"
            meta={<span className="text-xs text-gray-500">From current brief</span>}
            footer={{ href: "/brief", label: brief ? "Read full brief" : "Generate your first brief" }}
            index={4}
          >
            <PlaysList plays={plays} />
          </SectionCard>

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
            <SessionsList sessions={sessions} />
          </SectionCard>
        </div>

        <div className="flex flex-col gap-6">
          <SectionCard icon={Calendar} title="Market calendar" index={6}>
            <CalendarList occasions={occasions} />
          </SectionCard>

          <SectionCard
            icon={Eye}
            title="Competitor pulse"
            footer={{ href: "/competitors", label: "View competitors" }}
            index={7}
          >
            <PulseList changes={changes} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
