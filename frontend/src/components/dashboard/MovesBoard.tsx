"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Eye, MessageSquare } from "lucide-react";
import type { BriefRecommendation } from "@/lib/api";
import { PipImg, Ring } from "./viz";
import { cn } from "@/lib/utils";
import { pipJump, pipSay } from "@/lib/pip";

/**
 * "Tried it" marks are a per-viewer convenience kept in this browser only
 * (keyed by brief), not shared workspace state.
 */
export function useTriedMoves(briefId: string | null, total: number) {
  const key = briefId ? `agenzy:tried:${briefId}` : null;
  const [tried, setTried] = useState<number[]>([]);

  useEffect(() => {
    if (!key) return setTried([]);
    try {
      const raw = window.localStorage.getItem(key);
      setTried(raw ? (JSON.parse(raw) as number[]).filter((i) => i < total) : []);
    } catch {
      setTried([]);
    }
  }, [key, total]);

  const toggle = useCallback(
    (i: number) => {
      setTried((prev) => {
        const next = prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i];
        if (next.length === total && total > 0 && next.length > prev.length) {
          pipSay("All moves tried! Proud of you.");
          pipJump();
        } else if (next.length > prev.length) {
          pipSay("Nice! One more down.");
        }
        try {
          if (key) window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* storage unavailable — keep in memory */
        }
        return next;
      });
    },
    [key, total]
  );

  return { tried, toggle };
}

function MoveCard({
  rec,
  index,
  tried,
  onToggle,
  lead,
}: {
  rec: BriefRecommendation;
  index: number;
  tried: boolean;
  onToggle: () => void;
  lead: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08 }}
      className={cn(
        "overflow-hidden rounded-2xl border transition-colors",
        tried ? "border-lime-400 bg-lime-50" : lead ? "border-brand-200 bg-white shadow-soft" : "border-gray-200/80 bg-white"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <motion.button
          onClick={onToggle}
          whileTap={{ scale: 0.85 }}
          aria-pressed={tried}
          aria-label={tried ? `Mark "${rec.title}" as not tried` : `Mark "${rec.title}" as tried`}
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            tried ? "border-lime-500 bg-lime-300 text-ink" : "border-gray-300 bg-white text-gray-400 hover:border-brand-400 hover:text-brand-600"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {tried ? (
              <motion.span key="y" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                <Check className="h-4 w-4" strokeWidth={3} />
              </motion.span>
            ) : (
              <motion.span key="n" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="tabular text-xs font-bold">
                {index + 1}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <div className="min-w-0 flex-1">
          {lead && !tried && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-600">Top move</p>}
          <p className={cn("font-display font-semibold leading-snug", lead ? "text-base sm:text-lg" : "text-[15px]", tried ? "text-gray-500 line-through decoration-lime-500" : "text-ink")}>
            {rec.title}
          </p>
          {rec.watch_for?.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-gray-400" aria-label="What to watch" />
              {rec.watch_for.map((w) => (
                <span key={w} className="rounded-md bg-lilac px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  {w}
                </span>
              ))}
            </div>
          )}

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="mt-3 text-sm leading-relaxed text-gray-700">{rec.body}</p>
                <p className="mt-2 rounded-xl bg-canvas px-3 py-2 text-sm leading-relaxed text-gray-600">
                  <span className="font-semibold text-ink">Why: </span>
                  {rec.reasoning}
                </p>
                <Link
                  href={`/session?q=${encodeURIComponent(`Help me plan: ${rec.title}`)}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                >
                  <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /> Talk it through with Pip
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Hide details" : "Show details"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-lilac hover:text-brand-600"
        >
          <motion.span animate={{ rotate: open ? 180 : 0 }}>
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
      </div>
    </motion.li>
  );
}

interface MovesBoardProps {
  recs: BriefRecommendation[];
  weekLabel: string;
  tried: number[];
  onToggle: (i: number) => void;
}

export function MovesBoard({ recs, weekLabel, tried, onToggle }: MovesBoardProps) {
  const done = recs.length > 0 && tried.length === recs.length;
  return (
    <section className="card p-4 sm:p-5" aria-labelledby="moves-title">
      <header className="mb-4 flex items-center gap-3">
        <Ring value={recs.length ? tried.length / recs.length : 0} size={44} stroke={5} label={`${tried.length} of ${recs.length} moves tried`}>
          <span className="tabular text-[11px] font-bold text-ink">
            {tried.length}/{recs.length}
          </span>
        </Ring>
        <div className="min-w-0 flex-1">
          <h2 id="moves-title" className="font-display text-lg font-semibold text-ink">
            This week&apos;s moves
          </h2>
          <p className="text-xs text-gray-500">{weekLabel} · tick a move once you&apos;ve tried it</p>
        </div>
        <Link href="/brief" className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block">
          Full brief
        </Link>
      </header>

      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.6 }}>
                <PipImg pose="celebrate" size={56} />
              </motion.div>
              <div>
                <p className="font-fun text-lg font-medium text-lime-300">All moves tried!</p>
                <p className="text-xs text-white/70">Check how they did in Friday&apos;s check-in.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ol className="space-y-2.5">
        {recs.map((r, i) => (
          <MoveCard key={r.title} rec={r} index={i} lead={i === 0} tried={tried.includes(i)} onToggle={() => onToggle(i)} />
        ))}
      </ol>
    </section>
  );
}
