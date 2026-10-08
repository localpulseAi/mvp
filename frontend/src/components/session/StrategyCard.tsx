"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, CheckCircle2, Eye, Sparkles, TrendingUp } from "lucide-react";
import type { StrategistOutput } from "@/lib/api";
import { cn } from "@/lib/utils";

export type StrategyOutput = {
  type: "strategy";
  restatement: string;
  context: string;
  analysis: string;
  recommendation: string;
  recommendationReasoning: string;
  alternatives: { label: string; desc: string }[];
  watchFor: string[];
  agents: { name: string; status: "done" | "partial" }[];
};

export const AGENT_LIST = [
  "Market Analyst",
  "Competitor Analyst",
  "Brand & Positioning",
  "Timing Analyst",
  "Financial Sense-Check",
  "Risk Analyst",
];

export function mapStrategistOutput(raw: StrategistOutput): StrategyOutput {
  return {
    type: "strategy",
    restatement: raw.restated_question,
    context: raw.key_assumptions.length > 0 ? raw.key_assumptions.join(" ") : "",
    analysis: raw.reasoning,
    recommendation: raw.recommendation,
    recommendationReasoning: raw.reasoning,
    alternatives: raw.alternatives.map((a) => ({
      label: a.option,
      desc: [a.rationale, a.tradeoffs].filter(Boolean).join(" "),
    })),
    watchFor: raw.watch_for,
    agents: AGENT_LIST.map((name) => ({ name, status: "done" as const })),
  };
}

const TABS = [
  { id: "recommendation", label: "Recommendation", icon: Sparkles },
  { id: "alternatives", label: "Alternatives", icon: ArrowUpRight },
  { id: "watchfor", label: "Watch for", icon: Eye },
] as const;

export function StrategyCard({ output }: { output: StrategyOutput }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("recommendation");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" as const }}
      className="space-y-3"
    >
      {/* Agent run info */}
      <div className="flex flex-wrap gap-1.5">
        {output.agents.map((agent) => (
          <span
            key={agent.name}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-600"
          >
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {agent.name}
          </span>
        ))}
      </div>

      {/* Restatement */}
      <div className="rounded-control border border-gray-200 bg-gray-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">What you&apos;re asking</p>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{output.restatement}</p>
      </div>

      {/* Context */}
      {output.context && (
        <div className="rounded-control bg-lilac p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-700">
            <TrendingUp className="h-3.5 w-3.5" /> Key assumptions
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{output.context}</p>
        </div>
      )}

      {/* Analysis */}
      <div className="rounded-control border border-gray-200 bg-white p-4">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
          <BookOpen className="h-3.5 w-3.5" /> The analysis
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{output.analysis}</p>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-200/70" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-semibold transition-colors sm:px-4",
                tab === id
                  ? "border-brand-600 bg-lilac/50 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-ink"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "recommendation" && (
            <div>
              <p className="font-display text-base font-semibold leading-snug text-ink">{output.recommendation}</p>
              <p className="mt-3 text-sm leading-relaxed text-gray-700">{output.recommendationReasoning}</p>
            </div>
          )}
          {tab === "alternatives" && (
            <div className="space-y-4">
              {output.alternatives.length === 0 ? (
                <p className="text-sm text-gray-500">No alternatives provided.</p>
              ) : (
                output.alternatives.map((alt, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime-300 text-xs font-semibold text-ink">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{alt.label}</p>
                      <p className="mt-1 text-sm leading-relaxed text-gray-700">{alt.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {tab === "watchfor" && (
            <ul className="space-y-3">
              {output.watchFor.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2.5 rounded-control border border-gray-200 bg-white px-4 py-3 text-gray-500">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-600"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="text-xs">Six analysts are reviewing your question…</span>
    </div>
  );
}

export function StrategistAvatar({ busy = false }: { busy?: boolean }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 shadow-sm">
      <Sparkles className={cn("h-4 w-4 text-lime-300", busy && "animate-twinkle")} />
    </div>
  );
}
