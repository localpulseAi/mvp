"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { HeroPip } from "./HeroPip";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { CalendarDays, Clock, Target } from "lucide-react";
import { Spark } from "../Spark";
import { CYCLE_MS, sampleKeys, samples, type SampleKey } from "./samples";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;
const pop = { type: "spring" as const, stiffness: 380, damping: 26 };

/** Auto-advances through the samples; pauses on hover/focus, stops after a manual pick. */
function useAutoCycle(reduced: boolean) {
  const [active, setActive] = useState<SampleKey>("cafe");
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const stopped = reduced || manual;

  useEffect(() => {
    progress.set(0);
    if (stopped) return;
    controls.current = animate(progress, 1, {
      duration: CYCLE_MS / 1000,
      ease: "linear",
      onComplete: () => setActive((k) => sampleKeys[(sampleKeys.indexOf(k) + 1) % sampleKeys.length]),
    });
    return () => controls.current?.stop();
  }, [active, stopped, progress]);

  useEffect(() => {
    if (!controls.current || stopped) return;
    if (paused) controls.current.pause();
    else controls.current.play();
  }, [paused, stopped]);

  const pick = (k: SampleKey) => {
    setManual(true);
    setActive(k);
  };
  return { active, pick, setPaused, progress, cycling: !stopped };
}

function TabTimer({ progress, show }: { progress: MotionValue<number>; show: boolean }) {
  if (!show) return null;
  return (
    <span className="absolute inset-x-3 bottom-1 h-[2px] overflow-hidden rounded-full bg-white/20">
      <motion.span className="absolute inset-0 origin-left rounded-full bg-lime-300" style={{ scaleX: progress }} />
    </span>
  );
}

/** Radar ping behind the "local signal" icon. */
function SignalPing({ k }: { k: string }) {
  return (
    <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
      {[0, 1].map((i) => (
        <motion.span
          key={`${k}-${i}`}
          className="absolute inset-0 rounded-full border border-brand-400"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 2.6, opacity: 0 }}
          transition={{ duration: 1.6, delay: i * 0.5, repeat: Infinity, repeatDelay: 0.8, ease: "easeOut" as const }}
        />
      ))}
      <Target className="relative h-4 w-4 text-brand-600" aria-hidden="true" />
    </span>
  );
}

