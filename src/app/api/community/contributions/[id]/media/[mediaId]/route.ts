import { NextResponse } from "next/server";
import { getOwnContributionBundle } from "@/lib/community/contributionsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { removeDesignResponseMedia } from "@/lib/community/designResponseMediaRepository";

const EDITABLE_DESIGN_RESPONSE_STATUSES = new Set(["draft", "submitted", "under_review"]);

/** [Part A §2 — remove image] `mediaId` is the `design_response_media` join-row id (see OrderedMedia.id in publicMedia.ts), not a `media_asset_id` — deletes only that attachment, never the underlying media_assets row/Storage object (see designResponseMediaRepository.ts's header comment on why). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; mediaId: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const { id, mediaId } = await params;
    const bundle = await getOwnContributionBundle(id);
    if (!bundle || bundle.contribution.contributorId !== current.authUserId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    if (!EDITABLE_DESIGN_RESPONSE_STATUSES.has(bundle.designResponse.status)) {
      return NextResponse.json({ error: "This response is no longer editable." }, { status: 403 });
    }

    const removed = await removeDesignResponseMedia(bundle.designResponse.id, mediaId);
    if (!removed) return NextResponse.json({ error: "Media not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not remove that image." }, { status: 502 });
  }
}
