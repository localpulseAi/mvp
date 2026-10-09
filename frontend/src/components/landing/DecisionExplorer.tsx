"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Spark } from "./Spark";
import { SCENARIO_EVENT, discountImpact, scenarios, type ScenarioId } from "./scenarios";
import { cn } from "@/lib/utils";
import { pipJump, pipSay } from "@/lib/pip";

const PIP_REACTIONS: Record<ScenarioId, string> = {
  quiet: "Quiet hours? I love a challenge.",
  discount: "Let's check the margin first.",
  competitor: "Don't panic. Let's look closer.",
  occasion: "Ooh, a local moment!",
  social: "Let's make booking easy.",
};

const spring = { type: "spring" as const, stiffness: 350, damping: 32 };

function DiscountLab() {
  const [discount, setDiscount] = useState(20);
  const impact = discountImpact(discount);
  const reduced = useReducedMotion();
  const pct = (discount / 45) * 100;

  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-canvas p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <label htmlFor="discount-range" className="text-sm font-semibold text-ink">
          Try a discount
        </label>
        <output htmlFor="discount-range" className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white tabular">
          {discount}% off
        </output>
      </div>
      <input
        id="discount-range"
        type="range"
        min={0}
        max={45}
        step={1}
        value={discount}
        onChange={(e) => setDiscount(Number(e.target.value))}
        aria-valuetext={`${discount} percent discount`}
        className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full accent-brand-600"
        style={{ background: `linear-gradient(to right, #6840DE ${pct}%, #E6E1F0 ${pct}%)` }}
      />
      <div className="mt-1.5 flex justify-between text-[11px] text-gray-500">
        <span>No discount</span>
        <span>45% off</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3" aria-live="polite" aria-atomic="true">
        <div className="rounded-lg bg-white p-3">
          <span className="block text-[11px] font-medium text-gray-500">Gross profit / order</span>
          <strong className={cn("block font-display text-xl tabular", impact.contribution <= 0 ? "text-red-600" : "text-ink")}>
            ${impact.contribution.toFixed(2)}
          </strong>
          <small className="text-[11px] text-gray-500">Was $8.00 before discount</small>
        </div>
        <div className="rounded-lg bg-white p-3">
          <span className="block text-[11px] font-medium text-gray-500">Extra orders to match $800</span>
          <strong className="block font-display text-xl text-ink tabular">
            {impact.extra === null ? "Not possible" : `+${impact.extra}`}
          </strong>
          <small className="text-[11px] text-gray-500">
            {impact.orders === null ? "Each order makes no gross profit" : `${impact.orders} total orders vs. 100 before`}
          </small>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-[11px] text-gray-500" aria-hidden="true">
        <span className="shrink-0">Profit per order</span>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-lime-400"
            animate={{ scaleX: Math.max(0, impact.contribution / 8) }}
            transition={{ duration: reduced ? 0 : 0.25 }}
          />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-gray-500">Example: $20 price, $12 variable cost, 100 baseline orders. Fixed costs excluded.</p>
    </div>
  );
}

