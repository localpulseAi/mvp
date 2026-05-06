"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  Instagram,
  Globe,
  Users,
  MapPin,
  Calendar,
  Star,
  CheckCircle2,
  Search,
  Plus,
  Pencil,
  LogOut,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

// ── Nav sections ──────────────────────────────────────────────────────────────

const NAV = [
  { id: "profile",     label: "Profile",      icon: User   },
  { id: "notifs",      label: "Notifications",icon: Bell   },
  { id: "integrations",label: "Integrations", icon: Globe  },
  { id: "competitors", label: "Competitors",  icon: Users  },
  { id: "account",     label: "Account",      icon: Shield },
];

// ── Toggle component ──────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={cn(
        "relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        enabled ? "bg-brand-600" : "bg-gray-200"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 35 }}
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md",
          enabled ? "left-[22px]" : "left-[2px]"
        )}
      />
    </button>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ title, description, children, action }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE SECTION
// ─────────────────────────────────────────────────────────────────────────────

function ProfileSection() {
  return (
    <Section
      title="Business Profile"
      description="Your business information used to personalise every analysis."
      action={
        <button className="btn-secondary gap-2 text-sm">
          <Pencil className="h-3.5 w-3.5" /> Edit profile
        </button>
      }
    >
      {/* Avatar + identity card */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-brand-50 to-violet-50 p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-xl font-black text-white shadow-lg shadow-brand-600/25">
              CV
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
              <Star className="h-2.5 w-2.5 text-white fill-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-extrabold text-gray-900">Casa Verde Calgary</h3>
              <Badge variant="amber">Founding Member</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                2437 4 St SW, Calgary, AB
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                Full-service restaurant
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                Member since May 2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Business name",      value: "Casa Verde Calgary" },
          { label: "Niche",              value: "Full-service restaurant" },
          { label: "Address",            value: "2437 4 St SW, Calgary, AB T2S 2T7" },
          { label: "Instagram",          value: "@casaverde_yyc" },
          { label: "Brand voice",        value: "Warm, unpretentious, neighbourhood-first" },
          { label: "This quarter's goal",value: "Grow lunch covers 15%, lift Google rating to 4.5" },
        ].map((field) => (
          <div
            key={field.label}
            className={cn(
              "rounded-xl border border-gray-100 bg-white px-4 py-3.5",
              (field.label === "Address" || field.label === "Brand voice" || field.label === "This quarter's goal")
                && "col-span-2"
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {field.label}
            </p>
            <p className="text-sm font-medium text-gray-900">{field.value}</p>
          </div>
        ))}
      </div>

      {/* Cost + operations */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        {[
          { label: "Gross margin band", value: "65–72%" },
          { label: "Monthly fixed costs", value: "$15k–$25k/mo" },
          { label: "Price range",        value: "Lunch $14–22 · Dinner $22–38" },
          { label: "Peak capacity",      value: "60 covers/service" },
          { label: "Staff size",         value: "8–12 per shift" },
          { label: "Peak hours",         value: "Tue–Fri 11am–3pm, Thu–Sat 5–10pm" },
        ].map((f) => (
          <div key={f.label} className="rounded-xl border border-gray-100 bg-white px-4 py-3.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {f.label}
            </p>
            <p className="text-sm font-medium text-gray-900">{f.value}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS SECTION
// ─────────────────────────────────────────────────────────────────────────────

const NOTIF_DEFAULTS = [
  {
    id: "brief",
    label: "Weekly Brief",
    sub: "Delivered Monday at 7:00am local time",
    enabled: true,
    badge: "Core",
  },
  {
    id: "competitor",
    label: "Competitor update",
    sub: "Bi-weekly when new competitor analysis is ready",
    enabled: true,
    badge: null,
  },
  {
    id: "checkin",
    label: "Friday check-in",
    sub: "Weekly prompt before Monday's brief",
    enabled: true,
    badge: "Pilot",
  },
  {
    id: "session",
    label: "Strategy Session follow-up",
    sub: "Email when a long-running session analysis completes",
    enabled: false,
    badge: null,
  },
];

function NotificationsSection() {
  const [prefs, setPrefs] = useState(NOTIF_DEFAULTS);

  function toggle(id: string) {
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  }

  return (
    <Section
      title="Notifications"
      description="Choose which emails LocalPulse sends you and when."
    >
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        {prefs.map((pref, i) => (
          <div
            key={pref.id}
            className={cn(
              "flex items-center justify-between px-6 py-5",
              i < prefs.length - 1 && "border-b border-gray-50"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                pref.enabled ? "bg-brand-50" : "bg-gray-100"
              )}>
                <Bell className={cn("h-4 w-4", pref.enabled ? "text-brand-600" : "text-gray-400")} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{pref.label}</p>
                  {pref.badge && (
                    <Badge variant={pref.badge === "Core" ? "brand" : "amber"} className="text-[10px]">
                      {pref.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{pref.sub}</p>
              </div>
            </div>
            <Toggle enabled={pref.enabled} onChange={() => toggle(pref.id)} />
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-400 px-1">
        Transactional emails (auth links, data exports) are always sent regardless of preferences.
      </p>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTEGRATIONS SECTION
// ─────────────────────────────────────────────────────────────────────────────

function IntegrationsSection() {
  const integrations = [
    {
      id: "instagram",
      name: "Instagram",
      handle: "@casaverde_yyc",
      desc: "Read-only access to your own profile and post data",
      status: "connected" as const,
      gradient: "from-pink-500 via-rose-500 to-orange-400",
      textColor: "text-white",
    },
    {
      id: "google",
      name: "Google Business",
      handle: null,
      desc: "Read-only access to your Google Business Profile and reviews",
      status: "disconnected" as const,
      gradient: "from-blue-500 via-sky-400 to-emerald-400",
      textColor: "text-white",
    },
  ];

  return (
    <Section
      title="Integrations"
      description="Connect your accounts for richer analysis. All access is read-only."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((ig) => (
          <div
            key={ig.id}
            className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
          >
            {/* Gradient top bar */}
            <div className={`h-2 w-full bg-gradient-to-r ${ig.gradient}`} />

            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${ig.gradient}`}>
                  {ig.id === "instagram"
                    ? <Instagram className={`h-5 w-5 ${ig.textColor}`} />
                    : <Globe className={`h-5 w-5 ${ig.textColor}`} />
                  }
                </div>
                {ig.status === "connected"
                  ? <Badge variant="green" dot>Connected</Badge>
                  : <Badge variant="gray">Not connected</Badge>
                }
              </div>

              <p className="text-sm font-bold text-gray-900">{ig.name}</p>
              {ig.handle
                ? <p className="text-xs font-medium text-brand-600 mt-0.5">{ig.handle}</p>
                : <p className="text-xs text-gray-400 mt-0.5">No account connected</p>
              }
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{ig.desc}</p>

              <div className="mt-4">
                {ig.status === "connected" ? (
                  <button className="w-full rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-500 hover:border-red-200 hover:text-red-500 transition-colors">
                    Disconnect
                  </button>
                ) : (
                  <button className={`w-full rounded-xl bg-gradient-to-r ${ig.gradient} py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity`}>
                    Connect {ig.name}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5 flex items-start gap-3">
        <Shield className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          LocalPulse never writes to your accounts. Integrations are read-only and can be disconnected at any time. We do not store raw social content — only normalised signals used for analysis.
        </p>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPETITORS SECTION
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_COMPETITORS = [
  { name: "Wurst",            dist: "0.3 km", trend: "up",     scrape: "2d ago" },
  { name: "OEB Breakfast Co.",dist: "0.8 km", trend: "up",     scrape: "5d ago" },
  { name: "Vin Room",         dist: "0.4 km", trend: "up",     scrape: "2d ago" },
  { name: "The Main Dish",    dist: "0.2 km", trend: "stable", scrape: "4d ago" },
  { name: "Hankki",           dist: "0.5 km", trend: "down",   scrape: "3d ago" },
];

function CompetitorsSection() {
  return (
    <Section
      title="Competitor Set"
      description="Up to 5 competitors tracked across Instagram, Google, Facebook and Meta Ads."
      action={
        <div className="flex gap-2">
          <button className="btn-secondary gap-1.5 text-sm py-2">
            <Search className="h-3.5 w-3.5" /> Re-run discovery
          </button>
          <button className="btn-primary gap-1.5 text-sm py-2">
            <Plus className="h-3.5 w-3.5" /> Add competitor
          </button>
        </div>
      }
    >
      {/* Competitor grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
        {MOCK_COMPETITORS.map((c) => (
          <div
            key={c.name}
            className="group relative rounded-2xl border border-gray-100 bg-white p-4 hover:border-gray-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-sm font-black text-brand-700">
                {c.name[0]}
              </div>
              <div className="flex items-center gap-1.5">
                {c.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                {c.trend === "down" && <TrendingUp className="h-3.5 w-3.5 rotate-180 text-red-400" />}
                {c.trend === "stable" && <div className="h-0.5 w-3.5 rounded-full bg-gray-300 mt-1" />}
                <button className="opacity-0 group-hover:opacity-100 text-[10px] font-medium text-red-400 hover:text-red-600 transition-all ml-1">
                  Remove
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.dist} · scraped {c.scrape}</p>
            <div className="mt-2.5">
              <Badge variant="green" dot className="text-[10px]">Tracking active</Badge>
            </div>
          </div>
        ))}

        {/* Empty slot */}
        <div className="rounded-2xl border border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] hover:border-brand-300 hover:bg-brand-50/50 transition-colors cursor-pointer group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-brand-100 transition-colors">
            <Plus className="h-4 w-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
          </div>
          <p className="text-xs font-medium text-gray-400 group-hover:text-brand-600 transition-colors">
            Add slot open
          </p>
        </div>
      </div>

      {/* Scrape cadence reference */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Scrape cadence</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
          {[
            { src: "Instagram", cadence: "Weekly" },
            { src: "Facebook",  cadence: "Weekly" },
            { src: "Meta Ads",  cadence: "Weekly" },
            { src: "Google Reviews", cadence: "Bi-weekly" },
            { src: "Google Business", cadence: "Monthly" },
          ].map((s) => (
            <div key={s.src} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="font-medium text-gray-700">{s.src}</span>
              <span className="text-gray-400">· {s.cadence}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCOUNT SECTION
// ─────────────────────────────────────────────────────────────────────────────

function AccountSection() {
  return (
    <Section
      title="Account & Privacy"
      description="Manage your data, subscription, and account security."
    >
      {/* Subscription status */}
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-brand-600 to-violet-700 p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold">Founding Member</span>
            </div>
            <p className="text-2xl font-black">$149<span className="text-sm font-semibold text-brand-200">/month</span></p>
            <p className="text-xs text-brand-200 mt-1">Rate locked until May 2027 · Next billing Jun 1</p>
          </div>
          <Badge className="bg-white/15 text-white border-0">Active</Badge>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="flex-1 rounded-xl border border-white/20 bg-white/10 py-2 text-xs font-semibold hover:bg-white/20 transition-colors">
            View invoice history
          </button>
          <button className="flex-1 rounded-xl border border-white/20 bg-white/10 py-2 text-xs font-semibold hover:bg-white/20 transition-colors">
            Update payment method
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div className="mb-4 rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900">Active sessions</p>
          <button className="text-xs font-medium text-red-500 hover:text-red-700">
            Sign out all other sessions
          </button>
        </div>
        {[
          { device: "MacBook Pro · Chrome", location: "Calgary, AB", current: true,  time: "Now" },
          { device: "iPhone · Safari",      location: "Calgary, AB", current: false, time: "2h ago" },
        ].map((s, i) => (
          <div key={i} className={cn("flex items-center justify-between px-5 py-3.5", i === 0 && "border-b border-gray-50")}>
            <div className="flex items-center gap-3">
              <div className={cn("h-2 w-2 rounded-full", s.current ? "bg-emerald-500" : "bg-gray-300")} />
              <div>
                <p className="text-sm font-medium text-gray-900">{s.device}</p>
                <p className="text-xs text-gray-400">{s.location} · {s.time}</p>
              </div>
            </div>
            {s.current
              ? <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">This device</span>
              : <button className="text-xs text-gray-400 hover:text-red-500 transition-colors"><LogOut className="h-3.5 w-3.5" /></button>
            }
          </div>
        ))}
      </div>

      {/* Data actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
            <Download className="h-5 w-5 text-brand-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Export your data</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Download all briefs, strategy sessions, and competitor analyses as a JSON or CSV archive.
          </p>
          <button className="btn-secondary w-full justify-center text-sm py-2.5">
            Request export
          </button>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
            <Trash2 className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">Delete account</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Permanently removes your account and all associated data within 30 days. This cannot be undone.
          </p>
          <button className="w-full justify-center rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
            Delete account
          </button>
        </div>
      </div>

      {/* Privacy note */}
      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5 flex items-start gap-3">
        <Shield className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          LocalPulse never sells your data to third parties. Raw competitor data is never exposed through the UI or API. Authentication uses magic links only — no passwords stored.
        </p>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS: Record<string, React.ComponentType> = {
  profile:      ProfileSection,
  notifs:       NotificationsSection,
  integrations: IntegrationsSection,
  competitors:  CompetitorsSection,
  account:      AccountSection,
};

export default function SettingsPage() {
  const [active, setActive] = useState("profile");
  const ActiveSection = SECTIONS[active];

  return (
    <div className="flex min-h-screen">
      {/* Left settings nav */}
      <aside className="w-52 shrink-0 border-r border-gray-100 bg-white px-3 py-8">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Settings
        </p>
        <nav className="space-y-0.5">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all text-left",
                active === item.id
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", active === item.id ? "text-white" : "text-gray-400")} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Session shortcut at bottom */}
        <div className="mt-6 border-t border-gray-100 pt-4">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all">
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content — fills full remaining width */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-8">
          <AnimatePresence mode="wait">
            <ActiveSection key={active} />
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
