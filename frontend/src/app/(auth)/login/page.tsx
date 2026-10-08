"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Mail, MailCheck, ArrowRight, Loader2, RefreshCw, CloudOff, AlertCircle } from "lucide-react";
import { ApiError, requestMagicLink } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthHelp, PrototypeNote, authCardClass } from "@/components/auth/AuthNotes";
import { useCooldown } from "@/components/auth/useCooldown";
import { EMAIL_PATTERN, LINK_EXPIRY_MINUTES, RESEND_COOLDOWN_SECONDS } from "@/components/auth/authConfig";

type Status = "idle" | "sending" | "sent" | "unavailable" | "failed";

export default function LoginPage() {
  const reduced = useReducedMotion();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [resendNote, setResendNote] = useState("");
  const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS);

  const trimmed = email.trim();
  const sending = status === "sending";

  async function send(isResend = false) {
    setStatus("sending");
    setResendNote("");
    try {
      await requestMagicLink(trimmed);
      setStatus("sent");
      cooldown.start();
      if (isResend) setResendNote("Another link has been requested.");
    } catch (err) {
      setStatus(err instanceof ApiError && err.kind === "unavailable" ? "unavailable" : "failed");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (!trimmed) {
      setFieldError("Enter your email address.");
      emailRef.current?.focus();
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setFieldError("That doesn't look like an email address. Check for typos, e.g. name@business.com.");
      emailRef.current?.focus();
      return;
    }
    setFieldError("");
    send();
  }

  function changeEmail() {
    setStatus("idle");
    setResendNote("");
    requestAnimationFrame(() => emailRef.current?.focus());
  }

  const enter = {
    initial: reduced ? false : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit: reduced ? undefined : { opacity: 0, y: -6 },
    transition: { duration: reduced ? 0 : 0.25, ease: "easeOut" as const },
  };

  return (
    <AuthShell>
      <motion.div {...enter}>
        <div className={authCardClass}>
          {/* Screen-reader status for every transition */}
          <p className="sr-only" role="status" aria-live="polite">
            {sending ? "Sending your sign-in link." : status === "sent" ? "Sign-in link requested." : ""}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {status === "sent" ? (
              <motion.div key="sent" {...enter}>
                <div className="mb-6 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-lime-300">
                  <MailCheck className="h-6 w-6 text-ink" aria-hidden="true" />
                </div>
                <p className="eyebrow">Check your inbox</p>
                <h1 className="mt-2 font-display text-[28px] font-semibold leading-9 text-ink">
                  If that email can sign in, a link is on its way
                </h1>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  We sent the request for <span className="break-all font-semibold text-ink">{trimmed}</span>.
                  The link works once and expires in {LINK_EXPIRY_MINUTES} minutes. Check your spam folder too.
                </p>

                <div className="mt-7 space-y-3">
                  <button
                    type="button"
                    onClick={() => send(true)}
                    disabled={cooldown.remaining > 0}
                    className="btn-secondary w-full py-3"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {cooldown.remaining > 0 ? `Resend available in ${cooldown.remaining}s` : "Resend link"}
                  </button>
                  <button type="button" onClick={changeEmail} className="btn-ghost w-full">
                    Use a different email
                  </button>
                </div>
                <p className="mt-3 min-h-[1.25rem] text-center text-xs text-gray-500" aria-live="polite">
                  {resendNote}
                </p>
              </motion.div>
            ) : (
              <motion.div key="form" {...enter}>
                <div className="mb-6 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-lilac">
                  <Mail className="h-6 w-6 text-brand-600" aria-hidden="true" />
                </div>
                <p className="eyebrow">Sign in</p>
                <h1 className="mt-2 font-display text-[28px] font-semibold leading-9 text-ink">Welcome back</h1>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Enter your email and we&apos;ll send you a sign-in link. No password needed.
                </p>

                <form onSubmit={handleSubmit} className="mt-8" noValidate aria-busy={sending}>
                  <label htmlFor="email" className="label">
                    Email address
                  </label>
                  <input
                    ref={emailRef}
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@yourbusiness.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldError("");
                      if (status === "failed" || status === "unavailable") setStatus("idle");
                    }}
                    readOnly={sending}
                    className="input py-3 text-base sm:text-sm"
                    aria-invalid={!!fieldError}
                    aria-describedby={fieldError ? "email-error" : undefined}
                  />
                  {fieldError && (
                    <p id="email-error" className="mt-2 flex items-start gap-1.5 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {fieldError}
                    </p>
                  )}

                  <button type="submit" disabled={sending} className="btn-primary mt-5 w-full py-3">
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Sending your link…
                      </>
                    ) : (
                      <>
                        Send magic link
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </form>

                {status === "unavailable" && (
                  <div role="alert" className="mt-5 rounded-control border border-gray-200 bg-canvas p-4">
                    <p className="flex items-start gap-2 text-sm font-semibold text-ink">
                      <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                      Sign-in isn&apos;t available in this public prototype
                    </p>
                    <p className="mt-1 pl-6 text-sm leading-6 text-gray-600">
                      No email was sent. You can explore everything with a fictional workspace instead.
                    </p>
                    <Link href="/dashboard" className="btn-primary ml-6 mt-3">
                      Explore the demo
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                )}

                {status === "failed" && (
                  <div role="alert" className="mt-5 rounded-control bg-red-50 p-4">
                    <p className="flex items-start gap-2 text-sm font-semibold text-red-800">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      We couldn&apos;t send the link
                    </p>
                    <p className="mt-1 pl-6 text-sm leading-6 text-red-800/80">
                      Please try again in a moment. If it keeps happening, contact support below.
                    </p>
                    <button type="button" onClick={() => send()} className="btn-secondary ml-6 mt-3">
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      Try again
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <PrototypeNote />
        </div>

        <AuthHelp />
      </motion.div>
    </AuthShell>
  );
}
