"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAuditEvidence,
  getSocialAccounts,
  getCurrentAudit,
  listAudits,
  triggerAuditGenerate,
  updateActionItemStatus,
  type AuditActionItem,
  type SocialAuditAccount,
  type SocialAuditDetail,
} from "@/lib/api";
import { useWorkspaceData, errorMessage } from "@/lib/workspace";
import { demoAudit, demoAuditEvidence, demoAuditHistory, demoSocialAccounts } from "@/lib/demo-workspace";
import { DemoBanner, ErrorState, LoadingState, PageHeader } from "@/components/ui/states";
import { weekRange, type ItemStatus } from "@/components/audit/meta";
import { AuditView } from "@/components/audit/AuditView";
import { NoAccountsState, NoAuditState } from "@/components/audit/EmptyStates";

const PAGE = "px-4 py-6 sm:px-6 lg:px-8 lg:py-8";

type AuditData = { accounts: SocialAuditAccount[]; audit: SocialAuditDetail | null };

const DEMO_DATA: AuditData = { accounts: demoSocialAccounts, audit: demoAudit };

async function loadLive(): Promise<AuditData> {
  const { accounts } = await getSocialAccounts();
  if (accounts.length === 0) return { accounts, audit: null };
  const { audit } = await getCurrentAudit();
  return { accounts, audit };
}

const demoHistory = async () => demoAuditHistory;
const demoEvidence = async () => demoAuditEvidence;
const liveHistory = async () => (await listAudits(20)).audits;

function auditSubtitle(audit: SocialAuditDetail | null) {
  if (!audit) return "A qualitative read of your own social presence, with a short plan.";
  const generated = audit.generated_at
    ? ` · Generated ${new Date(audit.generated_at).toLocaleString("en-CA", { weekday: "long", hour: "numeric", minute: "2-digit" })}`
    : "";
  return `${weekRange(audit.week_start, audit.week_end)}${generated}`;
}

export default function AuditPage() {
  const { state, reload } = useWorkspaceData(loadLive, DEMO_DATA);
  const isDemo = state.mode === "demo";

  // Local working copies (live mode updates them via polling / status edits)
  const [accounts, setAccounts] = useState<SocialAuditAccount[]>([]);
  const [audit, setAudit] = useState<SocialAuditDetail | null>(null);
  const [items, setItems] = useState<AuditActionItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [statusError, setStatusError] = useState("");

  // "Explore a sample audit" before connecting (live workspace, no accounts)
  const [sampleOpen, setSampleOpen] = useState(false);
  const [sampleItems, setSampleItems] = useState<AuditActionItem[]>(demoAudit.action_items);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.status !== "ready") return;
    setAccounts(state.data.accounts);
    setAudit(state.data.audit);
    setItems(state.data.audit?.action_items ?? []);
  }, [state]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const pollAudit = useCallback(async () => {
    try {
      const res = await getCurrentAudit();
      if (res.audit) {
        setAudit(res.audit);
        setItems(res.audit.action_items);
        if (res.audit.status === "completed" || res.audit.status === "failed") {
          setGenerating(false);
          stopPolling();
          if (res.audit.status === "failed") setGenerateError("The audit couldn't be completed. Try generating it again.");
        }
      }
    } catch (err) {
      setGenerating(false);
      stopPolling();
      setGenerateError(errorMessage(err));
    }
  }, [stopPolling]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError("");
    try {
      await triggerAuditGenerate();
      pollRef.current = setInterval(pollAudit, 5000);
    } catch (err) {
      setGenerating(false);
      setGenerateError(errorMessage(err));
    }
  }

  async function handleStatusChange(id: string, status: ItemStatus) {
    const previous = items;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    if (isDemo) return; // demo: local only
    setStatusError("");
    try {
      await updateActionItemStatus(id, status);
    } catch (err) {
      setItems(previous);
      setStatusError(`Couldn't update that item: ${errorMessage(err)}`);
    }
  }

  function handleSampleStatus(id: string, status: ItemStatus) {
    setSampleItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  if (state.status === "loading") {
    return (
      <div className={cn(PAGE, "space-y-6")}>
        <PageHeader eyebrow="Social presence audit" title="How your presence is landing" />
        <LoadingState label="Loading your audit" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={cn(PAGE, "space-y-6")}>
        <PageHeader eyebrow="Social presence audit" title="How your presence is landing" />
        <ErrorState title="We couldn't load your audit" message={state.error} onRetry={reload} />
      </div>
    );
  }

  // Sample audit explored from the "no accounts" state (live workspace)
  if (sampleOpen) {
    return (
      <div className={cn(PAGE, "space-y-6")}>
        <DemoBanner what="a sample audit" />
        <PageHeader
          eyebrow="Sample social presence audit"
          title="What an audit looks like"
          description="A fictional café's audit. Nothing has been connected or analysed."
          action={
            <button onClick={() => setSampleOpen(false)} className="btn-secondary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to connect accounts
            </button>
          }
        />
        <AuditView
          audit={demoAudit}
          items={sampleItems}
          accounts={demoSocialAccounts}
          onStatusChange={handleSampleStatus}
          sample
          loadEvidence={demoEvidence}
          loadHistory={demoHistory}
        />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={cn(PAGE, "space-y-6")}>
        <PageHeader
          eyebrow="Social presence audit"
          title="How your presence is landing"
          description="Connect your own accounts to get a qualitative read and a short plan."
        />
        <NoAccountsState onConnected={(a) => setAccounts((prev) => [...prev, a])} onExploreSample={() => setSampleOpen(true)} />
      </div>
    );
  }

  const isGenerating = generating || audit?.status === "generating" || audit?.status === "regenerating";

  if (!audit && !isGenerating) {
    return (
      <div className={cn(PAGE, "space-y-6")}>
        <PageHeader eyebrow="Social presence audit" title="How your presence is landing" />
        <NoAuditState onGenerate={handleGenerate} generating={generating} error={generateError} />
      </div>
    );
  }

  return (
    <div className={cn(PAGE, "space-y-6")}>
      {isDemo && <DemoBanner what="a sample social presence audit" />}
      <PageHeader
        eyebrow="Social presence audit"
        title="How your presence is landing"
        description={auditSubtitle(audit)}
        action={
          !isDemo &&
          audit?.status === "completed" && (
            <button onClick={handleGenerate} disabled={generating} className="btn-secondary">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
              {generating ? "Generating…" : "Re-generate"}
            </button>
          )
        }
      />

      {isGenerating && (
        <div className="card-lilac flex items-center gap-4 p-5 sm:p-6" role="status" aria-live="polite">
          <Loader2 className="h-6 w-6 shrink-0 animate-spin text-brand-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-ink">Reviewing your connected accounts…</p>
            <p className="mt-0.5 text-sm text-gray-600">This page updates when the audit is ready. Your current report stays visible meanwhile.</p>
          </div>
        </div>
      )}

      {(generateError || statusError) && (
        <p role="alert" className="rounded-control border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {generateError || statusError}
        </p>
      )}

      {audit?.status === "completed" && (
        <AuditView
          audit={audit}
          items={items}
          accounts={accounts}
          onStatusChange={handleStatusChange}
          loadEvidence={isDemo ? demoEvidence : () => getAuditEvidence(audit.id).then((r) => r.evidence)}
          sample={isDemo}
          loadHistory={isDemo ? demoHistory : liveHistory}
        />
      )}
    </div>
  );
}
