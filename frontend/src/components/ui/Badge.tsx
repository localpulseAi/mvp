import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "brand"
  | "amber"
  | "green"
  | "red"
  | "gray"
  | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  brand:   "bg-brand-100 text-brand-700",
  amber:   "bg-amber-100 text-amber-700",
  green:   "bg-emerald-100 text-emerald-700",
  red:     "bg-red-100 text-red-700",
  gray:    "bg-gray-100 text-gray-500",
  outline: "bg-transparent border border-gray-200 text-gray-600",
};

const dotClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-500",
  brand:   "bg-brand-600",
  amber:   "bg-amber-500",
  green:   "bg-emerald-500",
  red:     "bg-red-500",
  gray:    "bg-gray-400",
  outline: "bg-gray-400",
};

export function Badge({
  children,
  variant = "default",
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            dotClasses[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
