"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { requestMagicLink } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await requestMagicLink(email);
      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" as const }}
      >
        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-control bg-lilac">
            <Mail className="h-6 w-6 text-brand-600" />
          </div>

          <p className="eyebrow">Sign in</p>
          <h1 className="mt-2 font-display text-[28px] font-semibold leading-9 text-ink">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Enter your email and we&apos;ll send you a sign-in link. No password needed.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@yourbusiness.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="input"
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : undefined}
              />
              {error && (
                <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {error}
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending link…
                </>
              ) : (
                <>
                  Send magic link
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex gap-3 rounded-control bg-gray-100 p-4">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p className="text-xs leading-5 text-gray-600">
              By continuing, you agree to our Privacy Policy. We will never sell your data.
              This is an Agenzy prototype demo; pilot access and launch timing have not been
              announced.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Want to look around first?{" "}
          <Link
            href="/dashboard"
            className="font-semibold text-brand-600 underline-offset-2 hover:text-brand-700 hover:underline"
          >
            View the demo
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-gray-500">
          Trouble signing in?{" "}
          <a
            href="mailto:hello@agenzy.online"
            className="font-semibold text-brand-600 underline-offset-2 hover:text-brand-700 hover:underline"
          >
            hello@agenzy.online
          </a>
        </p>
      </motion.div>
    </AuthShell>
  );
}
