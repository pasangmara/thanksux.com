import { NextResponse } from "next/server";
import { getOwnContributionBundle, submitContribution } from "@/lib/community/contributionsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const SUBMIT_RATE_LIMIT = 10;
const SUBMIT_RATE_WINDOW_MS = 15 * 60 * 1000;

/**
 * [§9] draft -> submitted, gated on the minimum every Contribution type
 * needs regardless of its specific field set (title, a chosen type, and a
 * filled-in "problem" — the one DesignResponse field every entry in
 * CONTRIBUTION_TYPE_FIELDS includes). Deeper type-specific requirements
 * (e.g. a Figma URL for UX/UI Design) are left to the editor's own
 * client-side guidance, not hard-gated server-side — matching how
 * thanks_signals' submit gate (Phase 6C) only enforces the fields common
 * to every submission, not a growing per-category rule set.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rateLimit = checkRateLimit(`contribution-submit:${clientIp(request)}`, SUBMIT_RATE_LIMIT, SUBMIT_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts — please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { id } = await params;
    const bundle = await getOwnContributionBundle(id);
    if (!bundle) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const missing: string[] = [];
    if (!bundle.contribution.title?.trim()) missing.push("Title");
    if (!bundle.contribution.contributionType?.trim()) missing.push("Contribution type");
    if (!bundle.designResponse.problemStatement?.trim()) missing.push("Problem");
    if (missing.length > 0) {
      return NextResponse.json({ error: `Fill in ${missing.join(", ")} before submitting.` }, { status: 400 });
    }

    const updated = await submitContribution(id);
    if (!updated) {
      return NextResponse.json(
        { error: "Could not submit — this contribution may no longer be a draft, or isn't yours." },
        { status: 403 },
      );
    }
    return NextResponse.json({ contribution: updated.contribution, designResponse: updated.designResponse });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not submit your contribution." }, { status: 502 });
  }
}
