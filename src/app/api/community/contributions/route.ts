import { NextResponse } from "next/server";
import { getOrCreateContribution } from "@/lib/community/contributionsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const CREATE_RATE_LIMIT = 10;
const CREATE_RATE_WINDOW_MS = 15 * 60 * 1000;

/**
 * [Phase 6E — "I can solve this"] POST { signalId } -> gets the caller's
 * existing active Contribution for that Signal, or creates a new one
 * (draft, plus its one linked DesignResponse draft). See
 * contributionsRepository.ts's getOrCreateContribution() header comment
 * for the one-active-contribution-per-signal product decision.
 */
export async function POST(request: Request) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Log in to respond to a ThanksSignal." }, { status: 401 });

    const rateLimit = checkRateLimit(`contribution-create:${clientIp(request)}`, CREATE_RATE_LIMIT, CREATE_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many attempts — please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    let body: { signalId?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (typeof body.signalId !== "string" || !body.signalId) {
      return NextResponse.json({ error: "A signalId is required." }, { status: 400 });
    }

    const bundle = await getOrCreateContribution(body.signalId);
    return NextResponse.json({ contribution: bundle.contribution, designResponse: bundle.designResponse });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not start a contribution." }, { status: 502 });
  }
}
