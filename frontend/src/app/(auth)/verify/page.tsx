"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MailCheck, ArrowLeft, RefreshCw, Loader2, Link2Off, Info } from "lucide-react";
import { verifyToken, requestMagicLink } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "your email";

  const [resent, setResent] = useState(false);
  const [verifying, setVerifying] = useState(!!token);
  const [verifyError, setVerifyError] = useState("");
  const verifyCalledRef = useRef(false);

  // If a token is in the URL, verify it immediately.
  // The ref guard prevents React 18 StrictMode from double-invoking this.
  useEffect(() => {
    if (!token || verifyCalledRef.current) return;
    verifyCalledRef.current = true;
    verifyToken(token)
      .then((data) => {
        router.replace(data.redirect);
      })
      .catch((err) => {
        setVerifyError(err instanceof Error ? err.message : "Invalid or expired sign-in link.");
        setVerifying(false);
      });
  }, [token, router]);

  async function handleResend() {
    if (email === "your email") return;
    setResent(true);
    try {
      await requestMagicLink(email);
    } catch {
      // silently ignore — don't leak account existence
    }
    setTimeout(() => setResent(false), 4000);
  }

  // Token present — show verifying spinner or error
  if (token) {
    return (
      <motion.div {...fade} className="card p-6 text-center sm:p-8">
        {verifying ? (
          <div role="status" aria-live="polite">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-brand-600" />
            <h1 className="font-display text-xl font-semibold text-ink">Signing you in…</h1>
            <p className="mt-2 text-sm text-gray-500">Just a moment.</p>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-control bg-red-100">
              <Link2Off className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="font-display text-xl font-semibold text-ink">Link expired</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">{verifyError}</p>
            <Link href="/login" className="btn-primary mt-6">
              Back to sign in
            </Link>
          </>
        )}
      </motion.div>
    );
  }

  // No token — show "check your inbox"
  return (
    <motion.div {...fade}>
      <div className="card p-6 text-center sm:p-8">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300">
          <MailCheck className="h-7 w-7 text-ink" />
        </div>

        <h1 className="font-display text-[28px] font-semibold leading-9 text-ink">
          Check your inbox
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          We sent a sign-in link to{" "}
          <span className="break-all font-semibold text-ink">{email}</span>. Click the link in the
          email to continue.
        </p>

        <div className="mt-6 flex gap-3 rounded-control bg-lilac p-4 text-left">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p className="text-xs leading-5 text-brand-800">
            <span className="font-semibold">Can&apos;t find it?</span> Check your spam folder. The
            link expires in 15 minutes.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            onClick={handleResend}
            disabled={resent}
            className="btn-secondary w-full"
            aria-live="polite"
          >
            <RefreshCw className={`h-4 w-4 ${resent ? "animate-spin" : ""}`} />
            {resent ? "Link resent" : "Resend link"}
          </button>

          <Link href="/login" className="btn-ghost w-full">
            <ArrowLeft className="h-4 w-4" />
            Use a different email
          </Link>
        </div>
      </div>

      {/* Dev shortcut - remove in production */}
      <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-4">
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          Dev shortcut
        </p>
        <div className="flex gap-2">
          <Link
            href="/onboarding"
            className="flex-1 rounded-control bg-gray-100 py-2 text-center text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Go to onboarding
          </Link>
          <Link
            href="/dashboard"
            className="flex-1 rounded-control bg-lilac py-2 text-center text-xs font-medium text-brand-700 transition-colors hover:bg-brand-200"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </AuthShell>
  );
}
