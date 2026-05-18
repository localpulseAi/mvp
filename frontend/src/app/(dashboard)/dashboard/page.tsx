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
  Zap,
  ChevronRight,
  Sun,
  Clock,
  Flame,
  Eye,
  Activity,
  ArrowRight,
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
  type CompetitorOut,
} from "@/lib/api";

/* ─── helpers ──────────────────────────────────────────────── */

function heatFromDays(days: number): "critical" | "high" | "medium" | "low" {
  if (days <= 7) return "critical";
  if (days <= 21) return "high";
  if (days <= 45) return "medium";
  return "low";
}

function daysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

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

/* ─── style maps ──────────────────────────────────────────── */

const heatConfig = {
  critical: { bar: "bg-red-500",    badge: "bg-red-100 text-red-700"       },
  high:     { bar: "bg-amber-500",  badge: "bg-amber-100 text-amber-700"   },
  medium:   { bar: "bg-violet-400", badge: "bg-violet-100 text-violet-700" },
  low:      { bar: "bg-gray-200",   badge: "bg-gray-100 text-gray-500"     },
};

const severityConfig = {
  high:   { dot: "bg-red-500",   ring: "ring-red-100",   text: "text-red-600"   },
  medium: { dot: "bg-amber-500", ring: "ring-amber-100", text: "text-amber-600" },
  low:    { dot: "bg-gray-300",  ring: "ring-gray-100",  text: "text-gray-400"  },
};

const accentMap: Record<string, { bg: string; icon: string; num: string; glow: string }> = {
  violet:  { bg: "bg-violet-50",  icon: "text-violet-600",  num: "text-violet-700",  glow: ""                    },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   num: "text-amber-700",   glow: ""                    },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", num: "text-emerald-700", glow: ""                    },
  red:     { bg: "bg-red-50",     icon: "text-red-500",     num: "text-red-600",     glow: "ring-2 ring-red-200" },
};

const playColor: Record<number, { num: string; urgBg: string; urgText: string }> = {
  0: { num: "bg-violet-600 text-white", urgBg: "bg-violet-50", urgText: "text-violet-700" },
  1: { num: "bg-amber-500 text-white",  urgBg: "bg-amber-50",  urgText: "text-amber-700"  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const } }),
};

/* ─── component ─────────────────────────────────────────────── */

