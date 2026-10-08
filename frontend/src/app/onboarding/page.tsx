"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowLeft, MapPin, Loader2, Lock } from "lucide-react";
import { discoverCompetitors, updateProfile, addCompetitor, type DiscoveryCandidate } from "@/lib/api";
import { Logo } from "@/components/brand/Logo";
import { Stepper, MobileStepper, type StepDef } from "@/components/onboarding/Stepper";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { InfoNote } from "@/components/onboarding/InfoNote";
import { CompetitorStep } from "@/components/onboarding/CompetitorStep";

const STEPS: StepDef[] = [
  { id: 1, label: "Business",    title: "Your business basics",       description: "Name, location, category" },
  { id: 2, label: "Brand",       title: "What you sell and your voice", description: "Offer, personality, goal" },
  { id: 3, label: "Costs",       title: "Cost structure",             description: "Ranges only, never exact" },
  { id: 4, label: "Operations",  title: "Capacity and operations",    description: "Hours, staff, capacity" },
  { id: 5, label: "Competitors", title: "Competitor discovery",       description: "Who to keep an eye on" },
];

const NICHES = [
  "Full-service restaurant",
  "Fast casual",
  "Cafe / coffee shop",
  "Bar / gastropub",
  "Food truck",
  "Bakery",
  "Other",
];

const MARGIN_BANDS = [
  { label: "Under 55%", value: "lt55" },
  { label: "55–65%", value: "55-65" },
  { label: "65–72%", value: "65-72" },
  { label: "72–78%", value: "72-78" },
  { label: "Over 78%", value: "gt78" },
];

const FIXED_COST_BANDS = [
  { label: "Under $8k/mo", value: "lt8k" },
  { label: "$8k–$15k/mo", value: "8-15k" },
  { label: "$15k–$25k/mo", value: "15-25k" },
  { label: "$25k–$40k/mo", value: "25-40k" },
  { label: "Over $40k/mo", value: "gt40k" },
];

type FormData = {
  businessName: string;
  address: string;
  niche: string;
  instagram: string;
  facebook: string;
  description: string;
  brandVoice: string;
  quarterGoal: string;
  grossMarginBand: string;
  fixedCostBand: string;
  priceRange: string;
  capacity: string;
  staffSize: string;
  peakHours: string;
};

