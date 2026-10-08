"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Send, Loader2, ChevronRight, History, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  listSessions,
  getSession,
  startSession,
  addFollowup,
  type SessionSummary,
} from "@/lib/api";
import {
  StrategyCard,
  ThinkingIndicator,
  StrategistAvatar,
  mapStrategistOutput,
  type StrategyOutput,
} from "@/components/session/StrategyCard";
import { SessionHistory } from "@/components/session/SessionHistory";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string | StrategyOutput;
  timestamp: Date;
};

const STARTER_QUESTIONS = [
  "Should I run a 30% off lunch promo for two weeks?",
  "What should I do with my marketing for Stampede?",
  "Is now the right time to launch a brunch menu?",
  "Should I sponsor the Flames playoff game?",
  "How should I respond to a competitor's aggressive pricing?",
];

export default function SessionPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listSessions()
      .then((data) => setSessions(data.sessions))
      .catch(() => null);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  async function loadSessionMessages(sessionId: string) {
    setHistoryOpen(false);
    setLoadingSession(true);
    setActiveSessionId(sessionId);
    try {
      const data = await getSession(sessionId);
      const msgs: Message[] = [];
      for (const turn of data.session.turns) {
        msgs.push({
          id: `user-${turn.turn_number}`,
          role: "user",
          content: turn.question,
          timestamp: new Date(data.session.created_at),
        });
        if (turn.strategist_output) {
          msgs.push({
            id: `ai-${turn.turn_number}`,
            role: "assistant",
            content: mapStrategistOutput(turn.strategist_output),
            timestamp: new Date(data.session.created_at),
          });
        }
      }
      setMessages(msgs);
    } catch {
      null;
    } finally {
      setLoadingSession(false);
    }
  }

  function startNew() {
    setHistoryOpen(false);
    setMessages([]);
    setActiveSessionId(null);
  }

  function applyStarter(q: string) {
    setHistoryOpen(false);
    setInput(q);
    inputRef.current?.focus();
  }

  async function handleSend() {
    if (!input.trim() || isThinking) return;
    const question = input.trim();
    setInput("");

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      if (activeSessionId) {
        // Follow-up — Strategist only
        const data = await addFollowup(activeSessionId, question);
        if (data.turn?.strategist_output) {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: mapStrategistOutput(data.turn.strategist_output),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
        }
      } else {
        // New session — full 6-agent pipeline
        const data = await startSession(question);
        setActiveSessionId(data.session_id);

        if (data.status === "needs_clarification" && data.clarifying_question) {
          const clarifyMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.clarifying_question,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, clarifyMsg]);
        } else if (data.turn?.strategist_output) {
          const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: mapStrategistOutput(data.turn.strategist_output),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          // Prepend new session to history list
          setSessions((prev) => [
            {
              id: data.session_id,
              status: "completed",
              original_question: question,
              parsed_type: null,
              turn_count: 1,
              total_cost_cents: data.turn?.cost_cents ?? 0,
              created_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      }
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: err instanceof Error ? `Error: ${err.message}` : "Something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  }

  const historyProps = {
    sessions,
    activeSessionId,
    showStarters: messages.length === 0 && !activeSessionId,
    starters: STARTER_QUESTIONS,
    onNew: startNew,
    onSelect: loadSessionMessages,
    onStarter: applyStarter,
  };

  return (
    <div className="relative flex h-[calc(100dvh-3.5rem)] lg:h-screen">
      {/* Session history — desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200/70 md:block">
        <SessionHistory {...historyProps} />
      </aside>

      {/* Session history — mobile overlay */}
      <AnimatePresence>
        {historyOpen && (
          <>
            <motion.div
              className="absolute inset-0 z-20 bg-ink/30 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setHistoryOpen(false)}
            />
            <motion.aside
              className="absolute inset-y-0 left-0 z-30 w-72 max-w-[85vw] shadow-lift md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
            >
              <button
                onClick={() => setHistoryOpen(false)}
                className="btn-ghost absolute right-12 top-2 z-10 p-2"
                aria-label="Close history"
              >
                <X className="h-4 w-4" />
              </button>
              <SessionHistory {...historyProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200/70 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setHistoryOpen(true)}
              className="btn-ghost -ml-2 p-2 md:hidden"
              aria-label="Open session history"
            >
              <History className="h-4 w-4" />
            </button>
            <h1 className="shrink-0 font-display text-sm font-semibold text-ink">Strategy session</h1>
            {activeSessionId && messages.length > 0 && (
              <>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                <span className="truncate text-sm text-gray-500">
                  {(messages[0]?.content as string) ?? "Session"}
                </span>
              </>
            )}
          </div>
          <Badge variant="outline" className="shrink-0">Prototype</Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {loadingSession ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" as const }}
              className="flex min-h-full flex-col items-center justify-center px-4 py-10 text-center sm:px-8"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-violet">
                <Sparkles className="h-7 w-7 text-lime-300" />
              </span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
                What&apos;s your next move?
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                This prototype demonstrates the planned decision workflow. Once configured, Claude is
                intended to analyse selected evidence and draft a recommendation for human review; this
                demo does not promise a response time or live analysis.
              </p>
              <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
                {STARTER_QUESTIONS.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    onClick={() => applyStarter(q)}
                    className="card-hover flex flex-col items-start justify-between gap-3 p-4 text-left text-sm text-gray-700"
                  >
                    {q}
                    <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
                      Ask this <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:max-w-md">
                        {msg.content as string}
                      </div>
                    </div>
                  ) : typeof msg.content === "string" ? (
                    <div className="flex gap-3">
                      <StrategistAvatar />
                      <div className="rounded-2xl rounded-tl-md border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <StrategistAvatar />
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-display text-sm font-semibold text-ink">Agenzy Strategist</span>
                          <Badge variant="brand" className="text-[10px]">Draft for review</Badge>
                        </div>
                        <StrategyCard output={msg.content as StrategyOutput} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-3">
                  <StrategistAvatar busy />
                  <ThinkingIndicator />
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t border-gray-200/70 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-2xl border border-gray-300 bg-white p-2.5 pl-4 shadow-sm transition-all focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-600/15">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a strategic question about your business…"
                aria-label="Strategic question"
                className="flex-1 resize-none bg-transparent py-1.5 text-base text-ink placeholder-gray-400 focus:outline-none sm:text-sm"
                disabled={isThinking}
                style={{ maxHeight: "120px" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                aria-label="Send question"
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-control transition-all",
                  input.trim() && !isThinking
                    ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                    : "cursor-not-allowed bg-gray-100 text-gray-400"
                )}
              >
                {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 hidden text-center text-[11px] text-gray-400 sm:block">
              Follow-ups keep the session context · Recommendations are drafts for your review
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
