/** Sign-in settings shared by /login and /verify. */

/**
 * Published privacy policy URL. Leave null until a real policy exists —
 * the UI only renders a policy link when this is set. Never invent one.
 */
export const PRIVACY_POLICY_URL: string | null = null;

/** Matches backend settings.magic_link_expire_minutes (backend/app/config.py). */
export const LINK_EXPIRY_MINUTES = 15;

/** Seconds before another link can be requested. */
export const RESEND_COOLDOWN_SECONDS = 30;

export const SUPPORT_EMAIL = "hello@agenzy.online";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
