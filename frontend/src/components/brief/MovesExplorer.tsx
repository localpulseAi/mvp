"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Eye, Lightbulb, MessageSquare } from "lucide-react";
import type { BriefRecommendation } from "@/lib/api";
import { PipImg, Ring } from "@/components/dashboard/viz";
import { cn } from "@/lib/utils";

interface MovesExplorerProps {
  recs: BriefRecommendation[];
  tried: number[];
  onToggle: (i: number) => void;
}

/** One move at a time: pick from the list, read a focused panel, mark it tried. */
export function MovesExplorer({ recs, tried, onToggle }: MovesExplorerProps) {
  const [sel, setSel] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const r = recs[sel];
  const isTried = tried.includes(sel);
  const allDone = recs.length > 0 && tried.length === recs.length;

  function onKey(e: React.KeyboardEvent, i: number) {
    let n: number | undefined;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % recs.length;
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + recs.length) % recs.length;
    if (n !== undefined) {
      e.preventDefault();
      setSel(n);
      tabs.current[n]?.focus();
    }
  }

  return (
    <section className="card overflow-hidden" aria-labelledby="moves-x-title">
      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Move list */}
        <div className="min-w-0 border-b border-gray-200/70 bg-canvas p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center gap-3">
            <Ring value={recs.length ? tried.length / recs.length : 0} size={44} stroke={5} label={`${tried.length} of ${recs.length} moves tried`}>
              <span className="tabular text-[11px] font-bold text-ink">
                {tried.length}/{recs.length}
              </span>
            </Ring>
            <div>
              <h2 id="moves-x-title" className="font-display text-base font-semibold text-ink">
                Your moves
              </h2>
              <p className="text-[11px] text-gray-500">{allDone ? "All tried, nice!" : "Pick one to explore"}</p>
            </div>
          </div>
          <div role="tablist" aria-label="This week's moves" aria-orientation="vertical" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible">
            {recs.map((rec, i) => {
              const active = i === sel;
              const done = tried.includes(i);
              return (
                <button
                  key={rec.title}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  role="tab"
                  aria-selected={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => setSel(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={cn(
                    "relative flex w-[220px] shrink-0 items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors lg:w-auto",
                    active ? "text-white" : "text-ink hover:bg-white"
                  )}
                >
                  {active && <motion.span layoutId="move-tab" className="absolute inset-0 rounded-xl bg-brand-600" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span
                    className={cn(
                      "relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                      done ? "bg-lime-300 text-ink" : active ? "bg-white/20 text-white" : "bg-white text-gray-500 ring-1 ring-gray-200"
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="relative line-clamp-2 text-sm font-semibold leading-snug">{rec.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Focused panel */}
        <div role="tabpanel" aria-label={r?.title} className="relative min-h-[320px] p-5 sm:p-6">
          <AnimatePresence mode="wait">
            {r && (
              <motion.div key={sel} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <p className="eyebrow">
                  Move {sel + 1} of {recs.length}
                  {sel === 0 && " · Top move"}
                </p>
                <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">{r.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-700">{r.body}</p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-lilac p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">
                      <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" /> Why it matters
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-700">{r.reasoning}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200/80 p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-gray-600">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Results to watch
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.watch_for.map((w) => (
                        <span key={w} className="rounded-md bg-lime-200 px-2 py-1 text-xs font-semibold text-ink">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onToggle(sel)}
                    aria-pressed={isTried}
                    className={isTried ? "btn-lime" : "btn-primary"}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {isTried ? "Tried it" : "Mark as tried"}
                  </motion.button>
                  <Link
                    href={`/session?q=${encodeURIComponent(`Help me plan: ${r.title}`)}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" /> Talk it through with Pip
                  </Link>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => setSel((sel - 1 + recs.length) % recs.length)} className="btn-ghost h-9 w-9 !px-0" aria-label="Previous move">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setSel((sel + 1) % recs.length)} className="btn-ghost h-9 w-9 !px-0" aria-label="Next move">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {allDone && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
                className="pointer-events-none absolute -top-2 right-3 hidden sm:block"
                aria-hidden="true"
              >
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.5 }}>
                  <PipImg pose="celebrate" size={72} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
