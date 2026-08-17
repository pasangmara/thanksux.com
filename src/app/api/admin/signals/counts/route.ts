import { NextResponse } from "next/server";
import { getSignalModerationCounts } from "@/lib/community/adminThanksSignalsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";

/**
 * [Signals dashboard §C/§D] Real, database-backed moderation counts —
 * read by both /admin/signals' own summary badges and AdminShell's nav
 * badge (so the "N new signals" indicator is correct wherever it's shown,
 * from one query, not two separately-computed numbers that could drift).
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const counts = await getSignalModerationCounts();
  return NextResponse.json({ counts });
}
