import { NextResponse } from "next/server";
import {
  approveSignal,
  archiveSignal,
  getSignalForAdmin,
  markUnderReview,
  MODERATION_PRECONDITIONS,
  publishSignal,
  rejectSignal,
  type ModerationAction,
} from "@/lib/community/adminThanksSignalsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const MODERATE_RATE_LIMIT = 30;
const MODERATE_RATE_WINDOW_MS = 10 * 60 * 1000;

const ACTION_LABEL: Record<ModerationAction, string> = {
  review: "mark under review",
  approve: "approve",
  reject: "reject",
  publish: "publish",
  archive: "archive",
};

const ACTIONS: Record<ModerationAction, (id: string) => ReturnType<typeof markUnderReview>> = {
  review: markUnderReview,
  approve: approveSignal,
  reject: rejectSignal,
  publish: publishSignal,
  archive: archiveSignal,
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const signal = await getSignalForAdmin(id);
  if (!signal) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ signal });
}

/**
 * [Phase 6D] Admin moderation only — a small, closed action-dispatch
 * endpoint (`{ action }`), not a general "PATCH any field" route, so the
 * server-side surface matches the exact five hardcoded transitions
 * `adminThanksSignalsRepository.ts` exposes. `requireAdmin()` is the real
 * gate here (this admin has no Supabase Auth session, so RLS's
 * `thanks_signals_admin_all` policy is never the enforcement path for
 * these writes — same architectural boundary as every other admin
 * repository in this app). A normal public user has no route that reaches
 * this file at all — proxy.ts's `/admin/*` matcher and `requireAdmin()`
 * both block it before this code runs, and separately, RLS still refuses
 * the same status/visibility values even if someone crafted a raw
 * PostgREST request with their own session (verified live — see the
 * Phase 6D QA report).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const rateLimit = checkRateLimit(`signal-moderate:${clientIp(request)}`, MODERATE_RATE_LIMIT, MODERATE_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many moderation actions — please slow down." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
    );
  }

  const { id } = await params;
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = body.action as ModerationAction;
  if (!action || !(action in ACTIONS)) {
    return NextResponse.json({ error: "Unknown moderation action." }, { status: 400 });
  }

  const current = await getSignalForAdmin(id);
  if (!current) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const allowed = MODERATION_PRECONDITIONS[action];
  if (!allowed.includes(current.status)) {
    return NextResponse.json(
      { error: `Cannot ${ACTION_LABEL[action]} — current status is "${current.status}".` },
      { status: 409 },
    );
  }

  try {
    const updated = await ACTIONS[action](id);
    if (!updated) {
      return NextResponse.json(
        { error: "This signal's status changed since it was loaded — refresh and try again." },
        { status: 409 },
      );
    }
    return NextResponse.json({ signal: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Moderation action failed." }, { status: 502 });
  }
}
