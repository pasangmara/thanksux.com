import { NextResponse } from "next/server";
import { createBanner, listBannersForAdmin } from "@/lib/cms/bannersRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";

/**
 * [Promotional Banner / Campaign System] Admin-only mutation boundary for
 * the Banners list — same shape as /api/admin/reviews/route.ts: plain
 * Route Handler, `requireAdmin()` + proxy.ts's `/admin/*` matcher are the
 * real gate, never linked from public navigation.
 */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const banners = await listBannersForAdmin();
  return NextResponse.json({ banners });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  let body: { title?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Banner title is required." }, { status: 400 });

  const banner = await createBanner(title);
  return NextResponse.json({ banner }, { status: 201 });
}
