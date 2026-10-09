"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

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
