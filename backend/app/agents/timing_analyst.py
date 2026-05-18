"""
Timing Analyst — identifies optimal timing windows, key upcoming dates, and timing risks.

Tools used: market_data_retrieval
Output: TimingAnalystOutput
"""
import json
from typing import Type
from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.schemas import AgentInput, TimingAnalystOutput


class TimingAnalyst(BaseAgent):
    name = "timing_analyst"
    version = "1.0"
    model = "claude-sonnet-4-6"
    timeout_seconds = 90
    max_tokens = 4096

    @property
    def output_schema(self) -> Type[BaseModel]:
        return TimingAnalystOutput

    def get_tool_names(self) -> list[str]:
        return ["market_data_retrieval"]

    def build_system_prompt(self) -> str:
        schema = TimingAnalystOutput.model_json_schema()
        return f"""You are a Timing Analyst for LocalPulse AI.

Your job: identify the best timing windows for marketing activity this week, flag upcoming occasions that warrant advance preparation, and surface any timing risks.

WORKFLOW:
1. Call `market_data_retrieval` with the owner's niche and time window to get the occasions calendar.
2. Analyze the occasions and seasonal context through the lens of the owner's peak hours, capacity, and niche.
3. Identify specific time windows (days of week, times of day) where marketing activity will have the highest impact.
4. Return your analysis as JSON.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema — no markdown, no explanation:
{json.dumps(schema, indent=2)}

GUIDELINES:
- best_windows_this_week: 2-4 specific windows. "Tuesday-Thursday 5-8pm" is useful. "Evenings" is not.
- avoid_timing: moments when marketing activity would be wasted or harmful (e.g., competitor event clashes, local conflicts).
- upcoming_key_dates: focus on dates within the next 21 days that require action now (lead time window).
- timing_summary: 2 sentences max. The single most important timing insight for this week.
- Base analysis on the occasions calendar the tool returns, combined with the owner's operating profile."""

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
        if profile.peak_hours:
            parts.append(f"Peak hours: {profile.peak_hours}")
        if profile.quarter_goal:
            parts.append(f"Quarter goal: {profile.quarter_goal}")

        parts.append(f"\n## Analysis Window")
        parts.append(f"Week of: {window.week_start.isoformat()} to {window.week_end.isoformat()}")

        if input_data.question:
            parts.append(f"\n## Strategic Question\n{input_data.question}")

        parts.append(
            f"\nCall `market_data_retrieval` with niche='{profile.niche or 'restaurant'}', "
            f"week_start='{window.week_start.isoformat()}', week_end='{window.week_end.isoformat()}', "
            f"then return your timing analysis as JSON."
        )
        return "\n".join(parts)
