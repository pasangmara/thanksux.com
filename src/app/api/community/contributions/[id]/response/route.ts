import { NextResponse } from "next/server";
import { updateOwnDesignResponse } from "@/lib/community/contributionsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { isValidHttpUrl } from "@/lib/community/validateUrl";

const MAX_LEN = { long: 4000, short: 300, url: 500 } as const;
const UPDATE_RATE_LIMIT = 30;
const UPDATE_RATE_WINDOW_MS = 10 * 60 * 1000;

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

/**
 * PATCH the DesignResponse linked to `[id]` (the Contribution's id — the
 * DesignResponse's own id is never exposed as a route param, since this
 * phase treats it as a 1:1 child of its Contribution). Only the safe
 * content fields — never status/published_project_id, and
 * updateOwnDesignResponse() doesn't accept them as parameters either. RLS
 * (migration 0015) refuses published_project_id and any status other than
 * draft/submitted/under_review regardless.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rateLimit = checkRateLimit(`design-response-update:${clientIp(request)}`, UPDATE_RATE_LIMIT, UPDATE_RATE_WINDOW_MS);
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

    for (const field of ["prototypeUrl", "figmaUrl", "caseStudyUrl", "externalUrl"] as const) {
      const v = body[field];
      if (typeof v === "string" && v.trim() && !isValidHttpUrl(v.trim())) {
        return NextResponse.json({ error: `${field} must be a valid http(s) URL.` }, { status: 400 });
      }
    }

    const updated = await updateOwnDesignResponse(id, {
      summary: body.summary === "" ? "" : str(body.summary, MAX_LEN.long),
      researchFindings: body.researchFindings === "" ? "" : str(body.researchFindings, MAX_LEN.long),
      designDecisions: body.designDecisions === "" ? "" : str(body.designDecisions, MAX_LEN.long),
      outcome: body.outcome === "" ? "" : str(body.outcome, MAX_LEN.long),
      problemStatement: body.problemStatement === "" ? "" : str(body.problemStatement, MAX_LEN.long),
      approach: body.approach === "" ? "" : str(body.approach, MAX_LEN.long),
      toolsUsed: body.toolsUsed === "" ? "" : str(body.toolsUsed, MAX_LEN.short),
      prototypeUrl: body.prototypeUrl === "" ? "" : str(body.prototypeUrl, MAX_LEN.url),
      figmaUrl: body.figmaUrl === "" ? "" : str(body.figmaUrl, MAX_LEN.url),
      caseStudyUrl: body.caseStudyUrl === "" ? "" : str(body.caseStudyUrl, MAX_LEN.url),
      externalUrl: body.externalUrl === "" ? "" : str(body.externalUrl, MAX_LEN.url),
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Could not save — this response may no longer be editable (already submitted, or not yours)." },
        { status: 403 },
      );
    }
    return NextResponse.json({ designResponse: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save your changes." }, { status: 502 });
  }
}
