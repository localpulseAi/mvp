"use client";

import { AlertCircle, MessageSquare, Plus, X } from "lucide-react";
import type { SessionSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SessionHistoryProps {
  /** null while loading */
  sessions: SessionSummary[] | null;
  error: string | null;
  activeSessionId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRetry: () => void;
  onClose?: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function SessionHistory({ sessions, error, activeSessionId, onNew, onSelect, onRetry, onClose }: SessionHistoryProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200/70 px-4 py-3">
        <h2 id="history-title" className="section-title text-sm">Past sessions</h2>
        <div className="flex items-center gap-1">
          <button onClick={onNew} className="btn-ghost px-2.5 py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-ghost p-2" aria-label="Close session history">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {error ? (
          <div role="alert" className="px-3 py-2 text-sm">
            <p className="flex items-start gap-2 text-gray-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              Couldn&apos;t load past sessions.
            </p>
            <button onClick={onRetry} className="mt-2 pl-6 text-sm font-semibold text-brand-700 hover:underline">
              Try again
            </button>
          </div>
        ) : sessions === null ? (
          <p className="px-3 py-2 text-xs text-gray-500" role="status">Loading…</p>
        ) : sessions.length === 0 ? (
          <p className="px-3 py-2 text-xs leading-relaxed text-gray-500">
            Your sessions will appear here after you ask your first question.
          </p>
        ) : (
          <ul aria-labelledby="history-title" className="space-y-0.5">
            {sessions.map((s) => {
              const active = activeSessionId === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => onSelect(s.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-control px-3 py-2.5 text-left transition-colors",
                      active ? "bg-lilac text-brand-700" : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <MessageSquare
                      className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", active ? "text-brand-600" : "text-gray-400")}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-xs font-medium leading-snug">{s.original_question}</span>
                      <span className="tabular mt-0.5 block text-[11px] text-gray-400">
                        {formatDate(s.created_at)} · {s.turn_count} turn{s.turn_count !== 1 ? "s" : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
