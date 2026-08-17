import { NextResponse } from "next/server";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { markNotificationRead } from "@/lib/community/notificationsRepository";

/** [Part H] Marks one notification read — RLS's `notifications_update_own` (migration 0021) is the real ownership gate; a caller passing someone else's notification id simply updates zero rows, reported here as 404 rather than leaking whether that id even exists. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const { id } = await params;
    const updated = await markNotificationRead(id);
    if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not update that notification." }, { status: 502 });
  }
}
