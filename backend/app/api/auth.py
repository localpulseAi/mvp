import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.owner import Owner, MagicLinkToken, OwnerSession
from app.services.auth_service import (
    create_magic_link_token,
    verify_magic_link_token,
    create_session_token,
    hash_token,
    get_current_owner,
)
from app.services.email_service import send_magic_link_email
import structlog

router = APIRouter(prefix="/auth", tags=["auth"])
log = structlog.get_logger()


@router.post("/request-magic-link", status_code=200)
async def request_magic_link(
    email: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    FR-AUTH-01, FR-AUTH-02: Send a magic link to the provided email.
    Creates the owner account if it doesn't exist.
    """
    email = email.lower().strip()

    # Get or create owner
    result = await db.execute(select(Owner).where(Owner.email == email))
    owner = result.scalar_one_or_none()

    if not owner:
        owner = Owner(email=email)
        db.add(owner)
        await db.flush()

    # Create magic link token
    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.magic_link_expire_minutes)

    magic_link = MagicLinkToken(
        owner_id=owner.id,
        token=raw_token,
        expires_at=expires_at,
    )
    db.add(magic_link)
    await db.commit()

    # Send email
    magic_link_url = f"{settings.app_url}/verify?token={raw_token}"
    await send_magic_link_email(
        to_email=email,
        magic_link_url=magic_link_url,
    )

    log.info("magic_link_sent", email=email, owner_id=str(owner.id))

    # Always return 200 regardless of whether email exists (security: don't enumerate accounts)
    return {"message": "If that email is registered, a sign-in link has been sent."}


@router.get("/verify")
async def verify_magic_link(
    token: str,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    FR-AUTH-01: Verify magic link token and issue a session.
    """
    owner = await verify_magic_link_token(token, db)
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired sign-in link.",
        )

    # Create session
    session_token = secrets.token_urlsafe(64)
    token_hash = hash_token(session_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.session_expire_days)

    session = OwnerSession(
        owner_id=owner.id,
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
    )
    db.add(session)
    await db.commit()

    log.info("session_created", owner_id=str(owner.id))

    # Set httpOnly cookie (FR-AUTH-04 / NFR-SEC-04)
    response.set_cookie(
        key="session",
        value=session_token,
        httponly=True,
        secure=settings.app_env == "production",
        samesite="lax",
        max_age=settings.session_expire_days * 86400,
    )

    return {
        "owner_id": str(owner.id),
        "onboarding_completed": owner.onboarding_completed,
        "redirect": "/onboarding" if not owner.onboarding_completed else "/dashboard",
    }


@router.post("/logout", status_code=200)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """FR-AUTH-04: Logout and terminate session."""
    session_token = request.cookies.get("session")
    if session_token:
        token_hash = hash_token(session_token)
        result = await db.execute(
            select(OwnerSession).where(OwnerSession.token_hash == token_hash)
        )
        session = result.scalar_one_or_none()
        if session:
            await db.delete(session)
            await db.commit()

    response.delete_cookie("session")
    return {"message": "Logged out."}


@router.get("/me")
async def get_me(owner: Owner = Depends(get_current_owner)):
    """Get the current authenticated owner."""
    return {
        "id": str(owner.id),
        "email": owner.email,
        "onboarding_completed": owner.onboarding_completed,
        "onboarding_step": owner.onboarding_step,
        "business_name": owner.business_name,
        "is_founding_member": owner.is_founding_member,
        "subscription_active": owner.subscription_active,
    }
