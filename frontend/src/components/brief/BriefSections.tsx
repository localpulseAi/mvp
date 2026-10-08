"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Eye, Lightbulb, TrendingUp, Users } from "lucide-react";
import type { BriefRecommendation, CompetitorBriefEntry } from "@/lib/api";
import { sampleBrief } from "@/lib/demo-content";
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

const sampleOccasions = [
  { label: "Mother's Day", date: "May 11", badge: "7 days" },
  { label: "Victoria Day", date: "May 19", badge: "15 days" },
  { label: "Lilac Festival", date: "May 24–25", badge: "20 days" },
  { label: "Stampede", date: "Jul 4", badge: "61 days" },
];

export function SampleOccasions() {
  return (
    <div>
      <p className="eyebrow text-gray-500">Sample planning occasions</p>
      <p className="mt-1 text-xs text-gray-400">Illustrative examples, not a live calendar</p>
      <div className="mt-3 space-y-2">
        {sampleOccasions.map((o) => (
          <div key={o.label} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{o.label}</p>
              <Badge variant="brand" className="tabular text-[10px]">{o.badge}</Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              {o.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SampleBriefCard() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Illustrative sample</Badge>
        <p className="text-sm font-semibold text-ink">Sample marketing brief</p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-700">{sampleBrief.marketRead}</p>
      <div className="mt-4 space-y-3">
        {sampleBrief.recommendations.map((rec, index) => (
          <div key={rec.title} className="rounded-control border border-gray-200 bg-white p-4">
            <p className="text-sm font-semibold text-ink">
              {index + 1}. {rec.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{rec.body}</p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              <span className="font-semibold text-brand-700">Why this appears:</span> {rec.reasoning}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
