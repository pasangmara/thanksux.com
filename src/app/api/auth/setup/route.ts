import { NextResponse } from "next/server";
import { countUsers, createUser } from "@/lib/auth/usersRepository";
import { createSession } from "@/lib/auth/sessionsRepository";
import { isPasswordAcceptable } from "@/lib/auth/passwords";
import { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME, isSecureCookieEnv } from "@/lib/auth/constants";
import { toPublicUser } from "@/types/auth";

/**
 * [Phase 1 — Authentication Foundation] The one path to creating an
 * Admin account — deliberately not a seeded/invented credential (no
 * hardcoded email or password anywhere in this codebase, no
 * `ADMIN_BOOTSTRAP_PASSWORD`-style env var). The real person running this
 * software creates their own real account through this real form, the
 * same "first user becomes admin" pattern many self-hosted apps (Ghost,
 * WordPress, etc.) use for exactly this bootstrap problem. Once any user
 * exists, this endpoint permanently refuses to create another admin —
 * `GET` reports availability so the UI can hide/show the form correctly.
 */

export async function GET() {
  const available = (await countUsers()) === 0;
  return NextResponse.json({ available });
}

export async function POST(request: Request) {
  if ((await countUsers()) > 0) {
    return NextResponse.json({ error: "Setup has already been completed." }, { status: 403 });
  }

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

  // [Race-safety] Two near-simultaneous setup submissions could both pass
  // the countUsers() check above before either writes — createUser()'s
  // own email-uniqueness check doesn't help here (different emails).
  // Re-check immediately before creating, closing the window as tightly
  // as this file-store's atomic-write model allows without a real
  // transaction (which the file store doesn't provide — a real DB
  // migration removes this race entirely).
  if ((await countUsers()) > 0) {
    return NextResponse.json({ error: "Setup has already been completed." }, { status: 403 });
  }

  const user = await createUser({ email, password, name, role: "admin" });
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
}
