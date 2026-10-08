"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion";
import { STEPS, type StepIndex } from "./steps";

/**
 * Drives the showcase timeline. `progress` (0→1) is a motion value for the
 * active step, so pausing freezes both the timer and the progress bar.
 * Autoplay only runs while the section is on screen and never under
 * reduced motion (users step through manually instead).
 */
export function useStepper(inView: boolean, reduced: boolean) {
  const [step, setStepState] = useState<StepIndex>(0);
  const [playing, setPlaying] = useState(!reduced);
  const progress = useMotionValue(0);
  const controls = useRef<AnimationPlaybackControls | null>(null);

  const setStep = useCallback(
    (next: number) => {
      controls.current?.stop();
      progress.set(0);
      setStepState((((next % STEPS.length) + STEPS.length) % STEPS.length) as StepIndex);
    },
    [progress]
  );

  useEffect(() => {
    if (reduced) setPlaying(false);
  }, [reduced]);

  // (Re)start the timer for the current step.
  useEffect(() => {
    if (reduced) {
      progress.set(1);
      return;
    }
    const remaining = 1 - progress.get();
    controls.current = animate(progress, 1, {
      duration: (STEPS[step].ms / 1000) * remaining,
      ease: "linear",
      onComplete: () => setStep(step + 1),
    });
    if (!playing || !inView) controls.current.pause();
    return () => controls.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reduced]);

  // Pause / resume without losing position.
  useEffect(() => {
    if (!controls.current || reduced) return;
    if (playing && inView) controls.current.play();
    else controls.current.pause();
  }, [playing, inView, reduced]);

  return { step, setStep, playing, setPlaying, progress };
}
