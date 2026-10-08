"use client";

import { useState } from "react";
import { Activity, Eye, Loader2, Lock, Plus, Sparkles } from "lucide-react";
import { connectSocialAccount, type SocialAuditAccount } from "@/lib/api";
import { errorMessage } from "@/lib/workspace";
import { INTEGRATIONS, READ_ONLY_NOTE, type IntegrationMeta } from "@/lib/integrations";

function ConnectAccountRow({
  integration,
  onConnected,
}: {
  integration: IntegrationMeta;
  onConnected: (account: SocialAuditAccount) => void;
}) {
  const [handle, setHandle] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const inputId = `connect-${integration.id}`;
  const comingSoon = integration.status === "coming_soon";

  const handleConnect = async () => {
    if (!handle.trim()) return;
    setConnecting(true);
    setError("");
    try {
      const res = await connectSocialAccount(integration.id, handle.trim());
      onConnected(res.account);
      setHandle("");
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <li className="rounded-control border border-gray-200/70 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{integration.label}</p>
          <p className="mt-0.5 flex items-start gap-1.5 text-xs leading-relaxed text-gray-600">
            <Lock className="mt-0.5 h-3 w-3 shrink-0 text-brand-600" aria-hidden="true" />
            {integration.access}
          </p>
        </div>
        {comingSoon ? (
          <span className="shrink-0 self-start rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">Coming soon</span>
        ) : (
          !open && (
            <button onClick={() => setOpen(true)} className="btn-secondary shrink-0 self-start">
              <Plus className="h-4 w-4 text-brand-600" aria-hidden="true" />
              Connect
            </button>
          )
        )}
      </div>

      {open && (
        <div className="mt-3 border-t border-gray-200/70 pt-3">
          <label htmlFor={inputId} className="label text-xs">{integration.inputLabel}</label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={inputId}
              className="input min-w-0 flex-1 px-3 py-2"
              placeholder={integration.placeholder}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${inputId}-error` : undefined}
              autoFocus
            />
            <button onClick={handleConnect} disabled={connecting || !handle.trim()} className="btn-primary px-3 py-2">
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {connecting ? "Connecting…" : "Connect read-only"}
            </button>
            <button onClick={() => { setOpen(false); setError(""); }} className="btn-ghost px-2">Cancel</button>
          </div>
          {error && <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </li>
  );
}

export function NoAccountsState({
  onConnected,
  onExploreSample,
}: {
  onConnected: (a: SocialAuditAccount) => void;
  onExploreSample: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="card p-6 sm:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac">
          <Activity className="h-6 w-6 text-brand-600" aria-hidden="true" />
        </div>
        <h2 className="font-display text-xl font-semibold text-ink">Connect an account to get your audit</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-600">
          The Social Presence Audit reads your own public presence and turns it into what&rsquo;s working, what isn&rsquo;t,
          and a short plan you can act on this week.
        </p>
        <ul className="mt-6 space-y-3" aria-label="Accounts you can connect">
          {INTEGRATIONS.map((i) => (
            <ConnectAccountRow key={i.id} integration={i} onConnected={onConnected} />
          ))}
        </ul>
        <p className="mt-4 text-xs text-gray-500">{READ_ONLY_NOTE} You can also manage this in Settings → Integrations.</p>
      </div>

      <div className="card-lilac flex flex-col p-6 sm:p-8">
        <p className="eyebrow">Not ready to connect?</p>
        <h3 className="mt-2 font-display text-lg font-semibold text-ink">See what an audit looks like first</h3>
        <ul className="mt-4 space-y-3.5">
          {[
            ["State of presence", "A plain-language read of each platform's cadence and content mix."],
            ["What's working and what isn't", "Observations kept separate from hypotheses, so you can judge them."],
            ["A short action plan", "Each step shows priority, effort, why it matters, and the result to watch."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <button onClick={onExploreSample} className="btn-primary mt-6 self-start">
          <Eye className="h-4 w-4" aria-hidden="true" />
          Explore a sample audit
        </button>
        <p className="mt-2 text-xs text-gray-500">Uses a fictional café. Nothing is connected or analysed.</p>
      </div>
    </div>
  );
}

export function NoAuditState({
  onGenerate,
  generating,
  error,
}: {
  onGenerate: () => void;
  generating: boolean;
  error?: string;
}) {
  return (
    <div className="card relative overflow-hidden p-8 text-center sm:p-12">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac">
        <Sparkles className="h-7 w-7 text-brand-600" aria-hidden="true" />
      </div>
      <p className="highlight text-2xl">Ready when you are</p>
      <h2 className="mt-1 font-display text-lg font-semibold text-ink">No audit for this week yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
        Agenzy will review your connected accounts and draft a short action plan. It usually takes under a minute.
      </p>
      <button onClick={onGenerate} disabled={generating} className="btn-primary mt-6">
        {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Activity className="h-4 w-4" aria-hidden="true" />}
        {generating ? "Generating…" : "Generate audit"}
      </button>
      {error && <p role="alert" className="mx-auto mt-3 max-w-sm text-sm text-red-600">{error}</p>}
    </div>
  );
}
