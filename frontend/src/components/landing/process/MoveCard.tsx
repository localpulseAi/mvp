"use client";

import { forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Eye, Lightbulb } from "lucide-react";
import { Spark } from "../Spark";
import { MOVE, type StepIndex } from "./steps";
import { cn } from "@/lib/utils";

const pop = { type: "spring" as const, stiffness: 420, damping: 28 };

/**
 * The payoff moment. Sequence (seconds into the Act step):
 *   0.0  glowing orb gathers where the card will land
 *   0.35 sparks burst outward
 *   0.55 card materialises (blur → sharp, scale up)
 *   0.9  title reveals word by word, shimmer sweeps the header
 *   1.6+ why / what to watch / plan ticks
 *   ∞    sparkles keep twinkling around the card, soft glow breathes
 */
const BURST = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  const dist = 120 + (i % 3) * 36;
  return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, size: 8 + (i % 4) * 4, lime: i % 2 === 0, delay: (i % 5) * 0.03 };
});

const TWINKLES = [
  { className: "-left-3 -top-3 h-5 w-5 text-lime-400", delay: 1.2 },
  { className: "-right-2 top-[38%] h-3.5 w-3.5 text-brand-400", delay: 1.8 },
  { className: "-bottom-3 left-[22%] h-4 w-4 text-brand-500", delay: 2.3 },
  { className: "-right-3 -bottom-2 h-6 w-6 text-lime-400", delay: 1.5 },
  { className: "-top-4 right-[30%] h-3 w-3 text-brand-300", delay: 2.0 },
];

function Burst() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-30">
      {/* Gathering orb */}
      <motion.span
        className="absolute -left-24 -top-24 h-48 w-48 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(214,239,131,0.95) 0%, rgba(104,64,222,0.45) 40%, transparent 70%)" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0.6, 2.4], opacity: [0, 1, 0] }}
        transition={{ duration: 1.1, times: [0, 0.4, 1], ease: "easeOut" as const }}
      />
      {/* Spark burst */}
      {BURST.map((b, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ left: -b.size / 2, top: -b.size / 2 }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
          animate={{ x: b.x, y: b.y, scale: [0, 1.2, 0], opacity: [0, 1, 0], rotate: 180 }}
          transition={{ delay: 0.35 + b.delay, duration: 1.1, ease: "easeOut" as const }}
        >
          <Spark className={cn(b.lime ? "text-lime-400" : "text-brand-500")} />
        </motion.span>
      ))}
    </div>
  );
}

export const MoveCard = forwardRef<HTMLDivElement, { step: StepIndex }>(function MoveCard({ step }, ref) {
  const show = step >= 4;
  const words = MOVE.title.split(" ");
  return (
    <div ref={ref} className="relative z-10 min-h-[320px]">
      <AnimatePresence mode="wait" initial={false}>
        {show ? (
          <motion.div key="magic" className="relative" exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}>
            <Burst />

            <motion.div
              initial={{ opacity: 0, scale: 0.6, filter: "blur(14px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ delay: 0.55, type: "spring", stiffness: 260, damping: 20 }}
              className="relative"
            >
              {/* Breathing glow */}
              <motion.div
                aria-hidden="true"
                className="absolute -inset-1 rounded-[20px] bg-gradient-to-br from-lime-300 via-brand-400 to-lime-300 blur-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0.35, 0.6, 0.35] }}
                transition={{ delay: 0.8, duration: 4, repeat: Infinity, repeatType: "mirror" as const }}
              />

              {/* Twinkling sparkles */}
              {TWINKLES.map((t, i) => (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  className={cn("absolute z-20", t.className)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.1, 0.5, 1, 0], opacity: [0, 1, 0.7, 1, 0], rotate: [0, 45, 90] }}
                  transition={{ delay: t.delay, duration: 2.2, repeat: Infinity, repeatDelay: 0.6 + i * 0.3 }}
                >
                  <Spark className="h-full w-full text-current" />
                </motion.span>
              ))}

              <div className="relative rounded-2xl border border-white/60 bg-white p-4 shadow-lift">
                {/* Header with shimmer */}
                <div className="relative overflow-hidden rounded-xl bg-[#E3F2B7] p-3.5">
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                    initial={{ left: "-60%" }}
                    animate={{ left: "160%" }}
                    transition={{ delay: 1.0, duration: 1.1, ease: "easeInOut" as const, repeat: Infinity, repeatDelay: 2.4 }}
                  />
                  <p className="relative flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                    <motion.span
                      animate={{ rotate: [0, 90, 180], scale: [1, 1.4, 1] }}
                      transition={{ delay: 0.9, duration: 0.8, repeat: Infinity, repeatDelay: 2.7 }}
                      className="inline-flex"
                    >
                      <Spark className="h-3 w-3 text-ink" />
                    </motion.span>
                    Your next move
                  </p>
                  <p className="relative mt-1.5 font-display text-[15px] font-semibold leading-snug text-ink">
                    {words.map((w, i) => (
                      <motion.span
                        key={i}
                        className="inline-block"
                        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.9 + i * 0.08, duration: 0.35 }}
                      >
                        {w}
                        {i < words.length - 1 && " "}
                      </motion.span>
                    ))}
                  </p>
                </div>

                <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.7 }} className="mt-3 flex gap-2 text-[11px] text-gray-600">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                  {MOVE.why}
                </motion.div>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.1 }}>
                    <Eye className="h-3.5 w-3.5 text-brand-600" />
                  </motion.span>
                  {MOVE.watch.map((w, i) => (
                    <motion.span
                      key={w}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2.2 + i * 0.15, ...pop }}
                      className="rounded-md bg-lilac px-2 py-0.5 text-[10px] font-semibold text-brand-700"
                    >
                      {w}
                    </motion.span>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                  {MOVE.plan.map((p, i) => (
                    <div key={p} className="flex items-center gap-2 text-[11px] text-ink">
                      <motion.span
                        initial={{ backgroundColor: "#FFFFFF", borderColor: "#D2CCE0" }}
                        animate={{ backgroundColor: "#6840DE", borderColor: "#6840DE" }}
                        transition={{ delay: 2.8 + i * 0.55, duration: 0.25 }}
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                      >
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2.9 + i * 0.55, ...pop }}>
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
                        </motion.span>
                      </motion.span>
                      {p}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="ghost"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="flex h-[300px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 text-center"
          >
            <motion.span animate={step === 3 ? { scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] } : {}} transition={{ duration: 1.2, repeat: Infinity }}>
              <Spark className="h-6 w-6 text-gray-300" />
            </motion.span>
            <p className="text-xs font-medium text-gray-400">Your next move appears here</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
