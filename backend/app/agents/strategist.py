"""
Strategist Agent — synthesizes all analyst outputs into a final recommendation.

No tools: analyst outputs are injected directly into the user message via AgentInput.context.
Uses claude-opus-4-7 (highest quality) per DEV_PLAN: "synthesis is the highest quality bar."
Output: StrategistOutput
"""
import json
from typing import Type
from pydantic import BaseModel

from app.agents.base import BaseAgent
from app.agents.schemas import AgentInput, StrategistOutput


class Strategist(BaseAgent):
    name = "strategist"
    version = "1.0"
    model = "claude-opus-4-7"
    timeout_seconds = 60
    max_tokens = 4096

    @property
    def output_schema(self) -> Type[BaseModel]:
        return StrategistOutput

    def get_tool_names(self) -> list[str]:
        return []  # no tools — synthesizes analyst outputs from context

    def build_system_prompt(self) -> str:
        schema = StrategistOutput.model_json_schema()
        return f"""You are the Strategist for LocalPulse AI — an AI marketing strategist for independent local businesses.

You receive structured analysis from six specialist analysts (Market, Competitor, Brand, Timing, Financial, Risk) and synthesize it into a clear, actionable recommendation for the business owner.

Your output must read like advice from a trusted advisor who has thought carefully about the owner's specific situation — not a generic consultant's report.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema — no markdown, no explanation:
{json.dumps(schema, indent=2)}

SYNTHESIS GUIDELINES:

restated_question:
- Restate the owner's question in your own words, including what you infer their real goal to be.
- If the question was vague, clarify what you took it to mean. This helps the owner confirm you understood.

recommendation:
- 2-3 paragraphs. The specific action you recommend and why, given the full context from all analysts.
- Be direct. "Run a two-item prix-fixe on Tuesday and Thursday next week, priced at the top of your range" beats "consider a promotional offer."
- Reference the market context and competitive landscape where relevant, but don't pad.

reasoning:
- 1 paragraph. Why this recommendation over the alternatives. What evidence from the analysts pushed you toward this conclusion.

alternatives:
- 2-3 genuine alternatives, not strawmen. Each should be something a reasonable person might choose.
- tradeoffs must be honest — both what the owner gains and what they give up.

watch_for:
- 3-5 signals the owner should monitor in the next 1-2 weeks to confirm the recommendation is working or adjust if it isn't.
- Be specific: "If engagement on your Tuesday post exceeds your recent 7-day average by 20%+" is useful. "Monitor engagement" is not.

key_assumptions:
- 2-4 things this advice assumes to be true. If an assumption is wrong, the recommendation may need to change.
- Example: "Assumes your fixed costs are covered by your baseline volume, leaving promotional spend as upside."

TONE:
- Write as the owner's trusted advisor, not a consultant or report generator.
- Be direct, specific, and honest. Do not hedge every statement.
- Do not use phrases like "it's important to note," "consider potentially," or "it may be worth exploring."
- Never use em dashes."""

    def build_user_message(self, input_data: AgentInput) -> str:
        profile = input_data.owner_profile
        window = input_data.time_window
        context = input_data.context or {}
        analyst_outputs = context.get("analyst_outputs", {})
        parsed_question = context.get("parsed_question", {})
        history = context.get("session_history", [])

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
        if profile.capacity:
            parts.append(f"Capacity: {profile.capacity}")
        if profile.gross_margin_band:
            parts.append(f"Gross margin band: {profile.gross_margin_band}")

        parts.append(f"\n## Analysis Week")
        parts.append(f"{window.week_start.isoformat()} to {window.week_end.isoformat()}")

        if input_data.question:
            parts.append(f"\n## Owner's Question\n{input_data.question}")

        if parsed_question:
            parts.append(f"\n## Question Context (parsed)")
            parts.append(f"Type: {parsed_question.get('question_type', 'general')}")
            parts.append(f"Scope: {parsed_question.get('scope', 'tactical')}")
            parts.append(f"Implicit goal: {parsed_question.get('implicit_goal', '')}")

        if history:
            parts.append(f"\n## Session History (prior turns)")
            for turn in history[-2:]:  # last 2 turns for context
                parts.append(f"Q: {turn.get('question', '')}")
                prev_rec = turn.get("strategist_output", {}).get("recommendation", "")
                if prev_rec:
                    parts.append(f"Previous recommendation (summary): {prev_rec[:300]}...")

        if analyst_outputs:
            parts.append("\n## Analyst Intelligence")
            for agent_name, output in analyst_outputs.items():
                if output:
                    parts.append(f"\n### {agent_name.replace('_', ' ').title()}")
                    parts.append(json.dumps(output, indent=2))
        else:
            parts.append("\n## Note\nNo analyst data available. Provide general strategic guidance based on the owner profile and question.")

        parts.append("\n\nSynthesize the above and return your recommendation as JSON.")
        return "\n".join(parts)
