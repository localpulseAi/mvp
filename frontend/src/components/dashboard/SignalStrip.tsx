"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ChangeItem } from "@/lib/api";
import { SEVERITY, SparkImg, Tip } from "./viz";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Last 7 days × competitors. Each public change is a dot on the day it was
 * spotted; status colour + legend + tooltip text (never colour alone).
 */
export function SignalStrip({ changes, competitors }: { changes: ChangeItem[]; competitors: string[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() - (6 - i) * DAY));
  const rows = Array.from(new Set([...competitors, ...changes.map((c) => c.competitor_name)])).slice(0, 5);
  const urgent = changes.find((c) => c.severity === "high");

  const cell = (name: string, day: Date) =>
    changes.filter((c) => c.competitor_name === name && startOfDay(new Date(c.detected_at)).getTime() === day.getTime());

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="pulse-title">
      <header className="mb-4 flex items-center gap-3">
        <SparkImg color="red" size={40} />
        <div className="min-w-0 flex-1">
          <h2 id="pulse-title" className="font-display text-base font-semibold text-ink">
            Competitor pulse
          </h2>
          <p className="text-xs text-gray-500">Public changes, last 7 days</p>
        </div>
        <Link href="/competitors" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          View all
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">Follow a nearby business to see its activity here.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[300px] border-separate border-spacing-y-1.5">
            <thead>
              <tr>
                <th className="sr-only">Business</th>
                {days.map((d, i) => (
                  <th key={i} className="pb-1 text-center text-[10px] font-medium text-gray-400">
                    {i === 6 ? "Today" : d.toLocaleDateString("en-CA", { weekday: "narrow" })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((name, r) => (
                <tr key={name}>
                  <th scope="row" className="w-[38%] pr-2 text-left">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-lime-300">
                        {name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate text-xs font-medium text-ink">{name}</span>
                    </span>
                  </th>
                  {days.map((d, i) => {
                    const hits = cell(name, d);
                    const top = hits.find((h) => h.severity === "high") ?? hits.find((h) => h.severity === "medium") ?? hits[0];
                    return (
                      <td key={i} className="text-center">
                        {top ? (
                          <Tip
                            content={
                              <>
                                <span className="block font-semibold">
                                  {name} · {SEVERITY[top.severity].label}
                                </span>
                                {hits.map((h) => h.description).join(" · ")}
                              </>
                            }
                          >
                            <motion.button
                              type="button"
                              aria-label={`${name}, ${SEVERITY[top.severity].label} signal: ${top.description}`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              whileHover={{ scale: 1.3 }}
                              transition={{ type: "spring", stiffness: 400, damping: 16, delay: 0.2 + r * 0.08 + i * 0.03 }}
                              className={cn("relative mx-auto block h-3.5 w-3.5 rounded-full ring-2 ring-white", SEVERITY[top.severity].dot)}
                            >
                              {top.severity === "high" && (
                                <motion.span
                                  className="absolute -inset-1 rounded-full border-2 border-red-400"
                                  animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
                                  transition={{ duration: 1.4, repeat: Infinity }}
                                  aria-hidden="true"
                                />
                              )}
                            </motion.button>
                          </Tip>
                        ) : (
                          <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-gray-200" aria-hidden="true" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
        {(["high", "medium", "low"] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", SEVERITY[k].dot)} aria-hidden="true" />
            {SEVERITY[k].label}
          </span>
        ))}
      </div>

      {urgent && (
        <Link
          href={`/session?q=${encodeURIComponent(`How should I respond? ${urgent.competitor_name}: ${urgent.description}`)}`}
          className="group mt-4 flex items-center gap-3 rounded-xl bg-red-50 px-3 py-2.5 ring-1 ring-red-200 transition-colors hover:bg-red-100"
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-xs text-red-900">
            <span className="font-semibold">High: {urgent.competitor_name}</span> {urgent.description}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-red-700">
            Plan response <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}
    </section>
  );
}
