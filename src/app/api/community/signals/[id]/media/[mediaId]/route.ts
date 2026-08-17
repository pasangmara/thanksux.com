import { NextResponse } from "next/server";
import { getSignalById } from "@/lib/community/thanksSignalsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { removeThanksSignalMedia } from "@/lib/community/thanksSignalMediaRepository";

const EDITABLE_STATUSES = new Set(["draft", "submitted"]);

/** [Part A §2 — remove attachment] `mediaId` is the `thanks_signal_media` join-row id (OrderedMedia.id in publicMedia.ts), not a `media_asset_id` — deletes only that attachment, never the underlying media_assets row/Storage object unless it becomes genuinely unreferenced (see thanksSignalMediaRepository.ts's header comment). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; mediaId: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const { id, mediaId } = await params;
    const signal = await getSignalById(id);
    if (!signal || signal.authorId !== current.authUserId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (!EDITABLE_STATUSES.has(signal.status)) {
      return NextResponse.json({ error: "This signal is no longer editable." }, { status: 403 });
    }

    const removed = await removeThanksSignalMedia(signal.id, mediaId);
    if (!removed) return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not remove that attachment." }, { status: 502 });
  }
}
