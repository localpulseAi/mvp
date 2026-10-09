"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare } from "lucide-react";
import type { SessionSummary } from "@/lib/api";
import { PipImg } from "./viz";

const PROMPTS = ["Should I run a discount?", "Plan for the festival", "Respond to a rival's offer"];

function ago(iso: string) {
  const d = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  return d === 0 ? "today" : d === 1 ? "yesterday" : `${d}d ago`;
}

/** Strategy-session entry point: Pip, one-tap prompts, and the last couple of sessions. */
export function AskPip({ sessions, sessionsError }: { sessions: SessionSummary[] | null; sessionsError?: string }) {
  return (
    <section className="card-ink relative overflow-hidden p-4 sm:p-5" aria-labelledby="askpip-title">
      <div aria-hidden="true" className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-600/40 blur-3xl" />
      <div className="relative flex items-center gap-3">
        <motion.div animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}>
          <PipImg pose="think" size={64} />
        </motion.div>
        <div>
          <h2 id="askpip-title" className="font-display text-lg font-semibold">
            Stuck on a decision?
          </h2>
          <p className="text-xs text-white/60">Ask Pip. Tap one to start.</p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {PROMPTS.map((p, i) => (
          <motion.div key={p} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07 }}>
            <Link
              href={`/session?q=${encodeURIComponent(p)}`}
              className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 transition-colors hover:bg-lime-300 hover:text-ink"
            >
              {p}
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="relative mt-4 border-t border-white/10 pt-3">
        {sessionsError ? (
          <p className="text-xs text-white/60">Recent sessions unavailable.</p>
        ) : sessions && sessions.length > 0 ? (
          <ul className="space-y-1">
            {sessions.slice(0, 2).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/session?id=${s.id}`}
                  className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-white/5"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-lime-300" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-white/85">{s.original_question}</span>
                  <span className="shrink-0 text-white/40">{ago(s.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-white/60">No sessions yet.</p>
        )}
        <Link href="/session" className="mt-2 inline-flex items-center gap-1 px-2 text-xs font-semibold text-lime-300 hover:underline">
          Open strategy session <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </section>
  );
}
