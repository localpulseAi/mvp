"use client";

import { useState } from "react";
import { Activity, Loader2, Plus, Sparkles } from "lucide-react";
import { connectSocialAccount, type SocialAuditAccount } from "@/lib/api";
import { PLATFORM_META } from "./meta";

function ConnectAccountRow({
  platform,
  onConnected,
}: {
  platform: string;
  onConnected: (account: SocialAuditAccount) => void;
}) {
  const meta = PLATFORM_META[platform];
  const [handle, setHandle] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async () => {
    if (!handle.trim()) return;
    setConnecting(true);
    setError("");
    try {
      const res = await connectSocialAccount(platform, handle.trim());
      onConnected(res.account);
      setHandle("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect that account.");
    } finally {
      setConnecting(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full justify-start sm:w-auto">
        <Plus className="h-4 w-4 text-brand-600" />
        Connect {meta?.label ?? platform}
      </button>
    );
  }

  const inputId = `connect-${platform}`;
  return (
    <div className="w-full rounded-control border border-brand-200 bg-white p-3 sm:w-auto">
      <label htmlFor={inputId} className="label text-xs">{meta?.label ?? platform}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={inputId}
          className="input min-w-0 flex-1 px-3 py-2 sm:w-48"
          placeholder={platform === "google_business" ? "Place ID or @handle" : "@handle"}
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          autoFocus
        />
        <button onClick={handleConnect} disabled={connecting || !handle.trim()} className="btn-primary px-3 py-2">
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </button>
        <button onClick={() => setOpen(false)} className="btn-ghost px-2">Cancel</button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function NoAccountsState({ onConnected }: { onConnected: (a: SocialAuditAccount) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="card p-6 sm:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac">
          <Activity className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="font-display text-xl font-semibold text-ink">Connect an account to unlock your audit</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-600">
          The Social Presence Audit looks at your own Instagram, Facebook and Google Business presence: what&rsquo;s
          working, what isn&rsquo;t, and a prioritised plan you can act on this week.
        </p>
        <div className="mt-6 flex flex-col flex-wrap gap-3 sm:flex-row">
          {["instagram", "facebook", "google_business"].map((p) => (
            <ConnectAccountRow key={p} platform={p} onConnected={onConnected} />
          ))}
        </div>
        <p className="mt-5 text-xs text-gray-500">You can also connect accounts from Settings → Integrations.</p>
      </div>

      <div className="card-lilac p-6 sm:p-8">
        <p className="eyebrow">What you&rsquo;ll get</p>
        <ul className="mt-4 space-y-3.5">
          {[
            ["State of presence", "A plain-language read of each platform's cadence and content mix."],
            ["What's working and what isn't", "Observations separated from hypotheses, so you can judge them."],
            ["A short action plan", "Prioritised by effort, with the result worth watching for each step."],
          ].map(([title, body]) => (
            <li key={title} className="flex gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="text-sm leading-relaxed text-gray-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function NoAuditState({ onGenerate, generating }: { onGenerate: () => void; generating: boolean }) {
  return (
    <div className="card relative overflow-hidden p-8 text-center sm:p-12">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac">
        <Sparkles className="h-7 w-7 text-brand-600" />
      </div>
      <p className="highlight text-2xl">Ready when you are</p>
      <h2 className="mt-1 font-display text-lg font-semibold text-ink">No audit for this week yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
        Generate your Social Presence Audit. Agenzy will review your connected accounts and draft an action plan.
      </p>
      <button onClick={onGenerate} disabled={generating} className="btn-primary mt-6">
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
        {generating ? "Generating…" : "Generate audit"}
      </button>
    </div>
  );
}
