"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        enabled ? "bg-brand-600" : "bg-gray-300"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 35 }}
        className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md", enabled ? "left-[22px]" : "left-[2px]")}
      />
    </button>
  );
}

export function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -8 }}
      transition={{ duration: reduced ? 0 : 0.25, ease: "easeOut" as const }}
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

export function TrustNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-control border border-brand-200/60 bg-lilac px-4 py-3.5">
      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <p className="text-xs leading-relaxed text-gray-700">{children}</p>
    </div>
  );
}
