"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import type { StrategistOutput } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { StrategistAvatar, StrategyCard, ThinkingIndicator } from "./StrategyCard";

export type Message =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; kind: "strategy"; output: StrategistOutput; sample?: boolean }
  | { id: string; role: "assistant"; kind: "text"; text: string }
  | { id: string; role: "error"; text: string; question: string };

interface MessageListProps {
  messages: Message[];
  thinking: boolean;
  onRetry: (question: string) => void;
}

export function MessageList({ messages, thinking, onRetry }: MessageListProps) {
  return (
    <ol className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6" aria-label="Conversation">
      {messages.map((msg) => (
        <li key={msg.id}>
          {msg.role === "user" ? (
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-brand-600 px-4 py-3 text-sm leading-relaxed text-white shadow-sm sm:max-w-md">
                <span className="sr-only">You: </span>
                {msg.text}
              </p>
            </div>
          ) : msg.role === "error" ? (
            <div role="alert" className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50" aria-hidden="true">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </span>
              <div className="rounded-2xl rounded-tl-md border border-red-200 bg-white px-4 py-3 text-sm text-gray-700">
                <p>
                  <span className="font-semibold text-ink">That didn&apos;t go through.</span> {msg.text}
                </p>
                <button
                  onClick={() => onRetry(msg.question)}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Ask again
                </button>
              </div>
            </div>
          ) : msg.kind === "text" ? (
            <div className="flex gap-3">
              <StrategistAvatar />
              <p className="rounded-2xl rounded-tl-md border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700">
                <span className="sr-only">Agenzy Strategist: </span>
                {msg.text}
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <StrategistAvatar />
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="font-display text-sm font-semibold text-ink">Agenzy Strategist</span>
                  {msg.sample ? (
                    <Badge variant="lime" className="text-[10px]">Sample answer — demo workspace</Badge>
                  ) : (
                    <Badge variant="brand" className="text-[10px]">Draft for your review</Badge>
                  )}
                </div>
                {msg.sample && (
                  <p className="mb-3 text-xs text-gray-500">
                    The demo always shows this one fictional answer. It doesn&apos;t analyse your question.
                  </p>
                )}
                <StrategyCard output={msg.output} />
              </div>
            </div>
          )}
        </li>
      ))}

      {thinking && (
        <li className="flex gap-3">
          <StrategistAvatar busy />
          <ThinkingIndicator />
        </li>
      )}
    </ol>
  );
}
