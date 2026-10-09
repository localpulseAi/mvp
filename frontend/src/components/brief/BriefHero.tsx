"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { MascotSlot } from "@/components/mascot/MascotSlot";
import { cn } from "@/lib/utils";

interface BriefHeroProps {
  title: string;
  range: string;
  generated: string;
  chips: { label: string; tone?: "lime" | "plain" }[];
  action?: React.ReactNode;
}

/** Pip presenting this week's brief. */
export function BriefHero({ title, range, generated, chips, action }: BriefHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-ink px-5 py-5 text-white sm:px-7 sm:py-6"
    >
      <div aria-hidden="true" className="absolute -left-16 -top-24 h-64 w-64 rounded-full bg-brand-600/40 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 right-10 h-48 w-48 rounded-full bg-lime-300/20 blur-3xl" />
      <div className="relative flex items-center gap-4 sm:gap-6">
        <motion.div
          className="shrink-0"
          initial={{ x: -30, opacity: 0, rotate: -8 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.1 }}
        >
          <MascotSlot pose2d="present" pose3d="present" size={104} tone="light" say="Your moves are ready." />
        </motion.div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-lime-300">Weekly strategic brief</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-[30px]">{title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/60">
            <span>{range}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" /> {generated}
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((c, i) => (
              <motion.span
                key={c.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  c.tone === "lime" ? "bg-lime-300 text-ink" : "bg-white/10 text-white ring-1 ring-white/15"
                )}
              >
                {c.label}
              </motion.span>
            ))}
          </div>
        </div>
        {action && <div className="hidden shrink-0 sm:block">{action}</div>}
      </div>
      {action && <div className="relative mt-4 sm:hidden">{action}</div>}
    </motion.section>
  );
}
