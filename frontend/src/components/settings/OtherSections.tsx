"use client";

import { useState } from "react";
import { Bell, Download, Globe, Instagram, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { CompetitorOut, OwnerProfile } from "@/lib/api";
import { Section, Toggle, TrustNote } from "./primitives";

// ── Notifications ─────────────────────────────────────────────────────────────

const NOTIF_DEFAULTS = [
  { id: "brief",      label: "Weekly Brief",               sub: "Delivered Monday at 7:00am local time",                enabled: true,  badge: "Core"  },
  { id: "competitor", label: "Competitor update",          sub: "Bi-weekly when new competitor analysis is ready",      enabled: true,  badge: null    },
  { id: "checkin",    label: "Friday check-in",            sub: "Weekly prompt before Monday's brief",                  enabled: true,  badge: "Pilot" },
  { id: "session",    label: "Strategy Session follow-up", sub: "Email when a long-running session analysis completes", enabled: false, badge: null    },
];

export function NotificationsSection() {
  const [prefs, setPrefs] = useState(NOTIF_DEFAULTS);
  function toggle(id: string) {
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  }
  return (
    <Section title="Notifications" description="Choose which emails Agenzy sends you and when.">
      <div className="card divide-y divide-gray-200/70 overflow-hidden">
        {prefs.map((pref) => (
          <div key={pref.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-control", pref.enabled ? "bg-lilac" : "bg-gray-100")}>
                <Bell className={cn("h-4 w-4", pref.enabled ? "text-brand-600" : "text-gray-400")} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{pref.label}</p>
                  {pref.badge && (
                    <Badge variant={pref.badge === "Core" ? "brand" : "lime"} className="text-[10px]">{pref.badge}</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{pref.sub}</p>
              </div>
            </div>
            <Toggle enabled={pref.enabled} onChange={() => toggle(pref.id)} label={pref.label} />
          </div>
        ))}
      </div>
      <p className="mt-3 px-1 text-xs text-gray-500">
        Transactional emails (sign-in links, data exports) are always sent regardless of preferences.
      </p>
    </Section>
  );
}

// ── Integrations ──────────────────────────────────────────────────────────────

export function IntegrationsSection({ profile }: { profile: OwnerProfile | null }) {
  const integrations = [
    {
      id: "instagram", name: "Instagram", icon: Instagram,
      handle: profile?.instagram_handle ?? null,
      desc: "Read-only access to your own profile and post data",
      connected: Boolean(profile?.instagram_handle),
    },
    {
      id: "google", name: "Google Business", icon: Globe,
      handle: null,
      desc: "Read-only access to your Google Business Profile and reviews",
      connected: false,
    },
  ];
  return (
    <Section title="Integrations" description="Connect your accounts for richer analysis. All access is read-only.">
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((ig) => (
          <div key={ig.id} className="card flex flex-col p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-control", ig.connected ? "bg-brand-600" : "bg-lilac")}>
                <ig.icon className={cn("h-5 w-5", ig.connected ? "text-white" : "text-brand-600")} />
              </div>
              {ig.connected ? <Badge variant="green" dot>Connected</Badge> : <Badge variant="gray">Not connected</Badge>}
            </div>
            <p className="font-display text-base font-semibold text-ink">{ig.name}</p>
            {ig.handle ? (
              <p className="mt-0.5 text-sm font-medium text-brand-700">{ig.handle}</p>
            ) : (
              <p className="mt-0.5 text-sm text-gray-500">No account connected</p>
            )}
            <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{ig.desc}</p>
            <div className="mt-5">
              {ig.connected ? (
                <button className="btn-secondary w-full hover:text-red-600 hover:ring-red-200">Disconnect</button>
              ) : (
                <button className="btn-primary w-full">Connect {ig.name}</button>
              )}
            </div>
          </div>
        ))}
      </div>
      <TrustNote>Agenzy never writes to your accounts. Integrations are read-only and can be disconnected at any time.</TrustNote>
    </Section>
  );
}

// ── Competitors ───────────────────────────────────────────────────────────────

const CADENCE = [
  { src: "Instagram", cadence: "Weekly" },
  { src: "Facebook", cadence: "Weekly" },
  { src: "Meta Ads", cadence: "Weekly" },
  { src: "Google Reviews", cadence: "Bi-weekly" },
  { src: "Google Business", cadence: "Monthly" },
];

export function CompetitorsSection({ competitors, onRemove }: { competitors: CompetitorOut[]; onRemove: (id: string) => void }) {
  const open = 5 - competitors.length;
  return (
    <Section
      title="Competitor set"
      description="Up to 5 businesses tracked across Instagram, Google, Facebook and Meta Ads."
      action={
        <button className="btn-secondary self-start">
          <Search className="h-4 w-4" /> Re-run discovery
        </button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {competitors.map((c) => (
          <div key={c.id} className="card group p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-control bg-lilac font-display text-sm font-semibold text-brand-700">
                {c.name[0]}
              </div>
              <button
                onClick={() => onRemove(c.id)}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:text-red-600"
                aria-label={`Remove ${c.name}`}
              >
                Remove
              </button>
            </div>
            <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{c.address ?? "No address on file"}</p>
            <div className="mt-3">
              <Badge variant="green" dot className="text-[10px]">Tracking active</Badge>
            </div>
          </div>
        ))}

        {open > 0 && (
          <button className="group flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-brand-400 hover:bg-lilac/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-white shadow-soft">
              <Plus className="h-4 w-4 text-brand-600" />
            </div>
            <p className="text-xs font-semibold text-gray-600 group-hover:text-brand-700">
              Add a business · {open} slot{open !== 1 ? "s" : ""} open
            </p>
          </button>
        )}
      </div>

      <div className="card p-5">
        <p className="mb-3 text-xs font-semibold text-ink">Refresh cadence</p>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-5">
          {CADENCE.map((s) => (
            <div key={s.src} className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              <span className="font-medium text-gray-700">{s.src}</span>
              <span className="text-gray-500">· {s.cadence}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── Account ───────────────────────────────────────────────────────────────────

export function AccountSection({ profile }: { profile: OwnerProfile | null }) {
  return (
    <Section title="Account & privacy" description="Manage your data, plan and account security.">
      <div className="card-ink relative mb-4 overflow-hidden p-5 sm:p-6">
        <Sparkles className="absolute right-5 top-5 h-5 w-5 text-lime-300" aria-hidden />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-300">
          {profile?.is_founding_member ? "Founding member" : "Pilot plan"}
        </p>
        <p className="mt-2 font-display text-xl font-semibold">Prototype workspace</p>
        <p className="mt-1 max-w-md text-sm text-white/70">
          Pilot scope and pricing are still being validated. Nothing is billed in this prototype.
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
          <span className={cn("h-1.5 w-1.5 rounded-full", profile?.subscription_active ? "bg-lime-300" : "bg-white/50")} />
          {profile?.subscription_active ? "Subscription active" : "No active subscription"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card flex flex-col p-5 sm:p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-control bg-lilac">
            <Download className="h-5 w-5 text-brand-600" />
          </div>
          <p className="font-display text-base font-semibold text-ink">Export your data</p>
          <p className="mb-5 mt-1 flex-1 text-sm leading-relaxed text-gray-600">
            Download all briefs, strategy sessions and competitor analyses as a JSON archive.
          </p>
          <button className="btn-secondary w-full">Request export</button>
        </div>
        <div className="card flex flex-col border-red-200 p-5 sm:p-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-control bg-red-50">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <p className="font-display text-base font-semibold text-ink">Delete account</p>
          <p className="mb-5 mt-1 flex-1 text-sm leading-relaxed text-gray-600">
            Permanently removes your account and all associated data within 30 days.
          </p>
          <button className="w-full rounded-control border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50">
            Delete account
          </button>
        </div>
      </div>

      <TrustNote>
        Agenzy never sells your data. Raw competitor data is never exposed through the UI or API. Sign-in uses magic
        links only, so no passwords are stored.
      </TrustNote>
    </Section>
  );
}
