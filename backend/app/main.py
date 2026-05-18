import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import create_tables
import app.models  # ensure all tables are registered with Base.metadata
from app.api import auth, market, competitors, competitor_data, briefs, agent_runs, sessions, discovery, owners, admin, social_audit

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.dev.ConsoleRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(20),  # INFO level
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
)
log = structlog.get_logger()

# Optional Sentry
if settings.sentry_dsn:
    try:
        import sentry_sdk
        sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.app_env)
    except ImportError:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("startup", env=settings.app_env)
    await create_tables()
    yield
    log.info("shutdown")


app = FastAPI(
    title="LocalPulse AI API",
    version="0.1.0",
    description="AI marketing strategist for Calgary restaurant owners",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.app_url, "http://localhost:3130"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(market.router, prefix="/api/v1")
app.include_router(competitors.router, prefix="/api/v1")
app.include_router(competitor_data.router, prefix="/api/v1")
app.include_router(briefs.router, prefix="/api/v1")
app.include_router(agent_runs.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")
app.include_router(discovery.router, prefix="/api/v1")
app.include_router(owners.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(social_audit.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.app_env, "version": "0.1.0"}


@app.get("/")
async def root():
    return {"service": "LocalPulse AI API", "docs": "/docs"}
