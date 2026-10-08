"use client";

import { forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Store } from "lucide-react";
import { ANALYSTS, INSIGHTS, PROFILE, SOURCES, type StepIndex } from "./steps";
import { SparkAgent, type SparkState } from "./SparkAgent";
import { Pip } from "./Pip";
import { cn } from "@/lib/utils";

const pop = { type: "spring" as const, stiffness: 420, damping: 28 };

/** Analyst orbit around the core (px). Stage uses the same maths for its spokes. */
export const ORBIT = { rx: 128, ry: 112 };
export function analystOffset(i: number) {
  const angle = (i / ANALYSTS.length) * Math.PI * 2 - Math.PI / 2;
  return { x: Math.cos(angle) * ORBIT.rx, y: Math.sin(angle) * ORBIT.ry };
}

/* ── 1. Your business ───────────────────────────────────────────── */

export const BusinessCard = forwardRef<HTMLDivElement, { step: StepIndex }>(function BusinessCard({ step }, ref) {
  const active = step === 0;
  return (
    <motion.div
      ref={ref}
      animate={{ scale: active ? 1.03 : 1, boxShadow: active ? "0 16px 40px -12px rgba(104,64,222,0.35)" : "0 1px 2px rgba(33,26,53,0.05)" }}
      transition={pop}
      className={cn("relative z-10 rounded-2xl border bg-white p-4", active ? "border-brand-300" : "border-gray-200")}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink">
          <Store className="h-4 w-4 text-lime-300" />
        </span>
        <div>
          <p className="font-display text-sm font-semibold leading-tight text-ink">Your café</p>
          <p className="text-[11px] text-gray-500">The context only you know</p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {PROFILE.map((p, i) => (
          <div key={p.k} className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-2.5 py-1.5 text-[11px]">
            <span className="text-gray-500">{p.k}</span>
            <motion.span
              key={`${p.k}-${step === 0}`}
              initial={step === 0 ? { opacity: 0, x: 8 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step === 0 ? 0.2 + i * 0.3 : 0, ...pop }}
              className="font-semibold text-ink"
            >
              {p.v}
            </motion.span>
          </div>
        ))}
      </div>
    </motion.div>
  );
});

/* ── 2. Sources ─────────────────────────────────────────────────── */

export const SourceChip = forwardRef<HTMLDivElement, { index: number; step: StepIndex }>(function SourceChip({ index, step }, ref) {
  const s = SOURCES[index];
  const on = step >= 1;
  const pulsing = step === 1;
  return (
    <motion.div
      ref={ref}
      animate={{ opacity: on ? 1 : 0.35, scale: pulsing ? [1, 1.1, 1] : 1 }}
      transition={pulsing ? { delay: 0.3 + index * 0.55, duration: 0.5 } : { duration: 0.3 }}
      className={cn(
        "relative z-10 flex items-center gap-2 rounded-xl border bg-white px-2.5 py-2 text-[11px] font-medium",
        on ? "border-brand-200 text-ink" : "border-gray-200 text-gray-400"
      )}
    >
      <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg", on ? "bg-lilac" : "bg-gray-100")}>
        <s.icon className={cn("h-3.5 w-3.5", on ? "text-brand-600" : "text-gray-400")} />
      </span>
      <span className="truncate">{s.label}</span>
    </motion.div>
  );
});

/* ── 3. Agenzy core + specialists ───────────────────────────────── */

/** Mini agent footprint: 44px character + name tag. Its body centre sits on the orbit point. */
const AGENT = { w: 84, body: 28 };

