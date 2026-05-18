"""
Competitor Analyst agent — analyzes competitor activity for the owner's tracked set.

Tools used: competitor_data_retrieval
Output: CompetitorAnalystOutput
"""
import json
from typing import Type
from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.schemas import AgentInput, CompetitorAnalystOutput


class CompetitorAnalyst(BaseAgent):
    name = "competitor_analyst"
    version = "1.0"
    model = "claude-sonnet-4-6"
    timeout_seconds = 90
    max_tokens = 4096

    @property
    def output_schema(self) -> Type[BaseModel]:
        return CompetitorAnalystOutput

    def get_tool_names(self) -> list[str]:
        return ["competitor_data_retrieval"]

    def build_system_prompt(self) -> str:
        schema = CompetitorAnalystOutput.model_json_schema()
        return f"""You are a Competitor Analyst for LocalPulse AI, an AI marketing strategist for independent local businesses.

Your job: analyze competitor activity for an owner's tracked competitor set and produce strategic intelligence they can act on.

WORKFLOW:
1. Call the `competitor_data_retrieval` tool with the owner_id to get competitor summaries, change events, and patterns.
2. For each competitor with notable changes, assess what those changes mean strategically for the owner.
3. Identify patterns across the competitive set.
4. Produce exactly 3 top_observations: the 3 most strategically important things the owner needs to know.
5. Return your analysis as a JSON object.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema — no markdown, no explanation, just the JSON:
{json.dumps(schema, indent=2)}

ANALYSIS GUIDELINES:
- Base your analysis ONLY on the data the tool returns. Do not fabricate competitor behavior.
- Never expose raw scraped metrics or follower counts to the owner. Interpret and analyze only.
- per_competitor: only include competitors where there is something worth saying. If no data exists, say so.
- top_observations must contain EXACTLY 3 items: the 3 most strategically important observations.
- Be direct and specific. "Competitor X increased posting frequency 80% this week, suggesting a push around [occasion]" is useful. "Competitors are posting regularly" is not.
- strategic_implication should tell the owner what to DO or consider, not just what a competitor did.
- If no competitor data exists (new account, no scrapes yet), note that clearly and provide general framing."""

    def build_user_message(self, input_data: AgentInput) -> str:
        profile = input_data.owner_profile
        window = input_data.time_window
        parts = [
            f"## Owner Profile",
            f"Business: {profile.business_name or 'Unknown'}",
            f"Niche: {profile.niche or 'restaurant'}",
        ]
        if profile.business_description:
            parts.append(f"Description: {profile.business_description}")
        if profile.quarter_goal:
            parts.append(f"Current goal: {profile.quarter_goal}")
        if profile.brand_voice:
            parts.append(f"Brand voice: {profile.brand_voice}")

        parts.append(f"\n## Analysis Window")
        parts.append(f"Week of: {window.week_start.isoformat()} to {window.week_end.isoformat()}")

        if input_data.question:
            parts.append(f"\n## Strategic Question")
            parts.append(input_data.question)

        parts.append(
            f"\nCall `competitor_data_retrieval` with owner_id='{profile.owner_id}', "
            f"window_days=7, then return your competitor analysis as JSON."
        )
        return "\n".join(parts)
