"""
Risk Analyst — identifies key risks, mitigations, and things to watch before the owner acts.

Tools used: market_data_retrieval, competitor_data_retrieval
Output: RiskAnalystOutput
"""
import json
from typing import Type
from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.schemas import AgentInput, RiskAnalystOutput


class RiskAnalyst(BaseAgent):
    name = "risk_analyst"
    version = "1.0"
    model = "claude-sonnet-4-6"
    timeout_seconds = 90
    max_tokens = 4096

    @property
    def output_schema(self) -> Type[BaseModel]:
        return RiskAnalystOutput

    def get_tool_names(self) -> list[str]:
        return ["market_data_retrieval", "competitor_data_retrieval"]

    def build_system_prompt(self) -> str:
        schema = RiskAnalystOutput.model_json_schema()
        return f"""You are a Risk Analyst for LocalPulse AI.

Your job: identify the real risks the owner faces this week — from market timing, competitive pressure, and operational constraints — and suggest concrete mitigations.

WORKFLOW:
1. Call `market_data_retrieval` to understand market timing risks (crowded occasions, low-demand periods).
2. Call `competitor_data_retrieval` to understand competitive risks (what competitors are doing that could undercut the owner's plans).
3. Synthesize into a risk assessment grounded in the data.
4. Return your analysis as JSON.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema — no markdown, no explanation:
{json.dumps(schema, indent=2)}

GUIDELINES:
- key_risks: 2-4 risks max. Be specific. "Risk of discount wars if promo launched this week given 3 competitors running promos" is useful. "Risk of low sales" is not.
- severity: high (act now), medium (monitor), low (awareness only).
- mitigation: one concrete action per risk, not a vague "consider monitoring."
- timing_risks: risks specifically related to WHEN the owner acts.
- competitive_risks: risks from competitor activity.
- operational_risks: risks from the owner's own capacity, staff, or constraints.
- risk_summary: 1-2 sentences. The single most important risk this week.
- Only flag real risks grounded in the data. Don't invent risks to fill the schema."""

    def build_user_message(self, input_data: AgentInput) -> str:
        profile = input_data.owner_profile
        window = input_data.time_window
        parts = [
            "## Owner Profile",
            f"Business: {profile.business_name or 'Unknown'}",
            f"Niche: {profile.niche or 'restaurant'}",
        ]
        if profile.capacity:
            parts.append(f"Capacity: {profile.capacity}")
        if profile.staff_size:
            parts.append(f"Staff size: {profile.staff_size}")
        if profile.quarter_goal:
            parts.append(f"Quarter goal: {profile.quarter_goal}")

        parts.append(f"\n## Analysis Window")
        parts.append(f"Week of: {window.week_start.isoformat()} to {window.week_end.isoformat()}")

        if input_data.question:
            parts.append(f"\n## Strategic Question to Risk-Assess\n{input_data.question}")

        parts.append(
            f"\nCall both tools:\n"
            f"1. `market_data_retrieval` with niche='{profile.niche or 'restaurant'}', "
            f"week_start='{window.week_start.isoformat()}', week_end='{window.week_end.isoformat()}'\n"
            f"2. `competitor_data_retrieval` with owner_id='{profile.owner_id}', window_days=7\n"
            f"\nThen return your risk analysis as JSON."
        )
        return "\n".join(parts)
