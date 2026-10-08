"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

interface SectionCardProps {
  icon: LucideIcon;
  title: string;
  meta?: React.ReactNode;
  footer?: { href: string; label: string };
  index?: number;
  className?: string;
  children: React.ReactNode;
}

export function SectionCard({ icon: Icon, title, meta, footer, index = 0, className, children }: SectionCardProps) {
  return (
    <motion.section
      custom={index}
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className={cn("card flex flex-col overflow-hidden", className)}
    >
      <header className="flex items-center justify-between gap-3 border-b border-gray-200/70 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-control bg-lilac">
            <Icon className="h-4 w-4 text-brand-600" />
          </span>
          <h2 className="section-title">{title}</h2>
        </div>
        {meta}
      </header>
      <div className="flex-1">{children}</div>
      {footer && (
        <Link
          href={footer.href}
          className="group flex items-center gap-1 border-t border-gray-200/70 px-5 py-3 text-sm font-semibold text-brand-600 transition-colors hover:bg-gray-50 hover:text-brand-700"
        >
          {footer.label}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </motion.section>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  tone?: "default" | "alert";
  index: number;
}

export function StatCard({ label, value, sub, icon: Icon, tone = "default", index }: StatCardProps) {
  const alert = tone === "alert";
  return (
    <motion.div custom={index} initial="hidden" animate="show" variants={fadeUp} className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">{label}</span>
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-control",
            alert ? "bg-red-50" : "bg-lilac"
          )}
        >
          <Icon className={cn("h-4 w-4", alert ? "text-red-600" : "text-brand-600")} />
        </span>
      </div>
      <p
        className={cn(
          "tabular mt-3 font-display font-semibold leading-none",
          /^\d+$/.test(value) ? "text-3xl text-ink" : value === "Unavailable" ? "text-lg text-gray-500" : "text-2xl text-ink"
        )}
      >
        {value}
      </p>
      <p className={cn("mt-1.5 text-xs", alert ? "font-medium text-red-700" : "text-gray-500")}>{sub}</p>
    </motion.div>
  );
}

/** Inline per-section failure. A failed section never renders as empty or zero. */
export function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-2 px-5 py-5 text-sm">
      <p className="flex items-start gap-2 text-gray-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
        <span>
          <span className="font-semibold text-ink">Couldn&apos;t load this section.</span> {message}
        </span>
      </p>
      {onRetry && (
        <button onClick={onRetry} className="self-start pl-6 text-sm font-semibold text-brand-700 hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
