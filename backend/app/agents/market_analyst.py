"""
Market Analyst agent — analyzes market signals for the owner's niche and week.

Tools used: market_data_retrieval
Output: MarketAnalystOutput
"""
import json
from typing import Type
from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.schemas import AgentInput, MarketAnalystOutput


class MarketAnalyst(BaseAgent):
    name = "market_analyst"
    version = "1.0"
    model = "claude-sonnet-4-6"
    timeout_seconds = 90
    max_tokens = 4096

    @property
    def output_schema(self) -> Type[BaseModel]:
        return MarketAnalystOutput

    def get_tool_names(self) -> list[str]:
        return ["market_data_retrieval"]

    def build_system_prompt(self) -> str:
        schema = MarketAnalystOutput.model_json_schema()
        return f"""You are a Market Analyst for LocalPulse AI, an AI marketing strategist for independent local businesses.

Your job: analyze market-level signals for the upcoming week and assess what they mean for the owner's specific business.

WORKFLOW:
1. Call the `market_data_retrieval` tool with the owner's niche and time window to get the occasions calendar and market data.
2. Analyze the returned data through the lens of the owner's business profile, goals, and constraints.
3. Return your analysis as a JSON object.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema — no markdown, no explanation, just the JSON:
{json.dumps(schema, indent=2)}

ANALYSIS GUIDELINES:
- Be specific to this owner's niche and business context, not generic.
- The demand_assessment must be 2-3 sentences maximum: what this week looks like for their business.
- Occasion highlights: include only occasions with high or medium relevance, and the recommendation must be actionable.
- key_opportunities: 2-4 concrete, actionable opportunities for this owner this week.
- key_risks: 1-3 real risks (not hypotheticals) based on the data.
- Do not make up data. Only analyze what the tool returns.
- Do not include probability estimates or confidence scores.
- If weather or trends data is unavailable, note that in data_freshness and omit from analysis."""

    def build_user_message(self, input_data: AgentInput) -> str:
        profile = input_data.owner_profile
        window = input_data.time_window
        parts = [
            f"## Owner Profile",
            f"Business: {profile.business_name or 'Unknown'}",
            f"Niche: {profile.niche or 'restaurant'}",
            f"Location: {profile.address or 'Calgary, AB'}",
        ]
        if profile.business_description:
            parts.append(f"Description: {profile.business_description}")
        if profile.quarter_goal:
            parts.append(f"Current goal: {profile.quarter_goal}")
        if profile.price_range:
            parts.append(f"Price range: {profile.price_range}")
        if profile.capacity:
            parts.append(f"Capacity: {profile.capacity}")
        if profile.peak_hours:
            parts.append(f"Peak hours: {profile.peak_hours}")
        if profile.gross_margin_band:
            parts.append(f"Gross margin band: {profile.gross_margin_band}")

        parts.append(f"\n## Analysis Window")
        parts.append(f"Week of: {window.week_start.isoformat()} to {window.week_end.isoformat()}")

        if input_data.question:
            parts.append(f"\n## Strategic Question")
            parts.append(input_data.question)

        parts.append(
            f"\nCall `market_data_retrieval` with niche='{profile.niche or 'restaurant'}', "
            f"week_start='{window.week_start.isoformat()}', week_end='{window.week_end.isoformat()}', "
            f"then return your analysis as JSON."
        )
        return "\n".join(parts)
