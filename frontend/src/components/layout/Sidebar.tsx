"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  MessageSquare,
  Users,
  Settings,
  Zap,
  ChevronRight,
  Bell,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Weekly Brief",
    href: "/brief",
    icon: Newspaper,
  },
  {
    label: "Strategy Session",
    href: "/session",
    icon: MessageSquare,
  },
  {
    label: "Competitors",
    href: "/competitors",
    icon: Users,
  },
  {
    label: "Social Audit",
    href: "/audit",
    icon: Activity,
  },
];

const secondaryItems = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-100 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shadow-sm">
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-sm font-bold text-gray-900 tracking-tight">
            LocalPulse
          </span>
          <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            AI
          </span>
        </div>
      </div>

      {/* Business context */}
      <div className="mx-3 mt-3 rounded-xl bg-brand-50 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-500">
          Active Business
        </p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
          Casa Verde Calgary
        </p>
        <p className="text-xs text-gray-500 truncate">Restaurant · Kensington</p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-all",
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-600"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.href === "/brief" && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-brand-100 text-brand-700"
                      )}
                    >
                      NEW
                    </span>
                  )}
                  {item.href === "/competitors" && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-700"
                      )}
                    >
                      3
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 border-t border-gray-100 pt-3">
          <ul className="space-y-0.5">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Friday check-in nudge */}
      <div className="mx-3 mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
        <div className="flex items-start gap-2">
          <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Friday Check-in</p>
            <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
              How did this week go? Reply before Monday's brief.
            </p>
            <button className="mt-1.5 text-[11px] font-semibold text-amber-700 underline underline-offset-2">
              Reply now
            </button>
          </div>
        </div>
      </div>

      {/* User profile */}
      <div className="border-t border-gray-100 p-3">
        <button className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:bg-gray-50">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            CV
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">
              Casa Verde
            </p>
            <p className="truncate text-xs text-gray-500">Founding Member</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500" />
        </button>
      </div>
    </aside>
  );
}
