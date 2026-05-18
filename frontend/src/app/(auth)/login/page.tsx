"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, ArrowRight, Loader2 } from "lucide-react";
import { requestMagicLink } from "@/lib/api";

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <header className="flex h-16 items-center px-6 border-b border-gray-100 bg-white">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
            <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">LocalPulse</span>
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">AI</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="card p-8">
            {/* Icon */}
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-md">
              <Mail className="h-6 w-6 text-white" />
            </div>

            <h1 className="text-center text-2xl font-extrabold text-gray-900">
              Welcome back
            </h1>
            <p className="mt-2 text-center text-sm text-gray-500">
              Enter your email and we'll send you a sign-in link. No password needed.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@yourrestaurant.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="input"
                  disabled={loading}
                />
                {error && (
                  <p className="mt-1.5 text-xs text-red-600">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-amber w-full justify-center py-3 text-sm"
              >
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

            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                By continuing, you agree to our Privacy Policy. We will never
                sell your data. LocalPulse is in founding-member pilot — access
                is by application only.
              </p>
            </div>
          </div>

          {/* Demo shortcut */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Want to see the dashboard first?{" "}
              <Link
                href="/dashboard"
                className="font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2"
              >
                View demo
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
