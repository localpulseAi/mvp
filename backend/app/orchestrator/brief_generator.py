"""
Weekly Brief generation — orchestrates Market Analyst + Competitor Analyst,
then calls a lightweight synthesizer to assemble the structured brief.

The synthesizer is a direct Anthropic API call (not a full agent) that takes
both analyst outputs and produces the final brief structure. Week 6's Strategist
agent will replace this with a richer synthesis pass.
"""
import asyncio
import json
import uuid
from datetime import date, timedelta, datetime, timezone
from typing import Optional

import structlog
from anthropic import AsyncAnthropic
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.schemas import (
    AgentInput,
    OwnerProfile,
    TimeWindow,
    MarketAnalystOutput,
    CompetitorAnalystOutput,
    BriefSynthesisOutput,
    BriefRecommendation,
)
from app.config import settings
from app.models.brief import WeeklyBrief
from app.models.owner import Owner
from app.orchestrator.dispatcher import dispatch_agents

log = structlog.get_logger()

SYNTHESIZER_MODEL = "claude-sonnet-4-6"
SYNTHESIZER_TIMEOUT = 90


def _current_week_bounds() -> tuple[date, date]:
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    sunday = monday + timedelta(days=6)
    return monday, sunday


def _owner_to_profile(owner: Owner) -> OwnerProfile:
    return OwnerProfile(
        owner_id=str(owner.id),
        business_name=owner.business_name,
        niche=owner.niche or "restaurant",
        address=owner.address,
        business_description=owner.business_description,
        brand_voice=owner.brand_voice,
        quarter_goal=owner.quarter_goal,
        gross_margin_band=owner.gross_margin_band,
        fixed_cost_band=owner.fixed_cost_band,
        price_range=owner.price_range,
        capacity=owner.capacity,
        staff_size=owner.staff_size,
        peak_hours=owner.peak_hours,
        instagram_handle=owner.instagram_handle,
        facebook_page=owner.facebook_page,
    )


async def _synthesize_brief(
    market_output: MarketAnalystOutput,
    competitor_output: Optional[CompetitorAnalystOutput],
    owner_profile: OwnerProfile,
    week_start: date,
    week_end: date,
) -> BriefSynthesisOutput:
    """
    Lightweight synthesis call: takes both analyst outputs and produces the brief structure.
    This is a direct API call, not a full BaseAgent, because it's a one-shot summarization.
    """
    if not settings.anthropic_api_key:
        return BriefSynthesisOutput(
            market_read=market_output.demand_assessment,
            recommendations=[
                BriefRecommendation(
                    title=opp,
                    body=opp,
                    reasoning="Based on market analysis",
                    watch_for=[],
                )
                for opp in market_output.key_opportunities[:3]
            ],
            watch_for=market_output.key_risks[:3],
        )

    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    schema = BriefSynthesisOutput.model_json_schema()
    system = f"""You are a marketing strategist writing a Weekly Strategic Brief for an independent local business owner.

You will receive structured market analysis and competitor analysis. Your job is to synthesize these into a concise, actionable weekly brief.

OUTPUT FORMAT:
Return ONLY a valid JSON object matching this schema — no markdown, no explanation:
{json.dumps(schema, indent=2)}

GUIDELINES:
- market_read: 3-4 sentences. What is the market context this week? What does it mean for this business specifically?
- recommendations: 2-4 concrete, prioritized actions the owner should take this week. Each recommendation must be specific enough to act on immediately.
- watch_for: 3-5 signals the owner should monitor this week.
- competitor_section: only include if there are notable competitor movements worth flagging. null if nothing significant.
- Write as if you are a trusted advisor, not a consultant generating a generic report.
- Be direct. No hedging language, no "consider potentially exploring."
"""

    market_data = market_output.model_dump(mode="json")
    competitor_data = competitor_output.model_dump(mode="json") if competitor_output else None

    user_content = {
        "owner": {
            "business_name": owner_profile.business_name,
            "niche": owner_profile.niche,
            "quarter_goal": owner_profile.quarter_goal,
            "price_range": owner_profile.price_range,
            "brand_voice": owner_profile.brand_voice,
        },
        "week": {"start": week_start.isoformat(), "end": week_end.isoformat()},
        "market_analysis": market_data,
        "competitor_analysis": competitor_data,
    }

    response = await asyncio.wait_for(
        client.messages.create(
            model=SYNTHESIZER_MODEL,
            max_tokens=4096,
            system=system,
            messages=[{"role": "user", "content": json.dumps(user_content, indent=2)}],
        ),
        timeout=SYNTHESIZER_TIMEOUT,
    )

    text = next((b.text for b in response.content if b.type == "text"), "")

    # Parse output
    from app.agents.base import _extract_json
    try:
        parsed = _extract_json(text)
        return BriefSynthesisOutput.model_validate(parsed)
    except Exception as e:
        log.error("synthesizer_parse_failed", error=str(e)[:200])
        return BriefSynthesisOutput(
            market_read=market_output.demand_assessment,
            recommendations=[
                BriefRecommendation(title=opp, body=opp, reasoning="Market analysis", watch_for=[])
                for opp in market_output.key_opportunities[:3]
            ],
            watch_for=market_output.key_risks,
        )


