"use client";

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

/* ─── mock data ─────────────────────────────────────────────── */

const stats = [
  { label: "Brief",    value: "Tomorrow", sub: "Mon · 7am",    icon: Newspaper,    accent: "violet", urgent: false },
  { label: "Sessions", value: "3",        sub: "this month",   icon: MessageSquare,accent: "amber",  urgent: false },
  { label: "Tracked",  value: "5",        sub: "competitors",  icon: Users,        accent: "emerald",urgent: false },
  { label: "Changes",  value: "3",        sub: "this week",    icon: Activity,     accent: "red",    urgent: true  },
];

const plays = [
  { priority: 1, urgency: "Act by Tuesday", title: "Push Mother's Day reservations now",  reason: "Only Vin Room has activated. 7 days out — window closes fast.", color: "violet" },
  { priority: 2, urgency: "Hold",           title: "No new lunch discounts",               reason: "3 of 5 competitors running promos. A 4th erodes your pricing position.",  color: "amber"  },
];

const occasions = [
  { label: "Mother's Day",    date: "May 11",    days: 7,  heat: "critical" },
  { label: "Victoria Day",    date: "May 19–21", days: 15, heat: "medium"   },
  { label: "Festival of Beers",date:"Jun 20–22", days: 47, heat: "low"      },
  { label: "Calgary Stampede",date: "Jul 4–13",  days: 61, heat: "high"     },
];

const competitors = [
  { name: "Vin Room",       change: "Running Meta Ads — dinner for two promo", platform: "Meta Ads", daysAgo: 2, severity: "high"   },
  { name: "Wurst",          change: "New $18 lunch special",                   platform: "Instagram",daysAgo: 3, severity: "medium" },
  { name: "OEB Breakfast",  change: "14 Google reviews in 7 days (avg 3)",     platform: "Google",   daysAgo: 5, severity: "low"    },
];

const recentSessions = [
  { id: "1", q: "Should I run a 30% off lunch promo?",  verdict: "Hold — competitors already running",     date: "May 1"  },
  { id: "2", q: "Right time to launch brunch menu?",    verdict: "Yes — Mother's Day window is open",       date: "Apr 24" },
  { id: "3", q: "Marketing plan for Stampede?",         verdict: "Lead local. Start messaging 3 weeks out", date: "Apr 18" },
];

/* ─── helpers ──────────────────────────────────────────────── */

const heatConfig = {
  critical: { bar: "bg-red-500",    badge: "bg-red-100 text-red-700"         },
  high:     { bar: "bg-amber-500",  badge: "bg-amber-100 text-amber-700"     },
  medium:   { bar: "bg-violet-400", badge: "bg-violet-100 text-violet-700"   },
  low:      { bar: "bg-gray-200",   badge: "bg-gray-100 text-gray-500"       },
};

const severityConfig = {
  high:   { dot: "bg-red-500",   ring: "ring-red-100",   text: "text-red-600"   },
  medium: { dot: "bg-amber-500", ring: "ring-amber-100", text: "text-amber-600" },
  low:    { dot: "bg-gray-300",  ring: "ring-gray-100",  text: "text-gray-400"  },
};

const accentMap: Record<string, { bg: string; icon: string; num: string; glow: string }> = {
  violet:  { bg: "bg-violet-50",  icon: "text-violet-600",  num: "text-violet-700",  glow: ""                 },
  amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   num: "text-amber-700",   glow: ""                 },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", num: "text-emerald-700", glow: ""                 },
  red:     { bg: "bg-red-50",     icon: "text-red-500",     num: "text-red-600",     glow: "ring-2 ring-red-200" },
};

const playColor: Record<string, { num: string; urgBg: string; urgText: string }> = {
  violet: { num: "bg-violet-600 text-white", urgBg: "bg-violet-50", urgText: "text-violet-700" },
  amber:  { num: "bg-amber-500 text-white",  urgBg: "bg-amber-50",  urgText: "text-amber-700"  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] } }),
};

/* ─── component ─────────────────────────────────────────────── */

export default function DashboardPage() {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50/60 px-6 pt-5 pb-4 gap-3">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sun className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] text-gray-400 font-medium">Sunday, May 4, 2026</span>
          </div>
          <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none">
            Good morning, Casa Verde
          </h1>
        </div>
        <Link href="/session" className="btn-primary text-xs gap-1.5 py-2 px-3.5">
          <Zap className="h-3.5 w-3.5" />
          New Strategy Session
        </Link>
      </div>

      {/* Urgent banner */}
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
            Mother&apos;s Day is <span className="text-amber-300">7 days away</span> — only Vin Room has activated.
          </p>
          <p className="text-[11px] text-violet-200 mt-0.5">You have a clear window. Act by Tuesday to own it.</p>
        </div>
        <Link href="/session" className="shrink-0 flex items-center gap-1 rounded-lg bg-white/15 hover:bg-white/25 transition px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap">
          Plan it <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.div>

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

      {/* Main grid — fills remaining height */}
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
                <span className="text-[10px] text-gray-400">Data through May 4</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50 flex-1">
              {plays.map((play, i) => {
                const c = playColor[play.color];
                return (
                  <motion.div key={play.priority} custom={i + 2} initial="hidden" animate="show" variants={fadeUp}
                    className="flex items-start gap-3 px-4 py-3">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${c.num}`}>
                      {play.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-bold text-gray-900">{play.title}</p>
                        <span className={`rounded-full px-1.5 py-px text-[9px] font-semibold ${c.urgBg} ${c.urgText}`}>
                          {play.urgency}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug">{play.reason}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="px-4 py-2 bg-gray-50/60 border-t border-gray-100 shrink-0">
              <Link href="/brief" className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700">
                <Newspaper className="h-3 w-3" />
                Full brief Monday 7am — read last brief
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
              {recentSessions.map((s, i) => (
                <motion.div key={s.id} custom={i + 4} initial="hidden" animate="show" variants={fadeUp}>
                  <Link href={`/session/${s.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{s.q}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">→ {s.verdict}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-300">{s.date}</span>
                      <ChevronRight className="h-3 w-3 text-gray-200 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — 1 col */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Calgary Calendar */}
          <div className="card overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 shrink-0">
              <Calendar className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-xs font-bold text-gray-900">Calgary Calendar</span>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {occasions.map((o, i) => {
                const h = heatConfig[o.heat as keyof typeof heatConfig];
                const pct = Math.max(6, Math.min(100, 100 - (o.days / 65) * 100));
                return (
                  <motion.div key={o.label} custom={i + 3} initial="hidden" animate="show" variants={fadeUp} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-gray-800">{o.label}</p>
                      <span className={`rounded-full px-1.5 py-px text-[9px] font-bold ${h.badge}`}>{o.days}d</span>
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
              })}
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
              {competitors.map((c, i) => {
                const sev = severityConfig[c.severity as keyof typeof severityConfig];
                return (
                  <motion.div key={c.name} custom={i + 5} initial="hidden" animate="show" variants={fadeUp}
                    className={`flex items-start gap-2.5 rounded-lg p-2.5 ring-1 ${sev.ring} bg-white`}>
                    <div className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${sev.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-bold text-gray-900">{c.name}</p>
                        <span className={`text-[9px] font-semibold ${sev.text}`}>
                          {c.severity === "high" ? "Watch" : c.severity === "medium" ? "Note" : "Info"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{c.change}</p>
                      <p className="text-[9px] text-gray-300 mt-0.5">{c.platform} · {c.daysAgo}d ago</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Compact ask CTA */}
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