function Field({ id, label, hint, children }: { id: string; label: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {hint && <p className="-mt-0.5 mb-2 text-xs text-gray-500">{hint}</p>}
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discovered, setDiscovered] = useState(false);
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([]);
  const [discoverError, setDiscoverError] = useState("");
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);

  const [form, setForm] = useState<FormData>({
    businessName: "",
    address: "",
    niche: "",
    instagram: "",
    facebook: "",
    description: "",
    brandVoice: "",
    quarterGoal: "",
    grossMarginBand: "",
    fixedCostBand: "",
    priceRange: "",
    capacity: "",
    staffSize: "",
    peakHours: "",
  });

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCompetitor(id: string) {
    setSelectedCompetitors((prev) =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : prev.length < 5
        ? [...prev, id]
        : prev
    );
  }

  async function runDiscovery() {
    if (!form.address || !form.niche) {
      setDiscoverError("Please complete your address and category in Step 1 first.");
      return;
    }
    setDiscoverLoading(true);
    setDiscoverError("");
    try {
      const result = await discoverCompetitors({
        address: form.address,
        niche: form.niche,
        business_name: form.businessName || "My Business",
        business_description: form.description || undefined,
      });
      setCandidates(result.candidates);
      setDiscovered(true);
    } catch (err) {
      setDiscoverError(err instanceof Error ? err.message : "Discovery failed. Please try again.");
    } finally {
      setDiscoverLoading(false);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      await updateProfile({
        business_name: form.businessName,
        address: form.address,
        niche: form.niche,
        instagram_handle: form.instagram,
        facebook_page: form.facebook,
        business_description: form.description,
        brand_voice: form.brandVoice,
        quarter_goal: form.quarterGoal,
        gross_margin_band: form.grossMarginBand,
        fixed_cost_band: form.fixedCostBand,
        price_range: form.priceRange,
        capacity: form.capacity,
        staff_size: form.staffSize,
        peak_hours: form.peakHours,
        onboarding_completed: true,
        onboarding_step: 5,
      });

      // Add selected competitors
      const selected = candidates.filter((c) => selectedCompetitors.includes(c.place_id));
      await Promise.all(
        selected.map((c) =>
          addCompetitor({
            name: c.name,
            address: c.address,
            google_place_id: c.place_id,
            google_business_url: c.google_business_url,
          }).catch(() => null)
        )
      );

      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding save failed:", err);
      setSaving(false);
    }
  }

  const current = STEPS[step - 1];
  const isLast = step === STEPS.length;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gray-200/70 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Agenzy home">
            <Logo height={30} priority />
          </Link>
          <span className="tabular ml-auto text-xs font-medium text-gray-500">
            Step {step} of {STEPS.length}
          </span>
        </div>
        <div className="px-4 pb-3 sm:px-6 md:hidden">
          <MobileStepper steps={STEPS} current={step} />
        </div>
      </header>

      <div className="flex min-h-screen pt-[88px] md:pt-16">
        {/* Desktop step nav */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-gray-200/70 bg-white px-4 pb-6 pt-8 md:flex">
          <p className="mb-4 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
            Set up your workspace
          </p>
          <Stepper steps={STEPS} current={step} onSelect={setStep} />

          <div className="mt-auto flex gap-2.5 rounded-control bg-gray-100 p-3">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" />
            <p className="text-[11px] leading-4 text-gray-600">
              Your answers stay private and are only used to tailor your recommendations.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex flex-1 justify-center px-4 pb-32 pt-8 sm:px-6 md:pb-12 md:pt-12">
          <div className="w-full max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: "easeOut" as const }}
              >
                {/* Step header */}
                <div className="mb-8">
                  <p className="eyebrow">
                    Step {step} · {current.label}
                  </p>
                  {isLast && discovered ? (
                    <h1 className="mt-2 font-display text-[28px] font-semibold leading-9 text-ink sm:text-4xl sm:leading-[44px]">
                      <span className="highlight">Almost there!</span>
                    </h1>
                  ) : (
                    <h1 className="mt-2 font-display text-[28px] font-semibold leading-9 text-ink sm:text-4xl sm:leading-[44px]">
                      {current.title}
                    </h1>
                  )}
                  <p className="mt-2 text-sm text-gray-500">
                    {isLast && discovered
                      ? "Pick the businesses you want Agenzy to keep an eye on, then head to your dashboard."
                      : `About ${6 - step} min remaining`}
                  </p>
                </div>

                {/* Step 1 — Business basics */}
                {step === 1 && (
                  <div className="space-y-6">
                    <Field id="businessName" label="Business name">
                      <input
                        id="businessName"
                        type="text"
                        className="input"
                        placeholder="Casa Verde Kitchen"
                        value={form.businessName}
                        onChange={(e) => update("businessName", e.target.value)}
                      />
                    </Field>
                    <Field id="address" label="Street address">
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          id="address"
                          type="text"
                          className="input pl-9"
                          placeholder="2437 4 St SW, Calgary, AB"
                          value={form.address}
                          onChange={(e) => update("address", e.target.value)}
                        />
                      </div>
                    </Field>
                    <div>
                      <p className="label" id="niche-label">Business category</p>
                      <div role="radiogroup" aria-labelledby="niche-label" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {NICHES.map((n) => (
                          <OptionCard key={n} selected={form.niche === n} onClick={() => update("niche", n)}>
                            {n}
                          </OptionCard>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field id="instagram" label="Instagram handle">
                        <input
                          id="instagram"
                          type="text"
                          className="input"
                          placeholder="@yourbusiness"
                          value={form.instagram}
                          onChange={(e) => update("instagram", e.target.value)}
                        />
                      </Field>
                      <Field id="facebook" label="Facebook page">
                        <input
                          id="facebook"
                          type="text"
                          className="input"
                          placeholder="yourbusiness"
                          value={form.facebook}
                          onChange={(e) => update("facebook", e.target.value)}
                        />
                      </Field>
                    </div>
                    <p className="text-xs text-gray-500">
                      Social accounts are optional and read-only. You can add them later in settings.
                    </p>
                  </div>
                )}

                {/* Step 2 — Brand & description */}
                {step === 2 && (
                  <div className="space-y-6">
                    <Field id="description" label="What do you sell?" hint="Describe your offer, atmosphere, and customer experience in plain language.">
                      <textarea
                        id="description"
                        rows={4}
                        className="input resize-none"
                        placeholder="We're a Mexican-inspired casual restaurant known for tacos, weekend brunch, and a relaxed neighbourhood feel. Loyal weekday lunch crowd plus busy Friday and Saturday dinners."
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                      />
                    </Field>
                    <Field id="brandVoice" label="Brand voice" hint="How do you talk to customers? What's the personality?">
                      <textarea
                        id="brandVoice"
                        rows={3}
                        className="input resize-none"
                        placeholder="Warm, unpretentious, neighbourhood-first. We don't take ourselves too seriously."
                        value={form.brandVoice}
                        onChange={(e) => update("brandVoice", e.target.value)}
                      />
                    </Field>
                    <Field
                      id="quarterGoal"
                      label={<>Your most important goal this quarter <span className="font-normal text-gray-400">(optional)</span></>}
                    >
                      <textarea
                        id="quarterGoal"
                        rows={2}
                        className="input resize-none"
                        placeholder="Fill more weekday lunch tables and get more recent Google reviews."
                        value={form.quarterGoal}
                        onChange={(e) => update("quarterGoal", e.target.value)}
                      />
                      <p className="mt-1.5 text-xs text-gray-500">
                        Agenzy uses this to prioritise which moves to suggest first.
                      </p>
                    </Field>
                  </div>
                )}

                {/* Step 3 — Cost structure */}
                {step === 3 && (
                  <div className="space-y-8">
                    <InfoNote title="Why we ask this">
                      Cost ranges help Agenzy check whether a promotion would meaningfully squeeze your
                      margin before suggesting it. We never store exact figures, only ranges.
                    </InfoNote>
                    <div>
                      <p className="label" id="margin-label">Approximate gross margin</p>
                      <p className="-mt-0.5 mb-3 text-xs text-gray-500">Revenue minus cost of goods sold</p>
                      <div role="radiogroup" aria-labelledby="margin-label" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {MARGIN_BANDS.map((b) => (
                          <OptionCard
                            key={b.value}
                            selected={form.grossMarginBand === b.value}
                            onClick={() => update("grossMarginBand", b.value)}
                            className="tabular"
                          >
                            {b.label}
                          </OptionCard>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="label" id="fixed-label">Monthly fixed costs (rent, labour, etc.)</p>
                      <div role="radiogroup" aria-labelledby="fixed-label" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {FIXED_COST_BANDS.map((b) => (
                          <OptionCard
                            key={b.value}
                            selected={form.fixedCostBand === b.value}
                            onClick={() => update("fixedCostBand", b.value)}
                            className="tabular"
                          >
                            {b.label}
                          </OptionCard>
                        ))}
                      </div>
                    </div>
                    <Field id="priceRange" label="Key product price range">
                      <input
                        id="priceRange"
                        type="text"
                        className="input"
                        placeholder="Lunch $14–$22 · Dinner $22–$38"
                        value={form.priceRange}
                        onChange={(e) => update("priceRange", e.target.value)}
                      />
                    </Field>
                  </div>
                )}

                {/* Step 4 — Operations */}
                {step === 4 && (
                  <div className="space-y-6">
                    <Field id="capacity" label="Peak capacity">
                      <input
                        id="capacity"
                        type="text"
                        className="input"
                        placeholder="e.g. 60 covers per service"
                        value={form.capacity}
                        onChange={(e) => update("capacity", e.target.value)}
                      />
                    </Field>
                    <Field id="staffSize" label="Front-of-house staff size">
                      <input
                        id="staffSize"
                        type="text"
                        className="input"
                        placeholder="e.g. 8–12 per shift"
                        value={form.staffSize}
                        onChange={(e) => update("staffSize", e.target.value)}
                      />
                    </Field>
                    <Field id="peakHours" label="Peak operating hours">
                      <input
                        id="peakHours"
                        type="text"
                        className="input"
                        placeholder="e.g. Tue–Fri 11am–3pm, Thu–Sat 5pm–10pm"
                        value={form.peakHours}
                        onChange={(e) => update("peakHours", e.target.value)}
                      />
                    </Field>
                    <InfoNote title="Why this matters">
                      Your hours help Agenzy flag timing conflicts. For example, a promotion during a
                      period when you&apos;re already full adds strain on staff without adding revenue.
                    </InfoNote>
                  </div>
                )}

                {/* Step 5 — Competitor Discovery */}
                {step === 5 && (
                  <CompetitorStep
                    discovered={discovered}
                    loading={discoverLoading}
                    error={discoverError}
                    candidates={candidates}
                    selected={selectedCompetitors}
                    onDiscover={runDiscovery}
                    onToggle={toggleCompetitor}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation — sticky footer on mobile, inline on desktop */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200/70 bg-white/95 px-4 py-3 backdrop-blur md:static md:mt-10 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
              <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
                {step > 1 ? (
                  <button onClick={() => setStep((s) => s - 1)} className="btn-secondary">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                ) : (
                  <span />
                )}

                {!isLast ? (
                  <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={finish} disabled={saving} className="btn-primary">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Setting up…
                      </>
                    ) : (
                      <>
                        Go to dashboard
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
