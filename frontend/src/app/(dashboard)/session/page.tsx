"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ChevronRight, History, Loader2, PanelLeftClose, PanelLeftOpen, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { addFollowup, getSession, listSessions, startSession, type SessionSummary } from "@/lib/api";
import { errorMessage, useWorkspaceData } from "@/lib/workspace";
import { demoSampleReply, demoSessionDetail } from "@/lib/demo-workspace";
import { DemoBanner } from "@/components/ui/states";
import { SessionHistory } from "@/components/session/SessionHistory";
import { MessageList, type Message } from "@/components/session/MessageList";

/** One set of intent-based starters, shown only in the empty conversation. */
const STARTERS = [
  "Should I discount to fill quiet weekdays?",
  "How should I respond to a competitor's price cut?",
  "What should I do for an upcoming local event?",
  "Is now a good time to launch a new menu item?",
];

const demoHistory: SessionSummary[] = [demoSessionDetail];

function turnsToMessages(detail: typeof demoSessionDetail, sample = false): Message[] {
  return detail.turns.flatMap((t): Message[] => [
    { id: `${detail.id}-q${t.turn_number}`, role: "user", text: t.question },
    ...(t.strategist_output
      ? [{ id: `${detail.id}-a${t.turn_number}`, role: "assistant" as const, kind: "strategy" as const, output: t.strategist_output, sample }]
      : []),
  ]);
}

const uid = () => Math.random().toString(36).slice(2);

