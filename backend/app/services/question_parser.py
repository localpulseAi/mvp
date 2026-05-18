"""
Question parsing — classifies the owner's strategic question before dispatching agents.

A lightweight direct Anthropic call (not a full agent) that extracts:
- question_type (pricing | marketing | operations | staffing | competitor_response | timing | general)
- scope (tactical | strategic)
- time_horizon (this_week | this_month | this_quarter | long_term)
- implicit_goal
- needs_clarification + clarifying_question (for ambiguous questions)
"""
import asyncio
import json

import structlog
from anthropic import AsyncAnthropic

from app.agents.base import _extract_json
from app.agents.schemas import OwnerProfile, ParsedQuestion
from app.config import settings

log = structlog.get_logger()

PARSER_MODEL = "claude-haiku-4-5-20251001"  # fast + cheap for classification
PARSER_TIMEOUT = 15

_SYSTEM = """You are a question classifier for LocalPulse AI. Your job is to parse a business owner's strategic question and extract structure from it.

Return ONLY a valid JSON object with these fields:
{
  "question_type": "pricing | marketing | operations | staffing | competitor_response | timing | general",
  "scope": "tactical | strategic",
  "time_horizon": "this_week | this_month | this_quarter | long_term",
  "implicit_goal": "what the owner is really trying to achieve (1 sentence)",
  "needs_clarification": false,
  "clarifying_question": null
}

Set needs_clarification=true and provide a clarifying_question ONLY if the question is so ambiguous that answering it without clarification would produce generic advice. Most questions should NOT need clarification — use context from the owner profile to fill gaps.

Examples where clarification IS needed:
- "Should I do it?" (no context at all)
- A question with two completely different possible interpretations

Examples where clarification is NOT needed:
- "Should I run a Mother's Day promotion?" → marketing, this_week, implicit goal = drive incremental covers
- "My competitor just cut prices. What do I do?" → competitor_response, this_week
- "How do I increase my margins?" → pricing/operations, this_quarter"""


async def parse_question(question: str, owner_profile: OwnerProfile) -> ParsedQuestion:
    """
    Classify and structure the owner's question.
    Falls back to a default ParsedQuestion if the API call fails.
    """
    if not settings.anthropic_api_key:
        return ParsedQuestion(
            question_type="general",
            scope="tactical",
            time_horizon="this_week",
            implicit_goal="Improve business performance",
        )

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    user_content = (
        f"Owner profile:\n"
        f"- Business: {owner_profile.business_name or 'Unknown'}\n"
        f"- Niche: {owner_profile.niche or 'restaurant'}\n"
        f"- Quarter goal: {owner_profile.quarter_goal or 'Not specified'}\n\n"
        f"Question to parse:\n{question}"
    )

    try:
        response = await asyncio.wait_for(
            client.messages.create(
                model=PARSER_MODEL,
                max_tokens=512,
                system=_SYSTEM,
                messages=[{"role": "user", "content": user_content}],
            ),
            timeout=PARSER_TIMEOUT,
        )
        text = next((b.text for b in response.content if b.type == "text"), "")
        parsed = _extract_json(text)
        result = ParsedQuestion.model_validate(parsed)
        log.info(
            "question_parsed",
            question_type=result.question_type,
            scope=result.scope,
            needs_clarification=result.needs_clarification,
        )
        return result
    except Exception as e:
        log.warning("question_parse_failed", error=str(e)[:100])
        return ParsedQuestion(
            question_type="general",
            scope="tactical",
            time_horizon="this_week",
            implicit_goal="Improve business performance",
        )
