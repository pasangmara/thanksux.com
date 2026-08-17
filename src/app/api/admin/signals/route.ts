import { NextResponse } from "next/server";
import { listSignalsForAdmin } from "@/lib/community/adminThanksSignalsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";

/**
 * [Phase 6D] Admin-only list, with optional server-side `status`/
 * `visibility` filters (query string) — filtering happens in the
 * repository's PostgREST query, not by fetching everything and filtering
 * in JS, per the instruction to prefer repository-side filtering.
 * `requireAdmin()` = defense-in-depth alongside proxy.ts's `/admin/*`
 * matcher, same pattern as every other admin route.
 */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || undefined;
  const visibility = url.searchParams.get("visibility") || undefined;
  const signals = await listSignalsForAdmin({ status, visibility });
  return NextResponse.json({ signals });
}
