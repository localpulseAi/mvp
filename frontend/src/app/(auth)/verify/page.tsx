"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Zap, MailCheck, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { verifyToken, requestMagicLink } from "@/lib/api";

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
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            {verifying ? (
              <>
                <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-brand-600" />
                <h1 className="text-xl font-bold text-gray-900">Signing you in…</h1>
                <p className="mt-2 text-sm text-gray-500">Just a moment.</p>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                  <ArrowLeft className="h-6 w-6 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Link expired</h1>
                <p className="mt-2 text-sm text-gray-500">{verifyError}</p>
                <Link href="/login" className="btn-primary mt-6 inline-flex">
                  Back to login
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // No token — show "check your inbox"
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <MailCheck className="h-7 w-7 text-emerald-600" />
          </div>

          <h1 className="text-2xl font-extrabold text-gray-900">
            Check your inbox
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            We sent a sign-in link to{" "}
            <span className="font-semibold text-gray-900">{email}</span>
            . Click the link in the email to continue.
          </p>

          <div className="mt-6 rounded-xl bg-brand-50 p-4">
            <p className="text-xs text-brand-700 leading-relaxed">
              <span className="font-semibold">Can't find it?</span> Check your
              spam folder. The link expires in 15 minutes.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleResend}
              disabled={resent}
              className="btn-secondary w-full justify-center py-2.5 text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${resent ? "animate-spin" : ""}`} />
              {resent ? "Link resent!" : "Resend link"}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Use a different email
            </Link>
          </div>
        </div>

        {/* Dev shortcut - remove in production */}
        <div className="mt-4 card p-4 border-dashed">
          <p className="text-xs font-semibold text-gray-500 text-center mb-2">
            DEV SHORTCUT
          </p>
          <div className="flex gap-2">
            <Link
              href="/onboarding"
              className="flex-1 rounded-lg bg-gray-100 py-2 text-center text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Go to Onboarding
            </Link>
            <Link
              href="/dashboard"
              className="flex-1 rounded-lg bg-brand-100 py-2 text-center text-xs font-medium text-brand-700 hover:bg-brand-200 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex h-16 items-center px-6 border-b border-gray-100 bg-white">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">
            LocalPulse
          </span>
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            AI
          </span>
        </Link>
      </header>
      <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" /></div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
