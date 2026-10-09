"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion, useTransform, type MotionValue } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Stage } from "./Stage";
import { STEPS } from "./steps";
import { useStepper } from "./useStepper";
import { cn } from "@/lib/utils";
import { PipSpot } from "@/components/mascot/PipSpot";
import { pipJump, pipSay } from "@/lib/pip";

/** What the 3D Pip says beside the stage as each step plays. */
const PIP_LINES = ["It all starts with you.", "Gathering clues…", "Calling my specialists!", "Found it!", "Ta-da! Your next move."];

function StepTab({
  index,
  active,
  done,
  progress,
  onSelect,
}: {
  index: number;
  active: boolean;
  done: boolean;
  progress: MotionValue<number>;
  onSelect: () => void;
}) {
  const scaleX = useTransform(progress, (v) => (active ? v : done ? 1 : 0));
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "group relative min-w-0 flex-1 overflow-hidden rounded-xl px-1.5 pb-3 pt-2.5 text-left transition-colors sm:px-3",
        active ? "bg-ink text-white" : "text-gray-500 hover:bg-gray-100"
      )}
    >
      <span className={cn("block text-[10px] font-semibold tabular", active ? "text-lime-300" : "text-gray-400")}>
        0{index + 1}
      </span>
      <span className="block truncate text-[11px] font-semibold sm:text-sm">{STEPS[index].label}</span>
      <span className="absolute inset-x-2 bottom-1.5 h-[3px] overflow-hidden rounded-full sm:inset-x-3">
        <span className={cn("absolute inset-0 rounded-full opacity-15", active ? "bg-white" : "bg-gray-400")} />
        <motion.span
          className={cn("absolute inset-0 origin-left rounded-full", active ? "bg-lime-300" : "bg-brand-600")}
          style={{ scaleX }}
        />
      </span>
    </button>
  );
}

export function ProcessShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  const reduced = !!useReducedMotion();
  const { step, setStep, playing, setPlaying, progress } = useStepper(inView, reduced);

  // The 3D guide narrates the animation while this section is on screen.
  useEffect(() => {
    if (!inView) return;
    pipSay(PIP_LINES[step]);
    if (step === 4) pipJump();
  }, [step, inView]);

  return (
    <section ref={sectionRef} id="what-you-get" className="site-container scroll-mt-24 pb-[70px] pt-10 lg:pb-[110px] lg:pt-16">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-16">
        <div>
          <span className="mb-4 block text-xs font-semibold tracking-[0.11em] text-ink">A LITTLE CLARITY GOES A LONG WAY</span>
          <h2 className="text-[clamp(30px,3vw,44px)] font-semibold leading-[1.2] tracking-[-0.045em] text-ink">
            You run the business.
            <br />
            We help with the <span className="peppy">what&apos;s next.</span>
          </h2>
        </div>
        <PipSpot pose="search" say="Watch me dig in below!" className="h-[150px] w-[140px] shrink-0 self-end lg:hidden xl:block" />
        <p className="max-w-[325px] text-base leading-[1.75] text-gray-500">Watch how Agenzy turns your context and local signals into one clear move.</p>
      </div>

      <MotionConfig reducedMotion="user">
        {/* Caption + controls */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="relative h-14 min-w-0 flex-1 overflow-hidden sm:h-8" aria-live={playing ? "off" : "polite"}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={step}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center font-fun text-xl font-medium leading-tight text-brand-600 sm:block sm:truncate sm:text-2xl"
              >
                {STEPS[step].caption}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={() => setStep(0)} className="btn-ghost h-10 w-10 !px-0" aria-label="Replay from the start">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPlaying(!playing)}
              className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-xs font-semibold text-white transition-colors hover:bg-ink-soft"
              aria-label={playing ? "Pause animation" : "Play animation"}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
            </button>
          </div>
        </div>

        <div aria-hidden="true">
          <Stage step={step} />
        </div>

        {/* Step rail */}
        <div role="tablist" aria-label="Steps in how Agenzy works" className="mt-4 flex gap-1.5 rounded-2xl border border-gray-200 bg-white p-1.5">
          {STEPS.map((s, i) => (
            <StepTab
              key={s.id}
              index={i}
              active={i === step}
              done={i < step}
              progress={progress}
              onSelect={() => {
                setStep(i);
              }}
            />
          ))}
        </div>

        <ol className="sr-only">
          <li>You share your goals, margins, and capacity.</li>
          <li>Agenzy gathers public signals: reviews, social posts, competitor ads, local events, nearby offers, plus marketing playbooks.</li>
          <li>Six specialist analysts (market, rivals, brand, timing, margins, risk) weigh in at the same time.</li>
          <li>Observed facts are separated from the insight that matters.</li>
          <li>You get one recommended move, why it matters, what to watch, and a short plan.</li>
        </ol>
        <p className="mt-3 text-center text-xs text-gray-400">Illustrative example with a fictional café.</p>
      </MotionConfig>
    </section>
  );
}
