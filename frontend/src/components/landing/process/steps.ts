import { BookOpen, Calculator, CalendarDays, Clock, Instagram, Megaphone, Palette, ShieldAlert, Star, Store, TrendingUp, Users } from "lucide-react";

/**
 * The "what's next" animation, told in five beats. Content is illustrative —
 * a fictional café — and mirrors how the product actually works:
 * owner context → public signals + playbooks → six specialist analysts →
 * a strategist's insight → one recommendation with what to watch.
 */
export const STEPS = [
  { id: "you",      label: "You",      caption: "It starts with your business.", ms: 2200 },
  { id: "gather",   label: "Gather",   caption: "Signals flow in from everywhere.", ms: 6800 },
  { id: "analyse",  label: "Analyse",  caption: "Six specialists weigh in at once.", ms: 6200 },
  { id: "insight",  label: "Insight",  caption: "The signal behind the noise.", ms: 4800 },
  { id: "act",      label: "Act", caption: "One clear move. What to watch.", ms: 7200 },
] as const;

export type StepIndex = 0 | 1 | 2 | 3 | 4;

export const PROFILE = [
  { k: "Goal", v: "More midweek visits" },
  { k: "Margin", v: "60–70%" },
  { k: "Capacity", v: "Quiet Tue–Thu" },
];

export const BUSINESS_ICON = Store;

export const SOURCES = [
  { id: "reviews",   icon: Star,         label: "Google reviews" },
  { id: "instagram", icon: Instagram,    label: "Instagram" },
  { id: "ads",       icon: Megaphone,    label: "Competitor ads" },
  { id: "events",    icon: CalendarDays, label: "Local events" },
  { id: "rivals",    icon: Store,        label: "Nearby offers" },
  { id: "playbooks", icon: BookOpen,     label: "Marketing playbooks" },
];

/** Each specialist "says" one finding during the Analyse step. */
export const ANALYSTS = [
  { name: "Market",  icon: TrendingUp,  spark: "blue",   color: "#3B82F6", tint: "bg-blue-100 text-blue-700",       finding: "Saturday market = extra foot traffic" },
  { name: "Rivals",  icon: Users,       spark: "red",    color: "#EF4444", tint: "bg-red-100 text-red-700",         finding: "Café nearby cut weekday prices 15%" },
  { name: "Brand",   icon: Palette,     spark: "pink",   color: "#EC4899", tint: "bg-pink-100 text-pink-700",       finding: "Warm and unfussy suits a bundle" },
  { name: "Timing",  icon: Clock,       spark: "yellow", color: "#EAB308", tint: "bg-yellow-100 text-yellow-800",   finding: "Tue–Thu, 8–11am is quiet" },
  { name: "Margins", icon: Calculator,  spark: "lime",   color: "#84A02B", tint: "bg-lime-200 text-lime-800",       finding: "A bundle keeps a healthy margin" },
  { name: "Risk",    icon: ShieldAlert, spark: "orange", color: "#F97316", tint: "bg-orange-100 text-orange-700",   finding: "Don't start a price war" },
];

/** Pip, the main mascot, changes pose with each step (files in /public/mascots). */
export const PIP_POSE = ["wave", "search", "think", "checklist", "celebrate"] as const;

/** When (s into the Analyse step) the first specialist speaks, and the gap between them. */
export const SPEAK = { first: 1.4, gap: 0.65 };

export const INSIGHTS = [
  { kind: "Observed", text: "Market on Saturday brings foot traffic" },
  { kind: "Observed", text: "Café nearby cut weekday prices 15%" },
  { kind: "Insight",  text: "Tuesday mornings have empty seats, not a price problem" },
];

export const MOVE = {
  title: "Launch a Tuesday coffee + pastry bundle",
  why: "Fills quiet hours without discounting the whole menu.",
  watch: ["Bundle orders", "Profit per order"],
  plan: ["Pick a high-margin pastry", "Tell regulars at the counter", "Compare with last Tuesday"],
};
