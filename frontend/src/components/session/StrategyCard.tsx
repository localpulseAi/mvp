"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Eye, MessageCircleQuestion, Scale, Star } from "lucide-react";
import type { StrategistOutput } from "@/lib/api";
import { PipImg, SparkImg } from "@/components/dashboard/viz";
import { cn } from "@/lib/utils";

/**
 * Strategist answer, always in the same order but visual-first:
 * recommendation → why (one line, expandable) → options compared →
 * assumptions to check → what to watch → one-tap follow-ups.
 */

const FOLLOW_UPS = ["What if it doesn't work?", "How do I promote it?", "What will it cost me?"];

function firstSentence(t: string) {
  const m = t.match(/^.*?[.!?](\s|$)/);
  return m ? m[0].trim() : t;
}

function Label({ icon: Icon, children }: { icon: typeof Eye; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {children}
    </h3>
  );
}

export function StrategyCard({ output, onFollowUp }: { output: StrategistOutput; onFollowUp?: (q: string) => void }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [openAlt, setOpenAlt] = useState<number | null>(null);
  const [checked, setChecked] = useState<number[]>([]);
  const short = output.reasoning ? firstSentence(output.reasoning) : "";
  const hasMore = output.reasoning && short.length < output.reasoning.length;

  const options = [
    { title: output.recommendation, tradeoff: null as string | null, rationale: output.reasoning, pick: true },
    ...output.alternatives.map((a) => ({ title: a.option, tradeoff: a.tradeoffs, rationale: a.rationale, pick: false })),
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
      {/* Recommendation */}
      <section className="relative overflow-hidden rounded-2xl bg-ink p-5 pr-24 text-white sm:pr-32">
        <div aria-hidden="true" className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600/50 blur-2xl" />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-300">Pip recommends</p>
        <p className="relative mt-2 font-display text-lg font-semibold leading-snug sm:text-xl">{output.recommendation}</p>
        {short && (
          <div className="relative mt-3 text-sm leading-relaxed text-white/75">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={whyOpen ? "full" : "short"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <span className="font-semibold text-white">Why: </span>
                {whyOpen ? output.reasoning : short}
              </motion.p>
            </AnimatePresence>
            {hasMore && (
              <button onClick={() => setWhyOpen((v) => !v)} className="mt-1 text-xs font-semibold text-lime-300 hover:underline" aria-expanded={whyOpen}>
                {whyOpen ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}
        <motion.div
          className="absolute -bottom-2 right-2 sm:right-4"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.2 }}
          aria-hidden="true"
        >
          <PipImg pose="present" size={88} className="sm:!h-[112px] sm:!w-[112px]" />
        </motion.div>
      </section>

      {/* Options compared */}
      {options.length > 1 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <Label icon={Scale}>Your options</Label>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {options.map((o, i) => {
              const open = openAlt === i;
              return (
                <motion.button
                  key={i}
                  type="button"
                  onClick={() => setOpenAlt(open ? null : i)}
                  aria-expanded={open}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className={cn(
                    "flex flex-col rounded-xl border p-3 text-left transition-colors",
                    o.pick ? "border-lime-400 bg-lime-50" : "border-gray-200 hover:border-brand-300 hover:bg-canvas"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        o.pick ? "bg-lime-300 text-ink" : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {o.pick && <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />}
                      {o.pick ? "Our pick" : `Option ${i + 1}`}
                    </span>
                    <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-gray-400">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </motion.span>
                  </span>
                  <span className={cn("mt-2 text-sm font-semibold leading-snug text-ink", o.pick && "line-clamp-3")}>{o.title}</span>
                  {o.tradeoff && (
                    <span className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-[11px] leading-snug text-amber-900">
                      <span className="font-semibold">Trade-off:</span> {o.tradeoff}
                    </span>
                  )}
                  <AnimatePresence initial={false}>
                    {open && o.rationale && (
                      <motion.span
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 block overflow-hidden text-xs leading-relaxed text-gray-600"
                      >
                        {o.rationale}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Assumptions — tick as you verify */}
        {output.key_assumptions.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <PipImg pose="checklist" size={36} />
              <div>
                <h3 className="text-sm font-semibold text-ink">Check these first</h3>
                <p className="text-[11px] text-gray-500">
                  {checked.length}/{output.key_assumptions.length} confirmed
                </p>
              </div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {output.key_assumptions.map((a, i) => {
                const on = checked.includes(i);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setChecked((p) => (on ? p.filter((x) => x !== i) : [...p, i]))}
                      aria-pressed={on}
                      className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left text-sm leading-snug transition-colors hover:bg-canvas"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          on ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 bg-white"
                        )}
                      >
                        {on && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className={on ? "text-gray-500 line-through" : "text-gray-700"}>{a}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* What to watch */}
        {output.watch_for.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <Label icon={Eye}>What to watch</Label>
            <ul className="mt-3 space-y-2">
              {output.watch_for.map((w, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-2.5 rounded-lg bg-lime-50 px-3 py-2 text-sm font-medium text-ink"
                >
                  <span className="tabular flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-300 text-[10px] font-bold">{i + 1}</span>
                  {w}
                </motion.li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* One-tap follow-ups */}
      {onFollowUp && (
        <div className="flex flex-wrap items-center gap-2">
          <MessageCircleQuestion className="h-4 w-4 text-gray-400" aria-hidden="true" />
          {FOLLOW_UPS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onFollowUp(q)}
              className="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-lilac"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Agent huddle while Pip thinks ─────────────────────────────── */

const HUDDLE = [
  { spark: "blue", label: "Market" },
  { spark: "red", label: "Rivals" },
  { spark: "pink", label: "Brand" },
  { spark: "yellow", label: "Timing" },
  { spark: "lime", label: "Margins" },
  { spark: "orange", label: "Risk" },
];

/** Shows the multi-agent process: specialists join and check in one by one. */
export function ThinkingIndicator() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => Math.min(v + 1, HUDDLE.length)), 320);
    return () => clearInterval(t);
  }, []);
  const done = n >= HUDDLE.length;
  return (
    <div role="status" aria-live="polite" className="flex-1 rounded-2xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-semibold text-ink">{done ? "Pulling it together…" : "Your specialists are on it…"}</p>
      <div className="mt-3 flex flex-wrap gap-3" aria-hidden="true">
        {HUDDLE.map((h, i) => {
          const joined = i < n;
          return (
            <motion.div
              key={h.spark}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0.25, scale: 0.6 }}
              animate={joined ? { opacity: 1, scale: 1, y: [0, -6, 0] } : { opacity: 0.25, scale: 0.6 }}
              transition={{ default: { type: "spring", stiffness: 380, damping: 14 }, y: { duration: 0.45, ease: "easeOut" as const } }}
            >
              <span className="relative">
                <SparkImg color={h.spark} size={36} />
                {joined && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-0.5 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-lime-300 ring-2 ring-white"
                  >
                    <Check className="h-2 w-2 text-ink" strokeWidth={4} />
                  </motion.span>
                )}
              </span>
              <span className="text-[10px] font-medium text-gray-500">{h.label}</span>
            </motion.div>
          );
        })}
      </div>
      <span className="sr-only">Agenzy is reviewing your question.</span>
    </div>
  );
}

export function StrategistAvatar({ busy = false }: { busy?: boolean }) {
  return (
    <div className="h-10 w-10 shrink-0" aria-hidden="true">
      <motion.div animate={busy ? { rotate: [-6, 6, -6] } : {}} transition={{ duration: 1.2, repeat: Infinity }}>
        <PipImg pose={busy ? "think" : "wave"} size={40} />
      </motion.div>
    </div>
  );
}
