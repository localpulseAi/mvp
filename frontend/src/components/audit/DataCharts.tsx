"use client";

import { motion } from "framer-motion";
import { BarChart3, Database, MessageSquareQuote, Star } from "lucide-react";
import { Ring, Tip } from "@/components/dashboard/viz";
import { WEEKDAYS, typeLabel, type EvidenceStats } from "./evidenceStats";

function ChartCard({ icon: Icon, title, takeaway, children }: { icon: typeof Star; title: string; takeaway?: string; children: React.ReactNode }) {
  return (
    <section className="card flex flex-col p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-ink">
        <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" /> {title}
      </h3>
      {takeaway && <p className="mt-1 text-xs text-gray-500">{takeaway}</p>}
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

/** Posts per weekday — single hue, the quietest days called out in text. */
function WeekdayBars({ stats }: { stats: EvidenceStats }) {
  const max = Math.max(1, ...stats.weekday);
  return (
    <div>
      <div className="flex h-32 items-end gap-2" role="img" aria-label={`Posts by weekday: ${WEEKDAYS.map((d, i) => `${d} ${stats.weekday[i]}`).join(", ")}`}>
        {stats.weekday.map((n, i) => (
          <Tip key={i} content={`${WEEKDAYS[i]}: ${n} post${n === 1 ? "" : "s"}`} className="h-full flex-1">
            <span className="flex h-full w-full flex-col items-center justify-end" tabIndex={0}>
              {n === max && <span className="tabular mb-1 text-[11px] font-semibold text-ink">{n}</span>}
              <motion.span
                className="w-full max-w-[28px] rounded-t-[4px] bg-brand-600"
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(n ? 6 : 2, (n / max) * 100)}%` }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.05 }}
                style={{ opacity: n ? 1 : 0.15 }}
              />
            </span>
          </Tip>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2 border-t border-gray-200 pt-1.5">
        {WEEKDAYS.map((d) => (
          <span key={d} className="flex-1 text-center text-[10px] text-gray-500">
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Average engagement (likes + comments) per post, by format. */
function TypeBars({ stats }: { stats: EvidenceStats }) {
  const max = Math.max(1, ...stats.byType.map((t) => t.avgEngagement));
  return (
    <ul className="space-y-3">
      {stats.byType.map((t, i) => (
        <li key={t.type}>
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-ink">{typeLabel(t.type)}</span>
            <span className="text-gray-500">
              <span className="tabular font-semibold text-ink">{t.avgEngagement}</span> avg · {t.count} post{t.count === 1 ? "" : "s"}
            </span>
          </div>
          <Tip content={`${typeLabel(t.type)}: ${t.avgEngagement} likes + comments per post on average, ${t.avgComments} comments`} className="mt-1 block w-full">
            <span className="block h-2.5 w-full overflow-hidden rounded-full bg-lilac" tabIndex={0}>
              <motion.span
                className="block h-full rounded-full bg-brand-600"
                initial={{ width: 0 }}
                animate={{ width: `${(t.avgEngagement / max) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.08 }}
              />
            </span>
          </Tip>
        </li>
      ))}
    </ul>
  );
}

/** Star distribution 5→1 plus reply-rate meter. */
function Reviews({ stats }: { stats: EvidenceStats }) {
  const max = Math.max(1, ...stats.ratings);
  return (
    <div className="flex items-center gap-5">
      <div className="text-center">
        <p className="tabular font-display text-3xl font-semibold text-ink">{stats.avgRating ?? "–"}</p>
        <p className="flex justify-center text-amber-500" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3 w-3" fill={stats.avgRating != null && i < Math.round(stats.avgRating) ? "currentColor" : "none"} />
          ))}
        </p>
        {stats.replyRate != null && (
          <div className="mt-3 flex flex-col items-center">
            <Ring value={stats.replyRate} size={52} stroke={6} tone="lime" label={`${Math.round(stats.replyRate * 100)}% of reviews replied to`}>
              <span className="tabular text-[11px] font-bold text-ink">{Math.round(stats.replyRate * 100)}%</span>
            </Ring>
            <span className="mt-1 text-[10px] text-gray-500">replied</span>
          </div>
        )}
      </div>
      <ul className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star, i) => {
          const n = stats.ratings[star - 1];
          return (
            <li key={star} className="flex items-center gap-2 text-[11px]">
              <span className="tabular w-6 text-gray-500">{star}★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <motion.span
                  className="block h-full rounded-full bg-brand-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${(n / max) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.06 }}
                />
              </span>
              <span className="tabular w-5 text-right text-gray-600">{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DataCharts({ stats, collectedLabel }: { stats: EvidenceStats; collectedLabel: string }) {
  if (!stats.postCount && !stats.reviewCount) return null;
  return (
    <section aria-labelledby="data-title">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 id="data-title" className="font-display text-base font-semibold text-ink">
          What the data shows
        </h2>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
          <Database className="h-3 w-3" aria-hidden="true" /> Calculated from {collectedLabel}
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {stats.postCount > 0 && (
          <ChartCard
            icon={BarChart3}
            title="When you post"
            takeaway={stats.quietDays.length && stats.quietDays.length < 7 ? `Fewest posts on ${stats.quietDays.join(", ")}` : undefined}
          >
            <WeekdayBars stats={stats} />
          </ChartCard>
        )}
        {stats.byType.length > 0 && (
          <ChartCard
            icon={MessageSquareQuote}
            title="What gets a reaction"
            takeaway={stats.topType ? `${typeLabel(stats.topType.type)}s get the most likes + comments` : undefined}
          >
            <TypeBars stats={stats} />
          </ChartCard>
        )}
        {stats.reviewCount > 0 && (
          <ChartCard icon={Star} title="What reviewers say" takeaway={`${stats.reviewCount} recent Google reviews`}>
            <Reviews stats={stats} />
          </ChartCard>
        )}
      </div>
    </section>
  );
}
