import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDef {
  id: number;
  label: string;
  title: string;
  description: string;
}

interface StepperProps {
  steps: StepDef[];
  current: number;
  onSelect: (id: number) => void;
}

function StepDot({ state, id }: { state: "done" | "active" | "todo"; id: number }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
        state === "active" && "bg-brand-600 text-white shadow-violet",
        state === "done" && "bg-lime-300 text-ink",
        state === "todo" && "border-2 border-gray-300 bg-white text-gray-400"
      )}
    >
      {state === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : id}
    </span>
  );
}

/** Vertical stepper for the desktop sidebar. */
export function Stepper({ steps, current, onSelect }: StepperProps) {
  return (
    <ol className="relative space-y-1" aria-label="Setup steps">
      {steps.map((s, i) => {
        const state = s.id < current ? "done" : s.id === current ? "active" : "todo";
        return (
          <li key={s.id} className="relative">
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[25px] top-[42px] h-[calc(100%-28px)] w-0.5 rounded-full",
                  s.id < current ? "bg-lime-400" : "bg-gray-200"
                )}
              />
            )}
            <button
              type="button"
              onClick={() => state === "done" && onSelect(s.id)}
              disabled={state === "todo"}
              aria-current={state === "active" ? "step" : undefined}
              className={cn(
                "flex w-full items-start gap-3 rounded-control px-3 py-2.5 text-left transition-colors",
                state === "active" && "bg-lilac",
                state === "done" && "hover:bg-gray-100",
                state === "todo" && "cursor-default"
              )}
            >
              <StepDot state={state} id={s.id} />
              <span className="min-w-0 pt-0.5">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    state === "active" ? "text-brand-700" : state === "done" ? "text-ink" : "text-gray-400"
                  )}
                >
                  {s.label}
                </span>
                <span className="block truncate text-xs text-gray-500">{s.description}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Compact horizontal progress for mobile. */
export function MobileStepper({ steps, current }: Omit<StepperProps, "onSelect">) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {steps.map((s) => (
        <span
          key={s.id}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            s.id < current ? "bg-lime-400" : s.id === current ? "bg-brand-600" : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}
