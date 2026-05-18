"""
Shared Pydantic schemas for agent inputs and outputs.
All agents receive AgentInput. Each agent defines its own output schema.
"""
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


# ── Shared input ──────────────────────────────────────────────────────────────

class OwnerProfile(BaseModel):
    owner_id: str
    business_name: Optional[str] = None
    niche: Optional[str] = "restaurant"
    address: Optional[str] = None
    business_description: Optional[str] = None
    brand_voice: Optional[str] = None
    quarter_goal: Optional[str] = None
    gross_margin_band: Optional[str] = None
    fixed_cost_band: Optional[str] = None
    price_range: Optional[str] = None
    capacity: Optional[str] = None
    staff_size: Optional[str] = None
    peak_hours: Optional[str] = None
    instagram_handle: Optional[str] = None
    facebook_page: Optional[str] = None


class TimeWindow(BaseModel):
    week_start: date
    week_end: date


class AgentInput(BaseModel):
    owner_profile: OwnerProfile
    time_window: TimeWindow
    question: Optional[str] = None  # for Strategy Sessions; null for Weekly Brief
    context: Optional[dict] = None  # extra context (e.g. Friday check-in reply)


# ── Market Analyst output ──────────────────────────────────────────────────────

class MarketSignal(BaseModel):
    signal_type: str
    description: str
    relevance: str  # high | medium | low
    source: str


class OccasionHighlight(BaseModel):
    name: str
    date: str
    days_out: int
    relevance: str  # high | medium | low
    recommendation: str


class MarketAnalystOutput(BaseModel):
    market_signals: list[MarketSignal] = Field(default_factory=list)
    occasion_highlights: list[OccasionHighlight] = Field(default_factory=list)
    weather_impact: Optional[str] = None
    demand_assessment: str
    key_opportunities: list[str] = Field(default_factory=list)
    key_risks: list[str] = Field(default_factory=list)
    data_freshness: dict[str, str] = Field(default_factory=dict)


# ── Competitor Analyst output ──────────────────────────────────────────────────

class CompetitorAssessment(BaseModel):
    competitor_name: str
    positioning_summary: str
    strengths: list[str] = Field(default_factory=list)
    vulnerabilities: list[str] = Field(default_factory=list)
    recent_shifts: str
    strategic_implication: str


class PatternAssessment(BaseModel):
    pattern: str
    competitors_involved: list[str] = Field(default_factory=list)
    implication: str
    severity: str  # high | medium | low


class CompetitorAnalystOutput(BaseModel):
    per_competitor: list[CompetitorAssessment] = Field(default_factory=list)
    cross_competitor_patterns: list[PatternAssessment] = Field(default_factory=list)
    top_observations: list[str] = Field(default_factory=list, min_length=0)
    data_freshness: dict[str, str] = Field(default_factory=dict)


# ── Brand & Positioning Analyst output ────────────────────────────────────────

class PositioningGap(BaseModel):
    gap: str
    opportunity: str
    competitor_context: str


class BrandAnalystOutput(BaseModel):
    positioning_gaps: list[PositioningGap] = Field(default_factory=list)
    differentiation_opportunities: list[str] = Field(default_factory=list)
    brand_voice_assessment: str
    competitive_whitespace: str
    messaging_recommendations: list[str] = Field(default_factory=list)
    data_freshness: dict[str, str] = Field(default_factory=dict)


# ── Timing Analyst output ──────────────────────────────────────────────────────

class TimingWindow(BaseModel):
    window: str
    reason: str
    action: str


class UpcomingDate(BaseModel):
    name: str
    date: str
    days_out: int
    action: str


class TimingAnalystOutput(BaseModel):
    best_windows_this_week: list[TimingWindow] = Field(default_factory=list)
    avoid_timing: list[str] = Field(default_factory=list)
    seasonal_context: str
    upcoming_key_dates: list[UpcomingDate] = Field(default_factory=list)
    timing_summary: str
    data_freshness: dict[str, str] = Field(default_factory=dict)


