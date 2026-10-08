"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { User, Bell, Shield, Globe, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getMe,
  logout,
  getCompetitors,
  getSocialAccounts,
  removeCompetitor,
  type CompetitorOut,
  type OwnerProfile,
  type SocialAuditAccount,
} from "@/lib/api";
import { useWorkspaceData } from "@/lib/workspace";
import { demoCompetitors, demoOwner, demoSocialAccounts } from "@/lib/demo-workspace";
import { DemoBanner, ErrorState, LoadingState, PageHeader } from "@/components/ui/states";
import { ProfileSection } from "@/components/settings/ProfileSection";
import {
  NotificationsSection,
  IntegrationsSection,
  CompetitorsSection,
  AccountSection,
} from "@/components/settings/OtherSections";

const NAV = [
  { id: "profile",       label: "Profile",       icon: User   },
  { id: "notifications", label: "Notifications", icon: Bell   },
  { id: "integrations",  label: "Integrations",  icon: Globe  },
  { id: "competitors",   label: "Competitors",   icon: Users  },
  { id: "account",       label: "Account",       icon: Shield },
] as const;
type SectionId = (typeof NAV)[number]["id"];

function sectionFromHash(): SectionId {
  const h = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
  return (NAV.find((n) => n.id === h)?.id ?? "profile") as SectionId;
}

type SettingsData = { profile: OwnerProfile; competitors: CompetitorOut[]; accounts: SocialAuditAccount[] };

const DEMO_DATA: SettingsData = { profile: demoOwner, competitors: demoCompetitors, accounts: demoSocialAccounts };

async function loadLive(): Promise<SettingsData> {
  const [profile, competitors, accountsRes] = await Promise.all([getMe(), getCompetitors(), getSocialAccounts()]);
  return { profile, competitors, accounts: accountsRes.accounts };
}

const UNSAVED_PROMPT = "You have unsaved profile changes. Leave this section and discard them?";

export default function SettingsPage() {
  const router = useRouter();
  const { state, reload } = useWorkspaceData(loadLive, DEMO_DATA);
  const isDemo = state.mode === "demo";
  const [active, setActive] = useState<SectionId>("profile");
  const [competitors, setCompetitors] = useState<CompetitorOut[]>([]);
  const [accounts, setAccounts] = useState<SocialAuditAccount[]>([]);
  const [signOutNote, setSignOutNote] = useState("");
  const dirtyRef = useRef(false);

  // Deep links: open the section named in the URL hash, and follow hash changes.
  useEffect(() => {
    setActive(sectionFromHash());
    const onHash = () => setActive(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    if (state.status !== "ready") return;
    setCompetitors(state.data.competitors);
    setAccounts(state.data.accounts);
  }, [state]);

  const setDirty = useCallback((d: boolean) => {
    dirtyRef.current = d;
  }, []);

  function go(id: SectionId) {
    if (id === active) return;
    if (dirtyRef.current && !window.confirm(UNSAVED_PROMPT)) return;
    dirtyRef.current = false;
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  async function handleLogout() {
    if (isDemo) {
      setSignOutNote("You're viewing the demo workspace, so there's nothing to sign out of.");
      return;
    }
    if (dirtyRef.current && !window.confirm(UNSAVED_PROMPT)) return;
    try {
      await logout();
    } catch {
      // Session may already be gone; continue to sign-in either way.
    }
    router.push("/login");
  }

  async function handleRemoveCompetitor(id: string) {
    await removeCompetitor(id);
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  }

  async function refreshCompetitors() {
    try {
      setCompetitors(await getCompetitors());
    } catch {
      reload();
    }
  }

  function renderSection(profile: OwnerProfile) {
    switch (active) {
      case "profile":
        return <ProfileSection key="profile" profile={profile} isDemo={isDemo} onSaved={reload} onDirtyChange={setDirty} />;
      case "notifications":
        return <NotificationsSection key="notifications" />;
      case "integrations":
        return <IntegrationsSection key="integrations" accounts={accounts} isDemo={isDemo} onAccountsChange={setAccounts} />;
      case "competitors":
        return (
          <CompetitorsSection
            key="competitors"
            competitors={competitors}
            isDemo={isDemo}
            onAdded={refreshCompetitors}
            onRemove={handleRemoveCompetitor}
          />
        );
      case "account":
        return <AccountSection key="account" isDemo={isDemo} />;
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {isDemo && <DemoBanner what="sample workspace settings" />}
      <PageHeader eyebrow="Settings" title="Workspace settings" description="Your business context, connections, and account." />

      {state.status === "loading" && <LoadingState label="Loading settings" />}
      {state.status === "error" && <ErrorState title="We couldn't load your settings" message={state.error} onRetry={reload} />}

      {state.status === "ready" && (
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Section nav — horizontal strip on mobile, rail on desktop */}
          <aside className="lg:w-56 lg:shrink-0">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:sticky lg:top-8 lg:overflow-visible">
              <nav aria-label="Settings sections" className="flex gap-1 lg:card lg:flex-col lg:p-2">
                {NAV.map((item) => {
                  const isActive = active === item.id;
                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        go(item.id);
                      }}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-[40px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-left text-sm font-medium transition-colors lg:w-full lg:py-2.5",
                        isActive ? "bg-lilac text-brand-700" : "text-gray-600 hover:bg-gray-100 hover:text-ink"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-brand-600" : "text-gray-400")} aria-hidden="true" />
                      {item.label}
                    </a>
                  );
                })}
                <div className="hidden lg:my-1 lg:block lg:border-t lg:border-gray-200/70" />
                <button
                  onClick={handleLogout}
                  className="flex min-h-[40px] shrink-0 items-center gap-2.5 whitespace-nowrap rounded-control px-3 py-2 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 lg:w-full lg:py-2.5"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Sign out
                </button>
              </nav>
            </div>
            <p aria-live="polite" className="mt-2 px-1 text-xs text-gray-500 empty:hidden">{signOutNote}</p>
          </aside>

          <section id={active} aria-label={NAV.find((n) => n.id === active)?.label} className="min-w-0 flex-1 scroll-mt-24">
            <AnimatePresence mode="wait">{renderSection(state.data.profile)}</AnimatePresence>
          </section>
        </div>
      )}
    </div>
  );
}
