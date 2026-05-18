"""
Agent registry — maps agent names to agent classes.
"""
from app.agents.base import BaseAgent
from app.agents.market_analyst import MarketAnalyst
from app.agents.competitor_analyst import CompetitorAnalyst
from app.agents.brand_analyst import BrandAnalyst
from app.agents.timing_analyst import TimingAnalyst
from app.agents.financial_analyst import FinancialAnalyst
from app.agents.risk_analyst import RiskAnalyst
from app.agents.strategist import Strategist
from app.agents.social_presence_analyst import SocialPresenceAnalyst

AGENT_REGISTRY: dict[str, type[BaseAgent]] = {
    "market_analyst": MarketAnalyst,
    "competitor_analyst": CompetitorAnalyst,
    "brand_analyst": BrandAnalyst,
    "timing_analyst": TimingAnalyst,
    "financial_analyst": FinancialAnalyst,
    "risk_analyst": RiskAnalyst,
    "strategist": Strategist,
    "social_presence_analyst": SocialPresenceAnalyst,
}

# The six analysts run in parallel before the Strategist
ANALYST_AGENTS = [
    "market_analyst",
    "competitor_analyst",
    "brand_analyst",
    "timing_analyst",
    "financial_analyst",
    "risk_analyst",
]
