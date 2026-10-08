"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, MessageSquare } from "lucide-react";
import type { BriefRecommendation, ChangeItem, OccasionItem, SessionSummary } from "@/lib/api";
import { cn } from "@/lib/utils";
import { fadeUp } from "./primitives";

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

const heatConfig = {
  critical: { bar: "bg-red-500",   badge: "bg-red-50 text-red-700",       label: "This week" },
  high:     { bar: "bg-brand-600", badge: "bg-lilac text-brand-700",      label: "Soon" },
  medium:   { bar: "bg-brand-300", badge: "bg-gray-100 text-gray-600",    label: "Upcoming" },
  low:      { bar: "bg-gray-300",  badge: "bg-gray-100 text-gray-500",    label: "Later" },
};

const severityConfig = {
  high:   { dot: "bg-red-500",   text: "text-red-700",   label: "Watch" },
  medium: { dot: "bg-amber-500", text: "text-amber-800", label: "Note" },
  low:    { dot: "bg-gray-300",  text: "text-gray-500",  label: "Info" },
};

/* ─── This week's plays ────────────────────────────────────── */

export function PlaysList({ plays, startIndex = 1 }: { plays: BriefRecommendation[]; startIndex?: number }) {
  if (plays.length === 0) {
    return (
      <p className="px-5 py-5 text-sm text-gray-500">
        No other moves this week. Focus on the top recommendation above.
      </p>
    );
  }
  return (
    <ol className="divide-y divide-gray-100">
      {plays.map((rec, i) => (
        <motion.li key={i} custom={i + 2} initial="hidden" animate="show" variants={fadeUp} className="flex items-start gap-4 px-5 py-4">
          <span className="tabular mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lilac text-xs font-semibold text-brand-700">
            {i + 1 + startIndex}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{rec.title}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500">{rec.body}</p>
          </div>
        </motion.li>
      ))}
    </ol>
  );
}

/* ─── Recent sessions ──────────────────────────────────────── */

export function SessionsList({ sessions }: { sessions: SessionSummary[] }) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lilac">
          <MessageSquare className="h-5 w-5 text-brand-600" />
        </span>
        <p className="text-sm text-gray-500">No sessions yet.</p>
        <Link href="/session" className="text-sm font-semibold text-brand-700 hover:underline">
          Ask your first strategic question
        </Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-gray-100">
      {sessions.map((s, i) => (
        <motion.li key={s.id} custom={i + 4} initial="hidden" animate="show" variants={fadeUp}>
          <Link href={`/session?id=${s.id}`} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{s.original_question}</p>
              <p className="tabular mt-0.5 text-xs text-gray-500">
                {new Date(s.created_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                {" · "}
                {s.turn_count} turn{s.turn_count !== 1 ? "s" : ""}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-brand-600" />
          </Link>
        </motion.li>
      ))}
    </ul>
  );
}

/* ─── Market calendar ──────────────────────────────────────── */

export function CalendarList({ occasions }: { occasions: OccasionItem[] }) {
  if (occasions.length === 0) {
    return (
      <p className="px-5 py-5 text-sm text-gray-500">
        No upcoming local occasions match your business category yet.{" "}
        <Link href="/settings" className="font-semibold text-brand-700 hover:underline">Check your category</Link>
      </p>
    );
  }
  return (
    <ul className="space-y-4 px-5 py-5">
      {occasions.map((o, i) => {
        const h = heatConfig[heatFromDays(o.days_out)];
        const pct = Math.max(6, Math.min(100, 100 - (o.days_out / 65) * 100));
        return (
          <motion.li key={o.id} custom={i + 3} initial="hidden" animate="show" variants={fadeUp} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-ink">{o.name}</p>
              <span className={cn("tabular shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", h.badge)}>
                {o.days_out}d · {h.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  className={cn("h-full rounded-full", h.bar)}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.5, ease: "easeOut" as const }}
                />
              </div>
              <span className="tabular w-14 shrink-0 text-right text-xs text-gray-400">{o.date}</span>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}

/* ─── Competitor pulse ─────────────────────────────────────── */

export function PulseList({ changes, trackedCount }: { changes: ChangeItem[]; trackedCount: number | null }) {
  if (changes.length === 0) {
    return (
      <p className="px-5 py-5 text-sm text-gray-500">
        {trackedCount === 0 ? (
          <>
            You aren&apos;t following any nearby businesses yet.{" "}
            <Link href="/settings#competitors" className="font-semibold text-brand-700 hover:underline">
              Add a business
            </Link>
          </>
        ) : (
          "No public changes from the businesses you follow in the last 7 days."
        )}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-gray-100">
      {changes.map((c, i) => {
        const sev = severityConfig[c.severity ?? "low"];
        return (
          <motion.li key={i} custom={i + 5} initial="hidden" animate="show" variants={fadeUp} className="flex items-start gap-3 px-5 py-3.5">
            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", sev.dot)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-ink">{c.competitor_name}</p>
                <span className={cn("text-[11px] font-semibold", sev.text)}>{sev.label}</span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">{c.description}</p>
              <p className="mt-1 text-[11px] text-gray-400">
                {c.source ?? c.change_type} · {daysAgo(c.detected_at)}d ago
              </p>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