function AnalystAgent({ index, step, spoken }: { index: number; step: StepIndex; spoken: number }) {
  const a = ANALYSTS[index];
  const o = analystOffset(index);
  const visible = step >= 2;
  const said = step >= 3 || index < spoken;
  const speaking = step === 2 && index === spoken - 1;
  const state: SparkState = speaking ? "speaking" : said ? "done" : "thinking";
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 z-20 flex flex-col items-center"
      style={{ width: AGENT.w }}
      initial={false}
      animate={{
        x: (visible ? o.x : o.x * 0.2) - AGENT.w / 2,
        y: (visible ? o.y : o.y * 0.2) - AGENT.body,
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.2,
      }}
      transition={{ ...pop, delay: visible && step === 2 ? index * 0.1 : 0 }}
    >
      <SparkAgent spark={a.spark} color={a.color} icon={a.icon} state={state} seed={index} />
      <span
        className={cn(
          "mt-1 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm transition-colors",
          said ? "border-lime-400 bg-lime-100 text-ink" : "border-gray-200 bg-white text-gray-700"
        )}
      >
        {a.name}
        {said && <Check className="h-2.5 w-2.5 text-lime-700" strokeWidth={3.5} />}
      </span>
    </motion.div>
  );
}

export const Core = forwardRef<HTMLDivElement, { step: StepIndex; spoken: number }>(function Core({ step, spoken }, ref) {
  return (
    <div className="relative mx-auto flex h-[320px] w-full max-w-[340px] items-center justify-center">
      {ANALYSTS.map((a, i) => (
        <AnalystAgent key={a.name} index={i} step={step} spoken={spoken} />
      ))}

      {/* Pulsing rings */}
      {[0, 1].map((r) => (
        <motion.span
          key={r}
          className="absolute h-32 w-32 rounded-full border-2 border-brand-300"
          animate={step >= 1 && step <= 3 ? { scale: [1, 1.9], opacity: [0.6, 0] } : { scale: 1, opacity: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, delay: r * 0.9, ease: "easeOut" as const }}
        />
      ))}

      <div ref={ref} className="relative z-10">
        <Pip step={step} />
      </div>
    </div>
  );
});

/* ── 4. Findings feed (Analyse) → Insights ───────────────────────── */

function FindingsFeed({ spoken }: { spoken: number }) {
  const said = ANALYSTS.slice(0, spoken).slice(-3);
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {said.map((a) => (
        <motion.div
          key={a.name}
          layout
          initial={{ opacity: 0, x: -20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.9, transition: { duration: 0.2 } }}
          transition={pop}
          className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] shadow-sm"
        >
          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", a.tint)}>
            <a.icon className="h-3 w-3" />
          </span>
          <span className="font-semibold text-ink">{a.name}:</span>
          <span className="truncate text-gray-600">{a.finding}</span>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export const Insights = forwardRef<HTMLDivElement, { step: StepIndex; spoken: number }>(function Insights({ step, spoken }, ref) {
  return (
    <div ref={ref} className="relative z-10 mx-auto min-h-[124px] w-full max-w-[340px] space-y-1.5">
      {step === 2 && <FindingsFeed spoken={spoken} />}
      <AnimatePresence>
        {step >= 3 &&
          INSIGHTS.map((ins, i) => {
            const key = ins.kind === "Insight";
            return (
              <motion.div
                key={ins.text}
                initial={{ opacity: 0, y: -24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ ...pop, delay: step === 3 ? 0.9 + i * 0.6 : 0 }}
                className={cn(
                  "relative flex items-center gap-2 overflow-hidden rounded-xl border px-3 py-2 text-[11px]",
                  key ? "border-brand-600 bg-brand-600 text-white shadow-violet" : "border-gray-200 bg-white text-gray-600"
                )}
              >
                <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", key ? "bg-lime-300 text-ink" : "bg-gray-100 text-gray-500")}>
                  {ins.kind}
                </span>
                <span className={cn("leading-snug", key && "font-semibold")}>{ins.text}</span>
                {key && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    initial={{ left: "-40%" }}
                    animate={{ left: "140%" }}
                    transition={{ delay: step === 3 ? 2.4 : 0.2, duration: 0.9, repeat: Infinity, repeatDelay: 2.5 }}
                  />
                )}
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
});
