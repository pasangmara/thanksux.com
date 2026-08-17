import { NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/auth/usersRepository";
import { createSession } from "@/lib/auth/sessionsRepository";
import { SESSION_COOKIE_MAX_AGE_SECONDS, SESSION_COOKIE_NAME, isSecureCookieEnv } from "@/lib/auth/constants";
import { toPublicUser } from "@/types/auth";

/** [Phase 1 — Authentication Foundation] Real credential verification (scrypt, timing-safe compare — see lib/auth/passwords.ts) — never a bypass, never a hardcoded credential. Deliberately generic error message (doesn't reveal whether the email exists) to avoid user enumeration. */
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = email && password ? await verifyCredentials(email, password) : undefined;
  if (!user) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const session = await createSession(user.id);
  const response = NextResponse.json({ user: toPublicUser(user) });
  response.cookies.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: isSecureCookieEnv(),
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
