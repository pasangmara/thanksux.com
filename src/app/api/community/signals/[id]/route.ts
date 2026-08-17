import { NextResponse } from "next/server";
import { getSignalById, updateOwnSignal } from "@/lib/community/thanksSignalsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const MAX_LEN = { title: 200, description: 4000, category: 60, context: 2000, audience: 300 } as const;
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
    const signal = await getSignalById(id);
    if (!signal) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ signal });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not load that signal." }, { status: 502 });
  }
}

/**
 * PATCH — only the safe content fields (title/description/category/
 * context/audience) are ever read from the request body. author_id,
 * status, visibility, created_at cannot be set this way — updateOwnSignal()
 * doesn't even accept them as parameters, so there's no field name that
 * would reach them even from a malicious payload. RLS additionally
 * refuses the write outright once the row is no longer draft/submitted.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rateLimit = checkRateLimit(`signal-update:${clientIp(request)}`, UPDATE_RATE_LIMIT, UPDATE_RATE_WINDOW_MS);
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

    const title = str(body.title, MAX_LEN.title);
    if (title !== undefined && !title) return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });

    const updated = await updateOwnSignal(id, {
      title,
      description: str(body.description, MAX_LEN.description),
      category: body.category === "" ? "" : str(body.category, MAX_LEN.category),
      context: body.context === "" ? "" : str(body.context, MAX_LEN.context),
      audience: body.audience === "" ? "" : str(body.audience, MAX_LEN.audience),
    });
    if (!updated) {
      return NextResponse.json(
        { error: "Could not save — this signal may no longer be editable (already submitted for review, or not yours)." },
        { status: 403 },
      );
    }
    return NextResponse.json({ signal: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not save your changes." }, { status: 502 });
  }
}
