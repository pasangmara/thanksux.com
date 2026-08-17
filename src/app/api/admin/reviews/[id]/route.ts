import { NextResponse } from "next/server";
import { deleteReview, getReviewForAdmin, updateReview } from "@/lib/cms/reviewsRepository";
import { resolveMediaAssetId } from "@/lib/cms/supabase/mediaAssets";
import { requireAdmin } from "@/lib/auth/requireAuth";

const MAX_LEN = { name: 200, role: 200, company: 200, review: 2000 } as const;

function str(value: unknown, max: number): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const review = await getReviewForAdmin(id);
  if (!review) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ review });
}

/** Content-only update (client_name/client_role/company/review_text/avatar/project/rating) — moderation (publish/feature/order) goes through the dedicated /action route below. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : undefined;
  if (clientName === "") return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  const reviewText = typeof body.reviewText === "string" ? body.reviewText.trim() : undefined;
  if (reviewText === "") return NextResponse.json({ error: "Review text is required." }, { status: 400 });

  let rating: number | null | undefined;
  if (body.rating === null) rating = null;
  else if (typeof body.rating === "number" && Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 5) {
    rating = body.rating;
  } else if (body.rating !== undefined) {
    return NextResponse.json({ error: "Rating must be an integer from 1 to 5, or empty." }, { status: 400 });
  }

  const projectId = body.projectId === null ? null : typeof body.projectId === "string" ? body.projectId : undefined;

  // [Same pattern writeProject.ts already uses for cover/thumbnail/gallery
  // images] The admin editor works in terms of AdminMedia (a storage URL +
  // alt text), never a raw media_assets id — resolveMediaAssetId() looks up
  // an existing row by storage_path (dedup) or creates one, so "Upload new
  // image"/"Choose existing image" in MediaField both just work here
  // without this route knowing which happened.
  let avatarMediaId: string | null | undefined;
  const avatarAlt = str(body.avatarAlt, MAX_LEN.name);
  if (body.avatarSrc === null) {
    avatarMediaId = null;
  } else if (typeof body.avatarSrc === "string" && body.avatarSrc) {
    avatarMediaId = await resolveMediaAssetId({ kind: "image", src: body.avatarSrc, alt: avatarAlt ?? "" });
  }

  const updated = await updateReview(id, {
    clientName,
    clientRole: str(body.clientRole, MAX_LEN.role),
    company: str(body.company, MAX_LEN.company),
    reviewText,
    avatarMediaId,
    avatarAlt,
    projectId,
    rating,
  });
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ review: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  await deleteReview(id);
  return NextResponse.json({ ok: true });
}
