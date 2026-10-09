"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─── Progress ring ─────────────────────────────────────────────
 * Single hue on a same-ramp track (a meter, not a pie). The value
 * is always printed in the middle, so colour never carries it alone. */

interface RingProps {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  tone?: "violet" | "lime";
  children?: React.ReactNode;
  label: string;
}

export function Ring({ value, size = 64, stroke = 7, tone = "violet", children, label }: RingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone === "lime" ? "#F1F9D3" : "#EEE7FC"} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone === "lime" ? "#A9C83F" : "#6840DE"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 0.9, ease: "easeOut" as const }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/* ─── Severity (status palette, always paired with a label) ───── */

export const SEVERITY = {
  high: { dot: "bg-red-500", label: "High", text: "text-red-700" },
  medium: { dot: "bg-amber-500", label: "Medium", text: "text-amber-800" },
  low: { dot: "bg-gray-400", label: "Low", text: "text-gray-600" },
} as const;
export type Severity = keyof typeof SEVERITY;

/** Segmented bar of signal counts by severity, 2px gaps between segments. */
export function SeverityBar({ counts }: { counts: Record<Severity, number> }) {
  const total = counts.high + counts.medium + counts.low;
  const order: Severity[] = ["high", "medium", "low"];
  if (total === 0) return <div className="h-2 w-full rounded-full bg-gray-100" aria-hidden="true" />;
  return (
    <div className="flex h-2 w-full gap-[2px] overflow-hidden rounded-full" aria-hidden="true">
      {order
        .filter((k) => counts[k] > 0)
        .map((k, i) => (
          <motion.span
            key={k}
            className={cn("h-full rounded-[2px] first:rounded-l-full last:rounded-r-full", SEVERITY[k].dot)}
            initial={{ flexGrow: 0 }}
            animate={{ flexGrow: counts[k] }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
            style={{ flexBasis: 0 }}
          />
        ))}
    </div>
  );
}

/* ─── Tooltip: hover AND keyboard focus ───────────────────────── */

interface TipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

export function Tip({ content, children, side = "top", className }: TipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={open ? id : undefined}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "pointer-events-none absolute left-1/2 z-50 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-left text-xs leading-snug text-white shadow-lift",
              side === "top" ? "bottom-[calc(100%+8px)]" : "top-[calc(100%+8px)]"
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/* ─── Mascot images (design/Pip-6-Poses-PNG, Spark-9-Colors-PNG) ─ */

export type PipPose = "wave" | "present" | "think" | "checklist" | "celebrate" | "thumbs-up" | "search";

export function PipImg({ pose, size, className }: { pose: PipPose; size: number; className?: string }) {
  return (
    <Image
      src={`/mascots/pip-${pose}.png`}
      alt=""
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      className={cn("select-none object-contain drop-shadow-[0_8px_12px_rgba(55,33,100,0.22)]", className)}
    />
  );
}

export function SparkImg({ color, size, className }: { color: string; size: number; className?: string }) {
  return (
    <Image
      src={`/mascots/spark-${color}.png`}
      alt=""
      width={size * 2}
      height={size * 2}
      style={{ width: size, height: size }}
      className={cn("select-none object-contain drop-shadow-sm", className)}
    />
  );
}
