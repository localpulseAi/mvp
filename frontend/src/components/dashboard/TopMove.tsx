"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Eye, Lightbulb, MessageSquare } from "lucide-react";
import type { BriefRecommendation } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ─── Lead recommendation: action · reason · result to watch ─── */

export function TopMove({ rec, weekLabel }: { rec: BriefRecommendation; weekLabel: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
      className="card overflow-hidden"
      aria-labelledby="top-move-title"
    >
      <div className="grid lg:grid-cols-[1.4fr_1fr]">
        <div className="p-5 sm:p-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-brand-600">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
            Your top move · {weekLabel}
          </p>
          <h2 id="top-move-title" className="mt-2 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
            {rec.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">{rec.body}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Link href="/brief" className="btn-primary">
              Read the full brief <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/session" className="btn-secondary">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Talk it through
            </Link>
          </div>
        </div>
        <div className="space-y-4 border-t border-gray-200/70 bg-canvas p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Why it matters</p>
            <p className="mt-1 text-sm leading-6 text-gray-700">{rec.reasoning}</p>
          </div>
          {rec.watch_for?.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                What to watch
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {rec.watch_for.map((w) => (
                  <li key={w} className="chip-lime">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

/* ─── Live workspace without a brief: explain prerequisites ─── */

export interface SetupStep {
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const next = steps.find((s) => !s.done);
  return (
    <section className="card p-5 sm:p-6" aria-labelledby="setup-title">
      <p className="eyebrow">Getting started</p>
      <h2 id="setup-title" className="mt-1 font-display text-xl font-semibold text-ink">
        Your first brief isn&apos;t ready yet
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Agenzy needs a little context before it can recommend your next move.
      </p>
      <ol className="mt-5 space-y-2">
        {steps.map((s) => (
          <li
            key={s.label}
            className={cn(
              "flex items-center gap-3 rounded-control border px-4 py-3",
              s === next ? "border-brand-200 bg-lilac" : "border-gray-200/70 bg-white"
            )}
          >
            {s.done ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : (
              <Circle className="h-5 w-5 shrink-0 text-gray-300" aria-hidden="true" />
            )}
            <span className={cn("flex-1 text-sm", s.done ? "text-gray-500 line-through" : "font-medium text-ink")}>
              {s.label}
              <span className="sr-only">{s.done ? " (done)" : " (to do)"}</span>
            </span>
            {!s.done && (
              <Link
                href={s.href}
                className={cn(s === next ? "btn-primary px-3 py-1.5" : "text-sm font-semibold text-brand-700 hover:underline")}
              >
                {s.cta}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