# ── Financial Sense-Check output ───────────────────────────────────────────────

class FinancialAnalystOutput(BaseModel):
    margin_impact_assessment: str
    pricing_signal: str
    capacity_utilization_note: str
    cost_risk_note: str
    financial_constraints: list[str] = Field(default_factory=list)
    viable_options: list[str] = Field(default_factory=list)
    data_freshness: dict[str, str] = Field(default_factory=dict)


# ── Risk Analyst output ────────────────────────────────────────────────────────

class RiskItem(BaseModel):
    risk: str
    severity: str  # high | medium | low
    mitigation: str


class RiskAnalystOutput(BaseModel):
    key_risks: list[RiskItem] = Field(default_factory=list)
    risk_summary: str
    timing_risks: list[str] = Field(default_factory=list)
    competitive_risks: list[str] = Field(default_factory=list)
    operational_risks: list[str] = Field(default_factory=list)
    data_freshness: dict[str, str] = Field(default_factory=dict)


# ── Strategist output ──────────────────────────────────────────────────────────

class Alternative(BaseModel):
    option: str
    rationale: str
    tradeoffs: str


class StrategistOutput(BaseModel):
    restated_question: str
    recommendation: str
    reasoning: str
    alternatives: list[Alternative] = Field(default_factory=list)
    watch_for: list[str] = Field(default_factory=list)
    key_assumptions: list[str] = Field(default_factory=list)


# ── Question parsing ───────────────────────────────────────────────────────────

class ParsedQuestion(BaseModel):
    question_type: str  # pricing | marketing | operations | staffing | competitor_response | timing | general
    scope: str  # tactical | strategic
    time_horizon: str  # this_week | this_month | this_quarter | long_term
    implicit_goal: str
    needs_clarification: bool = False
    clarifying_question: Optional[str] = None


# ── Brief synthesizer output ──────────────────────────────────────────────────

class BriefRecommendation(BaseModel):
    title: str
    body: str
    reasoning: str
    watch_for: list[str] = Field(default_factory=list)


class CompetitorBriefEntry(BaseModel):
    name: str
    observation: str
    implication: str


class BriefSynthesisOutput(BaseModel):
    market_read: str
    recommendations: list[BriefRecommendation] = Field(default_factory=list)
    watch_for: list[str] = Field(default_factory=list)
    competitor_section: Optional[list[CompetitorBriefEntry]] = None


# ── Social Presence Analyst output ────────────────────────────────────────────

class PresencePlatformState(BaseModel):
    platform: str
    assessment: str
    cadence_observation: str
    content_mix_observation: str
    recent_direction: str


class WorkingItem(BaseModel):
    observation: str
    why_it_works: str
    theme: str  # timing | content_type | occasion | tone | engagement | consistency


class NotWorkingItem(BaseModel):
    observation: str
    hypothesis: str
    category: str  # content | cadence | engagement | positioning | reviews | profile


class AuditActionItem(BaseModel):
    title: str
    priority: str   # high | medium | low
    category: str   # content | cadence | engagement | positioning | reviews | profile | other
    why: str
    how: str
    watch_for: str
    effort_band: str  # under_15_min | 15_to_60_min | over_1_hour


class PriorPlanItemProgress(BaseModel):
    title: str
    status: str  # done | in_progress | stalled | dismissed | no_longer_relevant
    signal_observed: str


class SocialPresenceAuditOutput(BaseModel):
    state_of_presence: list[PresencePlatformState] = Field(default_factory=list)
    what_working: list[WorkingItem] = Field(default_factory=list)
    what_not_working: list[NotWorkingItem] = Field(default_factory=list)
    action_plan: list[AuditActionItem] = Field(default_factory=list)
    prior_plan_progress: list[PriorPlanItemProgress] = Field(default_factory=list)
    market_connection: str = ""
    data_freshness: dict[str, str] = Field(default_factory=dict)
