import { NextResponse } from "next/server";
import { getCurrentUser } from "./session";
import type { PublicUser } from "@/types/auth";

/**
 * [Phase 1 — Authentication Foundation] Defense-in-depth authorization
 * checks for Route Handlers — called at the top of every `/api/admin/*`
 * handler in addition to `proxy.ts`'s route-level gate. This isn't
 * redundant: Next's own `proxy.js` documentation explicitly recommends
 * this precise pattern — "Always verify authentication and authorization
 * inside each Server Function rather than relying on Proxy alone," since
 * a future matcher change or route refactor could silently remove Proxy
 * coverage without anyone noticing.
 *
 * Both helpers return either `{ user }` (proceed) or `{ response }` (the
 * caller returns this immediately) — a discriminated result rather than
 * throwing, so a route handler's control flow stays a plain `if`, no
 * try/catch required for the common case.
 */

type AuthResult = { user: PublicUser; response?: undefined } | { user?: undefined; response: NextResponse };

export async function requireUser(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }
  return { user };
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireUser();
  if (result.response) return result;
  if (result.user.role !== "admin") {
    return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  }
  return result;
}
