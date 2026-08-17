import { NextResponse } from "next/server";
import { getSignalById } from "@/lib/community/thanksSignalsRepository";
import {
  getMyContributionStatus,
  getOrCreateContribution,
  submitContribution,
  updateOwnContribution,
} from "@/lib/community/contributionsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { createNotification } from "@/lib/community/notificationsRepository";
import { getAuthUserEmail, isEmailProviderConfigured, sendAuthorOfferEmail } from "@/lib/community/contributorNotificationEmail";

const OFFER_RATE_LIMIT = 10;
const OFFER_RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_MESSAGE_LEN = 1000;

/** [Part B/L] Read-only — decides the CTA's initial render state (form vs. "already offered") without creating anything. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ contribution: null });
    const { id } = await params;
    const contribution = await getMyContributionStatus(id);
    return NextResponse.json({ contribution });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not load offer status." }, { status: 502 });
  }
}

/**
 * [Part B/C/D/E/F] The real "I can solve this" action. Never a mailto link
 * — creates/reuses a real Contribution (+ linked DesignResponse) via the
 * existing getOrCreateContribution()/submitContribution() (Phase 6E,
 * unchanged), then notifies the Signal's author: always an in-app
 * `notifications` row (real, database-backed), and an email attempt that
 * is only ever reported as sent if a real provider actually accepted it
 * (see contributorNotificationEmail.ts — no provider is configured today,
 * so this always reports `emailStatus: "not_configured"`, never a faked
 * "sent").
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Log in to offer to help with this problem." }, { status: 401 });

    const rateLimit = checkRateLimit(`offer-help:${clientIp(request)}`, OFFER_RATE_LIMIT, OFFER_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts — please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { id } = await params;

    let body: { message?: unknown };
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const message = typeof body.message === "string" ? body.message.trim().slice(0, MAX_MESSAGE_LEN) : "";

    // [Part M] Signal no longer published / deleted / archived — getSignalById
    // is RLS-gated (thanks_signals_select), so this also naturally covers
    // "doesn't exist" and "exists but not visible to you" the same way.
    const signal = await getSignalById(id);
    if (!signal || signal.visibility !== "public") {
      return NextResponse.json({ error: "This problem is no longer open for responses." }, { status: 404 });
    }
    if (signal.authorId === current.authUserId) {
      return NextResponse.json({ error: "You can't offer to help on your own problem." }, { status: 400 });
    }

    const bundle = await getOrCreateContribution(id);

    // [Part C — duplicate prevention] Anything past "draft" means this
    // contributor already completed a real offer against this Signal
    // before (this exact route, or the fuller /contribute editor) —
    // report that state rather than creating a second record or
    // re-notifying the author for the same offer.
    if (bundle.contribution.status !== "draft") {
      return NextResponse.json({ alreadyOffered: true, contribution: bundle.contribution });
    }

    if (message) {
      await updateOwnContribution(bundle.contribution.id, { explanation: message });
    }

    const submitted = await submitContribution(bundle.contribution.id);
    if (!submitted) {
      return NextResponse.json({ error: "This offer changed since it was loaded — refresh and try again." }, { status: 409 });
    }

    // [Part E/G] Real, database-backed in-app notification — created
    // regardless of email outcome below, so the author always has a
    // record inside ThanksUX even if no email provider is configured.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    let notified = true;
    try {
      await createNotification({
        recipientId: signal.authorId,
        type: "contribution_offer",
        title: "Someone wants to help solve your problem",
        message: message
          ? `${current.profile.name || "A community member"}: "${message}"`
          : `${current.profile.name || "A community member"} offered to help with "${signal.title}".`,
        referenceType: "thanks_signal",
        referenceId: signal.id,
      });
    } catch {
      // [Part M] Notification creation failing must never undo the
      // already-successful offer/submission above — surfaced via
      // `notified: false` so the client can say so honestly, not a 500.
      notified = false;
    }

    // [Part F/O] Best-effort, honestly reported — never blocks or fails
    // the overall response, and never claims success it didn't achieve.
    let emailStatus: "sent" | "failed" | "not_configured" = "not_configured";
    if (isEmailProviderConfigured()) {
      try {
        const authorEmail = await getAuthUserEmail(signal.authorId);
        if (authorEmail) {
          const result = await sendAuthorOfferEmail({
            toEmail: authorEmail,
            authorName: "",
            problemTitle: signal.title,
            contributorName: current.profile.name || "A community member",
            message: message || null,
            signalUrl: `${siteUrl}/share/${signal.id}`,
          });
          emailStatus = result.ok ? "sent" : "failed";
        } else {
          emailStatus = "failed";
        }
      } catch {
        emailStatus = "failed";
      }
    }

    return NextResponse.json({ contribution: submitted.contribution, notified, emailStatus });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not send your offer to help." }, { status: 502 });
  }
}
