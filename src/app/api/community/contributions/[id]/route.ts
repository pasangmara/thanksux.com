import { NextResponse } from "next/server";
import { getOwnContributionBundle, updateOwnContribution, updateOwnDesignResponse } from "@/lib/community/contributionsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { CONTRIBUTION_TYPES } from "@/types/contribution";
import { isValidHttpUrl } from "@/lib/community/validateUrl";

const MAX_LEN = { title: 200, explanation: 2000, research: 2000, observation: 2000, proposedDirection: 2000, url: 500 } as const;
const UPDATE_RATE_LIMIT = 30;
const UPDATE_RATE_WINDOW_MS = 10 * 60 * 1000;

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const { id } = await params;
    const bundle = await getOwnContributionBundle(id);
    if (!bundle) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(bundle);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not load that contribution." }, { status: 502 });
  }
}

/**
 * PATCH — only the safe content fields on `contributions` (title/
 * contribution_type/explanation/research/observation/proposed_direction/
 * prototype_url/figma_url/external_url) are ever read from the body.
 * `contributor_id`/`status` cannot be set this way — updateOwnContribution()
 * doesn't accept them as parameters, and RLS additionally refuses the
 * write once the row is no longer draft/submitted (migration 0012) or
 * isn't `status = 'draft'` at insert time (migration 0015).
 *
 * When `contributionType` changes, the linked DesignResponse's `discipline`
 * is kept in sync in the same request — the app never lets the two drift
 * apart (discipline is NOT NULL and otherwise has no other source of truth).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rateLimit = checkRateLimit(`contribution-update:${clientIp(request)}`, UPDATE_RATE_LIMIT, UPDATE_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many updates — please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const contributionType =
      typeof body.contributionType === "string" && (CONTRIBUTION_TYPES as string[]).includes(body.contributionType)
        ? body.contributionType
        : undefined;

    for (const field of ["prototypeUrl", "figmaUrl", "externalUrl"] as const) {
      const v = body[field];
      if (typeof v === "string" && v.trim() && !isValidHttpUrl(v.trim())) {
        return NextResponse.json({ error: `${field} must be a valid http(s) URL.` }, { status: 400 });
      }
    }

    const updated = await updateOwnContribution(id, {
      title: str(body.title, MAX_LEN.title),
      contributionType,
      explanation: body.explanation === "" ? "" : str(body.explanation, MAX_LEN.explanation),
      research: body.research === "" ? "" : str(body.research, MAX_LEN.research),
      observation: body.observation === "" ? "" : str(body.observation, MAX_LEN.observation),
      proposedDirection: body.proposedDirection === "" ? "" : str(body.proposedDirection, MAX_LEN.proposedDirection),
      prototypeUrl: body.prototypeUrl === "" ? "" : str(body.prototypeUrl, MAX_LEN.url),
      figmaUrl: body.figmaUrl === "" ? "" : str(body.figmaUrl, MAX_LEN.url),
      externalUrl: body.externalUrl === "" ? "" : str(body.externalUrl, MAX_LEN.url),
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Could not save — this contribution may no longer be editable (already submitted, or not yours)." },
        { status: 403 },
      );
    }

    if (contributionType) {
      await updateOwnDesignResponse(id, { discipline: contributionType });
    }

    return NextResponse.json({ contribution: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save your changes." }, { status: 502 });
  }
}
