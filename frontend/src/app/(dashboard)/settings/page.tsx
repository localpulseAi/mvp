"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { User, Bell, Shield, Globe, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMe, logout, getCompetitors, removeCompetitor,
  type OwnerProfile, type CompetitorOut,
} from "@/lib/api";
import { ProfileSection } from "@/components/settings/ProfileSection";
import {
  NotificationsSection,
  IntegrationsSection,
  CompetitorsSection,
  AccountSection,
} from "@/components/settings/OtherSections";

const NAV = [
  { id: "profile",      label: "Profile",       icon: User   },
  { id: "notifs",       label: "Notifications", icon: Bell   },
  { id: "integrations", label: "Integrations",  icon: Globe  },
  { id: "competitors",  label: "Competitors",   icon: Users  },
  { id: "account",      label: "Account",       icon: Shield },
];

export default function SettingsPage() {
  const router = useRouter();
  const [active, setActive] = useState("profile");
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorOut[]>([]);

  async function loadData() {
    try {
      const [p, cs] = await Promise.all([getMe(), getCompetitors()]);
      setProfile(p);
      setCompetitors(cs);
    } catch {
      null;
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleLogout() {
    try { await logout(); } catch { null; }
    router.push("/login");
  }

  async function handleRemoveCompetitor(id: string) {
    try {
      await removeCompetitor(id);
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
    } catch { null; }
  }

  function renderSection() {
    switch (active) {
      case "profile":
        return <ProfileSection key="profile" profile={profile} onSaved={loadData} />;
      case "notifs":
        return <NotificationsSection key="notifs" />;
      case "integrations":
        return <IntegrationsSection key="integrations" profile={profile} />;
      case "competitors":
        return <CompetitorsSection key="competitors" competitors={competitors} onRemove={handleRemoveCompetitor} />;
      case "account":
        return <AccountSection key="account" profile={profile} />;
      default:
        return null;
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <p className="eyebrow">Settings</p>
        <h1 className="page-title mt-1.5">Workspace settings</h1>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Section nav — horizontal strip on mobile, rail on desktop */}
        <aside className="lg:w-56 lg:shrink-0">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:sticky lg:top-8 lg:overflow-visible">
            <nav aria-label="Settings sections" className="flex gap-1 lg:card lg:flex-col lg:p-2">
              {NAV.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActive(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full lg:py-2.5",
                      isActive
                        ? "bg-lilac text-brand-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-ink"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand-600" : "text-gray-400")} />
                    {item.label}
                  </button>
                );
              })}
              <div className="hidden lg:my-1 lg:block lg:border-t lg:border-gray-200/70" />
              <button
                onClick={handleLogout}
                className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 lg:w-full lg:py-2.5"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">{renderSection()}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
