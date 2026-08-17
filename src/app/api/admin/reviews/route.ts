import { NextResponse } from "next/server";
import { createReview, listReviewsForAdmin } from "@/lib/cms/reviewsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";

/**
 * [Phase 6G Part B] Admin-only mutation boundary for the Client Reviews
 * list — same shape as /api/admin/projects/route.ts: plain Route Handler,
 * `requireAdmin()` + proxy.ts's `/admin/*` matcher are the real gate, never
 * linked from public navigation.
 */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const reviews = await listReviewsForAdmin();
  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: { clientName?: unknown; reviewText?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const clientName = typeof body.clientName === "string" ? body.clientName.trim() : "";
  const reviewText = typeof body.reviewText === "string" ? body.reviewText.trim() : "";
  if (!clientName) return NextResponse.json({ error: "Client name is required." }, { status: 400 });
  if (!reviewText) return NextResponse.json({ error: "Review text is required." }, { status: 400 });

  const review = await createReview({ clientName, reviewText });
  return NextResponse.json({ review }, { status: 201 });
}
