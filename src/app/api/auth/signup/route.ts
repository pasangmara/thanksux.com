import { NextResponse } from "next/server";
import { createUser } from "@/lib/auth/usersRepository";
import { createSession } from "@/lib/auth/sessionsRepository";
import { isPasswordAcceptable } from "@/lib/auth/passwords";
import { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME, isSecureCookieEnv } from "@/lib/auth/constants";
import { toPublicUser } from "@/types/auth";

/**
 * [Phase 1 — Authentication Foundation] Public signup — creates a
 * `role: "user"` account, never `"admin"` (the only path to an admin
 * account is `/api/auth/setup`, gated to when zero users exist — see that
 * route). No UI page links to this yet (no public feature consumes a
 * Registered User today — Thanks UX's community layer is explicitly out
 * of scope for this phase), but the endpoint itself is real and tested,
 * ready for Phase 5.
 */
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown; name?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!isPasswordAcceptable(password)) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const user = await createUser({ email, password, name, role: "user" });
    const session = await createSession(user.id);

    const response = NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
    response.cookies.set(SESSION_COOKIE_NAME, session.id, {
      httpOnly: true,
      secure: isSecureCookieEnv(),
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create account." },
      { status: 409 },
    );
  }
}