export function DecisionExplorer() {
  const [selected, setSelected] = useState<ScenarioId>("quiet");
  const [showReason, setShowReason] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [checked, setChecked] = useState<Partial<Record<ScenarioId, number[]>>>({});
  const reduced = useReducedMotion();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const s = scenarios.find((x) => x.id === selected)!;
  const done = (checked[selected] ?? []).length;

  function select(id: ScenarioId, fromUser = true) {
    setSelected(id);
    setShowReason(false);
    setPlanOpen(false);
    if (fromUser) pipSay(PIP_REACTIONS[id]);
  }

  useEffect(() => {
    const onSelect = (e: Event) => {
      const id = (e as CustomEvent<ScenarioId>).detail;
      if (scenarios.some((x) => x.id === id)) select(id);
    };
    window.addEventListener(SCENARIO_EVENT, onSelect);
    return () => window.removeEventListener(SCENARIO_EVENT, onSelect);
  }, []);

  function onKey(e: React.KeyboardEvent, i: number) {
    let n: number | undefined;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % scenarios.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i + scenarios.length - 1) % scenarios.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = scenarios.length - 1;
    if (n !== undefined) {
      e.preventDefault();
      select(scenarios[n].id);
      tabRefs.current[n]?.focus();
    }
  }

  function toggle(i: number) {
    const arr = checked[selected] ?? [];
    const next = arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i];
    setChecked((old) => ({ ...old, [selected]: next }));
    if (next.length === 3 && arr.length === 2) {
      pipSay("Nice work! That's a plan.");
      pipJump();
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid grid-cols-[minmax(0,1fr)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-soft lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Sidebar */}
        <div className="flex min-w-0 flex-col bg-ink p-4 text-white sm:p-6">
          <div className="mb-4 flex items-center gap-3 px-1 text-xs font-semibold tracking-[0.1em] text-white/80 lg:mb-6">
            <Spark className="h-5 w-5 text-lime-300" />
            WHAT&apos;S ON YOUR MIND?
          </div>
          <div
            role="tablist"
            aria-label="Explore a business decision"
            aria-orientation="vertical"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {scenarios.map((item, i) => {
              const active = item.id === selected;
              return (
                <motion.button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  id={`case-tab-${item.id}`}
                  role="tab"
                  aria-selected={active}
                  aria-controls="case-panel"
                  tabIndex={active ? 0 : -1}
                  onClick={() => select(item.id)}
                  onKeyDown={(e) => onKey(e, i)}
                  whileTap={reduced ? undefined : { scale: 0.985 }}
                  className={cn(
                    "relative flex shrink-0 items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm font-medium transition-colors lg:py-4",
                    active ? "text-ink" : "text-white/85 hover:bg-white/5"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="case-active"
                      className="absolute inset-0 rounded-lg bg-lime-300"
                      transition={reduced ? { duration: 0 } : spring}
                    />
                  )}
                  <span className={cn("relative text-xs tabular", active ? "text-ink/60" : "text-white/40")}>{item.number}</span>
                  <span className="relative flex-1 whitespace-nowrap lg:whitespace-normal">{item.label}</span>
                  <span className="relative hidden lg:block" aria-hidden="true">
                    {active ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4 text-white/60" />}
                  </span>
                </motion.button>
              );
            })}
          </div>
          <p className="mt-auto hidden pt-10 text-sm text-white/70 lg:block">
            Real questions.
            <br />
            <span className="font-fun text-xl font-medium text-lime-300">A clearer way forward.</span>
          </p>
        </div>

        {/* Panel */}
        <div className="min-w-0">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 sm:px-8">
            <span className="text-sm font-semibold text-ink">
              agenzy <span className="font-normal text-gray-500">/ strategy in action</span>
            </span>
            <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">Interactive example</span>
          </div>

          <div role="tabpanel" id="case-panel" aria-labelledby={`case-tab-${selected}`} tabIndex={0} className="px-5 py-6 sm:px-8 sm:py-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selected}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lilac text-[10px] font-bold text-brand-700" aria-hidden="true">
                    YOU
                  </span>
                  <p className="font-display text-base font-medium text-ink sm:text-lg">{s.question}</p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {s.context.map((text, i) => (
                    <motion.span
                      key={text}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * i, duration: 0.25 }}
                      className="rounded-md border border-gray-200 bg-canvas px-2.5 py-1 text-xs text-gray-600"
                    >
                      {text}
                    </motion.span>
                  ))}
                </div>

                <div className="mt-6">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                    <Spark className="h-3.5 w-3.5 text-brand-600" /> {s.feature}
                  </span>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[28px]">{s.title}</h3>
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-600">{s.answer}</p>
                </div>

                {selected === "discount" && <DiscountLab />}

                <button
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
                  aria-expanded={showReason}
                  aria-controls="case-reason"
                  onClick={() => setShowReason((v) => !v)}
                >
                  {showReason ? "Hide the reasoning" : "Why this approach?"}
                  {showReason ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                </button>
                <AnimatePresence initial={false}>
                  {showReason && (
                    <motion.p
                      id="case-reason"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 max-w-2xl overflow-hidden border-l-2 border-brand-200 pl-4 text-sm leading-relaxed text-gray-600"
                    >
                      {s.reason}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="mt-6 border-t border-gray-100 pt-5">
                  <p className="text-xs font-semibold tracking-[0.08em] text-ink">WHAT TO WATCH</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {s.metrics.map((m) => (
                      <span key={m} className="rounded-md bg-lime-200 px-2.5 py-1 text-xs font-medium text-ink">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <motion.button
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                    className="btn-primary min-h-[48px] rounded-lg px-5"
                    aria-expanded={planOpen}
                    aria-controls="sample-plan"
                    onClick={() => setPlanOpen((v) => !v)}
                  >
                    {planOpen ? "Close sample plan" : "Build a sample action plan"}
                    {planOpen ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
                  </motion.button>
                  <span className="text-xs leading-snug text-gray-500">
                    Small steps.
                    <br />A practical place to start.
                  </span>
                </div>

                <AnimatePresence initial={false}>
                  {planOpen && (
                    <motion.div
                      id="sample-plan"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-5 rounded-xl border border-brand-200/70 bg-lilac/60 p-4 sm:p-5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display text-sm font-semibold text-ink">Your sample action plan</h4>
                          <span aria-live="polite" className="text-xs font-semibold text-brand-700 tabular">
                            {done} / 3 tried
                          </span>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white" aria-hidden="true">
                          <motion.div
                            className="h-full w-full origin-left rounded-full bg-brand-600"
                            animate={{ scaleX: done / 3 }}
                            transition={reduced ? { duration: 0 } : spring}
                          />
                        </div>
                        <div className="mt-3 space-y-2">
                          {s.plan.map((item, i) => {
                            const on = (checked[selected] ?? []).includes(i);
                            return (
                              <label
                                key={item}
                                className={cn(
                                  "flex cursor-pointer items-start gap-3 rounded-lg bg-white px-3 py-2.5 text-sm transition-colors",
                                  on ? "text-gray-500 line-through decoration-gray-300" : "text-ink"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={on}
                                  onChange={() => toggle(i)}
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded accent-brand-600"
                                />
                                <span>{item}</span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="mt-3 text-xs text-gray-600" aria-live="polite">
                          {done === 3
                            ? "Nice work exploring. In your business, compare the results before deciding what to repeat."
                            : "Try ticking a step. This sample resets when you reload."}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="mt-5 text-xs text-gray-500">{s.signal}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
