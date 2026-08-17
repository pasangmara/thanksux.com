/**
 * [Phase 1 — Authentication Foundation] Shared between `proxy.ts` (uses
 * `NextRequest`/`NextResponse`'s cookie API) and Route Handlers/Server
 * Components (use `next/headers`'s `cookies()`) — two different cookie
 * APIs, so the name/options are centralized here rather than the
 * cookie-manipulation code itself, which each context calls natively.
 */
export const SESSION_COOKIE_NAME = "session";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days — matches sessionsRepository.ts's SESSION_TTL_MS

/** `secure` only in production — a `secure` cookie is silently dropped by browsers over plain http, which would break local dev (http://localhost). */
export function isSecureCookieEnv(): boolean {
  return process.env.NODE_ENV === "production";
}
