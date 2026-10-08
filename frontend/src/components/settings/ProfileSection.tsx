"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Pencil, Save, Sparkles, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { updateProfile, type OwnerProfile } from "@/lib/api";
import { Section } from "./primitives";

type Field = keyof OwnerProfile;

const profileFields: { label: string; field: Field; span?: boolean; multi?: boolean }[] = [
  { label: "Business name", field: "business_name" },
  { label: "Niche", field: "niche" },
  { label: "Address", field: "address", span: true },
  { label: "Instagram", field: "instagram_handle" },
  { label: "Facebook page", field: "facebook_page" },
  { label: "Brand voice", field: "brand_voice", span: true, multi: true },
  { label: "This quarter's goal", field: "quarter_goal", span: true, multi: true },
];

const opsFields: { label: string; field: Field }[] = [
  { label: "Gross margin band", field: "gross_margin_band" },
  { label: "Monthly fixed costs", field: "fixed_cost_band" },
  { label: "Price range", field: "price_range" },
  { label: "Peak capacity", field: "capacity" },
  { label: "Staff size", field: "staff_size" },
  { label: "Peak hours", field: "peak_hours" },
];

function FieldBox({
  label,
  field,
  value,
  editing,
  multi,
  className,
  onChange,
}: {
  label: string;
  field: string;
  value: string;
  editing: boolean;
  multi?: boolean;
  className?: string;
  onChange: (v: string) => void;
}) {
  const id = `profile-${field}`;
  return (
    <div className={className}>
      <label htmlFor={editing ? id : undefined} className="label">{label}</label>
      {editing ? (
        multi ? (
          <textarea id={id} rows={2} value={value} onChange={(e) => onChange(e.target.value)} className="input resize-none" />
        ) : (
          <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className="input" />
        )
      ) : (
        <p className="min-h-[42px] rounded-control border border-gray-200/70 bg-white px-4 py-2.5 text-sm text-ink">
          {value || <span className="text-gray-400">Not set</span>}
        </p>
      )}
    </div>
  );
}

export function ProfileSection({ profile, onSaved }: { profile: OwnerProfile | null; onSaved: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Partial<OwnerProfile>>({});

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  function upd(field: Field, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updateProfile({
        business_name: form.business_name ?? undefined,
        address: form.address ?? undefined,
        niche: form.niche ?? undefined,
        instagram_handle: form.instagram_handle ?? undefined,
        facebook_page: form.facebook_page ?? undefined,
        business_description: form.business_description ?? undefined,
        brand_voice: form.brand_voice ?? undefined,
        quarter_goal: form.quarter_goal ?? undefined,
        gross_margin_band: form.gross_margin_band ?? undefined,
        fixed_cost_band: form.fixed_cost_band ?? undefined,
        price_range: form.price_range ?? undefined,
        capacity: form.capacity ?? undefined,
        staff_size: form.staff_size ?? undefined,
        peak_hours: form.peak_hours ?? undefined,
      });
      onSaved();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  const initials = (form.business_name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const val = (f: Field) => (form[f] as string) ?? "";

  return (
    <Section
      title="Business profile"
      description="The context Agenzy uses to tailor every recommendation."
      action={
        editing ? (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setError(""); if (profile) setForm(profile); }} className="btn-secondary">
              <X className="h-4 w-4" /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-secondary self-start">
            <Pencil className="h-4 w-4" /> Edit profile
          </button>
        )
      }
    >
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Identity card */}
      <div className="card-lilac mb-6 p-5 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 font-display text-lg font-semibold text-white shadow-violet sm:h-16 sm:w-16 sm:text-xl">
              {initials}
            </div>
            {profile?.is_founding_member && (
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-lime-300 ring-2 ring-lilac">
                <Sparkles className="h-3 w-3 text-ink" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-display text-xl font-semibold text-ink">{form.business_name || "Your business"}</h3>
              {profile?.is_founding_member && <Badge variant="lime">Founding member</Badge>}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              {form.address && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-600" />
                  <span className="truncate">{form.address}</span>
                </span>
              )}
              {form.niche && (
                <span className="flex items-center gap-1.5 capitalize">
                  <Users className="h-3.5 w-3.5 text-brand-600" />
                  {form.niche}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h3 className="section-title mb-4">Business details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {profileFields.map(({ label, field, span, multi }) => (
            <FieldBox
              key={field}
              label={label}
              field={field}
              value={val(field)}
              editing={editing}
              multi={multi}
              className={cn(span && "sm:col-span-2")}
              onChange={(v) => upd(field, v)}
            />
          ))}
        </div>
      </div>

      <div className="card mt-4 p-5 sm:p-6">
        <h3 className="section-title">Operations</h3>
        <p className="mb-4 mt-1 text-xs text-gray-500">Ranges only. Agenzy never asks for exact financials.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {opsFields.map(({ label, field }) => (
            <FieldBox
              key={field}
              label={label}
              field={field}
              value={val(field)}
              editing={editing}
              onChange={(v) => upd(field, v)}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
