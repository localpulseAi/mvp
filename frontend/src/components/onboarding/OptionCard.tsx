import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  /** Show the selection indicator on the right instead of the left. */
  indicator?: "left" | "right" | "none";
  role?: "radio" | "checkbox";
}

/** Selectable card — violet ring + lilac fill when selected. */
export function OptionCard({
  selected,
  onClick,
  children,
  disabled,
  className,
  indicator = "right",
  role = "radio",
}: OptionCardProps) {
  const dot = (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center transition-colors",
        role === "radio" ? "rounded-full" : "rounded-md",
        selected ? "bg-brand-600 text-white" : "border-2 border-gray-300 bg-white"
      )}
    >
      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
    </span>
  );

  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-control border bg-white px-4 py-3 text-left text-sm font-medium transition-all",
        selected
          ? "border-brand-600 bg-lilac text-brand-800 ring-2 ring-brand-600/20"
          : "border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-gray-50",
        disabled && "cursor-not-allowed opacity-50 hover:border-gray-200 hover:bg-white",
        className
      )}
    >
      {indicator === "left" && dot}
      <span className="min-w-0 flex-1">{children}</span>
      {indicator === "right" && dot}
    </button>
  );
}
