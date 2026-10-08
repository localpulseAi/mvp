"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Lightbulb, RefreshCw, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialAuditAccount, SocialAuditDetail } from "@/lib/api";
import { PLATFORM_META, PlatformBadge, tabMotion } from "./meta";

type Presence = { platform: string; assessment: string; cadence_observation: string; content_mix_observation: string; recent_direction: string };
type Working = { observation: string; why_it_works: string; theme: string };
type NotWorking = { observation: string; hypothesis: string; category: string };
type Progress = { title: string; status: string; signal_observed: string };

const PROGRESS_STYLES: Record<string, string> = {
  done: "bg-lime-300 text-ink",
  in_progress: "bg-lilac text-brand-700",
  stalled: "bg-amber-50 text-amber-800",
  dismissed: "bg-gray-100 text-gray-500",
  no_longer_relevant: "bg-gray-100 text-gray-500",
};

function SectionCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h3 className="section-title mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function AuditReport({ audit, accounts }: { audit: SocialAuditDetail; accounts: SocialAuditAccount[] }) {
  const presence = (audit.state_of_presence ?? []) as Presence[];
  const working = (audit.what_working ?? []) as Working[];
  const notWorking = (audit.what_not_working ?? []) as NotWorking[];
  const progress = (audit.prior_plan_progress ?? []) as Progress[];

  return (
    <motion.div {...tabMotion} className="space-y-5">
      {/* Connected accounts */}
      <div className="flex flex-wrap gap-2">
        {accounts.filter((a) => a.is_active).map((a) => {
          const ok = a.last_scrape_status === "success";
          return (
            <div key={a.id} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-soft">
              <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-amber-500")} />
              <PlatformBadge platform={a.platform} />
              <span className="sr-only">{ok ? "data current" : "data needs attention"}</span>
            </div>
          );
        })}
      </div>

      {audit.market_connection && (
        <div className="card-ink flex gap-3 p-5 sm:p-6">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-lime-300" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-300">From your market</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-white/90">{audit.market_connection}</p>
          </div>
        </div>
      )}

      {progress.length > 0 && (
        <SectionCard title="Progress on last week's plan" icon={<RefreshCw className="h-4 w-4 text-brand-600" />}>
          <div className="space-y-2.5">
            {progress.map((item, i) => (
              <div key={i} className="flex flex-col gap-2 rounded-control bg-canvas p-3.5 sm:flex-row sm:items-start sm:gap-3">
                <span className={cn("w-fit whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", PROGRESS_STYLES[item.status] ?? "bg-gray-100 text-gray-600")}>
                  {item.status.replace(/_/g, " ")}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{item.signal_observed}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {presence.length > 0 && (
        <SectionCard title="State of presence">
          <div className="grid gap-3 xl:grid-cols-2">
            {presence.map((p) => (
              <div key={p.platform} className="rounded-control border border-gray-200/70 bg-canvas p-4">
                <PlatformBadge platform={p.platform} />
                <p className="mt-2 text-sm leading-relaxed text-gray-800">{p.assessment}</p>
                <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-gray-700">Cadence</dt>
                    <dd className="mt-0.5 text-gray-600">{p.cadence_observation}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-700">Content mix</dt>
                    <dd className="mt-0.5 text-gray-600">{p.content_mix_observation}</dd>
                  </div>
                </dl>
                <p className="mt-3 rounded-lg bg-lilac px-3 py-2 text-xs font-medium text-brand-700">{p.recent_direction}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {working.length > 0 && (
          <SectionCard title="What's working" icon={<TrendingUp className="h-4 w-4 text-emerald-600" />}>
            <div className="space-y-3">
              {working.map((w, i) => (
                <div key={i} className="flex gap-3 rounded-control border border-gray-200/70 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{w.observation}</p>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">{w.why_it_works}</p>
                    <span className="chip-lime mt-2.5 capitalize">{w.theme.replace(/_/g, " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {notWorking.length > 0 && (
          <SectionCard title="What's not working" icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}>
            <div className="space-y-3">
              {notWorking.map((n, i) => (
                <div key={i} className="flex gap-3 rounded-control border border-gray-200/70 p-4">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{n.observation}</p>
                    <p className="mb-1 mt-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
                      Likely reason (hypothesis)
                    </p>
                    <p className="text-sm leading-relaxed text-gray-600">{n.hypothesis}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {audit.data_freshness && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(audit.data_freshness).map(([src, ts]) => (
            <span key={src} className="text-xs text-gray-500">
              {PLATFORM_META[src]?.label ?? src}: data through{" "}
              {new Date(ts).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
