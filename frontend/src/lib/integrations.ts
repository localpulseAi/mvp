/**
 * Single source of truth for which owner-account integrations exist and
 * whether they can be connected yet. Social Audit and Settings both read
 * from here so availability is labelled the same everywhere.
 */
export type IntegrationId = "instagram" | "facebook" | "google_business";

export type IntegrationStatus = "available" | "coming_soon";

export interface IntegrationMeta {
  id: IntegrationId;
  label: string;
  status: IntegrationStatus;
  /** What Agenzy reads. Always read-only. */
  access: string;
  inputLabel: string;
  placeholder: string;
}

export const INTEGRATIONS: IntegrationMeta[] = [
  {
    id: "instagram",
    label: "Instagram",
    status: "available",
    access: "Reads your public profile and recent posts. Never posts, comments, or messages.",
    inputLabel: "Instagram handle",
    placeholder: "@yourbusiness",
  },
  {
    id: "facebook",
    label: "Facebook",
    status: "available",
    access: "Reads your public Page posts. Never posts or replies on your behalf.",
    inputLabel: "Facebook Page name or URL slug",
    placeholder: "yourbusiness",
  },
  {
    id: "google_business",
    label: "Google Business",
    status: "available",
    access: "Reads your public Business Profile and reviews. Never replies to reviews or edits your listing.",
    inputLabel: "Business name or Place ID",
    placeholder: "Your Business Name",
  },
];

export const READ_ONLY_NOTE =
  "All connections are read-only. Agenzy never writes to your accounts, and you can disconnect at any time.";

export function integrationLabel(id: string): string {
  return INTEGRATIONS.find((i) => i.id === id)?.label ?? id.replace(/_/g, " ");
}
