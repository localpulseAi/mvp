"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronDown, Circle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuditActionItem } from "@/lib/api";
import { CATEGORY_LABELS, EFFORT_LABELS, PRIORITY_META, type ItemStatus } from "./meta";

const STATUS_OPTIONS: { id: ItemStatus; label: string; icon: typeof Circle }[] = [
  { id: "pending", label: "To do", icon: Circle },
  { id: "in_progress", label: "In progress", icon: Clock },
  { id: "done", label: "Done", icon: CheckCircle2 },
  { id: "dismissed", label: "Dismiss", icon: XCircle },
];

export function ActionItemCard({
  item,
  onStatusChange,
}: {
  item: AuditActionItem;
  onStatusChange: (id: string, status: ItemStatus) => void;
}) {
  const priority = PRIORITY_META[item.priority] ?? PRIORITY_META.low;
  const [expanded, setExpanded] = useState(false);
  const done = item.status === "done";

  return (
    <div
      className={cn(
        "card border-l-4 p-5 transition-opacity sm:p-6",
        priority.border,
        done && "opacity-70",
        item.status === "dismissed" && "opacity-50"
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", priority.pill)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", priority.dot)} />
              {priority.label} priority
            </span>
            <span className="rounded-full bg-lilac px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              {CATEGORY_LABELS[item.category] ?? item.category}
            </span>
            <span className="tabular rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
              {EFFORT_LABELS[item.effort_band] ?? item.effort_band}
            </span>
          </div>
          <p className={cn("font-display text-[15px] font-semibold text-ink", done && "text-gray-400 line-through")}>
            {item.title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.why}</p>

          <button
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="mt-3 inline-flex items-center gap-1 rounded text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            {expanded ? "Hide details" : "How to do it"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>

          {expanded && (
            <div className="mt-3 grid gap-3 rounded-control bg-canvas p-4 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">How to do it</p>
                <p className="text-sm leading-relaxed text-gray-700">{item.how}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">Result to watch</p>
                <p className="text-sm leading-relaxed text-gray-700">{item.watch_for}</p>
              </div>
              <Link
                href="/session"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-800 sm:col-span-2"
              >
                Discuss in a Strategy Session
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Status segmented control */}
        <div
          role="radiogroup"
          aria-label={`Status for ${item.title}`}
          className="inline-flex shrink-0 self-start rounded-control border border-gray-200 bg-white p-0.5"
        >
          {STATUS_OPTIONS.map((s) => {
            const Icon = s.icon;
            const active = item.status === s.id;
            return (
              <button
                key={s.id}
                role="radio"
                aria-checked={active}
                onClick={() => onStatusChange(item.id, s.id)}
                title={s.label}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? s.id === "done"
                      ? "bg-lime-300 text-ink"
                      : "bg-lilac text-brand-700"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className={cn("hidden xl:inline", active && "inline")}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
