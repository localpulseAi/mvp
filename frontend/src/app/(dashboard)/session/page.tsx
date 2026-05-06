"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Zap,
  ChevronRight,
  Clock,
  Plus,
  ArrowUpRight,
  BookOpen,
  TrendingUp,
  Eye,
  Users,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

type MessageRole = "user" | "assistant" | "thinking";

type Message = {
  id: string;
  role: MessageRole;
  content: string | StrategyOutput;
  timestamp: Date;
};

type StrategyOutput = {
  type: "strategy";
  restatement: string;
  context: string;
  analysis: string;
  recommendation: string;
  recommendationReasoning: string;
  alternatives: { label: string; desc: string }[];
  watchFor: string[];
  agents: { name: string; status: "done" | "partial" }[];
};

const pastSessions = [
  {
    id: "1",
    question: "Should I run a 30% off lunch promo for two weeks?",
    date: "May 1",
    active: true,
  },
  {
    id: "2",
    question: "Is now the right time to launch a brunch menu?",
    date: "Apr 24",
  },
  {
    id: "3",
    question: "What should I do with my marketing for Stampede?",
    date: "Apr 18",
  },
];

const SAMPLE_RESPONSE: StrategyOutput = {
  type: "strategy",
  restatement:
    "You're asking whether to run a 30% discount across your lunch menu for two consecutive weeks, likely to drive midday traffic and potentially acquire new customers.",
  context:
    "Three of your five tracked competitors — Wurst, The Main Dish, and OEB Breakfast Co. — have run lunch promotions in the last 10 days. Calgary lunch demand is currently running 8–12% below seasonal norms following the long weekend, with recovery expected by Wednesday. Mother's Day is 7 days out, which typically pulls discretionary dining spend toward dinner/brunch rather than weekday lunch.",
  analysis:
    "A 30% discount at your gross margin band and current lunch covers-per-service puts you in a position where you'd need a 35–40% volume lift to hold net revenue flat. That's a demanding requirement against current demand levels. More concerning: your five tracked competitors already contain three lunch promotions running simultaneously. A fourth offer in the same neighbourhood doesn't differentiate — it adds to a promo cluster that trains customers to expect discounts rather than building new loyalty. The timing also runs directly into your strongest revenue window of the year (Mother's Day → Victoria Day → Stampede build), when discounting reduces the margin available to fund any of those campaigns.",
  recommendation:
    "Don't run the 30% discount this week or next. The math is tight, the competitive timing is poor, and the margin you'd burn is better preserved for Mother's Day activation.",
  recommendationReasoning:
    "The three-competitor promo cluster reduces the differentiation value of any fourth discount to near zero. Your discount would have to be either deeper (further compressing margin) or louder (requiring media spend) to stand out — both of which worsen the economics.",
  alternatives: [
    {
      label: "Value-add instead of discount",
      desc: "A free dessert with any lunch entrée or complimentary coffee protects your margin (cost ~$2–4 per cover) while creating a differentiated offer that doesn't signal price-based competition. This also doesn't create the promo expectation that a % discount creates.",
    },
    {
      label: "Targeted slow-day offer",
      desc: "If lunch volume is the specific problem, a Monday–Tuesday lunch special (your softest days) limits margin exposure to the days where you actually need volume support, and doesn't compress margin on Thursday–Friday where your baseline is stronger.",
    },
    {
      label: "Wait until post-Stampede",
      desc: "If the goal is customer acquisition rather than immediate volume, a September promotion — after Stampede demand normalises and competitors have exhausted their promo energy — has a cleaner competitive landscape and a customer base that's ready to establish new habits.",
    },
  ],
  watchFor: [
    "If two or more competitors drop their current promos in the next 7 days without extending them, the saturation concern eases and the case for a targeted offer improves.",
    "If your Monday–Tuesday lunch covers run more than 20% below your recent baseline, that's a signal that a targeted slow-day offer makes sense even with the current competitive context.",
    "If Mother's Day reservation uptake is strong this week, that validates holding off — your dining room's demand problem is a weekday structural issue, not an audience awareness problem.",
  ],
  agents: [
    { name: "Market Analyst", status: "done" },
    { name: "Competitor Analyst", status: "done" },
    { name: "Brand & Positioning", status: "done" },
    { name: "Timing Analyst", status: "done" },
    { name: "Financial Sense-Check", status: "done" },
    { name: "Risk Analyst", status: "done" },
  ],
};

const STARTER_QUESTIONS = [
  "Should I run a 30% off lunch promo for two weeks?",
  "What should I do with my marketing for Stampede?",
  "Is now the right time to launch a brunch menu?",
  "Should I sponsor the Flames playoff game?",
  "How should I respond to a competitor's aggressive pricing?",
];

