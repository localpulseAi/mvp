from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Use aiosqlite for dev if DATABASE_URL is sqlite, otherwise asyncpg for postgres
database_url = settings.database_url
if database_url.startswith("sqlite"):
    # aiosqlite driver
    if not database_url.startswith("sqlite+aiosqlite"):
        database_url = database_url.replace("sqlite://", "sqlite+aiosqlite://", 1)

_is_sqlite = "sqlite" in database_url
_connect_args = {"check_same_thread": False} if _is_sqlite else {"statement_cache_size": 0}

engine = create_async_engine(
    database_url,
    echo=settings.app_env == "development",
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
