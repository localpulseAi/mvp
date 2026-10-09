"use client";

import { motion } from "framer-motion";
import { CalendarDays, Clock, Store, TrendingUp, Users, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Picks an icon for a market-read sentence from what it talks about. */
function iconFor(text: string): { icon: LucideIcon; tone: string } {
  const t = text.toLowerCase();
  if (/(festival|event|market|occasion|holiday|weekend market)/.test(t)) return { icon: CalendarDays, tone: "bg-blue-50 text-blue-600" };
  if (/(competitor|nearby|café|cafe|rival|promotion|price)/.test(t)) return { icon: Users, tone: "bg-red-50 text-red-600" };
  if (/(morning|tuesday|weekday|hours|seats|capacity|quiet)/.test(t)) return { icon: Clock, tone: "bg-amber-50 text-amber-700" };
  if (/(discount|offer|bundle|value)/.test(t)) return { icon: Tag, tone: "bg-lime-100 text-lime-800" };
  if (/(store|shop|street|foot traffic)/.test(t)) return { icon: Store, tone: "bg-lilac text-brand-700" };
  return { icon: TrendingUp, tone: "bg-lilac text-brand-700" };
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * The market read, broken into scannable signal cards (one idea per card)
 * instead of a paragraph. Falls back to the full text if it is one sentence.
 */
export function WeekSignals({ text }: { text: string }) {
  const parts = sentences(text).slice(0, 4);
  return (
    <section aria-labelledby="signals-title">
      <h2 id="signals-title" className="mb-3 font-display text-base font-semibold text-ink">
        The week at a glance
      </h2>
      <div className={`grid gap-3 ${parts.length >= 3 ? "sm:grid-cols-3" : parts.length === 2 ? "sm:grid-cols-2" : ""}`}>
        {parts.slice(0, 3).map((p, i) => {
          const { icon: Icon, tone } = iconFor(p);
          return (
            <motion.div
              key={p}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="card flex gap-3 p-4"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="text-sm leading-relaxed text-gray-700">{p}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
