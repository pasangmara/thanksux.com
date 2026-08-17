import { NextResponse } from "next/server";
import { listContributionsForAdmin } from "@/lib/community/adminContributionsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";

/** [Phase 6E] Admin-only list, optional `status`/`published` filters — same pattern as /api/admin/signals (Phase 6D). */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const published = url.searchParams.get("published") === "true";
  const contributions = await listContributionsForAdmin({ status, published: published || undefined });
  return NextResponse.json({ contributions });
}
