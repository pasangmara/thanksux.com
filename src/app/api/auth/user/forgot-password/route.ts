import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

/**
 * [Phase 5 — Public user auth foundation] Real Supabase Auth password
 * reset request. IMPORTANT, honestly documented: this project's Supabase
 * project has no custom SMTP provider configured (confirmed via the
 * Management API before writing this route — smtp_host is unset), so
 * Supabase falls back to its own built-in shared mailer, which is
 * explicitly rate-limited to a small number of emails and is not a
 * production-ready delivery path. This route does not fake or guarantee
 * delivery — it reports Supabase's own response honestly, and the UI
 * (forgot-password page) states this limitation rather than promising an
 * email that may not arrive.
 */

const RESET_RATE_LIMIT = 3;
const RESET_RATE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(`user-reset:${clientIp(request)}`, RESET_RATE_LIMIT, RESET_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts — please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    let body: { email?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/reset-password`,
    });

    // Supabase intentionally doesn't reveal whether the email exists (avoids
    // account enumeration) — a generic success message is correct here, not
    // a leaked implementation detail, UNLESS Supabase itself returned a real
    // transport/config error (e.g. rate-limited), which is surfaced honestly.
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong — please try again." },
      { status: 502 },
    );
  }
}
