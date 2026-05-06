from typing import Optional
from app.config import settings
import structlog

log = structlog.get_logger()


async def send_magic_link_email(
    to_email: str,
    magic_link_url: str,
    business_name: Optional[str] = None,
) -> bool:
    """
    Send a magic link email via Resend (or log in development).
    Returns True on success.
    """
    if settings.app_env == "development" or not settings.resend_api_key:
        # In development, just log the link
        log.info(
            "magic_link_email_dev",
            to=to_email,
            url=magic_link_url,
            note="Set RESEND_API_KEY to send real emails",
        )
        return True

    try:
        import httpx

        payload = {
            "from": f"{settings.email_from_name} <{settings.email_from}>",
            "to": [to_email],
            "subject": "Your LocalPulse sign-in link",
            "html": _build_magic_link_html(magic_link_url, business_name),
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json=payload,
                timeout=10,
            )
            response.raise_for_status()

        log.info("magic_link_email_sent", to=to_email)
        return True

    except Exception as e:
        log.error("magic_link_email_failed", to=to_email, error=str(e))
        return False


async def send_weekly_brief_email(
    to_email: str,
    brief_html: str,
    business_name: str,
    week_of: str,
) -> bool:
    """Send the weekly strategic brief via email."""
    if settings.app_env == "development" or not settings.resend_api_key:
        log.info("weekly_brief_email_dev", to=to_email, week_of=week_of)
        return True

    try:
        import httpx

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.resend_api_key}"},
                json={
                    "from": f"LocalPulse AI <{settings.email_from}>",
                    "to": [to_email],
                    "subject": f"Your Weekly Strategic Brief — Week of {week_of}",
                    "html": brief_html,
                },
                timeout=15,
            )
            response.raise_for_status()

        log.info("brief_email_sent", to=to_email)
        return True

    except Exception as e:
        log.error("brief_email_failed", to=to_email, error=str(e))
        return False


def _build_magic_link_html(magic_link_url: str, business_name: Optional[str]) -> str:
    greeting = f"Hi {business_name}," if business_name else "Hi there,"
    return f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; color: #111827;">
      <div style="margin-bottom: 32px;">
        <span style="display: inline-block; background: #7c3aed; color: white; padding: 6px 12px; border-radius: 8px; font-size: 14px; font-weight: 700; letter-spacing: -0.3px;">LocalPulse AI</span>
      </div>
      <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 8px; color: #111827;">Sign in to LocalPulse</h1>
      <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">{greeting} Click the button below to sign in. This link expires in 15 minutes.</p>
      <a href="{magic_link_url}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 28px; border-radius: 12px; font-size: 15px; font-weight: 700; text-decoration: none; margin-bottom: 28px;">Sign in to LocalPulse</a>
      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6;">If you didn't request this, you can safely ignore this email. No account will be created.</p>
      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 28px 0;">
      <p style="color: #9ca3af; font-size: 12px;">LocalPulse AI · Calgary, AB · <a href="#" style="color: #9ca3af;">Privacy Policy</a></p>
    </body>
    </html>
    """
