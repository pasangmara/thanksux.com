import { NextResponse } from "next/server";
import { getReviewForAdmin, moveReview, setReviewFeatured, setReviewPublished } from "@/lib/cms/reviewsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";

type ReviewAction = "publish" | "unpublish" | "feature" | "unfeature" | "moveUp" | "moveDown";
const ACTIONS: ReviewAction[] = ["publish", "unpublish", "feature", "unfeature", "moveUp", "moveDown"];

/**
 * [Phase 6G Part B §10] Small, closed action-dispatch endpoint — same
 * `{ action }` shape as /api/admin/signals/[id]'s moderation route, reused
 * here rather than a second convention, for the admin list's Publish/
 * Unpublish/Feature/Unfeature/Move up/Move down row actions.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;
  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = body.action as ReviewAction;
  if (!action || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  switch (action) {
    case "publish": {
      const review = await setReviewPublished(id, true);
      if (!review) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ review });
    }
    case "unpublish": {
      const review = await setReviewPublished(id, false);
      if (!review) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ review });
    }
    case "feature": {
      const review = await setReviewFeatured(id, true);
      if (!review) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ review });
    }
    case "unfeature": {
      const review = await setReviewFeatured(id, false);
      if (!review) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ review });
    }
    case "moveUp":
    case "moveDown": {
      await moveReview(id, action === "moveUp" ? -1 : 1);
      const review = await getReviewForAdmin(id);
      if (!review) return NextResponse.json({ error: "Not found." }, { status: 404 });
      return NextResponse.json({ review });
    }
  }
}
