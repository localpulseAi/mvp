"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Clock,
  Eye,
  Hash,
  Lightbulb,
  Megaphone,
  Star,
  Tag,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatternItem } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function daysAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-lilac text-brand-700",
  "bg-lime-200 text-ink",
  "bg-brand-600 text-white",
  "bg-ink text-lime-300",
  "bg-gray-100 text-gray-700",
];

export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
};

// ── Pattern card ──────────────────────────────────────────────────────────────

function PatternIcon({ type, className }: { type: string; className?: string }) {
  const props = { className: cn("h-4 w-4", className) };
  if (type === "simultaneous_promos") return <Tag {...props} />;
  if (type === "ad_wave") return <Megaphone {...props} />;
  if (type === "hashtag_cluster") return <Hash {...props} />;
  if (type === "cadence_drop") return <TrendingDown {...props} />;
  if (type === "review_surge") return <Star {...props} />;
  return <Activity {...props} />;
}

export const severityConfig = {
  high:   { border: "border-l-red-500",   icon: "bg-red-50 text-red-600",     pill: "bg-red-50 text-red-700",     dot: "bg-red-500",   label: "High priority" },
  medium: { border: "border-l-amber-400", icon: "bg-amber-50 text-amber-700", pill: "bg-amber-50 text-amber-800", dot: "bg-amber-500", label: "Market signal" },
  low:    { border: "border-l-gray-300",  icon: "bg-gray-100 text-gray-500",  pill: "bg-gray-100 text-gray-600",  dot: "bg-gray-400",  label: "Watch" },
};

export function PatternCard({ pattern, index }: { pattern: PatternItem; index: number }) {
  const severity = (pattern.severity as keyof typeof severityConfig) ?? "low";
  const cfg = severityConfig[severity] ?? severityConfig.low;
  const type = pattern.pattern_type ?? "pattern";

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      animate="show"
      custom={index}
      className={cn("card overflow-hidden border-l-4", cfg.border)}
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-control", cfg.icon)}>
            <PatternIcon type={type} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base font-semibold capitalize text-ink">
                {type.replace(/_/g, " ")}
              </h3>
              <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", cfg.pill)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                {cfg.label}
              </span>
            </div>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
              <Eye className="h-3 w-3" aria-hidden="true" /> Observed in public signals
            </p>
            <p className="text-sm leading-relaxed text-gray-700">{pattern.description}</p>
            {pattern.detected_at && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" aria-hidden="true" /> Detected {daysAgo(pattern.detected_at)}
              </p>
            )}
          </div>
        </div>

        {(pattern.competitors_involved?.length ?? 0) > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 sm:pl-[54px]">
            {pattern.competitors_involved.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-canvas py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-gray-700"
              >
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold", avatarColor(name))}>
                  {getInitials(name)}
                </span>
                {name}
              </span>
            ))}
          </div>
        )}

        {pattern.strategic_implication && (
          <div className="card-lilac mt-5 p-4">
            <div className="flex gap-3">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="eyebrow mb-1 text-[11px]">Our interpretation · what this means for you</p>
                <p className="text-sm leading-relaxed text-ink">{pattern.strategic_implication}</p>
                <Link
                  href="/session"
                  className="mt-3 inline-flex items-center gap-1 rounded text-xs font-semibold text-brand-700 hover:text-brand-800"
                >
                  Discuss in a Strategy Session
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}

// ── Small pieces ──────────────────────────────────────────────────────────────

export function SummaryTile({ count, label, dot }: { count: number; label: string; dot: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      <p className="tabular mt-2 font-display text-3xl font-semibold text-ink">{count}</p>
    </div>
  );
}

/** "Instagram posts · 2d ago" chips from an analysis' data_freshness map. */
export function FreshnessChips({ freshness }: { freshness: Record<string, string> | null | undefined }) {
  const entries = Object.entries(freshness ?? {});
  if (entries.length === 0) return <p className="text-xs text-gray-500">Source freshness not reported</p>;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Sources and freshness">
      {entries.map(([src, ts]) => (
        <li
          key={src}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-canvas px-2 py-1 text-[11px] font-medium text-gray-600"
        >
          <span className="font-semibold text-ink">{src}</span>
          <span aria-hidden="true">·</span>
          <span>{daysAgo(ts)}</span>
        </li>
      ))}
    </ul>
  );
}
