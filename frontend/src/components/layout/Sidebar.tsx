"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Newspaper,
  MessageSquare,
  Users,
  Settings,
  ChevronRight,
  CalendarCheck,
  Activity,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";

const navItems = [
  { label: "Dashboard",        href: "/dashboard",   icon: LayoutDashboard },
  { label: "Weekly Brief",     href: "/brief",       icon: Newspaper },
  { label: "Strategy Session", href: "/session",     icon: MessageSquare },
  { label: "Competitors",      href: "/competitors", icon: Users },
  { label: "Social Audit",     href: "/audit",       icon: Activity },
];

const secondaryItems = [{ label: "Settings", href: "/settings", icon: Settings }];

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: (typeof navItems)[number];
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-lilac text-brand-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-ink"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand-600"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <item.icon
        className={cn(
          "h-[18px] w-[18px] shrink-0",
          active ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Workspace context */}
      <div className="mx-3 mt-4 rounded-2xl border border-brand-200/60 bg-lilac px-3.5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-600">
          Demo workspace
        </p>
        <p className="mt-1 truncate font-display text-sm font-semibold text-ink">
          Sample local business
        </p>
        <p className="truncate text-xs text-gray-500">Illustrative data only</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
          Workspace
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isActive(item.href)} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-gray-200/70 pt-4">
          <ul className="space-y-0.5">
            {secondaryItems.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={isActive(item.href)} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Friday check-in nudge */}
      <div className="mx-3 mb-3 rounded-2xl bg-ink p-3.5 text-white">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime-300">
            <CalendarCheck className="h-3.5 w-3.5 text-ink" />
          </div>
          <div>
            <p className="text-xs font-semibold">Friday check-in</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-white/65">
              How did this week go? Your answer shapes Monday&apos;s brief.
            </p>
            <button className="mt-2 text-[11px] font-semibold text-lime-300 underline underline-offset-2 hover:text-lime-200">
              Reply now
            </button>
          </div>
        </div>
      </div>

      {/* User profile */}
      <div className="border-t border-gray-200/70 p-3">
        <button className="group flex w-full items-center gap-3 rounded-control px-2.5 py-2 transition-colors hover:bg-gray-100">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            DW
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-ink">Demo workspace</p>
            <p className="truncate text-xs text-gray-500">Prototype view</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200/70 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-gray-200/70 px-5">
          <Link href="/" aria-label="Agenzy home">
            <Logo height={30} priority />
          </Link>
        </div>
        <SidebarBody />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200/70 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" aria-label="Agenzy home">
          <Logo height={26} priority />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="btn-ghost -mr-2"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-lift lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
            >
              <div className="flex h-14 items-center justify-between border-b border-gray-200/70 px-4">
                <Logo height={26} />
                <button onClick={() => setOpen(false)} className="btn-ghost -mr-2" aria-label="Close navigation">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
