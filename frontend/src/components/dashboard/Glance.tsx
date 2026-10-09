"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, CalendarDays, MessageSquare, Radar, Users } from "lucide-react";
import type { ChangeItem, OccasionItem } from "@/lib/api";
import { Ring, SEVERITY, SeverityBar, PipImg, type Severity } from "./viz";
import { fadeUp } from "./primitives";
import { cn } from "@/lib/utils";

/* ─── Greeting with Pip ─────────────────────────────────────── */

interface GreetingProps {
  eyebrow: string;
  title: string;
  chips: { label: string; tone?: "alert" | "lime" | "plain" }[];
}

export function Greeting({ eyebrow, title, chips }: GreetingProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-brand-200/60 bg-lilac px-5 py-5 sm:px-7 sm:py-6"
    >
      <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/50 blur-2xl" />
      <div className="relative flex items-center gap-4 sm:gap-6">
        <motion.div
          className="shrink-0"
          initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
        >
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}>
            <PipImg pose="wave" size={88} className="sm:!h-[104px] sm:!w-[104px]" />
          </motion.div>
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-[28px]">{title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <motion.span
                key={c.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                  c.tone === "alert"
                    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                    : c.tone === "lime"
                      ? "bg-lime-300 text-ink"
                      : "bg-white text-ink ring-1 ring-brand-200/70"
                )}
              >
                {c.tone === "alert" && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
                {c.label}
              </motion.span>
            ))}
          </div>
        </div>
        <Link href="/session" className="btn-primary hidden shrink-0 md:inline-flex">
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Ask Pip
        </Link>
      </div>
    </motion.section>
  );
}

/* ─── At-a-glance tiles ─────────────────────────────────────── */

function Tile({ href, index, children, label }: { href: string; index: number; children: React.ReactNode; label: string }) {
  return (
    <motion.div custom={index} initial="hidden" animate="show" variants={fadeUp}>
      <Link
        href={href}
        aria-label={label}
        className="card-hover group flex h-full items-center gap-4 p-4 sm:p-5"
      >
        {children}
      </Link>
    </motion.div>
  );
}

function Unavailable({ what }: { what: string }) {
  return <p className="text-sm text-gray-500">{what} unavailable</p>;
}

interface GlanceProps {
  moves: { tried: number; total: number } | null;
  changes: ChangeItem[] | null;
  nextOccasion: OccasionItem | null | undefined; // undefined = failed to load
  following: { names: string[] } | null;
}

export function Glance({ moves, changes, nextOccasion, following }: GlanceProps) {
  const counts: Record<Severity, number> = { high: 0, medium: 0, low: 0 };
  changes?.forEach((c) => (counts[c.severity] += 1));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* Moves tried */}
      <Tile href="/brief" index={1} label="This week's moves">
        {moves ? (
          <>
            <Ring value={moves.total ? moves.tried / moves.total : 0} label={`${moves.tried} of ${moves.total} moves tried`}>
              <span className="tabular font-display text-base font-semibold text-ink">
                {moves.tried}/{moves.total}
              </span>
            </Ring>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Moves tried</p>
              <p className="mt-0.5 font-display text-lg font-semibold text-ink">
                {moves.total === 0 ? "No brief yet" : moves.tried === moves.total ? "All done!" : `${moves.total - moves.tried} to go`}
              </p>
            </div>
          </>
        ) : (
          <Unavailable what="Brief" />
        )}
      </Tile>

      {/* Signals */}
      <Tile href="/competitors" index={2} label="Competitor signals this week">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", counts.high ? "bg-red-50" : "bg-lilac")}>
          <Radar className={cn("h-6 w-6", counts.high ? "text-red-600" : "text-brand-600")} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Signals · 7 days</p>
          {changes ? (
            <>
              <p className="tabular mt-0.5 font-display text-lg font-semibold text-ink">{changes.length}</p>
              <SeverityBar counts={counts} />
              <p className="mt-1.5 flex gap-2.5 text-[11px] text-gray-500">
                {(Object.keys(counts) as Severity[])
                  .filter((k) => counts[k])
                  .map((k) => (
                    <span key={k} className="inline-flex items-center gap-1">
                      <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY[k].dot)} aria-hidden="true" />
                      {counts[k]} {SEVERITY[k].label.toLowerCase()}
                    </span>
                  ))}
              </p>
            </>
          ) : (
            <Unavailable what="Signals" />
          )}
        </div>
      </Tile>

      {/* Next occasion */}
      <Tile href="/brief" index={3} label="Next local occasion">
        {nextOccasion === undefined ? (
          <Unavailable what="Calendar" />
        ) : nextOccasion === null ? (
          <>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lilac">
              <CalendarDays className="h-6 w-6 text-brand-600" aria-hidden="true" />
            </span>
            <p className="text-sm text-gray-500">No upcoming occasions</p>
          </>
        ) : (
          <>
            <Ring
              value={1 - Math.min(nextOccasion.days_out, 60) / 60}
              tone="lime"
              label={`${nextOccasion.name} in ${nextOccasion.days_out} days`}
            >
              <span className="text-center leading-none">
                <span className="tabular block font-display text-base font-semibold text-ink">{nextOccasion.days_out}</span>
                <span className="text-[9px] font-semibold uppercase text-gray-500">days</span>
              </span>
            </Ring>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Next occasion</p>
              <p className="mt-0.5 line-clamp-2 font-display text-sm font-semibold leading-snug text-ink">{nextOccasion.name}</p>
            </div>
          </>
        )}
      </Tile>

      {/* Following */}
      <Tile href="/competitors" index={4} label="Businesses you follow">
        {following ? (
          <>
            <div className="flex shrink-0 -space-x-2.5">
              {following.names.slice(0, 3).map((n, i) => (
                <span
                  key={n}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xs font-bold",
                    ["bg-ink text-lime-300", "bg-brand-600 text-white", "bg-lime-300 text-ink"][i % 3]
                  )}
                  title={n}
                >
                  {n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              ))}
              {following.names.length === 0 && (
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-gray-300">
                  <Users className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Following</p>
              <p className="mt-0.5 font-display text-lg font-semibold text-ink">
                {following.names.length ? `${following.names.length} nearby` : "Add one"}
              </p>
            </div>
          </>
        ) : (
          <Unavailable what="Competitors" />
        )}
      </Tile>
    </div>
  );
}

