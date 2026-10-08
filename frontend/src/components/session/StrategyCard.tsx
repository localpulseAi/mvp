"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, Eye, Lightbulb, ListChecks, Sparkles } from "lucide-react";
import type { StrategistOutput } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Strategist response, always in the same order:
 * recommendation → reasoning → alternatives → assumptions & evidence → what to watch.
 */

function Block({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: typeof Eye;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-control border border-gray-200 bg-white p-4", className)}>
      <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {title}
      </h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function StrategyCard({ output }: { output: StrategistOutput }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
      className="space-y-3"
    >
      {output.restated_question && (
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-600">You asked: </span>
          {output.restated_question}
        </p>
      )}

      <section className="rounded-2xl border border-brand-200/70 bg-lilac p-5">
        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-700">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" /> Recommendation
        </h3>
        <p className="mt-2 font-display text-base font-semibold leading-snug text-ink sm:text-lg">
          {output.recommendation}
        </p>
      </section>

      {output.reasoning && (
        <Block icon={BookOpen} title="Why this approach">
          <p className="text-sm leading-relaxed text-gray-700">{output.reasoning}</p>
        </Block>
      )}

      {output.alternatives.length > 0 && (
        <Block icon={ArrowUpRight} title="Alternatives">
          <ol className="space-y-4">
            {output.alternatives.map((alt, i) => (
              <li key={i} className="flex gap-3">
                <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{alt.option}</p>
                  {alt.rationale && <p className="mt-1 text-sm leading-relaxed text-gray-700">{alt.rationale}</p>}
                  {alt.tradeoffs && (
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">
                      <span className="font-semibold text-gray-600">Trade-off: </span>
                      {alt.tradeoffs}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Block>
      )}

      {output.key_assumptions.length > 0 && (
        <Block icon={ListChecks} title="Assumptions & evidence" className="bg-gray-50">
          <ul className="space-y-1.5">
            {output.key_assumptions.map((a, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {output.watch_for.length > 0 && (
        <Block icon={Eye} title="What to watch">
          <ul className="flex flex-wrap gap-2">
            {output.watch_for.map((w, i) => (
              <li key={i} className="chip-lime">{w}</li>
            ))}
          </ul>
        </Block>
      )}
    </motion.div>
  );
}

export function ThinkingIndicator() {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2.5 rounded-control border border-gray-200 bg-white px-4 py-3 text-gray-500">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-600 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="text-xs">Reviewing your question…</span>
    </div>
  );
}

export function StrategistAvatar({ busy = false }: { busy?: boolean }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 shadow-sm" aria-hidden="true">
      <Sparkles className={cn("h-4 w-4 text-lime-300", busy && "animate-twinkle motion-reduce:animate-none")} />
    </div>
  );
}
