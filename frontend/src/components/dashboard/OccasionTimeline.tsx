"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { OccasionItem } from "@/lib/api";
import { parseApiDate } from "@/lib/utils";
import { SparkImg, Tip } from "./viz";
import { cn } from "@/lib/utils";

const WINDOW = 60; // days shown on the track

function fmt(d: string) {
  return parseApiDate(d).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

/**
 * Next 60 days as a single track: today on the left, each occasion a dot at
 * its distance. Single hue; "soon" (≤14 days) is called out by size + label,
 * not colour alone. Hover or focus a dot for details.
 */
export function OccasionTimeline({ occasions }: { occasions: OccasionItem[] }) {
  const items = occasions.filter((o) => o.days_out >= 0 && o.days_out <= WINDOW).slice(0, 6);
  const weeks = [7, 14, 21, 28, 35, 42, 49, 56];

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="cal-title">
      <header className="mb-2 flex items-center gap-3">
        <SparkImg color="blue" size={40} />
        <div>
          <h2 id="cal-title" className="font-display text-base font-semibold text-ink">
            Coming up locally
          </h2>
          <p className="text-xs text-gray-500">Next {WINDOW} days · hover a dot</p>
        </div>
      </header>

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Nothing on the calendar for the next {WINDOW} days.</p>
      ) : (
        <>
          <div className="relative mx-2 mb-2 mt-14 h-10">
            {/* track */}
            <div className="absolute inset-x-0 top-4 h-1.5 rounded-full bg-gray-100" />
            <motion.div
              className="absolute left-0 top-4 h-1.5 origin-left rounded-full bg-brand-200"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{ width: `${(14 / WINDOW) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
            {/* week ticks */}
            {weeks.map((w) => (
              <span key={w} className="absolute top-[13px] h-3 w-px bg-gray-200" style={{ left: `${(w / WINDOW) * 100}%` }} aria-hidden="true" />
            ))}
            {/* today */}
            <span className="absolute -left-1 top-2.5 h-4 w-4 rounded-full border-[3px] border-white bg-ink shadow" aria-hidden="true" />
            <span className="absolute -left-2 top-9 text-[10px] font-semibold text-ink">Today</span>
            <span className="absolute right-0 top-9 text-[10px] text-gray-400">{WINDOW}d</span>

            {items.map((o, i) => {
              const soon = o.days_out <= 14;
              const left = (o.days_out / WINDOW) * 100;
              return (
                <div key={o.id} className="absolute top-0 -translate-x-1/2" style={{ left: `${left}%` }}>
                  {/* direct label above, alternating height to avoid collisions */}
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className={cn(
                      "pointer-events-none absolute w-[92px] text-[10px] leading-tight",
                      i > 0 && "hidden sm:block",
                      left > 78 ? "right-0 text-right" : left < 14 ? "left-0 text-left" : "left-1/2 -translate-x-1/2 text-center",
                      i % 2 === 0 ? "-top-12" : "-top-7",
                      soon ? "font-semibold text-ink" : "text-gray-500"
                    )}
                  >
                    <span className="line-clamp-2">{o.name}</span>
                  </motion.span>
                  <Tip
                    content={
                      <>
                        <span className="block font-semibold">{o.name}</span>
                        {fmt(o.date)} · in {o.days_out} days{o.category ? ` · ${o.category}` : ""}
                      </>
                    }
                  >
                    <motion.button
                      type="button"
                      aria-label={`${o.name}, ${fmt(o.date)}, in ${o.days_out} days`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.25 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.3 + i * 0.1 }}
                      className={cn(
                        "relative mt-2 block rounded-full border-[3px] border-white shadow",
                        soon ? "h-6 w-6 -translate-y-1 bg-brand-600" : "h-4 w-4 bg-brand-400"
                      )}
                    >
                      {soon && (
                        <motion.span
                          className="absolute -inset-1.5 rounded-full border-2 border-brand-400"
                          animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                          transition={{ duration: 1.6, repeat: Infinity }}
                          aria-hidden="true"
                        />
                      )}
                    </motion.button>
                  </Tip>
                </div>
              );
            })}
          </div>
          {items[0] && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-canvas px-3 py-2.5">
              <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-white text-center leading-none shadow-sm">
                <span className="text-[9px] font-semibold uppercase text-brand-600">
                  {parseApiDate(items[0].date).toLocaleDateString("en-CA", { month: "short" })}
                </span>
                <span className="tabular font-display text-sm font-semibold text-ink">{parseApiDate(items[0].date).getDate()}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">Next up · {items[0].days_out} days</p>
                <p className="truncate text-sm font-semibold text-ink">{items[0].name}</p>
              </div>
              <Link
                href={`/session?q=${encodeURIComponent(`What should I do for ${items[0].name}?`)}`}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
              >
                Plan it <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
          <p className="mt-3 flex items-center gap-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-brand-600" aria-hidden="true" /> Within 2 weeks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-400" aria-hidden="true" /> Later
            </span>
          </p>
        </>
      )}
    </section>
  );
}
