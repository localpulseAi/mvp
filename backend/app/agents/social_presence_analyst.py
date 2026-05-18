"""
Social Presence Analyst — analyses the owner's own social media presence.

Tools used: owner_social_data_retrieval
Output: SocialPresenceAuditOutput
"""
import json
from typing import Type
from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.schemas import AgentInput, SocialPresenceAuditOutput


class SocialPresenceAnalyst(BaseAgent):
    name = "social_presence_analyst"
    version = "1.0"
    model = "claude-sonnet-4-6"
    timeout_seconds = 90
    max_tokens = 4096

    @property
    def output_schema(self) -> Type[BaseModel]:
        return SocialPresenceAuditOutput

    def get_tool_names(self) -> list[str]:
        return ["owner_social_data_retrieval"]

    def build_system_prompt(self) -> str:
        schema = SocialPresenceAuditOutput.model_json_schema()
        return f"""You are a Social Presence Analyst for LocalPulse AI, an AI marketing strategist for independent local businesses.

Your job: read the owner's own social media presence the way a strategist would — not as a dashboard of numbers, but as a narrative of what they're putting out, how it's landing, and what to do differently.

WORKFLOW:
1. Call `owner_social_data_retrieval` with the owner_id to get their social content and prior action plan.
2. For each connected platform, assess what they're posting, how often, and what patterns emerge.
3. Identify 2–4 specific things that are working (with the WHY — timing, occasion alignment, tone, content type, consistency).
4. Identify 2–3 things that are not working (with a hypothesis for WHY — not just what, but the reasoning behind it).
5. If a prior action plan exists, assess each item: what changed, what signal do you see, what's the status?
6. Produce 3–7 ranked action items that are concrete and owner-doable.
7. Write a brief market_connection tying the findings to the occasion calendar or competitive context.
8. Return your audit as a JSON object.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema — no markdown, no explanation, just the JSON:
{json.dumps(schema, indent=2)}

ANALYSIS GUIDELINES:
- Base your analysis ONLY on the data the tool returns. Do not fabricate content or engagement patterns.
- Do NOT expose raw metrics as headlines. Interpret them. "Posted 3 times last week, down from 8 the week before" is supporting context — not the finding.
- what_working: be specific about WHY it worked. "Your Tuesday lunch post got strong engagement — the timing (11am) and the photo of the daily special aligns with when locals are searching for lunch options in your area" is useful. "Your posts are doing well" is not.
- what_not_working: lead with the hypothesis. Not "your engagement is low" but "your captions tend to be short and post-only — no calls to action, no local hooks — which likely explains why comments are minimal despite decent reach."
- action_plan: 3–7 items only. Each item must be owner-doable without a marketing team. Specific enough that the owner could do it tomorrow.
- effort_band: under_15_min | 15_to_60_min | over_1_hour — be realistic.
- prior_plan_progress: for each prior item, assign one status and explain what signal you saw. "stalled" means no observable change. "done" means you see evidence they acted on it.
- Never use verdict language. Never produce numerical confidence scores. Write as a trusted strategic advisor.
- If no social data exists (no connected accounts or all scrapes failed), note that clearly with a connect-account recommendation as the top action item.
- market_connection: 2–3 sentences max. Tie to specific upcoming occasions or what competitors are doing if relevant."""

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
            parts.append(f"Current quarter goal: {profile.quarter_goal}")

        parts.append("\n## Audit Period")
        parts.append(f"Week of: {window.week_start.isoformat()} to {window.week_end.isoformat()}")

        if input_data.context:
            market_ctx = input_data.context.get("market_context")
            if market_ctx:
                parts.append("\n## Market Context (for market_connection field)")
                parts.append(str(market_ctx)[:500])

        parts.append(
            f"\nCall `owner_social_data_retrieval` with owner_id='{profile.owner_id}', "
            f"window_days=30, include_prior_plan=true. "
            f"Then return your Social Presence Audit as JSON."
        )
        return "\n".join(parts)
