"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Search,
  Plus,
  X,
  Loader2,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { discoverCompetitors, updateProfile, addCompetitor, type DiscoveryCandidate } from "@/lib/api";

const STEPS = [
  { id: 1, label: "Business", title: "Your business basics" },
  { id: 2, label: "Brand", title: "What you sell & your voice" },
  { id: 3, label: "Costs", title: "Cost structure" },
  { id: 4, label: "Ops", title: "Capacity & operations" },
  { id: 5, label: "Competitors", title: "Competitor Discovery" },
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
      setDiscoverError("Please complete your address and niche in Step 1 first.");
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

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-gray-100 bg-white px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
            <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-gray-900">LocalPulse AI</span>
        </Link>
        <div className="ml-auto text-xs text-gray-400">
          Step {step} of {STEPS.length}
        </div>
      </header>

      <div className="flex min-h-screen pt-14">
        {/* Left step nav */}
        <aside className="hidden w-56 shrink-0 border-r border-gray-100 bg-white md:flex flex-col pt-8 pb-6 px-4">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 px-2">
            Setup progress
          </p>
          <ol className="space-y-1">
            {STEPS.map((s) => {
              const done = s.id < step;
              const active = s.id === step;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => s.id < step && setStep(s.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-all",
                      active
                        ? "bg-brand-50 text-brand-700 font-semibold"
                        : done
                        ? "text-gray-600 hover:bg-gray-50"
                        : "text-gray-400 cursor-default"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                        active
                          ? "border-brand-600 bg-brand-600 text-white"
                          : done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-gray-200 text-gray-400"
                      )}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.id}
                    </span>
                    <span>{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Progress bar */}
          <div className="mt-auto px-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Progress</span>
              <span className="text-xs font-semibold text-brand-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-1.5 rounded-full bg-brand-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-start px-6 py-12">
          <div className="w-full max-w-lg animate-fade-in">
            {/* Step header */}
            <div className="mb-8">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="brand">Step {step} of {STEPS.length}</Badge>
                <span className="text-xs text-gray-400">
                  ~{6 - step} min remaining
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                {STEPS[step - 1].title}
              </h1>
            </div>

            {/* Step 1 — Business basics */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="label">Business name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Casa Verde Calgary"
                    value={form.businessName}
                    onChange={(e) => update("businessName", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Street address in Calgary</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-9"
                      placeholder="2437 4 St SW, Calgary, AB"
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Niche category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {NICHES.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update("niche", n)}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all",
                          form.niche === n
                            ? "border-brand-600 bg-brand-50 text-brand-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Instagram handle</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="@yourrestaurant"
                      value={form.instagram}
                      onChange={(e) => update("instagram", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Facebook page</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="yourrestaurant"
                      value={form.facebook}
                      onChange={(e) => update("facebook", e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Integrations are optional and read-only. You can add them later in settings.
                </p>
              </div>
            )}

            {/* Step 2 — Brand & description */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label className="label">What do you sell?</label>
                  <p className="text-xs text-gray-500 mb-2">
                    Describe your food, vibe, and customer experience in plain language.
                  </p>
                  <textarea
                    rows={4}
                    className="input resize-none"
                    placeholder="We're a Mexican-inspired casual restaurant. Known for our tacos, weekend brunch, and a relaxed neighbourhood feel. Loyal weekday lunch crowd plus strong Friday/Saturday dinner..."
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Brand voice</label>
                  <p className="text-xs text-gray-500 mb-2">
                    How do you talk to customers? What's the personality?
                  </p>
                  <textarea
                    rows={3}
                    className="input resize-none"
                    placeholder="Warm, unpretentious, neighbourhood-first. We don't take ourselves too seriously. Friendly like a local spot should be..."
                    value={form.brandVoice}
                    onChange={(e) => update("brandVoice", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">
                    Your most important goal this quarter{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    className="input resize-none"
                    placeholder="Grow midday lunch covers by 15% and improve Google review rating from 4.1 to 4.5..."
                    value={form.quarterGoal}
                    onChange={(e) => update("quarterGoal", e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Used by the Strategist agent to prioritise recommendations.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3 — Cost structure */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-xs font-semibold text-amber-800">
                    Why we ask this
                  </p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    The Financial Sense-Check agent uses cost ranges to tell you whether a proposed promotion or move would meaningfully compress your margin. We never store exact figures — ranges only.
                  </p>
                </div>
                <div>
                  <label className="label">Approximate gross margin</label>
                  <p className="text-xs text-gray-500 mb-3">
                    Food & beverage revenue minus cost of goods
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {MARGIN_BANDS.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => update("grossMarginBand", b.value)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                          form.grossMarginBand === b.value
                            ? "border-brand-600 bg-brand-50 text-brand-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        )}
                      >
                        {b.label}
                        {form.grossMarginBand === b.value && (
                          <CheckCircle2 className="h-4 w-4 text-brand-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Monthly fixed costs (rent, labour, etc.)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {FIXED_COST_BANDS.map((b) => (
                      <button
                        key={b.value}
                        type="button"
                        onClick={() => update("fixedCostBand", b.value)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                          form.fixedCostBand === b.value
                            ? "border-brand-600 bg-brand-50 text-brand-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        )}
                      >
                        {b.label}
                        {form.fixedCostBand === b.value && (
                          <CheckCircle2 className="h-4 w-4 text-brand-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Key product price range</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Lunch $14–$22 · Dinner $22–$38"
                    value={form.priceRange}
                    onChange={(e) => update("priceRange", e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 4 — Operations */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <label className="label">Peak capacity (covers per service)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 60 covers per service"
                    value={form.capacity}
                    onChange={(e) => update("capacity", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Front-of-house staff size</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 8–12 per shift"
                    value={form.staffSize}
                    onChange={(e) => update("staffSize", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Peak operating hours</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Tue–Fri 11am–3pm, Thu–Sat 5pm–10pm"
                    value={form.peakHours}
                    onChange={(e) => update("peakHours", e.target.value)}
                  />
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    Why this matters
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    The Timing Analyst uses your operating hours to flag
                    conflicts — for example, a promo during a period you're
                    already at capacity won't improve revenue and creates service
                    strain.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5 — Competitor Discovery */}
            {step === 5 && (
              <div className="space-y-5">
                {!discovered ? (
                  <div className="text-center py-8">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
                      <Search className="h-7 w-7 text-brand-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">
                      Find your competitors
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                      We'll scan businesses near your location and rank
                      candidates across 5 dimensions: proximity, scale,
                      geography, product type, and positioning.
                    </p>
                    {discoverError && (
                      <p className="mt-3 text-xs text-red-600">{discoverError}</p>
                    )}
                    <button
                      onClick={runDiscovery}
                      disabled={discoverLoading}
                      className="btn-primary mt-6"
                    >
                      {discoverLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Scanning…
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Run Competitor Discovery
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {candidates.length} candidates found
                        </p>
                        <p className="text-xs text-gray-500">
                          Select up to 5 competitors to track
                        </p>
                      </div>
                      <Badge variant="brand" dot>
                        {selectedCompetitors.length}/5 selected
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {candidates.map((c) => {
                        const selected = selectedCompetitors.includes(c.place_id);
                        const disabled =
                          !selected && selectedCompetitors.length >= 5;
                        return (
                          <button
                            key={c.place_id}
                            type="button"
                            onClick={() => !disabled && toggleCompetitor(c.place_id)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                              selected
                                ? "border-brand-600 bg-brand-50"
                                : disabled
                                ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                selected
                                  ? "border-brand-600 bg-brand-600"
                                  : "border-gray-300"
                              )}
                            >
                              {selected && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">
                                  {c.name}
                                </span>
                                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600">
                                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                  {Math.round(c.composite_score * 10)}% match
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {c.address}
                              </p>
                              {c.reasoning && (
                                <p className="mt-0.5 text-xs text-gray-600">
                                  {c.reasoning}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <button className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700">
                      <Plus className="h-4 w-4" />
                      Add a competitor not in this list
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="btn-secondary gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < STEPS.length ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="btn-primary"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={finish}
                  disabled={saving}
                  className="btn-amber"
                >
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
        </main>
      </div>
    </div>
  );
}
