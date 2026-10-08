"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PIP_POSE, type StepIndex } from "./steps";

/**
 * Pip — Agenzy's main mascot (design/Pip-6-Poses-PNG) at the centre of the
 * process. Swaps pose per step with a quick squash-and-pop, idles with a
 * gentle bob, and hops when the next move lands.
 */
export function Pip({ step }: { step: StepIndex }) {
  const reduced = !!useReducedMotion();
  const pose = PIP_POSE[step];
  const celebrating = step === 4 && !reduced;

  return (
    <div className="relative h-[120px] w-[120px]">
      <motion.div
        className="h-full w-full"
        style={{ originY: 1 }}
        animate={
          reduced
            ? {}
            : celebrating
              ? { y: [0, -16, 0, -8, 0], scaleY: [1, 1.05, 0.93, 1.02, 1] }
              : step === 1
                ? { rotate: [-5, 4, -5], x: [-3, 3, -3], y: [0, -3, 0] }
                : step === 2
                  ? { rotate: [-3, 3, -3], y: [0, -2, 0] }
                  : { y: [0, -4, 0] }
        }
        transition={
          celebrating
            ? { duration: 1.1, repeat: Infinity, repeatDelay: 0.3 }
            : { duration: step === 1 ? 2.2 : step === 2 ? 2.6 : 3, repeat: Infinity, ease: "easeInOut" as const }
        }
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={pose}
            className="absolute inset-0"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            <Image
              src={`/mascots/pip-${pose}.png`}
              alt=""
              width={240}
              height={240}
              priority={step === 0}
              className={`h-full w-full object-contain drop-shadow-[0_14px_18px_rgba(55,33,100,0.28)] ${pose === "search" ? "lg:-scale-x-100" : ""}`}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Ground shadow */}
      <motion.span
        aria-hidden="true"
        className="absolute -bottom-2 left-[calc(50%-36px)] h-3 w-[72px] rounded-full bg-ink/15 blur-[3px]"
        animate={celebrating ? { scaleX: [1, 0.6, 1, 0.8, 1], opacity: [1, 0.5, 1, 0.7, 1] } : { scaleX: 1, opacity: 1 }}
        transition={celebrating ? { duration: 1.1, repeat: Infinity, repeatDelay: 0.3 } : { duration: 0.3 }}
      />
    </div>
  );
}
