const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8990";

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export function requestMagicLink(email: string) {
  return apiFetch<{ message: string }>(`/auth/request-magic-link?email=${encodeURIComponent(email)}`, {
    method: "POST",
  });
}

export function verifyToken(token: string) {
  return apiFetch<{ owner_id: string; onboarding_completed: boolean; redirect: string }>(
    `/auth/verify?token=${encodeURIComponent(token)}`
  );
}

export function logout() {
  return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

// ── Owner profile ─────────────────────────────────────────────────────────────

export type OwnerProfile = {
  id: string;
  email: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  business_name: string | null;
  address: string | null;
  niche: string | null;
  instagram_handle: string | null;
  facebook_page: string | null;
  business_description: string | null;
  brand_voice: string | null;
  quarter_goal: string | null;
  gross_margin_band: string | null;
  fixed_cost_band: string | null;
  price_range: string | null;
  capacity: string | null;
  staff_size: string | null;
  peak_hours: string | null;
  subscription_active: boolean;
  is_founding_member: boolean;
};

export function getMe() {
  return apiFetch<OwnerProfile>("/owners/me");
}

export function updateProfile(data: Partial<Omit<OwnerProfile, "id" | "email">>) {
  return apiFetch<{ updated: string[]; onboarding_completed: boolean }>("/owners/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ── Discovery ─────────────────────────────────────────────────────────────────

export type DiscoveryCandidate = {
  place_id: string;
  name: string;
  address: string;
  rating: number | null;
  review_count: number;
  google_business_url: string;
  composite_score: number;
  reasoning: string;
  scores: Record<string, number>;
};

export function discoverCompetitors(params: {
  address: string;
  niche: string;
  business_name: string;
  business_description?: string;
}) {
  return apiFetch<{ candidates: DiscoveryCandidate[]; total_found: number; shortlisted: number }>(
    "/discovery/competitors",
    { method: "POST", body: JSON.stringify(params) }
  );
}

// ── Competitors ───────────────────────────────────────────────────────────────

export function addCompetitor(data: {
  name: string;
  address?: string;
  google_place_id?: string;
  google_business_url?: string;
}) {
  return apiFetch("/competitors", { method: "POST", body: JSON.stringify(data) });
}

// ── Briefs ────────────────────────────────────────────────────────────────────

export type BriefRecommendation = {
  title: string;
  body: string;
  reasoning: string;
  watch_for: string[];
};

export type CompetitorBriefEntry = {
  name: string;
  observation: string;
  implication: string;
};

export type WeeklyBriefOut = {
  id: string;
  week_start: string;
  week_end: string;
  status: string;
  market_read: string | null;
  recommendations: BriefRecommendation[] | null;
  watch_for: string[] | null;
  competitor_section: { entries: CompetitorBriefEntry[] } | null;
  data_freshness: Record<string, string> | null;
  generated_at: string;
};

export function getCurrentBrief() {
  return apiFetch<{ brief: WeeklyBriefOut } | null>("/briefs/current");
}

export function generateBrief() {
  return apiFetch<{ message: string }>("/briefs/generate", { method: "POST" });
}

export function listBriefs() {
  return apiFetch<{ briefs: { id: string; week_start: string; week_end: string; status: string }[] }>("/briefs");
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export type StrategistOutput = {
  restated_question: string;
  recommendation: string;
  reasoning: string;
  alternatives: { option: string; rationale: string; tradeoffs: string }[];
  watch_for: string[];
  key_assumptions: string[];
};

export type SessionTurn = {
  turn_number: number;
  question: string;
  is_followup: boolean;
  strategist_output: StrategistOutput | null;
  cost_cents: number;
  latency_ms: number;
};

export type SessionSummary = {
  id: string;
  status: string;
  original_question: string;
  parsed_type: string | null;
  turn_count: number;
  total_cost_cents: number;
  created_at: string;
};

export type SessionDetail = SessionSummary & {
  implicit_goal: string | null;
  turns: SessionTurn[];
};

export function listSessions() {
  return apiFetch<{ sessions: SessionSummary[]; total: number }>("/sessions");
}

export function getSession(sessionId: string) {
  return apiFetch<{ session: SessionDetail }>(`/sessions/${sessionId}`);
}

export function startSession(question: string) {
  return apiFetch<{
    session_id: string;
    status: string;
    turn: SessionTurn | null;
    clarifying_question?: string;
  }>("/sessions", { method: "POST", body: JSON.stringify({ question }) });
}

export function addFollowup(sessionId: string, question: string) {
  return apiFetch<{
    session_id: string;
    status: string;
    turn: SessionTurn | null;
  }>(`/sessions/${sessionId}/followup`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

// ── Market ────────────────────────────────────────────────────────────────────

export type OccasionItem = {
  id: string;
  name: string;
  date: string;
  days_out: number;
  category: string | null;
  niche_tags: string[] | null;
};

export function getOccasions(niche?: string) {
  const qs = niche ? `?niche=${encodeURIComponent(niche)}` : "";
  return apiFetch<{ occasions: OccasionItem[] }>(`/market/occasions${qs}`);
}

// ── Competitors (extended) ────────────────────────────────────────────────────

export type CompetitorOut = {
  id: string;
  name: string;
  address: string | null;
  google_place_id: string | null;
  instagram_handle: string | null;
  facebook_page: string | null;
  google_business_url: string | null;
  is_active: boolean;
  baseline_complete: boolean;
  added_at: string;
};

export type AnalysisItem = {
  id: string;
  competitor_id: string;
  generated_at: string;
  positioning_summary: string | null;
  strengths: string[] | null;
  vulnerabilities: string[] | null;
  recent_shifts: string | null;
  strategic_implication: string | null;
  data_freshness: Record<string, string> | null;
};

export type ChangeItem = {
  competitor_id: string;
  competitor_name: string;
  change_type: string;
  description: string;
  severity: "high" | "medium" | "low";
  detected_at: string;
  source?: string;
};

export type PatternItem = {
  pattern_type?: string;
  description: string;
  severity: "high" | "medium" | "low";
  competitors_involved: string[];
  strategic_implication?: string;
  detected_at?: string;
};

export function getCompetitors() {
  return apiFetch<CompetitorOut[]>("/competitors");
}

export function removeCompetitor(id: string) {
  return apiFetch<void>(`/competitors/${id}`, { method: "DELETE" });
}

export function analyzeAllCompetitors() {
  return apiFetch<Record<string, unknown>>("/competitors/analyze-all", { method: "POST" });
}

export function getAllAnalyses() {
  return apiFetch<{ analyses: AnalysisItem[]; total: number }>("/competitor-data/analysis");
}

export function getRecentChanges(windowDays = 7) {
  return apiFetch<{ changes: ChangeItem[]; total: number }>(
    `/competitor-data/changes?window_days=${windowDays}`
  );
}

export function getCrossPatterns(windowDays = 30) {
  return apiFetch<{ patterns: PatternItem[]; total: number }>(
    `/competitor-data/patterns?window_days=${windowDays}`
  );
}

// ── Social Presence Audit ─────────────────────────────────────────────────────

export type SocialAuditAccount = {
  id: string;
  platform: string;
  handle: string | null;
  display_name: string | null;
  is_active: boolean;
  connected_at: string;
  last_scraped_at: string | null;
  last_scrape_status: string | null;
};

export type AuditActionItem = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  category: string;
  why: string;
  how: string;
  watch_for: string;
  effort_band: string;
  status: "pending" | "in_progress" | "done" | "dismissed";
  display_order: number;
};

export type PlatformState = {
  platform: string;
  assessment: string;
  cadence_observation: string;
  content_mix_observation: string;
  recent_direction: string;
};

export type WorkingItem = {
  observation: string;
  why_it_works: string;
  theme: string;
};

export type NotWorkingItem = {
  observation: string;
  hypothesis: string;
  category: string;
};

export type PriorPlanProgress = {
  title: string;
  status: string;
  signal_observed: string;
};

export type SocialAuditDetail = {
  id: string;
  week_start: string;
  week_end: string;
  status: string;
  state_of_presence: PlatformState[] | null;
  what_working: WorkingItem[] | null;
  what_not_working: NotWorkingItem[] | null;
  prior_plan_progress: PriorPlanProgress[] | null;
  market_connection: string | null;
  data_freshness: Record<string, string> | null;
  action_items: AuditActionItem[];
  generated_at: string;
};

export type AuditSummary = {
  id: string;
  week_start: string;
  week_end: string;
  status: string;
  generated_at: string;
  action_item_count: number;
  has_prior_plan_progress: boolean;
};

export function getSocialAccounts() {
  return apiFetch<{ accounts: SocialAuditAccount[] }>("/social-audit/accounts");
}

export function connectSocialAccount(platform: string, handle: string, display_name?: string) {
  return apiFetch<{ account: SocialAuditAccount }>("/social-audit/accounts", {
    method: "POST",
    body: JSON.stringify({ platform, handle, display_name }),
  });
}

export function disconnectSocialAccount(id: string) {
  return apiFetch<{ status: string }>(`/social-audit/accounts/${id}`, { method: "DELETE" });
}

export function getCurrentAudit() {
  return apiFetch<{ audit: SocialAuditDetail | null }>("/social-audit/current");
}

export function listAudits(limit = 10) {
  return apiFetch<{ audits: AuditSummary[]; total: number }>(`/social-audit?limit=${limit}`);
}

export function triggerAuditGenerate() {
  return apiFetch<{ status: string; week_start: string }>("/social-audit/generate", { method: "POST" });
}

export function updateActionItemStatus(itemId: string, status: string) {
  return apiFetch<{ item: AuditActionItem }>(`/social-audit/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function getActiveActionItems() {
  return apiFetch<{ items: AuditActionItem[] }>("/social-audit/items/active");
}
