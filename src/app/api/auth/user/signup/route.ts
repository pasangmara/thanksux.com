import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

/**
 * [Phase 5 — Public user auth foundation] Real Supabase Auth signup — not
 * the Phase 1 hand-rolled system (data/users.json), which remains
 * exclusively the admin identity store. This is the intended path for
 * "Visitor -> Sign up" going forward; see docs/PHASE_5_AUTH.md for why
 * both systems coexist rather than being merged.
 *
 * The new auth.users row triggers Phase 3B's handle_new_user() function,
 * which creates the matching `profiles` row (role: 'user', the only role
 * this path can ever produce — same rule Phase 1's signup already
 * enforced for its own system).
 *
 * [Phase 5B — hardening] Explicit `emailRedirectTo` -> /login: Supabase's
 * confirmation link lands there whether it succeeds (a real session
 * cookie is set, login's own effect notices and can route onward) or
 * fails (Supabase appends #error=...&error_description=... to that same
 * URL — login's client-side effect parses and displays it, so an
 * expired/invalid confirmation link is never a silent dead end). Falls
 * back to localhost only in an environment with no NEXT_PUBLIC_SITE_URL
 * set — production must set this to https://thanksux.com once deployed
 * (see docs/PHASE_5B_PRODUCTION_CHECKLIST.md).
 */

const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_RATE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(`user-signup:${clientIp(request)}`, SIGNUP_RATE_LIMIT, SIGNUP_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts — please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    let body: { name?: unknown; email?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: `${siteUrl}/login` },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
    }

    // Supabase's documented anti-enumeration behavior: signing up with an
    // email that already has an account returns a 200 with a *fake* user
    // object rather than an error, specifically so this endpoint's response
    // shape can't be used to harvest which emails are registered. The real
    // signal is `identities` being empty (a genuine new signup always has
    // exactly one identity) — verified against the live API before writing
    // this check, not assumed from docs alone.
    const alreadyRegistered = Boolean(data.user) && (data.user?.identities?.length ?? 0) === 0;
    if (alreadyRegistered) {
      return NextResponse.json({ error: "An account with this email already exists. Try logging in instead." }, { status: 409 });
    }

    // Supabase's own signal for "email confirmation required": a user object
    // exists but no session was issued yet. Reported honestly to the client
    // rather than the UI pretending the account is immediately active.
    const needsEmailConfirmation = Boolean(data.user) && !data.session;

    return NextResponse.json({ needsEmailConfirmation, email });
  } catch (err) {
    // Unexpected failure reaching Supabase itself (network/outage), not a
    // normal validation rejection — still a clean JSON error, never an
    // unhandled 500 with no body for the client to read.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong — please try again." },
      { status: 502 },
    );
  }
}
