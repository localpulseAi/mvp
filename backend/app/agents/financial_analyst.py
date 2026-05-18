"""
Financial Sense-Check Agent — validates strategic options against the owner's financial constraints.

No tools needed: reasons from owner profile cost bands and the strategic question.
Never uses exact figures — ranges only, per FR-ONB-04.
Output: FinancialAnalystOutput
"""
import json
from typing import Type
from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.schemas import AgentInput, FinancialAnalystOutput


class FinancialAnalyst(BaseAgent):
    name = "financial_analyst"
    version = "1.0"
    model = "claude-sonnet-4-6"
    timeout_seconds = 90
    max_tokens = 4096

    @property
    def output_schema(self) -> Type[BaseModel]:
        return FinancialAnalystOutput

    def get_tool_names(self) -> list[str]:
        return []  # no tools — reasons from owner profile only

    def build_system_prompt(self) -> str:
        schema = FinancialAnalystOutput.model_json_schema()
        return f"""You are a Financial Sense-Check Agent for LocalPulse AI.

Your job: assess the financial implications of strategic options for a local business owner, using only the cost band ranges they've provided. You do NOT have access to exact figures, and you must NEVER ask for them or imply the owner should share them.

IMPORTANT CONSTRAINTS:
- You work only with bands (e.g., "gross margin 50-65%", "fixed costs $10k-20k/month"). Never extrapolate to exact numbers.
- Use range-based reasoning: "at the lower end of your margin band, X is viable; at the upper end, Y becomes more attractive."
- Do not make point-estimate claims. "This will cost you $2,400" is forbidden. "At your capacity and price range, this could represent a meaningful shift in contribution margin" is correct.
- Do not pressure the owner to raise prices or cut costs unless the data clearly suggests an issue.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema — no markdown, no explanation:
{json.dumps(schema, indent=2)}

GUIDELINES:
- margin_impact_assessment: qualitative impact on margin if the owner pursues the strategic question.
- pricing_signal: what the owner's price range suggests about their positioning vs the market.
- capacity_utilization_note: whether their current capacity creates financial headroom or constraint.
- financial_constraints: the 2-3 real constraints the recommendation must respect.
- viable_options: what's financially feasible within their bands, not what would be ideal in the abstract."""

    def build_user_message(self, input_data: AgentInput) -> str:
        profile = input_data.owner_profile
        window = input_data.time_window
        parts = [
            "## Owner Financial Profile (ranges only)",
            f"Niche: {profile.niche or 'restaurant'}",
        ]
        if profile.gross_margin_band:
            parts.append(f"Gross margin band: {profile.gross_margin_band}")
        if profile.fixed_cost_band:
            parts.append(f"Fixed cost band: {profile.fixed_cost_band}")
        if profile.price_range:
            parts.append(f"Price range: {profile.price_range}")
        if profile.capacity:
            parts.append(f"Capacity: {profile.capacity}")
        if profile.staff_size:
            parts.append(f"Staff size: {profile.staff_size}")
        if profile.quarter_goal:
            parts.append(f"Quarter goal: {profile.quarter_goal}")

        parts.append(f"\n## Analysis Week")
        parts.append(f"{window.week_start.isoformat()} to {window.week_end.isoformat()}")

        if input_data.question:
            parts.append(f"\n## Strategic Question to Sense-Check\n{input_data.question}")
        else:
            parts.append("\n## Context\nProvide a general financial sense-check for this week's strategic context.")

        parts.append("\nReturn your financial sense-check as JSON.")
        return "\n".join(parts)
