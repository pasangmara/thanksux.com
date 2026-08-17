import { NextResponse } from "next/server";
import { createDraftSignal } from "@/lib/community/thanksSignalsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const MAX_LEN = { title: 200, description: 4000, category: 60, context: 2000, audience: 300 } as const;
const CREATE_RATE_LIMIT = 10;
const CREATE_RATE_WINDOW_MS = 15 * 60 * 1000;

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max);
}

/** POST /api/community/signals — creates a new draft, authored by the signed-in visitor. author_id/status/visibility are never read from the request body — createDraftSignal() derives author from the session and hardcodes status='draft'/visibility='private'. */
export async function POST(request: Request) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rateLimit = checkRateLimit(`signal-create:${clientIp(request)}`, CREATE_RATE_LIMIT, CREATE_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many drafts created — please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const title = str(body.title, MAX_LEN.title) || "Untitled";
    const description = str(body.description, MAX_LEN.description) ?? "";

    const signal = await createDraftSignal({
      title,
      description,
      category: str(body.category, MAX_LEN.category),
      context: str(body.context, MAX_LEN.context),
      audience: str(body.audience, MAX_LEN.audience),
    });
    return NextResponse.json({ signal }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create your draft." },
      { status: 502 },
    );
  }
}
