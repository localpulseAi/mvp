"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Calculator, Clock, Database, ListChecks, Sparkles, Wrench } from "lucide-react";
import type { AuditActionItem, AuditEvidence } from "@/lib/api";
import { PipImg, SparkImg } from "@/components/dashboard/viz";
import { MascotSlot } from "@/components/mascot/MascotSlot";
import { agentLabel, ago, sourceLabel, toolLabel, typeLabel, type EvidenceStats } from "./evidenceStats";
import { cn } from "@/lib/utils";

type StageId = "collect" | "measure" | "analyse" | "plan";

const KIND = {
  data: { label: "Data · no AI", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  ai: { label: "AI · grounded in the data", cls: "bg-lilac text-brand-700 ring-brand-200" },
};

interface AgentTraceProps {
  evidence: AuditEvidence;
  stats: EvidenceStats;
  items: AuditActionItem[];
  onOpenEvidence: () => void;
  onOpenPlan: () => void;
}

/**
 * How this audit was made: collect → measure → analyse → plan. The first two
 * steps are plain data work; only the last two involve the AI, and it reads
 * only what was collected. Each stage expands to show exactly what it did.
 */
export function AgentTrace({ evidence, stats, items, onOpenEvidence, onOpenPlan }: AgentTraceProps) {
  const [sel, setSel] = useState<StageId>("collect");
  const reduced = useReducedMotion();
  const agent = evidence.agents[0];
  const secs = evidence.orchestration ? Math.round(evidence.orchestration.total_latency_ms / 1000) : agent ? Math.round(agent.latency_ms / 1000) : null;
  const itemsRead = evidence.sources.reduce((s, x) => s + x.item_count, 0);

  const stages: { id: StageId; kind: keyof typeof KIND; title: string; stat: string; mascot: React.ReactNode }[] = [
    { id: "collect", kind: "data", title: "Collect", stat: `${itemsRead} items from ${evidence.sources.length} sources`, mascot: <PipImg pose="search" size={52} /> },
    { id: "measure", kind: "data", title: "Measure", stat: stats.postsPerWeek != null ? `${stats.postsPerWeek} posts/week · ${stats.avgRating ?? "–"}★` : "Patterns calculated", mascot: <SparkImg color="violet" size={46} /> },
    { id: "analyse", kind: "ai", title: "Analyse", stat: agent ? `${agent.tool_call_count} data look-ups${secs ? ` · ${secs}s` : ""}` : "Analyst agent", mascot: <PipImg pose="think" size={52} /> },
    { id: "plan", kind: "ai", title: "Plan", stat: `${items.length} actions`, mascot: <PipImg pose="checklist" size={52} /> },
  ];

  return (
    <section className="card overflow-hidden" aria-labelledby="trace-title">
      <header className="flex flex-col gap-1 border-b border-gray-200/70 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Behind this audit</p>
          <h2 id="trace-title" className="mt-1 font-display text-lg font-semibold text-ink">
            What our agents did, step by step
          </h2>
        </div>
        <div className="flex items-end gap-3">
          <p className="text-xs text-gray-500">Generated {ago(evidence.generated_at)}{secs ? ` · took ${secs}s` : ""}</p>
          <MascotSlot pose2d="search" pose3d="search" size={72} say="Here's everything I looked at." className="hidden sm:block" />
        </div>
      </header>

      {/* Pipeline */}
      <div role="tablist" aria-label="Audit pipeline" className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4 sm:gap-0 sm:p-5">
        {stages.map((s, i) => {
          const active = s.id === sel;
          return (
            <div key={s.id} className="relative flex items-stretch">
              <motion.button
                role="tab"
                aria-selected={active}
                onClick={() => setSel(s.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.12 }}
                className={cn(
                  "relative z-10 flex w-full flex-col items-center rounded-2xl border px-2 pb-3 pt-2 text-center transition-colors sm:mx-2",
                  active ? "border-brand-300 bg-lilac/60 shadow-soft" : "border-transparent hover:bg-canvas"
                )}
              >
                <span className="flex h-14 items-end">{s.mascot}</span>
                <span className="mt-1 font-display text-sm font-semibold text-ink">
                  {i + 1}. {s.title}
                </span>
                <span className="mt-0.5 text-[11px] leading-tight text-gray-500">{s.stat}</span>
                <span className={cn("mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1", KIND[s.kind].cls)}>{KIND[s.kind].label}</span>
              </motion.button>
              {i < stages.length - 1 && (
                <div className="absolute -right-2 top-9 z-0 hidden w-4 items-center sm:flex" aria-hidden="true">
                  <ArrowRight className="h-4 w-4 text-brand-300" />
                  {!reduced && (
                    <motion.span
                      className="absolute left-0 h-1.5 w-1.5 rounded-full bg-brand-600"
                      animate={{ x: [0, 14], opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stage detail */}
      <div className="border-t border-gray-200/70 bg-canvas px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {sel === "collect" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  Scouts pulled your <strong className="font-semibold text-ink">public</strong> profiles through read-only connections. Nothing was posted or changed.
                </p>
                <ul className="grid gap-2 sm:grid-cols-3">
                  {evidence.sources.map((s) => (
                    <li key={s.source} className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-gray-200/70">
                      <Database className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{sourceLabel(s.source)}</p>
                        <p className="text-[11px] text-gray-500">
                          <span className="tabular">{s.item_count}</span> {s.source === "google_business" ? "listing" : "items"} · {ago(s.scraped_at)}
                        </p>
                      </div>
                    </li>
                  ))}
                  {evidence.sources.length === 0 && <li className="text-sm text-gray-500">No source data was attached to this audit.</li>}
                </ul>
                <button onClick={onOpenEvidence} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                  See everything that was read <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {sel === "measure" && (
              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm text-gray-700">
                  <Calculator className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  These numbers are calculated straight from the collected posts and reviews, not written by AI.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { k: "Posts per week", v: stats.postsPerWeek != null ? String(stats.postsPerWeek) : "–" },
                    { k: "Best format", v: stats.topType ? typeLabel(stats.topType.type) : "–" },
                    { k: "Avg rating", v: stats.avgRating != null ? `${stats.avgRating}★` : "–" },
                    { k: "Reviews replied", v: stats.replyRate != null ? `${Math.round(stats.replyRate * 100)}%` : "–" },
                  ].map((m) => (
                    <div key={m.k} className="rounded-xl bg-white p-3 ring-1 ring-gray-200/70">
                      <p className="text-[11px] text-gray-500">{m.k}</p>
                      <p className="tabular mt-0.5 font-display text-xl font-semibold text-ink">{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sel === "analyse" && (
              <div className="space-y-3">
                {agent ? (
                  <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-gray-200/70 sm:flex-row sm:items-center">
                    <Sparkles className="h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{agentLabel(agent.agent_name)}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                        <span>Model: {agent.model_used}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" /> {Math.round(agent.latency_ms / 1000)}s
                        </span>
                        <span className="capitalize">Status: {agent.status}</span>
                      </p>
                    </div>
                    <ul className="flex flex-wrap gap-1.5">
                      {agent.tools.map((t) => (
                        <li key={t} className="inline-flex items-center gap-1 rounded-md bg-lilac px-2 py-1 text-[11px] font-semibold text-brand-700">
                          <Wrench className="h-3 w-3" aria-hidden="true" /> {toolLabel(t)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Agent run details weren&apos;t recorded for this audit.</p>
                )}
                <p className="text-sm text-gray-700">
                  The analyst can only use the tools listed above, so it reads your collected data rather than browsing the web. Its
                  findings are labelled as interpretation; the charts below are pure data.
                </p>
              </div>
            )}

            {sel === "plan" && (
              <div className="space-y-3">
                <ul className="space-y-1.5">
                  {items.slice(0, 4).map((it) => (
                    <li key={it.id} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-gray-200/70">
                      <span
                        className={cn("h-2 w-2 shrink-0 rounded-full", it.priority === "high" ? "bg-red-500" : it.priority === "medium" ? "bg-amber-500" : "bg-gray-400")}
                        aria-hidden="true"
                      />
                      <span className="flex-1 truncate font-medium text-ink">{it.title}</span>
                      <span className="text-[11px] capitalize text-gray-500">{it.priority}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={onOpenPlan} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                  <ListChecks className="h-4 w-4" /> Open the action plan
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
