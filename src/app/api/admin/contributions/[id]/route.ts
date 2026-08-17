import { NextResponse } from "next/server";
import {
  approveContribution,
  archiveContribution,
  CONTRIBUTION_MODERATION_PRECONDITIONS,
  getContributionForAdmin,
  markContributionUnderReview,
  publishDesignResponse,
  PUBLISH_REQUIRES_CONTRIBUTION_STATUS,
  rejectContribution,
  type ContributionModerationAction,
} from "@/lib/community/adminContributionsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const MODERATE_RATE_LIMIT = 30;
const MODERATE_RATE_WINDOW_MS = 10 * 60 * 1000;

const ACTION_LABEL: Record<ContributionModerationAction, string> = {
  review: "mark under review",
  approve: "approve",
  reject: "reject",
  archive: "archive",
  publish: "publish",
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const contribution = await getContributionForAdmin(id);
  if (!contribution) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ contribution });
}

/**
 * [Phase 6E] Same closed action-dispatch pattern as
 * /api/admin/signals/[id] (Phase 6D). `review`/`approve`/`reject`/`archive`
 * transition the Contribution's own status; `publish` is the one exception
 * — it requires the Contribution to already be `approved`, then transitions
 * the *linked DesignResponse's* status instead (see
 * adminContributionsRepository.ts's header comment).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const rateLimit = checkRateLimit(`contribution-moderate:${clientIp(request)}`, MODERATE_RATE_LIMIT, MODERATE_RATE_WINDOW_MS);
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

  const action = body.action as ContributionModerationAction;
  if (!action || !(action in ACTION_LABEL)) {
    return NextResponse.json({ error: "Unknown moderation action." }, { status: 400 });
  }

  const current = await getContributionForAdmin(id);
  if (!current) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (action === "publish") {
    if (current.status !== PUBLISH_REQUIRES_CONTRIBUTION_STATUS) {
      return NextResponse.json(
        { error: `Cannot publish — the contribution must be "${PUBLISH_REQUIRES_CONTRIBUTION_STATUS}" first (currently "${current.status}").` },
        { status: 409 },
      );
    }
  } else {
    const allowed = CONTRIBUTION_MODERATION_PRECONDITIONS[action];
    if (!allowed.includes(current.status)) {
      return NextResponse.json(
        { error: `Cannot ${ACTION_LABEL[action]} — current status is "${current.status}".` },
        { status: 409 },
      );
    }
  }

  try {
    const updated = await {
      review: markContributionUnderReview,
      approve: approveContribution,
      reject: rejectContribution,
      archive: archiveContribution,
      publish: publishDesignResponse,
    }[action](id);
    if (!updated) {
      return NextResponse.json(
        { error: "This contribution's status changed since it was loaded — refresh and try again." },
        { status: 409 },
      );
    }
    return NextResponse.json({ contribution: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Moderation action failed." }, { status: 502 });
  }
}