async def generate_brief(owner: Owner, db: AsyncSession) -> WeeklyBrief:
    """
    Generate a Weekly Strategic Brief for one owner.
    Creates or updates the WeeklyBrief row for the current week.
    """
    week_start, week_end = _current_week_bounds()
    owner_id = owner.id

    # Check if a brief for this week already exists
    existing = await db.execute(
        select(WeeklyBrief).where(
            and_(
                WeeklyBrief.owner_id == owner_id,
                WeeklyBrief.week_start == week_start,
            )
        )
    )
    brief = existing.scalar_one_or_none()

    if brief and brief.status == "completed":
        # Already completed — return as-is (caller can mark as regenerating)
        return brief

    if not brief:
        brief = WeeklyBrief(
            owner_id=owner_id,
            week_start=week_start,
            week_end=week_end,
            status="generating",
        )
        db.add(brief)
        await db.commit()
        await db.refresh(brief)
    else:
        brief.status = "generating"
        await db.commit()

    log.info("brief_generation_start", owner_id=str(owner_id), week_start=week_start.isoformat())

    profile = _owner_to_profile(owner)
    input_data = AgentInput(
        owner_profile=profile,
        time_window=TimeWindow(week_start=week_start, week_end=week_end),
    )

    # Dispatch analysts in parallel
    orch_result = await dispatch_agents(
        agent_names=["market_analyst", "competitor_analyst"],
        input_data=input_data,
        owner_id=owner_id,
        trigger="weekly_brief",
        db=db,
    )

    brief.orchestration_id = orch_result.orchestration_id

    # Extract typed outputs
    market_output: Optional[MarketAnalystOutput] = None
    competitor_output: Optional[CompetitorAnalystOutput] = None

    market_result = orch_result.results.get("market_analyst")
    if market_result and market_result.output:
        market_output = market_result.output

    comp_result = orch_result.results.get("competitor_analyst")
    if comp_result and comp_result.output:
        competitor_output = comp_result.output

    if not market_output:
        brief.status = "failed"
        await db.commit()
        log.error("brief_generation_failed_no_market", owner_id=str(owner_id))
        return brief

    # Synthesize the brief from analyst outputs
    try:
        synthesis = await _synthesize_brief(
            market_output, competitor_output, profile, week_start, week_end
        )
    except Exception as e:
        log.error("brief_synthesis_failed", owner_id=str(owner_id), error=type(e).__name__ + ": " + str(e))
        synthesis = BriefSynthesisOutput(
            market_read=market_output.demand_assessment,
            recommendations=[
                BriefRecommendation(title=opp, body=opp, reasoning="Market analysis", watch_for=[])
                for opp in market_output.key_opportunities[:3]
            ],
            watch_for=market_output.key_risks,
        )

    # Build data_freshness from both agents
    data_freshness = dict(market_output.data_freshness)
    if competitor_output:
        data_freshness.update(competitor_output.data_freshness)

    # Competitor section
    comp_section = None
    if synthesis.competitor_section:
        comp_section = {
            "entries": [e.model_dump(mode="json") for e in synthesis.competitor_section]
        }

    # Full output for archival
    full_output = {
        "market_analysis": market_output.model_dump(mode="json"),
        "competitor_analysis": competitor_output.model_dump(mode="json") if competitor_output else None,
        "synthesis": synthesis.model_dump(mode="json"),
        "orchestration": {
            "id": str(orch_result.orchestration_id),
            "status": orch_result.status,
            "total_cost_cents": orch_result.total_cost_cents,
            "total_latency_ms": orch_result.total_latency_ms,
        },
    }

    brief.status = "completed"
    brief.market_read = synthesis.market_read
    brief.recommendations = [r.model_dump(mode="json") for r in synthesis.recommendations]
    brief.watch_for = synthesis.watch_for
    brief.competitor_section = comp_section
    brief.data_freshness = data_freshness
    brief.full_output = full_output
    brief.generated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(brief)

    log.info(
        "brief_generation_complete",
        owner_id=str(owner_id),
        brief_id=str(brief.id),
        cost_cents=orch_result.total_cost_cents,
        latency_ms=orch_result.total_latency_ms,
    )

    return brief
