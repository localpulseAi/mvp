import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.owner import Owner, MagicLinkToken, OwnerSession


def hash_token(token: str) -> str:
    """SHA-256 hash a token for storage. Never store raw session tokens."""
    return hashlib.sha256(token.encode()).hexdigest()


async def verify_magic_link_token(
    token: str,
    db: AsyncSession,
) -> Optional[Owner]:
    """
    Verify a magic link token. Returns the Owner if valid, None otherwise.
    Marks the token as used on success.
    """
    result = await db.execute(
        select(MagicLinkToken).where(MagicLinkToken.token == token)
    )
    magic_link = result.scalar_one_or_none()

    if not magic_link:
        return None

    now = datetime.now(timezone.utc)

    # Check expiry — SQLite returns naive datetimes; make tz-aware before comparing
    expires_at = magic_link.expires_at.replace(tzinfo=timezone.utc) if magic_link.expires_at.tzinfo is None else magic_link.expires_at
    if expires_at < now:
        return None

    # Check already used
    if magic_link.used_at is not None:
        return None

    # Mark as used — store naive UTC so SQLite reads it back consistently
    magic_link.used_at = now.replace(tzinfo=None)
    await db.flush()

    # Fetch owner
    result = await db.execute(select(Owner).where(Owner.id == magic_link.owner_id))
    owner = result.scalar_one_or_none()
    return owner


async def create_magic_link_token(owner_id: str, db: AsyncSession) -> str:
    """Create and store a magic link token. Returns the raw token."""
    from datetime import timedelta
    from app.config import settings

    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.magic_link_expire_minutes
    )
    token = MagicLinkToken(
        owner_id=owner_id,
        token=raw_token,
        expires_at=expires_at,
    )
    db.add(token)
    await db.flush()
    return raw_token


async def create_session_token(owner_id: str, db: AsyncSession) -> str:
    """Create and store a session. Returns the raw session token."""
    from datetime import timedelta
    from app.config import settings

    raw_token = secrets.token_urlsafe(64)
    token_hash = hash_token(raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.session_expire_days
    )
    session = OwnerSession(
        owner_id=owner_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.add(session)
    await db.flush()
    return raw_token


async def get_current_owner(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Owner:
    """
    FastAPI dependency: extract session token from cookie, validate, return Owner.
    Raises 401 if not authenticated.
    """
    session_token = request.cookies.get("session")
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    token_hash = hash_token(session_token)
    result = await db.execute(
        select(OwnerSession)
        .where(OwnerSession.token_hash == token_hash)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session.",
        )

    now = datetime.now(timezone.utc)
    session_expires_at = session.expires_at.replace(tzinfo=timezone.utc) if session.expires_at.tzinfo is None else session.expires_at
    if session_expires_at < now:
        await db.delete(session)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please sign in again.",
        )

    # Update last_active
    session.last_active_at = now

    result = await db.execute(select(Owner).where(Owner.id == session.owner_id))
    owner = result.scalar_one_or_none()

    if not owner:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Owner not found.",
        )

    await db.commit()
    return owner
