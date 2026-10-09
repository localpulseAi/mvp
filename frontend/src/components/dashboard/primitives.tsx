"use client";

import { AlertCircle } from "lucide-react";

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

/** Inline per-section failure. A failed section never renders as empty or zero. */
export function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-2 px-5 py-5 text-sm">
      <p className="flex items-start gap-2 text-gray-700">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
        <span>
          <span className="font-semibold text-ink">Couldn&apos;t load this section.</span> {message}
        </span>
      </p>
      {onRetry && (
        <button onClick={onRetry} className="self-start pl-6 text-sm font-semibold text-brand-700 hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
