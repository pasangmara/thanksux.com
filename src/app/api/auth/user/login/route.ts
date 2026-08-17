import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const LOGIN_RATE_LIMIT = 8;
const LOGIN_RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(`user-login:${clientIp(request)}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts — please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    let body: { email?: unknown; password?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Supabase's own message for an unconfirmed account is distinct from a
      // wrong-password message — surfaced as-is rather than a generic
      // "invalid credentials" that would hide *why* login failed.
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
  } catch (err) {
    // Unexpected failure reaching Supabase itself, not a normal auth
    // rejection — still a clean JSON error, never an unhandled 500.
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong — please try again." },
      { status: 502 },
    );
  }
}