function FloatingChip({ text, icon: Icon, className, delay }: { text: string; icon: typeof Clock; className: string; delay: number }) {
  return (
    <motion.div
      aria-hidden="true"
      className={cn("pointer-events-none absolute z-20 hidden items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-lift sm:flex", className)}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{ opacity: { delay }, scale: { delay, ...pop }, y: { duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay } }}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lilac">
        <Icon className="h-3 w-3 text-brand-600" />
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
          {text}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

export function HeroBrief() {
  const reduced = !!useReducedMotion();
  const { active, pick, setPaused, progress, cycling } = useAutoCycle(reduced);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = samples[active];

  // Gentle 3D tilt that follows the pointer (desktop, motion allowed).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 18 });

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onKey(e: React.KeyboardEvent, i: number) {
    let n: number | undefined;
    if (e.key === "ArrowRight") n = (i + 1) % sampleKeys.length;
    if (e.key === "ArrowLeft") n = (i + sampleKeys.length - 1) % sampleKeys.length;
    if (e.key === "Home") n = 0;
    if (e.key === "End") n = sampleKeys.length - 1;
    if (n !== undefined) {
      e.preventDefault();
      pick(sampleKeys[n]);
      tabRefs.current[n]?.focus();
    }
  }

  return (
    <motion.div
      id="sample"
      initial={reduced ? false : { opacity: 0, y: 40, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease }}
      className="relative w-full max-w-[590px] justify-self-center [perspective:1200px] lg:max-w-none"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => {
        setPaused(false);
        mx.set(0);
        my.set(0);
      }}
      onPointerMove={onMove}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <HeroPip sample={active} cheer={s.cheer} />
      <FloatingChip text={s.chips[0]} icon={CalendarDays} className="-left-6 top-24 lg:-left-10" delay={1.1} />
      <FloatingChip text={s.chips[1]} icon={Clock} className="-bottom-3 right-6 lg:-right-6" delay={1.4} />

      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="rounded-[20px] bg-lilac p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3 text-[11px] font-semibold tracking-[0.08em] text-ink sm:text-xs">
          <span>A CLEARER WEEK STARTS HERE</span>
          <span className="font-normal tracking-normal text-gray-500">Illustrative example</span>
        </div>

        <div role="tablist" aria-label="Choose a sample business" className="mb-4 flex gap-1.5">
          {sampleKeys.map((k, i) => (
            <button
              key={k}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`tab-${k}`}
              role="tab"
              aria-selected={active === k}
              aria-controls="brief-panel"
              tabIndex={active === k ? 0 : -1}
              onClick={() => pick(k)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                "relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors sm:text-sm",
                active === k ? "text-white" : "text-gray-500 hover:bg-brand-200/60"
              )}
            >
              {active === k && <motion.span layoutId="hero-tab" className="absolute inset-0 rounded-full bg-ink" transition={pop} />}
              <span className="relative">{samples[k].tab}</span>
              <TabTimer progress={progress} show={active === k && cycling} />
            </button>
          ))}
        </div>

        <div
          id="brief-panel"
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
          tabIndex={0}
          className="relative overflow-hidden rounded-xl border border-brand-200/70 bg-white p-5 shadow-[0_12px_32px_rgba(55,33,100,0.08)] sm:p-7"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-2.5 text-xs font-semibold tracking-[0.08em] text-brand-600">YOUR WEEKLY STRATEGIC BRIEF</p>
              <h2 className="mb-4 text-[22px] font-semibold leading-[1.3] tracking-[-0.04em] text-ink sm:text-[25px]">
                A good week starts
                <br />
                with a smart move.
              </h2>
            </div>
            <motion.div animate={reduced ? {} : { y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}>
              <Image src="/brand/symbol.png" alt="" width={48} height={43} className="h-auto w-12 shrink-0" />
            </motion.div>
          </div>

          <div className="mb-5 flex justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={s.business} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.2 }}>
                {s.business}
              </motion.span>
            </AnimatePresence>
            <span>This week</span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={active} exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-5 flex gap-3">
                <SignalPing k={active} />
                <div>
                  <p className="text-xs font-semibold tracking-[0.06em] text-ink">THE LOCAL SIGNAL</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{s.signal}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, ...pop }}
                className="relative overflow-hidden rounded-lg bg-[#E3F2B7] px-5 py-5"
              >
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  initial={{ left: "-60%" }}
                  animate={{ left: "160%" }}
                  transition={{ delay: 0.6, duration: 1, ease: "easeInOut" as const, repeat: Infinity, repeatDelay: 3.5 }}
                />
                <p className="relative flex items-center gap-2 text-xs font-semibold tracking-[0.06em] text-ink">
                  <motion.span className="inline-flex" animate={{ rotate: [0, 180] }} transition={{ delay: 0.3, duration: 0.7 }}>
                    <Spark className="h-3.5 w-3.5 text-ink" />
                  </motion.span>
                  YOUR NEXT MOVE
                </p>
                <h3 className="relative mb-2.5 mt-2.5 text-[22px] font-semibold leading-[1.25] tracking-[-0.035em] text-ink sm:text-[25px]">
                  {s.title.map((line, li) => (
                    <span key={line} className="block">
                      {line.split(" ").map((w, wi) => (
                        <motion.span
                          key={wi}
                          className="inline-block"
                          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          transition={{ delay: 0.25 + (li * 4 + wi) * 0.06, duration: 0.35 }}
                        >
                          {w}&nbsp;
                        </motion.span>
                      ))}
                    </span>
                  ))}
                </h3>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="relative text-[13px] leading-relaxed text-ink/80 sm:text-sm">
                  {s.move}
                </motion.p>
              </motion.div>

              <div className="mt-5 grid grid-cols-[1.4fr_1fr] gap-5">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
                  <p className="text-xs font-semibold tracking-[0.06em] text-ink">WHY IT MATTERS</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.why}</p>
                </motion.div>
                <div className="border-l border-gray-100 pl-5">
                  <p className="text-xs font-semibold tracking-[0.06em] text-ink">WHAT TO WATCH</p>
                  {s.watch.map((w, i) => (
                    <motion.p
                      key={w}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + i * 0.15 }}
                      className="mt-1 text-xs leading-relaxed text-gray-500"
                    >
                      {w}
                    </motion.p>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 font-fun text-[19px] font-medium text-brand-600 sm:text-[21px]">
          <motion.span className="inline-flex" animate={reduced ? {} : { rotate: [0, 90, 180], scale: [1, 1.25, 1] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}>
            <Spark className="h-5 w-5 text-brand-600" />
          </motion.span>
          Less guessing. More going.
        </p>
      </motion.div>
    </motion.div>
  );
}
