"use client";

import { useState } from "react";
import { Bell, Download, Info, Loader2, Lock, Mail, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  addCompetitor,
  connectSocialAccount,
  disconnectSocialAccount,
  type CompetitorOut,
  type SocialAuditAccount,
} from "@/lib/api";
import { errorMessage } from "@/lib/workspace";
import { INTEGRATIONS, READ_ONLY_NOTE, type IntegrationMeta } from "@/lib/integrations";
import { Section, Toggle, TrustNote } from "./primitives";

function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-start gap-2 rounded-control border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
      {children}
    </p>
  );
}

// ── Notifications ─────────────────────────────────────────────────────────────

const NOTIF_DEFAULTS = [
  { id: "brief",      label: "Weekly Brief",               sub: "Monday at 7:00am in your local time zone",            enabled: true  },
  { id: "competitor", label: "Competitor update",          sub: "Every two weeks, when new analysis is ready",         enabled: true  },
  { id: "checkin",    label: "Friday check-in",            sub: "A short prompt before Monday's brief",                enabled: true  },
  { id: "session",    label: "Strategy Session follow-up", sub: "When a longer session analysis completes",            enabled: false },
];

export function NotificationsSection() {
  const [prefs, setPrefs] = useState(NOTIF_DEFAULTS);
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "your time zone";

  function toggle(id: string) {
    setPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  }

  return (
    <Section title="Notifications" description="Choose which emails Agenzy sends you and when.">
      <div className="mb-4 flex items-start gap-3 rounded-control border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong className="font-semibold">Planned — delivery not yet active.</strong> Scheduled emails are part of the pilot
          plan and aren&apos;t being sent yet. Choices here aren&apos;t saved to your account.
        </p>
      </div>
      <div className="card divide-y divide-gray-200/70 overflow-hidden">
        {prefs.map((pref) => (
          <div key={pref.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-control", pref.enabled ? "bg-lilac" : "bg-gray-100")}>
                <Bell className={cn("h-4 w-4", pref.enabled ? "text-brand-600" : "text-gray-400")} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{pref.label}</p>
                  <Badge variant="gray" className="text-[10px]">Planned</Badge>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{pref.sub}</p>
              </div>
            </div>
            <Toggle enabled={pref.enabled} onChange={() => toggle(pref.id)} label={`${pref.label} (planned)`} />
          </div>
        ))}
      </div>
      <p className="mt-3 px-1 text-xs text-gray-500">
        Time zone detected from this browser: <span className="font-medium text-gray-700">{tz}</span>. Sign-in links are
        always sent when you request them.
      </p>
    </Section>
  );
}

// ── Integrations ──────────────────────────────────────────────────────────────

function IntegrationCard({
  meta,
  account,
  isDemo,
  onConnected,
  onDisconnected,
}: {
  meta: IntegrationMeta;
  account: SocialAuditAccount | undefined;
  isDemo: boolean;
  onConnected: (a: SocialAuditAccount) => void;
  onDisconnected: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputId = `settings-connect-${meta.id}`;
  const connected = Boolean(account);

  async function connect() {
    if (!handle.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await connectSocialAccount(meta.id, handle.trim());
      onConnected(res.account);
      setOpen(false);
      setHandle("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!account || !window.confirm(`Disconnect ${meta.label}? Agenzy will stop reading it.`)) return;
    setBusy(true);
    setError("");
    try {
      await disconnectSocialAccount(account.id);
      onDisconnected(account.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card flex flex-col p-5 sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="font-display text-base font-semibold text-ink">{meta.label}</p>
        {meta.status === "coming_soon" ? (
          <Badge variant="gray">Coming soon</Badge>
        ) : connected ? (
          <Badge variant="green" dot>Connected</Badge>
        ) : (
          <Badge variant="outline">Not connected</Badge>
        )}
      </div>
      {account?.handle && <p className="text-sm font-medium text-brand-700">{account.handle}</p>}
      <p className="mt-2 flex flex-1 items-start gap-1.5 text-sm leading-relaxed text-gray-600">
        <Lock className="mt-1 h-3 w-3 shrink-0 text-brand-600" aria-hidden="true" />
        {meta.access}
      </p>

      {open && !connected && (
        <div className="mt-4">
          <label htmlFor={inputId} className="label text-xs">{meta.inputLabel}</label>
          <input
            id={inputId}
            className="input"
            placeholder={meta.placeholder}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && connect()}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            autoFocus
          />
        </div>
      )}
      {error && <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-5 flex gap-2">
        {meta.status === "coming_soon" ? (
          <button disabled className="btn-secondary w-full">Coming soon</button>
        ) : isDemo ? (
          <button disabled className="btn-secondary w-full" title="Connections are turned off in the demo workspace">
            {connected ? "Disconnect" : `Connect ${meta.label}`}
          </button>
        ) : connected ? (
          <button onClick={disconnect} disabled={busy} className="btn-secondary w-full hover:text-red-600 hover:ring-red-200">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Disconnect
          </button>
        ) : open ? (
          <>
            <button onClick={connect} disabled={busy || !handle.trim()} className="btn-primary flex-1">
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {busy ? "Connecting…" : "Connect read-only"}
            </button>
            <button onClick={() => { setOpen(false); setError(""); }} className="btn-ghost">Cancel</button>
          </>
        ) : (
          <button onClick={() => setOpen(true)} className="btn-primary w-full">Connect {meta.label}</button>
        )}
      </div>
    </div>
  );
}

export function IntegrationsSection({
  accounts,
  isDemo,
  onAccountsChange,
}: {
  accounts: SocialAuditAccount[];
  isDemo: boolean;
  onAccountsChange: (accounts: SocialAuditAccount[]) => void;
}) {
  return (
    <Section title="Integrations" description="Connect your own accounts for richer audits and briefs.">
      {isDemo && <DemoNote>Connections are turned off in the demo workspace. The statuses below belong to the fictional café.</DemoNote>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((meta) => (
          <IntegrationCard
            key={meta.id}
            meta={meta}
            account={accounts.find((a) => a.platform === meta.id && a.is_active)}
            isDemo={isDemo}
            onConnected={(a) => onAccountsChange([...accounts, a])}
            onDisconnected={(id) => onAccountsChange(accounts.filter((a) => a.id !== id))}
          />
        ))}
      </div>
      <TrustNote>{READ_ONLY_NOTE}</TrustNote>
    </Section>
  );
}

// ── Competitors ───────────────────────────────────────────────────────────────

const MAX_COMPETITORS = 5;

export function CompetitorsSection({
  competitors,
  isDemo,
  onAdded,
  onRemove,
}: {
  competitors: CompetitorOut[];
  isDemo: boolean;
  onAdded: () => void;
  onRemove: (id: string) => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const open = MAX_COMPETITORS - competitors.length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await addCompetitor({ name: name.trim(), address: address.trim() || undefined });
      setName("");
      setAddress("");
      setAdding(false);
      onAdded();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: CompetitorOut) {
    if (!window.confirm(`Stop tracking ${c.name}? Its history stays in past briefs.`)) return;
    setRemovingId(c.id);
    setError("");
    try {
      await onRemove(c.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Section title="Competitor set" description={`Up to ${MAX_COMPETITORS} nearby businesses, tracked through public signals only.`}>
      {isDemo && <DemoNote>These are fictional businesses. Adding and removing is turned off in the demo workspace.</DemoNote>}
      {error && <p role="alert" className="mb-4 rounded-control border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{error}</p>}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {competitors.map((c) => (
          <div key={c.id} className="card p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-control bg-lilac font-display text-sm font-semibold text-brand-700">
                {c.name[0]}
              </div>
              {!isDemo && (
                <button
                  onClick={() => remove(c)}
                  disabled={removingId === c.id}
                  className="rounded px-1.5 py-0.5 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:text-red-600"
                  aria-label={`Remove ${c.name}`}
                >
                  {removingId === c.id ? "Removing…" : "Remove"}
                </button>
              )}
            </div>
            <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{c.address ?? "No address on file"}</p>
            <div className="mt-3">
              <Badge variant={c.baseline_complete ? "green" : "gray"} dot className="text-[10px]">
                {c.baseline_complete ? "Tracking active" : "Collecting baseline"}
              </Badge>
            </div>
          </div>
        ))}

        {open > 0 && !isDemo && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="group flex min-h-[132px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-brand-400 hover:bg-lilac/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-white shadow-soft">
              <Plus className="h-4 w-4 text-brand-600" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-gray-600 group-hover:text-brand-700">
              Add a business · {open} slot{open !== 1 ? "s" : ""} open
            </span>
          </button>
        )}
      </div>

      {adding && (
        <form onSubmit={submit} className="card mb-4 grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label htmlFor="comp-name" className="label">Business name</label>
            <input id="comp-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label htmlFor="comp-address" className="label">Address <span className="font-normal text-gray-500">(optional)</span></label>
            <input id="comp-address" className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={busy || !name.trim()} className="btn-primary">
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {busy ? "Adding…" : "Start tracking"}
            </button>
            <button type="button" onClick={() => { setAdding(false); setError(""); }} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="card p-5">
        <p className="mb-3 text-xs font-semibold text-ink">Planned refresh cadence</p>
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Instagram", "Weekly"],
            ["Facebook", "Weekly"],
            ["Meta Ads", "Weekly"],
            ["Google Reviews", "Every 2 weeks"],
            ["Google Business", "Monthly"],
          ].map(([src, cadence]) => (
            <div key={src} className="flex items-center gap-2 text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
              <span className="font-medium text-gray-700">{src}</span>
              <span className="text-gray-500">· {cadence}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── Account ───────────────────────────────────────────────────────────────────

export function AccountSection({ isDemo }: { isDemo: boolean }) {
  return (
    <Section title="Account & privacy" description="Your data, plan, and account.">
      {isDemo && <DemoNote>You&apos;re in the demo workspace, so there&apos;s no account to export or delete.</DemoNote>}

      <div className="card-ink mb-4 p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-300">Pilot preparation</p>
        <p className="mt-2 font-display text-xl font-semibold">Prototype workspace</p>
        <p className="mt-1 max-w-md text-sm text-white/70">
          Pilot scope and pricing are still being validated. Nothing is billed in this prototype.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { icon: Download, title: "Export your data", body: "A JSON archive of your briefs, strategy sessions, and competitor analyses.", danger: false },
          { icon: Trash2, title: "Delete account", body: "Permanently removes your account and associated data.", danger: true },
        ].map((a) => (
          <div key={a.title} className={cn("card flex flex-col p-5 sm:p-6", a.danger && "border-red-200")}>
            <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-control", a.danger ? "bg-red-50" : "bg-lilac")}>
              <a.icon className={cn("h-5 w-5", a.danger ? "text-red-600" : "text-brand-600")} aria-hidden="true" />
            </div>
            <p className="font-display text-base font-semibold text-ink">{a.title}</p>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-gray-600">{a.body}</p>
            <p className="mt-4 text-xs text-gray-500">
              Self-serve {a.danger ? "deletion" : "export"} isn&apos;t available in the prototype yet.
            </p>
            {!isDemo && (
              <a
                href={`mailto:hello@agenzy.online?subject=${encodeURIComponent(a.danger ? "Delete my Agenzy account" : "Export my Agenzy data")}`}
                className="btn-secondary mt-3 w-full"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
                Email us to request it
              </a>
            )}
          </div>
        ))}
      </div>

      <TrustNote>
        Agenzy never sells your data. Raw competitor data is never exposed through the UI or API. Sign-in uses magic
        links only, so no passwords are stored.
      </TrustNote>
    </Section>
  );
}
