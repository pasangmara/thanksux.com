import { NextResponse } from "next/server";
import { emailChannel } from "@/lib/notifications/channels/emailChannel";

/**
 * [Phase 1 — Authentication Foundation] Password reset via email is
 * explicitly NOT implemented — this route exists so the interface/shape
 * is real and ready, but it truthfully refuses rather than pretending to
 * send an email that will never arrive. This reuses the exact same
 * `emailChannel` abstraction the CRM's lead-notification system already
 * established (`lib/notifications/`) instead of building a second email
 * concept — `emailChannel.isConfigured()` (true once `NOTIFY_EMAIL_TO` is
 * set) still doesn't mean sending works, since `send()` itself has no
 * real provider wired up yet; this route reflects that honestly rather
 * than reporting "configured" as if it were "working."
 *
 * Do not call this "production ready" until a real email provider is
 * wired into `emailChannel.send()` and tested end-to-end.
 */
export async function POST(request: Request) {
  let body: { email?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (!emailChannel.isConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Password reset via email is not available yet — no email provider is configured. Contact the site admin directly to reset your password.",
      },
      { status: 503 },
    );
  }

  // Reachable only once a real email provider is wired into
  // emailChannel.send() (it is not, as of this phase) — until then this
  // branch cannot execute, since isConfigured() gates it above.
  return NextResponse.json(
    { ok: false, error: "Email sending is not implemented yet." },
    { status: 501 },
  );
}
