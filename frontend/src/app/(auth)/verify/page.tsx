"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { MailCheck, ArrowLeft, ArrowRight, RefreshCw, Loader2, Link2Off, Info, CheckCircle2, CloudOff } from "lucide-react";
import { ApiError, verifyToken, requestMagicLink } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthHelp, PrototypeNote, authCardClass } from "@/components/auth/AuthNotes";
import { useCooldown } from "@/components/auth/useCooldown";
import { EMAIL_PATTERN, LINK_EXPIRY_MINUTES, RESEND_COOLDOWN_SECONDS } from "@/components/auth/authConfig";

type VerifyState = "verifying" | "success" | "invalid" | "unavailable" | "failed";

function StateIcon({ tone, children }: { tone: "lime" | "lilac" | "red" | "gray"; children: React.ReactNode }) {
  const bg = { lime: "bg-lime-300", lilac: "bg-lilac", red: "bg-red-50", gray: "bg-gray-100" }[tone];
  return (
    <div className={`mx-auto mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] ${bg}`} aria-hidden="true">
      {children}
    </div>
  );
}

/** Token in URL → verify it and redirect. */
function TokenVerify({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<VerifyState>("verifying");
  const calledRef = useRef(false); // guards React StrictMode double-invoke

  function run() {
    setState("verifying");
    verifyToken(token)
      .then((data) => {
        setState("success");
        router.replace(data.redirect);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.kind === "unavailable") setState("unavailable");
        else if (err instanceof ApiError && (err.kind === "client" || err.kind === "unauthorized")) setState("invalid");
        else setState("failed");
      });
  }

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="text-center" role="status" aria-live="polite">
      {state === "verifying" && (
        <>
          <StateIcon tone="lilac">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </StateIcon>
          <h1 className="font-display text-2xl font-semibold text-ink">Signing you in…</h1>
          <p className="mt-2 text-sm text-gray-600">Checking your link. This takes a moment.</p>
        </>
      )}
      {state === "success" && (
        <>
          <StateIcon tone="lime">
            <CheckCircle2 className="h-6 w-6 text-ink" />
          </StateIcon>
          <h1 className="font-display text-2xl font-semibold text-ink">You&apos;re signed in</h1>
          <p className="mt-2 text-sm text-gray-600">Taking you to your workspace…</p>
        </>
      )}
      {state === "invalid" && (
        <>
          <StateIcon tone="red">
            <Link2Off className="h-6 w-6 text-red-600" />
          </StateIcon>
          <h1 className="font-display text-2xl font-semibold text-ink">This link has expired or was already used</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Sign-in links work once and expire after {LINK_EXPIRY_MINUTES} minutes. Request a new one to continue.
          </p>
          <Link href="/login" className="btn-primary mt-6">
            Send a new link
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      )}
      {state === "unavailable" && (
        <>
          <StateIcon tone="gray">
            <CloudOff className="h-6 w-6 text-gray-500" />
          </StateIcon>
          <h1 className="font-display text-2xl font-semibold text-ink">Sign-in isn&apos;t available here</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            This public prototype isn&apos;t connected to a sign-in service. You can explore a fictional workspace instead.
          </p>
          <Link href="/dashboard" className="btn-primary mt-6">
            Explore the demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      )}
      {state === "failed" && (
        <>
          <StateIcon tone="red">
            <Link2Off className="h-6 w-6 text-red-600" />
          </StateIcon>
          <h1 className="font-display text-2xl font-semibold text-ink">We couldn&apos;t check your link</h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">Something went wrong on our side. Your link may still work.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button onClick={run} className="btn-primary">
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link href="/login" className="btn-secondary">
              Send a new link
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/** No token → "check your inbox" with resend cooldown. */
function CheckInbox({ email }: { email: string | null }) {
  const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const validEmail = !!email && EMAIL_PATTERN.test(email);

  async function resend() {
    if (!validEmail || sending) return;
    setSending(true);
    setNote("");
    try {
      await requestMagicLink(email!);
      setNote("If that email can sign in, another link is on its way.");
      cooldown.start();
    } catch (err) {
      setNote(
        err instanceof ApiError && err.kind === "unavailable"
          ? "Sign-in isn't available in this public prototype, so no email was sent."
          : "We couldn't send another link. Try again in a moment."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="text-center">
      <StateIcon tone="lime">
        <MailCheck className="h-6 w-6 text-ink" />
      </StateIcon>
      <h1 className="font-display text-[28px] font-semibold leading-9 text-ink">Check your inbox</h1>
      <p className="mt-3 text-sm leading-6 text-gray-600">
        {validEmail ? (
          <>
            If <span className="break-all font-semibold text-ink">{email}</span> can sign in, a link is on its way.
          </>
        ) : (
          "If your email can sign in, a link is on its way."
        )}{" "}
        Open it on this device to continue.
      </p>

      <div className="mt-6 flex gap-3 rounded-control bg-lilac p-4 text-left">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        <p className="text-xs leading-5 text-gray-700">
          <span className="font-semibold">Can&apos;t find it?</span> Check your spam folder. The link works once and
          expires in {LINK_EXPIRY_MINUTES} minutes.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {validEmail && (
          <button onClick={resend} disabled={sending || cooldown.remaining > 0} className="btn-secondary w-full py-3">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            {sending ? "Sending…" : cooldown.remaining > 0 ? `Resend available in ${cooldown.remaining}s` : "Resend link"}
          </button>
        )}
        <Link href="/login" className="btn-ghost w-full">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {validEmail ? "Use a different email" : "Back to sign in"}
        </Link>
      </div>
      <p className="mt-3 min-h-[1.25rem] text-xs text-gray-500" role="status" aria-live="polite">
        {note}
      </p>
    </div>
  );
}

function VerifyContent() {
  const reduced = useReducedMotion();
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.35, ease: "easeOut" as const }}
    >
      <div className={authCardClass}>
        {token ? <TokenVerify token={token} /> : <CheckInbox email={email} />}
        <PrototypeNote />
      </div>
      <AuthHelp />
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div role="status" className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
            <span className="sr-only">Loading</span>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </AuthShell>
  );
}
