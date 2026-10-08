import { Facebook, Instagram, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "audit" | "plan" | "history";
export type ItemStatus = "pending" | "in_progress" | "done" | "dismissed";

export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function weekRange(start: string, end: string): string {
  return `Week of ${parseDate(start).toLocaleDateString("en-CA", { month: "long", day: "numeric" })} – ${parseDate(end).toLocaleDateString("en-CA", { day: "numeric", year: "numeric" })}`;
}

export const PLATFORM_META: Record<string, { label: string }> = {
  instagram: { label: "Instagram" },
  facebook: { label: "Facebook" },
  google_business: { label: "Google Business" },
};

export const PRIORITY_META = {
  high:   { label: "High",   pill: "bg-red-50 text-red-700",     dot: "bg-red-500",   border: "border-l-red-500" },
  medium: { label: "Medium", pill: "bg-amber-50 text-amber-800", dot: "bg-amber-500", border: "border-l-amber-400" },
  low:    { label: "Low",    pill: "bg-gray-100 text-gray-600",  dot: "bg-gray-400",  border: "border-l-gray-300" },
};

export const EFFORT_LABELS: Record<string, string> = {
  under_15_min: "< 15 min",
  "15_to_60_min": "15–60 min",
  over_1_hour: "1+ hour",
};

export const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  cadence: "Cadence",
  engagement: "Engagement",
  positioning: "Positioning",
  reviews: "Reviews",
  profile: "Profile",
  other: "Other",
};

export const tabMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

export function PlatformBadge({ platform, className }: { platform: string; className?: string }) {
  const meta = PLATFORM_META[platform] ?? { label: platform };
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold text-ink", className)}>
      {platform === "instagram" && <Instagram className="h-3.5 w-3.5 text-brand-600" />}
      {platform === "facebook" && <Facebook className="h-3.5 w-3.5 text-brand-600" />}
      {platform === "google_business" && <Star className="h-3.5 w-3.5 text-brand-600" />}
      {meta.label}
    </span>
  );
}