function StrategyCard({ output }: { output: StrategyOutput }) {
  const [tab, setTab] = useState<"recommendation" | "alternatives" | "watchfor">(
    "recommendation"
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Agent run info */}
      <div className="flex flex-wrap gap-1.5">
        {output.agents.map((agent) => (
          <span
            key={agent.name}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
          >
            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
            {agent.name}
          </span>
        ))}
      </div>

      {/* Restatement */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
          What you're asking
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">{output.restatement}</p>
      </div>

      {/* Context */}
      <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-brand-600" />
          <p className="text-xs font-semibold text-brand-700">Strategic context</p>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{output.context}</p>
      </div>

      {/* Analysis */}
      <div className="p-4 border border-gray-200 rounded-xl">
        <div className="flex items-center gap-1.5 mb-2">
          <BookOpen className="h-3.5 w-3.5 text-gray-500" />
          <p className="text-xs font-semibold text-gray-600">The analysis</p>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{output.analysis}</p>
      </div>

      {/* Tabs: recommendation / alternatives / watch for */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(
            [
              { id: "recommendation", label: "Recommendation", icon: Zap },
              { id: "alternatives", label: "Alternatives", icon: ArrowUpRight },
              { id: "watchfor", label: "Watch for", icon: Eye },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-all border-b-2",
                tab === id
                  ? "border-brand-600 text-brand-700 bg-brand-50/50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "recommendation" && (
            <div>
              <p className="text-sm font-bold text-gray-900 leading-snug">
                {output.recommendation}
              </p>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                {output.recommendationReasoning}
              </p>
            </div>
          )}
          {tab === "alternatives" && (
            <div className="space-y-4">
              {output.alternatives.map((alt, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{alt.label}</p>
                    <p className="mt-1 text-sm text-gray-700 leading-relaxed">{alt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "watchfor" && (
            <ul className="space-y-3">
              {output.watchFor.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
      <span className="text-xs">Strategist is thinking…</span>
    </div>
  );
}

export default function SessionPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "u1",
      role: "user",
      content: "Should I run a 30% off lunch promo for two weeks?",
      timestamp: new Date("2026-05-01T14:30:00"),
    },
    {
      id: "a1",
      role: "assistant",
      content: SAMPLE_RESPONSE,
      timestamp: new Date("2026-05-01T14:30:38"),
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeSession, setActiveSession] = useState("1");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

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

    // Simulate agent run
    await new Promise((r) => setTimeout(r, 3500));
    setIsThinking(false);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: {
        ...SAMPLE_RESPONSE,
        restatement: `You're asking about: "${question}"`,
      },
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
  }

  return (
    <div className="flex h-screen">
      {/* Session history sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-gray-900">Sessions</span>
          </div>
          <button
            onClick={() => {
              setMessages([]);
              setActiveSession("");
            }}
            className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {/* Starter questions */}
          {messages.length === 0 && (
            <div className="space-y-1 mb-4">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Try asking…
              </p>
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Session history */}
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            History
          </p>
          {pastSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s.id)}
              className={cn(
                "flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left transition-all",
                activeSession === s.id
                  ? "bg-amber-50 text-amber-700"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <MessageSquare
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                  activeSession === s.id ? "text-amber-600" : "text-gray-400"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-snug line-clamp-2">
                  {s.question}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400">{s.date}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Cost indicator */}
        <div className="border-t border-gray-100 px-4 py-3">
          <p className="text-[10px] text-gray-400">
            <span className="font-semibold text-gray-600">3</span> sessions this month ·{" "}
            <span className="font-semibold text-gray-600">Unlimited</span> plan
          </p>
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex h-14 items-center justify-between border-b border-gray-100 bg-white px-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-semibold text-gray-900">Strategy Session</span>
            {activeSession && (
              <>
                <ChevronRight className="h-4 w-4 text-gray-300" />
                <span className="text-sm text-gray-500 truncate max-w-xs">
                  {pastSessions.find((s) => s.id === activeSession)?.question ?? "New session"}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              &lt;45s first response
            </div>
            <Badge variant="green" dot>Live</Badge>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
                <MessageSquare className="h-7 w-7 text-brand-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Ask the strategist</h2>
              <p className="mt-2 max-w-sm text-sm text-gray-500 leading-relaxed">
                Bring a strategic question about your restaurant. You'll get a
                full analysis with market context, a recommendation with
                reasoning, and alternatives — in under 45 seconds.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-md">
                {STARTER_QUESTIONS.slice(0, 3).map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="card-hover flex items-center justify-between px-4 py-3 text-sm text-gray-700 text-left"
                  >
                    {q}
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-6 p-6">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-md rounded-2xl rounded-tr-md bg-brand-600 px-4 py-3 text-sm text-white leading-relaxed shadow-sm">
                        {msg.content as string}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 shadow-sm">
                        <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-900">
                            LocalPulse Strategist
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {msg.timestamp.toLocaleTimeString("en-CA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <Badge variant="brand" className="text-[10px]">
                            6 agents
                          </Badge>
                        </div>
                        <StrategyCard output={msg.content as StrategyOutput} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                  <div className="flex items-center">
                    <ThinkingIndicator />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-gray-100 bg-white p-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/10 transition-all">
              <Users className="mb-1 h-4 w-4 shrink-0 text-gray-400" />
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask a strategic question about your restaurant…"
                className="flex-1 resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                disabled={isThinking}
                style={{ maxHeight: "120px" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all",
                  input.trim() && !isThinking
                    ? "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">
              First response in &lt;45s · Follow-ups in &lt;15s · Session context preserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
