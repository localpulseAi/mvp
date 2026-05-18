from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database — defaults to SQLite for local dev
    database_url: str = "sqlite+aiosqlite:///./localpulse_dev.db"
    redis_url: str = "redis://localhost:6379/0"

    # Auth
    secret_key: str = "dev-secret-key-change-in-production"
    magic_link_expire_minutes: int = 15
    session_expire_days: int = 30

    # Anthropic
    anthropic_api_key: Optional[str] = None

    # Email
    resend_api_key: Optional[str] = None
    email_from: str = "noreply@localpulse.ai"
    email_from_name: str = "LocalPulse AI"

    # External APIs
    google_places_api_key: Optional[str] = None
    apify_api_token: Optional[str] = None
    tavily_api_key: Optional[str] = None

    # Sentry
    sentry_dsn: Optional[str] = None

    # App
    app_env: str = "development"
    app_url: str = "http://localhost:3130"
    backend_url: str = "http://localhost:8990"

    # Cost budgets (USD cents)
    max_cost_per_session_cents: int = 300
    max_cost_per_owner_month_cents: int = 8000

    # Agent framework
    agent_default_model: str = "claude-sonnet-4-6"
    agent_strategist_model: str = "claude-opus-4-7"
    agent_market_analyst_timeout: int = 30
    agent_competitor_analyst_timeout: int = 35
    agent_max_validation_retries: int = 1

    # Admin (comma-separated email list for admin-only endpoints)
    admin_emails: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
