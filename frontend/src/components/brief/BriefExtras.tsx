"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Eye } from "lucide-react";
import type { CompetitorBriefEntry } from "@/lib/api";
import { PipImg, SparkImg } from "@/components/dashboard/viz";

const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/* ─── What to watch: metric chips ─────────────────────────────── */

export function WatchStrip({ items }: { items: string[] }) {
  return (
    <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5" aria-labelledby="watch-title">
      <div className="flex items-center gap-2.5 sm:w-44 sm:shrink-0">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-300">
          <Eye className="h-4 w-4 text-ink" aria-hidden="true" />
        </span>
        <h2 id="watch-title" className="font-display text-base font-semibold leading-tight text-ink">
          Watch this week
        </h2>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((w, i) => (
          <motion.li
            key={w}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-sm font-medium text-ink"
          >
            <span className="tabular flex h-5 w-5 items-center justify-center rounded-full bg-lilac text-[10px] font-bold text-brand-700">{i + 1}</span>
            {w}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

/* ─── Competitor watch: spotted → so what ─────────────────────── */

export function CompetitorCards({ entries }: { entries: CompetitorBriefEntry[] }) {
  return (
    <section aria-labelledby="comp-title">
      <div className="mb-3 flex items-center gap-2.5">
        <SparkImg color="red" size={36} />
        <h2 id="comp-title" className="flex-1 font-display text-base font-semibold text-ink">
          From your competitor watch
        </h2>
        <Link href="/competitors" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Full analysis
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map((e, i) => (
          <motion.article
            key={e.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="card overflow-hidden"
          >
            <header className="flex items-center gap-2.5 border-b border-gray-200/70 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-lime-300">{initials(e.name)}</span>
              <span className="font-display text-sm font-semibold text-ink">{e.name}</span>
            </header>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-500">Spotted</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{e.observation}</p>
              <div className="mt-3 flex gap-2.5 rounded-xl bg-lilac/70 p-3">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-ink">
                  <span className="font-semibold text-brand-700">So what: </span>
                  {e.implication}
                </p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/* ─── Evidence: freshness meters ─────────────────────────────── */

function daysSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/** Fresher = fuller bar (0 days full, 7+ days near-empty). Days are printed, so the bar never stands alone. */
export function EvidenceMeters({ freshness }: { freshness: Record<string, string> }) {
  const rows = Object.entries(freshness).map(([k, v]) => ({ k, d: daysSince(v) }));
  return (
    <section className="card p-4" aria-labelledby="evidence-title">
      <div className="flex items-center gap-2.5">
        <PipImg pose="search" size={48} />
        <div>
          <h2 id="evidence-title" className="font-display text-sm font-semibold text-ink">
            Where this came from
          </h2>
          <p className="text-[11px] text-gray-500">How fresh each source is</p>
        </div>
      </div>
      <ul className="mt-3 space-y-3">
        {rows.map((r, i) => (
          <li key={r.k}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="font-medium text-ink">{r.k}</span>
              <span className="tabular shrink-0 text-gray-500">{r.d === 0 ? "today" : `${r.d}d ago`}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lilac">
              <motion.div
                className="h-full origin-left rounded-full bg-brand-600"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.max(0.08, 1 - r.d / 8) }}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.1 }}
              />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