export default function SessionPage() {
  const { state, reload } = useWorkspaceData(() => listSessions().then((r) => r.sessions), demoHistory);
  const isDemo = state.status === "ready" && state.mode === "demo";

  const [extraSessions, setExtraSessions] = useState<SessionSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false); // mobile overlay
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyToggle = useRef<HTMLButtonElement>(null);

  const sessions = state.status === "ready" ? [...extraSessions, ...state.data] : null;

  // Demo: open the sample exchange. Live: open ?id= if linked from the dashboard.
  useEffect(() => {
    if (state.status !== "ready") return;
    if (state.mode === "demo") {
      setActiveId(demoSessionDetail.id);
      setMessages(turnsToMessages(demoSessionDetail, true));
      return;
    }
    const id = new URLSearchParams(window.location.search).get("id");
    if (id) openSession(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  useEffect(() => {
    if (!historyOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeOverlay();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen]);

  function closeOverlay() {
    setHistoryOpen(false);
    historyToggle.current?.focus();
  }

  async function openSession(id: string) {
    setHistoryOpen(false);
    setActiveId(id);
    if (isDemo) {
      setMessages(turnsToMessages(demoSessionDetail, true));
      return;
    }
    setLoadingSession(true);
    try {
      const data = await getSession(id);
      setMessages(turnsToMessages(data.session));
    } catch (err) {
      setMessages([{ id: uid(), role: "error", text: errorMessage(err), question: "" }]);
    } finally {
      setLoadingSession(false);
    }
  }

  function startNew() {
    setHistoryOpen(false);
    setMessages([]);
    setActiveId(null);
    inputRef.current?.focus();
  }

  async function ask(question: string) {
    if (!question.trim() || thinking) return;
    setInput("");
    setMessages((prev) => [...prev.filter((m) => m.role !== "error"), { id: uid(), role: "user", text: question }]);
    setThinking(true);

    if (isDemo) {
      // No network call in the demo: a short, honest pause, then the fixed sample.
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: uid(), role: "assistant", kind: "strategy", output: demoSampleReply, sample: true }]);
        setThinking(false);
      }, 300);
      return;
    }

    try {
      if (activeId) {
        const data = await addFollowup(activeId, question);
        if (data.turn?.strategist_output) {
          const output = data.turn.strategist_output;
          setMessages((prev) => [...prev, { id: uid(), role: "assistant", kind: "strategy", output }]);
        }
      } else {
        const data = await startSession(question);
        setActiveId(data.session_id);
        if (data.status === "needs_clarification" && data.clarifying_question) {
          const text = data.clarifying_question;
          setMessages((prev) => [...prev, { id: uid(), role: "assistant", kind: "text", text }]);
        } else if (data.turn?.strategist_output) {
          const output = data.turn.strategist_output;
          setMessages((prev) => [...prev, { id: uid(), role: "assistant", kind: "strategy", output }]);
        }
        setExtraSessions((prev) => [
          { id: data.session_id, status: data.status, original_question: question, parsed_type: null, turn_count: 1, total_cost_cents: 0, created_at: new Date().toISOString() },
          ...prev,
        ]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { id: uid(), role: "error", text: errorMessage(err), question }]);
    } finally {
      setThinking(false);
    }
  }

  const historyProps = {
    sessions,
    error: state.status === "error" ? state.error : null,
    activeSessionId: activeId,
    onNew: startNew,
    onSelect: openSession,
    onRetry: reload,
  };

  const firstQuestion = messages.find((m) => m.role === "user");

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex h-[calc(100dvh-3.5rem)] lg:h-screen">
        {/* History — tablet/desktop, collapsible */}
        {!historyCollapsed && (
          <aside className="hidden w-64 shrink-0 border-r border-gray-200/70 md:block" aria-label="Session history">
            <SessionHistory {...historyProps} />
          </aside>
        )}

        {/* History — phone overlay */}
        <AnimatePresence>
          {historyOpen && (
            <>
              <motion.div
                className="absolute inset-0 z-20 bg-ink/30 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeOverlay}
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Session history"
                className="absolute inset-y-0 left-0 z-30 w-72 max-w-[85vw] shadow-lift md:hidden"
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: "easeOut" as const }}
              >
                <SessionHistory {...historyProps} onClose={closeOverlay} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Conversation */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 shrink-0 items-center gap-2 border-b border-gray-200/70 bg-white px-4 sm:px-6">
            <button
              ref={historyToggle}
              onClick={() => setHistoryOpen(true)}
              className="btn-ghost -ml-2 p-2 md:hidden"
              aria-label="Open session history"
              aria-expanded={historyOpen}
            >
              <History className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setHistoryCollapsed((v) => !v)}
              className="btn-ghost -ml-2 hidden p-2 md:inline-flex"
              aria-label={historyCollapsed ? "Show session history" : "Hide session history"}
              aria-expanded={!historyCollapsed}
            >
              {historyCollapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden="true" /> : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />}
            </button>
            <h1 className="shrink-0 font-display text-sm font-semibold text-ink">Strategy session</h1>
            {firstQuestion && firstQuestion.role === "user" && (
              <>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden="true" />
                <span className="truncate text-sm text-gray-500">{firstQuestion.text}</span>
              </>
            )}
          </div>

          {isDemo && <DemoBanner what="a sample strategy session" className="m-3 shrink-0 rounded-xl py-2.5 sm:mx-6" />}

          <div className="flex-1 overflow-y-auto">
            {state.status === "loading" || loadingSession ? (
              <div className="flex h-full items-center justify-center" role="status">
                <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
                <span className="sr-only">Loading</span>
              </div>
            ) : messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" as const }}
                className="flex min-h-full flex-col items-center justify-center px-4 py-10 text-center sm:px-8"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-violet">
                  <Sparkles className="h-7 w-7 text-lime-300" aria-hidden="true" />
                </span>
                <h2 className="mt-5 font-display text-2xl font-semibold text-ink">What&apos;s your next move?</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                  Ask about a real decision. You&apos;ll get a recommendation, the reasoning, alternatives, and what to watch.
                </p>
                <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {STARTERS.map((q) => (
                    <button
                      key={q}
                      onClick={() => ask(q)}
                      className="card-hover flex items-center justify-between gap-3 p-4 text-left text-sm font-medium text-ink"
                    >
                      {q}
                      <ChevronRight className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <>
                <MessageList messages={messages} thinking={thinking} onRetry={(q) => ask(q)} />
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Composer — anchored */}
          <div className="shrink-0 border-t border-gray-200/70 bg-white px-4 py-3 sm:px-6 sm:py-4">
            <form
              className="mx-auto max-w-3xl"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input.trim());
              }}
            >
              <div className="flex items-end gap-3 rounded-2xl border border-gray-300 bg-white p-2.5 pl-4 shadow-sm transition-all focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/15">
                <label htmlFor="session-question" className="sr-only">
                  {activeId ? "Ask a follow-up question" : "Ask a strategic question"}
                </label>
                <textarea
                  id="session-question"
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      ask(input.trim());
                    }
                  }}
                  placeholder={activeId ? "Ask a follow-up…" : "Ask a strategic question about your business…"}
                  aria-describedby="composer-note"
                  className="max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-base text-ink placeholder-gray-400 focus:outline-none sm:text-sm"
                  disabled={thinking || state.status !== "ready"}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || thinking}
                  aria-label="Send question"
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-control transition-colors duration-150",
                    input.trim() && !thinking
                      ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                      : "cursor-not-allowed bg-gray-100 text-gray-400"
                  )}
                >
                  {thinking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <p id="composer-note" className="mt-2 text-center text-[11px] text-gray-500">
                {isDemo
                  ? "Demo workspace: nothing is sent. You'll see a fixed sample answer."
                  : "Your question and business profile are sent to Agenzy's analysts. Answers are drafts for your review."}
              </p>
            </form>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