export default function DashboardPage() {
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [brief, setBrief] = useState<WeeklyBriefOut | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [changes, setChanges] = useState<ChangeItem[]>([]);
  const [occasions, setOccasions] = useState<OccasionItem[]>([]);
  const [competitorCount, setCompetitorCount] = useState<number>(0);

  useEffect(() => {
    Promise.allSettled([
      getMe().then(setOwner),
      getCurrentBrief().then((r) => r?.brief && setBrief(r.brief)),
      listSessions().then((r) => setSessions(r.sessions.slice(0, 3))),
      getRecentChanges(7).then((r) => setChanges((r.changes ?? []).slice(0, 3))),
      getOccasions().then((r) => setOccasions((r.occasions ?? []).slice(0, 4))),
      getCompetitors().then((cs) => setCompetitorCount(cs.length)),
    ]);
  }, []);

  const businessName = owner?.business_name ?? "your business";
  const plays = (brief?.recommendations ?? []).slice(0, 2);
  const urgentChange = changes.find((c) => c.severity === "high");

  const stats = [
    { label: "Brief",    value: brief ? "Ready" : "Pending", sub: brief ? `Week of ${new Date(brief.week_start).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}` : "Next Monday", icon: Newspaper,    accent: "violet", urgent: false },
    { label: "Sessions", value: String(sessions.length),      sub: "this month",   icon: MessageSquare, accent: "amber",   urgent: false },
    { label: "Tracked",  value: String(competitorCount),       sub: "competitors",  icon: Users,         accent: "emerald", urgent: false },
    { label: "Changes",  value: String(changes.length),        sub: "this week",    icon: Activity,      accent: changes.length > 0 ? "red" : "emerald", urgent: changes.length > 0 },
  ];

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50/60 px-6 pt-5 pb-4 gap-3">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sun className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] text-gray-400 font-medium">{todayLabel()}</span>
          </div>
          <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">
            {greeting()}, {businessName}
          </h1>
        </div>
        <Link href="/session" className="btn-primary text-xs gap-1.5 py-2 px-3.5">
          <Zap className="h-3.5 w-3.5" />
          New Strategy Session
        </Link>
      </div>

      {/* Urgent banner — show if there's a high-severity change */}
      {urgentChange && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="shrink-0 flex items-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-2.5 shadow-md shadow-violet-200"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Flame className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-none">
              {urgentChange.competitor_name}: <span className="text-amber-300">{urgentChange.description}</span>
            </p>
            <p className="text-[11px] text-violet-200 mt-0.5">High-priority competitor signal detected.</p>
          </div>
          <Link href="/session" className="shrink-0 flex items-center gap-1 rounded-lg bg-white/15 hover:bg-white/25 transition px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap">
            Plan it <ArrowRight className="h-3 w-3" />
          </Link>
        </motion.div>
      )}

      {/* Stats */}
      <div className="shrink-0 grid grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const a = accentMap[s.accent];
          return (
            <motion.div key={s.label} custom={i} initial="hidden" animate="show" variants={fadeUp}
              className={`card px-4 py-3 ${s.urgent ? a.glow : ""}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</span>
                <div className={`rounded-md p-1 ${a.bg}`}>
                  <s.icon className={`h-3 w-3 ${a.icon}`} />
                </div>
              </div>
              <p className={`text-xl font-black leading-none ${a.num}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">

        {/* Left — 2 cols */}
        <div className="col-span-2 flex flex-col gap-4 min-h-0">

          {/* This week's plays */}
          <div className="card overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-bold text-gray-900">This Week&apos;s Plays</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-300" />
                <span className="text-[10px] text-gray-400">From current brief</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50 flex-1">
              {plays.length > 0 ? plays.map((rec, i) => {
                const c = playColor[i % 2];
                return (
                  <motion.div key={i} custom={i + 2} initial="hidden" animate="show" variants={fadeUp}
                    className="flex items-start gap-3 px-4 py-3">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${c.num}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-bold text-gray-900">{rec.title}</p>
                        <span className={`rounded-full px-1.5 py-px text-[9px] font-semibold ${c.urgBg} ${c.urgText}`}>
                          This week
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{rec.body}</p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="flex items-center justify-center flex-1 py-4">
                  <p className="text-xs text-gray-400">No brief yet — generate one from the Brief page.</p>
                </div>
              )}
            </div>
            <div className="px-4 py-2 bg-gray-50/60 border-t border-gray-100 shrink-0">
              <Link href="/brief" className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700">
                <Newspaper className="h-3 w-3" />
                {brief ? "Read full brief" : "Generate your first brief"}
                <ChevronRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold text-gray-900">Recent Sessions</span>
              </div>
              <Link href="/session" className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700">
                Ask something <Zap className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50 flex-1 overflow-y-auto">
              {sessions.length > 0 ? sessions.map((s, i) => (
                <motion.div key={s.id} custom={i + 4} initial="hidden" animate="show" variants={fadeUp}>
                  <Link href="/session"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{s.original_question}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(s.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                        {" · "}{s.turn_count} turn{s.turn_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-gray-200 group-hover:text-violet-400 transition-colors shrink-0" />
                  </Link>
                </motion.div>
              )) : (
                <div className="flex items-center justify-center flex-1 py-6">
                  <p className="text-xs text-gray-400">No sessions yet — ask your first strategic question.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — 1 col */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Calgary Calendar */}
          <div className="card overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 shrink-0">
              <Calendar className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-xs font-bold text-gray-900">Market Calendar</span>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {occasions.length > 0 ? occasions.map((o, i) => {
                const heat = heatFromDays(o.days_out);
                const h = heatConfig[heat];
                const pct = Math.max(6, Math.min(100, 100 - (o.days_out / 65) * 100));
                return (
                  <motion.div key={o.id} custom={i + 3} initial="hidden" animate="show" variants={fadeUp} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-gray-800 truncate pr-2">{o.name}</p>
                      <span className={`rounded-full px-1.5 py-px text-[9px] font-bold shrink-0 ${h.badge}`}>{o.days_out}d</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div className={`h-full rounded-full ${h.bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: i * 0.1 + 0.3, duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-300 shrink-0 w-12 text-right">{o.date}</span>
                    </div>
                  </motion.div>
                );
              }) : (
                <p className="text-xs text-gray-400 py-2">Loading calendar…</p>
              )}
            </div>
          </div>

          {/* Competitor Pulse */}
          <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-gray-900">Competitor Pulse</span>
              </div>
              <Link href="/competitors" className="text-[10px] font-semibold text-violet-600 hover:text-violet-700">Details →</Link>
            </div>
            <div className="p-3 space-y-2 flex-1 overflow-y-auto">
              {changes.length > 0 ? changes.map((c, i) => {
                const sev = severityConfig[c.severity ?? "low"];
                return (
                  <motion.div key={i} custom={i + 5} initial="hidden" animate="show" variants={fadeUp}
                    className={`flex items-start gap-2.5 rounded-lg p-2.5 ring-1 ${sev.ring} bg-white`}>
                    <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${sev.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-bold text-gray-900">{c.competitor_name}</p>
                        <span className={`text-[9px] font-semibold ${sev.text}`}>
                          {c.severity === "high" ? "Watch" : c.severity === "medium" ? "Note" : "Info"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{c.description}</p>
                      <p className="text-[9px] text-gray-300 mt-0.5">{c.source ?? c.change_type} · {daysAgo(c.detected_at)}d ago</p>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="flex items-center justify-center flex-1 py-4">
                  <p className="text-[11px] text-gray-400 text-center">No recent competitor changes.</p>
                </div>
              )}
            </div>
            <div className="px-3 py-2.5 border-t border-gray-100 shrink-0">
              <Link href="/session"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 transition px-3 py-2 text-[11px] font-semibold text-white w-full">
                <Zap className="h-3 w-3" />
                Ask the strategist
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
