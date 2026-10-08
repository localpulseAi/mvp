"use client";

import { MessageSquare, Plus } from "lucide-react";
import type { SessionSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SessionHistoryProps {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  showStarters: boolean;
  starters: string[];
  onNew: () => void;
  onSelect: (id: string) => void;
  onStarter: (q: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

export function SessionHistory({
  sessions,
  activeSessionId,
  showStarters,
  starters,
  onNew,
  onSelect,
  onStarter,
}: SessionHistoryProps) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-3.5">
        <h2 className="section-title text-sm">Sessions</h2>
        <button onClick={onNew} className="btn-ghost px-2.5 py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {showStarters && (
          <div className="mb-4 space-y-0.5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              Try asking
            </p>
            {starters.map((q) => (
              <button
                key={q}
                onClick={() => onStarter(q)}
                className="w-full rounded-control px-3 py-2.5 text-left text-xs leading-snug text-gray-600 transition-colors hover:bg-gray-100 hover:text-ink"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {sessions.length > 0 && (
          <>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              History
            </p>
            {sessions.map((s) => {
              const active = activeSessionId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-control px-3 py-2.5 text-left transition-colors",
                    active ? "bg-lilac text-brand-700" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <MessageSquare
                    className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", active ? "text-brand-600" : "text-gray-400")}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium leading-snug">{s.original_question}</p>
                    <p className="tabular mt-0.5 text-[11px] text-gray-400">{formatDate(s.created_at)}</p>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      <div className="border-t border-gray-200/70 px-4 py-3">
        <p className="text-[11px] text-gray-500">
          <span className="tabular font-semibold text-ink">{sessions.length}</span> sessions this month
        </p>
      </div>
    </div>
  );
}
