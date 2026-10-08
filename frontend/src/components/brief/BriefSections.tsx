"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Eye, Lightbulb, TrendingUp, Users } from "lucide-react";
import type { BriefRecommendation, CompetitorBriefEntry, OccasionItem } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";

export const rise = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

function SectionHeading({ icon: Icon, title, action }: { icon: typeof Eye; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-control bg-lilac">
          <Icon className="h-4 w-4 text-brand-600" />
        </span>
        <h2 className="section-title text-lg">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function MarketRead({ text }: { text: string }) {
  return (
    <motion.section custom={0} initial="hidden" animate="show" variants={rise} className="card p-6">
      <SectionHeading icon={TrendingUp} title="Market read" />
      <p className="whitespace-pre-line text-[15px] leading-7 text-gray-700">{text}</p>
    </motion.section>
  );
}

export function Recommendations({ items }: { items: BriefRecommendation[] }) {
  return (
    <motion.section custom={1} initial="hidden" animate="show" variants={rise} className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-6 py-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">This week&apos;s recommendations</h2>
          <p className="mt-0.5 text-sm text-white/60">Choose the move that fits your capacity.</p>
        </div>
        <span className="chip-lime tabular">
          {items.length} move{items.length !== 1 ? "s" : ""}
        </span>
      </div>
      <ol className="divide-y divide-gray-100">
        {items.map((rec, i) => (
          <li key={i} className="flex items-start gap-4 p-6">
            <span className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-semibold text-ink">{rec.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{rec.body}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {rec.reasoning && (
                  <div className="rounded-control bg-lilac p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">
                      <Lightbulb className="h-3.5 w-3.5" /> Why it matters
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{rec.reasoning}</p>
                  </div>
                )}
                {rec.watch_for && rec.watch_for.length > 0 && (
                  <div className="rounded-control border border-gray-200 bg-gray-50 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-600">
                      <Eye className="h-3.5 w-3.5" /> Results to watch
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {rec.watch_for.map((w, j) => (
                        <li key={j} className="flex gap-2 text-sm text-gray-700">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-600" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}

export function WatchList({ items }: { items: string[] }) {
  return (
    <motion.section custom={2} initial="hidden" animate="show" variants={rise} className="card p-6">
      <SectionHeading icon={Eye} title="What to watch this week" />
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-gray-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            {item}
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

export function CompetitorWatch({ entries }: { entries: CompetitorBriefEntry[] }) {
  return (
    <motion.section custom={3} initial="hidden" animate="show" variants={rise} className="card-lilac p-6">
      <SectionHeading
        icon={Users}
        title="From your competitor watch"
        action={
          <Link href="/competitors" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Full analysis
          </Link>
        }
      />
      <div className="grid gap-3 md:grid-cols-2">
        {entries.map((entry, i) => (
          <div key={i} className="rounded-control border border-brand-200/60 bg-white p-4">
            <p className="font-display text-sm font-semibold text-ink">{entry.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{entry.observation}</p>
            <p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-relaxed text-gray-700">
              <span className="font-semibold text-brand-700">Implication: </span>
              {entry.implication}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function relativeDays(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/** Evidence freshness — which sources fed this brief and how recent they are. */
export function DataFreshness({ freshness }: { freshness: Record<string, string> }) {
  const entries = Object.entries(freshness);
  if (entries.length === 0) return null;
  return (
    <section className="card p-5" aria-labelledby="freshness-title">
      <h2 id="freshness-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">
        Evidence used
      </h2>
      <ul className="mt-3 space-y-2">
        {entries.map(([source, at]) => (
          <li key={source} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-gray-700">{source}</span>
            <span className="tabular shrink-0 text-xs text-gray-500">{relativeDays(at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function UpcomingOccasions({ occasions }: { occasions: OccasionItem[] }) {
  return (
    <section aria-labelledby="occasions-title">
      <h2 id="occasions-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">
        Coming up locally
      </h2>
      {occasions.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">No upcoming occasions match your business category.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {occasions.map((o) => (
            <li key={o.id} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{o.name}</p>
                <Badge variant="brand" className="tabular shrink-0 text-[10px]">
                  {o.days_out} days
                </Badge>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {new Date(o.date).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
