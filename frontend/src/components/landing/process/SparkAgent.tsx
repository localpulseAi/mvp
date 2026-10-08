"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

/**
 * A specialist sub-agent, drawn as a Spark mascot (design/Spark-9-Colors-PNG).
 *   thinking — sways, "…" bubble in its colour
 *   speaking — hops and wiggles, speech bubble shows its specialty icon
 *   done     — settles with a soft glow
 */
export type SparkState = "thinking" | "speaking" | "done";

interface SparkAgentProps {
  spark: string;
  color: string;
  icon: LucideIcon;
  state: SparkState;
  seed: number;
}

export function SparkAgent({ spark, color, icon: Icon, state, seed }: SparkAgentProps) {
  const reduced = !!useReducedMotion();
  const speaking = state === "speaking";

  return (
    <div className="relative h-14 w-14">
      <AnimatePresence mode="wait">
        {state === "thinking" && (
          <motion.span
            key="think"
            className="absolute -right-3 -top-2 z-10 flex items-center gap-[2px] rounded-full border border-gray-200 bg-white px-1.5 py-1 shadow-sm"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1 w-1 rounded-full"
                style={{ backgroundColor: color }}
                animate={reduced ? {} : { y: [0, -2, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 + seed * 0.1 }}
              />
            ))}
          </motion.span>
        )}
        {speaking && (
          <motion.span
            key="speak"
            className="absolute -right-4 -top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full rounded-bl-sm bg-ink shadow-md"
            initial={{ opacity: 0, scale: 0.3, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -6 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
          >
            <Icon className="h-3 w-3 text-lime-300" />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Soft glow once the agent has reported in */}
      <motion.span
        aria-hidden="true"
        className="absolute inset-1 rounded-full blur-md"
        style={{ backgroundColor: color }}
        animate={{ opacity: state === "done" ? 0.35 : speaking ? 0.5 : 0 }}
        transition={{ duration: 0.4 }}
      />

      <motion.div
        className="relative h-full w-full"
        style={{ originY: 1 }}
        animate={
          reduced
            ? {}
            : speaking
              ? { y: [0, -10, 0, -5, 0], rotate: [0, -10, 10, -4, 0], scale: [1, 1.12, 1] }
              : state === "done"
                ? { y: [0, -2, 0] }
                : { rotate: [-4, 4, -4], y: [0, -1.5, 0] }
        }
        transition={
          speaking
            ? { duration: 0.75 }
            : { duration: 2.4 + seed * 0.2, repeat: Infinity, ease: "easeInOut" as const, delay: seed * 0.15 }
        }
      >
        <Image src={`/mascots/spark-${spark}.png`} alt="" width={112} height={112} className="h-full w-full object-contain drop-shadow-md" />
      </motion.div>

      {/* Specialty badge */}
      <span
        className="absolute -bottom-0.5 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white bg-white shadow-sm"
        style={{ color }}
      >
        <Icon className="h-2.5 w-2.5" strokeWidth={2.6} />
      </span>
    </div>
  );
}
