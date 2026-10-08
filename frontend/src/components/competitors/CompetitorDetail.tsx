"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, AlertCircle, ArrowRight, BarChart2, Clock, Eye, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AnalysisItem, CompetitorOut } from "@/lib/api";
import { avatarColor, daysAgo, getInitials } from "./shared";

type UICompetitor = CompetitorOut & { analysis: AnalysisItem | null };

function SourceChip({ label }: { label: string }) {
  return (
    <span className="rounded-md border border-gray-200 bg-canvas px-2 py-1 text-[11px] font-semibold text-gray-600">
      {label}
    </span>
  );
}

function PointList({ title, items, positive }: { title: string; items?: string[] | null; positive: boolean }) {
  const Icon = positive ? TrendingUp : AlertCircle;
  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", positive ? "bg-emerald-500" : "bg-amber-500")} />
        <h3 className="section-title">{title}</h3>
      </div>
      {(items ?? []).length > 0 ? (
        <ul className="space-y-2.5">
          {items!.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-gray-700">
              <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", positive ? "text-emerald-600" : "text-amber-600")} />
              <span className="leading-relaxed">{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">None identified</p>
      )}
    </div>
  );
}

export function CompetitorDetail({ selected }: { selected: UICompetitor }) {
  const a = selected.analysis;

  return (
    <motion.div
      key={selected.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" as const }}
      className="min-w-0 flex-1 space-y-4"
    >
      {/* Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-control text-sm font-bold", avatarColor(selected.name))}>
              {getInitials(selected.name)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-semibold text-ink">{selected.name}</h2>
                {a ? <Badge variant="green" dot>Analysed</Badge> : <Badge variant="gray" dot>Pending</Badge>}
                {selected.baseline_complete && <Badge variant="brand">Baseline set</Badge>}
              </div>
              {selected.address && <p className="mt-0.5 truncate text-sm text-gray-500">{selected.address}</p>}
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Added {daysAgo(selected.added_at)}
                </span>
                {a && <span>Analysis {daysAgo(a.generated_at)}</span>}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5" aria-label="Connected sources">
            {selected.instagram_handle && <SourceChip label="Instagram" />}
            {selected.facebook_page && <SourceChip label="Facebook" />}
            {selected.google_place_id && <SourceChip label="Google" />}
          </div>
        </div>
      </div>

      {a ? (
        <>
          {/* Strategic implication — emphasised first */}
          {a.strategic_implication && (
            <div className="card-ink relative overflow-hidden p-5 sm:p-6">
              <Sparkles className="absolute right-5 top-5 h-5 w-5 text-lime-300" aria-hidden />
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-lime-300" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-300">
                  Strategic implication for you
                </p>
              </div>
              <p className="mt-2.5 max-w-3xl pr-6 text-[15px] leading-relaxed text-white/90">{a.strategic_implication}</p>
              <Link href="/session" className="btn-lime mt-4 px-4 py-2">
                Discuss in a Strategy Session
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {a.positioning_summary && (
            <div className="card p-5 sm:p-6">
              <div className="mb-2.5 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-brand-600" />
                <h3 className="section-title">Market positioning</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{a.positioning_summary}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <PointList title="Strengths" items={a.strengths} positive />
            <PointList title="Vulnerabilities" items={a.vulnerabilities} positive={false} />
          </div>

          {a.recent_shifts && (
            <div className="card p-5 sm:p-6">
              <div className="mb-2.5 flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <h3 className="section-title">Recent activity</h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{a.recent_shifts}</p>
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac">
            <Sparkles className="h-6 w-6 text-brand-600" />
          </div>
          <p className="section-title">No analysis yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-gray-500">
            Connect data and run analysis to populate this view. Sample content elsewhere is illustrative, not live AI insight.
          </p>
        </div>
      )}
    </motion.div>
  );
}
