"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Info, Loader2, MapPin, Pencil, Save, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateProfile, type OwnerProfile } from "@/lib/api";
import { errorMessage } from "@/lib/workspace";
import { Section } from "./primitives";

type Field = keyof OwnerProfile;
type FieldDef = { label: string; field: Field; span?: boolean; multi?: boolean; hint?: string };

/** Needed before recommendations can be tailored at all. */
const REQUIRED: FieldDef[] = [
  { label: "Business name", field: "business_name" },
  { label: "Business category", field: "niche", hint: "e.g. café, salon, boutique" },
  { label: "Street address", field: "address", span: true, hint: "Used to find nearby occasions and competitors" },
  { label: "This quarter's goal", field: "quarter_goal", span: true, multi: true, hint: "One sentence is enough" },
];

/** Improves relevance; ranges only, never exact financials. */
const OPTIONAL_CONTEXT: FieldDef[] = [
  { label: "Brand voice", field: "brand_voice", span: true, multi: true },
  { label: "Instagram handle", field: "instagram_handle" },
  { label: "Facebook page", field: "facebook_page" },
  { label: "Gross margin band", field: "gross_margin_band" },
  { label: "Monthly fixed costs", field: "fixed_cost_band" },
  { label: "Price range", field: "price_range" },
  { label: "Staff size", field: "staff_size" },
  { label: "Spare capacity", field: "capacity", span: true },
  { label: "Peak hours", field: "peak_hours", span: true },
];

const EDITABLE: Field[] = [...REQUIRED, ...OPTIONAL_CONTEXT].map((f) => f.field).concat("business_description");

function FieldBox({
  def,
  value,
  editing,
  missing,
  onChange,
}: {
  def: FieldDef;
  value: string;
  editing: boolean;
  missing?: boolean;
  onChange: (v: string) => void;
}) {
  const id = `profile-${def.field}`;
  const hintId = def.hint ? `${id}-hint` : undefined;
  return (
    <div className={cn(def.span && "sm:col-span-2")}>
      <label htmlFor={editing ? id : undefined} className="label">
        {def.label}
      </label>
      {editing ? (
        def.multi ? (
          <textarea id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} className="input resize-none" aria-describedby={hintId} />
        ) : (
          <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input" aria-describedby={hintId} />
        )
      ) : (
        <p
          className={cn(
            "min-h-[42px] rounded-control border px-4 py-2.5 text-sm",
            missing ? "border-dashed border-brand-300 bg-lilac/40 text-gray-500" : "border-gray-200/70 bg-white text-ink"
          )}
        >
          {value || (missing ? "Needed" : <span className="text-gray-400">Not set</span>)}
        </p>
      )}
      {editing && def.hint && <p id={hintId} className="mt-1 text-xs text-gray-500">{def.hint}</p>}
    </div>
  );
}

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

export function ProfileSection({
  profile,
  isDemo,
  onSaved,
  onDirtyChange,
}: {
  profile: OwnerProfile;
  isDemo: boolean;
  onSaved: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [form, setForm] = useState<Partial<OwnerProfile>>(profile);

  useEffect(() => setForm(profile), [profile]);

  const val = (f: Field) => ((form[f] as string | null) ?? "");
  const dirty = editing && EDITABLE.some((f) => (form[f] ?? "") !== (profile[f] ?? ""));
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const missingRequired = useMemo(() => REQUIRED.filter((d) => !((profile[d.field] as string | null) ?? "").trim()), [profile]);

  function upd(field: Field, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (save.kind !== "saving") setSave({ kind: "idle" });
  }

  function cancel() {
    setEditing(false);
    setForm(profile);
    setSave({ kind: "idle" });
  }

  async function handleSave() {
    setSave({ kind: "saving" });
    const payload = Object.fromEntries(EDITABLE.map((f) => [f, (form[f] as string | null) ?? undefined]));
    try {
      await updateProfile(payload);
      setSave({ kind: "saved" });
      setEditing(false);
      onSaved();
    } catch (err) {
      setSave({ kind: "error", message: errorMessage(err) });
    }
  }

  const initials = (form.business_name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <Section
      title="Business profile"
      description="The context Agenzy uses to tailor every recommendation."
      action={
        isDemo ? null : editing ? (
          <div className="flex gap-2">
            <button onClick={cancel} disabled={save.kind === "saving"} className="btn-secondary">
              <X className="h-4 w-4" aria-hidden="true" /> Cancel
            </button>
            <button onClick={handleSave} disabled={save.kind === "saving" || !dirty} className="btn-primary">
              {save.kind === "saving" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              {save.kind === "saving" ? "Saving…" : "Save changes"}
            </button>
          </div>
        ) : (
          <button onClick={() => { setEditing(true); setSave({ kind: "idle" }); }} className="btn-secondary self-start">
            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit profile
          </button>
        )
      }
    >
      {/* Save feedback, announced */}
      <div aria-live="polite" className="empty:hidden">
        {save.kind === "saved" && (
          <p className="mb-4 flex items-center gap-2 rounded-control border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Profile saved.
          </p>
        )}
        {save.kind === "error" && (
          <p role="alert" className="mb-4 rounded-control border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
            Couldn&apos;t save your profile: {save.message} Your edits are still here.
          </p>
        )}
      </div>

      {isDemo && (
        <p className="mb-4 flex items-start gap-2 rounded-control border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
          Editing is turned off in the demo workspace. Sign in to update your own business profile.
        </p>
      )}

      {/* First task: complete required context (live only) */}
      {!isDemo && missingRequired.length > 0 && !editing && (
        <div className="card-ink mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lime-300">Start here</p>
            <p className="mt-1 font-display text-lg font-semibold">Add the basics so recommendations fit your business</p>
            <p className="mt-1 text-sm text-white/70">
              Missing: {missingRequired.map((d) => d.label.toLowerCase()).join(", ")}.
            </p>
          </div>
          <button onClick={() => setEditing(true)} className="btn-lime shrink-0">
            Complete required context <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Identity card */}
      <div className="card-lilac mb-6 p-5 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-600 font-display text-lg font-semibold text-white shadow-violet sm:h-16 sm:w-16 sm:text-xl">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-xl font-semibold text-ink">{form.business_name || "Your business"}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              {form.address && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                  <span className="truncate">{form.address}</span>
                </span>
              )}
              {form.niche && (
                <span className="flex items-center gap-1.5 capitalize">
                  <Users className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                  {form.niche}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="section-title">Required context</h3>
          <p className="text-xs text-gray-500">
            {REQUIRED.length - missingRequired.length} of {REQUIRED.length} complete
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {REQUIRED.map((def) => (
            <FieldBox
              key={def.field}
              def={def}
              value={val(def.field)}
              editing={editing}
              missing={!isDemo && missingRequired.includes(def)}
              onChange={(v) => upd(def.field, v)}
            />
          ))}
        </div>
      </div>

      <div className="card mt-4 p-5 sm:p-6">
        <h3 className="section-title">Optional context</h3>
        <p className="mb-4 mt-1 text-xs text-gray-500">Makes advice more specific. Ranges only; Agenzy never asks for exact financials.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {OPTIONAL_CONTEXT.map((def) => (
            <FieldBox key={def.field} def={def} value={val(def.field)} editing={editing} onChange={(v) => upd(def.field, v)} />
          ))}
        </div>
      </div>
    </Section>
  );
}
