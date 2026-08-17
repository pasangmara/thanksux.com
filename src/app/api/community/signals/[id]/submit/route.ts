import { NextResponse } from "next/server";
import { getSignalById, submitSignal } from "@/lib/community/thanksSignalsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const SUBMIT_RATE_LIMIT = 10;
const SUBMIT_RATE_WINDOW_MS = 15 * 60 * 1000;

/**
 * The one, single, hardcoded draft -> submitted transition this phase
 * exposes. No status value is ever read from the request body — there is
 * none to read; submitSignal() takes only an id.
 *
 * A draft can be saved incomplete ("leave and return later"), but
 * submitting for review requires title/description/category/context —
 * checked here, at the submit gate specifically, not at every draft save.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rateLimit = checkRateLimit(`signal-submit:${clientIp(request)}`, SUBMIT_RATE_LIMIT, SUBMIT_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many submissions — please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { id } = await params;
    const existing = await getSignalById(id);
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const missing = [
      !existing.title.trim() && "title",
      !existing.description.trim() && "description",
      !existing.category?.trim() && "category",
      !existing.context?.trim() && "context",
    ].filter(Boolean);
    if (missing.length > 0) {
      return NextResponse.json({ error: `Fill in ${missing.join(", ")} before submitting.` }, { status: 400 });
    }

    const updated = await submitSignal(id);
    if (!updated) {
      return NextResponse.json(
        { error: "Could not submit — this signal may already be submitted, not yours, or missing required fields." },
        { status: 403 },
      );
    }
    return NextResponse.json({ signal: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not submit your signal." }, { status: 502 });
  }
}
