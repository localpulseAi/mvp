"""
Brand & Positioning Analyst — identifies positioning gaps, competitive whitespace, and messaging opportunities.

Tools used: competitor_data_retrieval
Output: BrandAnalystOutput
"""
import json
from typing import Type
from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.schemas import AgentInput, BrandAnalystOutput


class BrandAnalyst(BaseAgent):
    name = "brand_analyst"
    version = "1.0"
    model = "claude-sonnet-4-6"
    timeout_seconds = 90
    max_tokens = 4096

    @property
    def output_schema(self) -> Type[BaseModel]:
        return BrandAnalystOutput

    def get_tool_names(self) -> list[str]:
        return ["competitor_data_retrieval"]

    def build_system_prompt(self) -> str:
        schema = BrandAnalystOutput.model_json_schema()
        return f"""You are a Brand & Positioning Analyst for LocalPulse AI.

Your job: identify positioning gaps in the competitive landscape and surface differentiation opportunities the owner can own.

WORKFLOW:
1. Call `competitor_data_retrieval` to understand what the owner's competitors are signaling about their positioning (their messaging, hashtags, promotional themes, and brand signals).
2. Compare competitor positioning against the owner's own brand voice, description, and goals.
3. Identify unoccupied territory — what no competitor is clearly owning.
4. Return your analysis as JSON.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema — no markdown, no explanation:
{json.dumps(schema, indent=2)}

GUIDELINES:
- positioning_gaps: only flag gaps where the owner could credibly occupy the space given their brand voice and niche.
- competitive_whitespace: the single clearest territory no competitor is owning right now.
- brand_voice_assessment: how coherent and distinctive the owner's brand voice is, based on what they've described.
- messaging_recommendations: 2-4 concrete messaging angles the owner could lean into.
- Do not repeat the same insight in multiple fields.
- Base analysis on the competitor data the tool returns, not assumptions."""

    def build_user_message(self, input_data: AgentInput) -> str:
        profile = input_data.owner_profile
        window = input_data.time_window
        parts = [
            "## Owner Profile",
            f"Business: {profile.business_name or 'Unknown'}",
            f"Niche: {profile.niche or 'restaurant'}",
        ]
        if profile.business_description:
            parts.append(f"Description: {profile.business_description}")
        if profile.brand_voice:
            parts.append(f"Brand voice: {profile.brand_voice}")
        if profile.quarter_goal:
            parts.append(f"Quarter goal: {profile.quarter_goal}")
        if profile.price_range:
            parts.append(f"Price range: {profile.price_range}")

        if input_data.question:
            parts.append(f"\n## Strategic Question\n{input_data.question}")

        parts.append(
            f"\nCall `competitor_data_retrieval` with owner_id='{profile.owner_id}', "
            f"window_days=7, then return your brand and positioning analysis as JSON."
        )
        return "\n".join(parts)
