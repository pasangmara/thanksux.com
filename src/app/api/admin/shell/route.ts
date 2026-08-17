import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { getSignalModerationCounts } from "@/lib/community/adminThanksSignalsRepository";
import { getSiteSettings } from "@/lib/cms/siteContentRepository";

/**
 * [Perf — admin shell consolidation] `AdminShell` (the layout every
 * `/admin/*` page renders inside) previously called `/api/admin/signals/
 * counts` and `/api/admin/settings` as two separate `fetch()`s on every
 * single navigation — each independently running its own `requireAdmin()`
 * (a session-cookie lookup + a user lookup, two sequential Supabase reads)
 * before doing its own actual query. That's 2 full auth checks + 2 round
 * trips for data that's always fetched together, every time an admin
 * clicks a sidebar link. One endpoint, one `requireAdmin()`, one round
 * trip — same two pieces of data, same security boundary (a request with
 * no valid admin session still gets the exact same 401/403 `requireAdmin()`
 * already returned), just not paid for twice. The page's own data fetch
 * (e.g. `/api/admin/projects`) keeps its own independent `requireAdmin()`
 * call — that's a real, separate defense-in-depth layer (it must survive a
 * direct hit to that route, not just navigation through the shell), not
 * something this consolidation touches.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const [counts, settings] = await Promise.all([getSignalModerationCounts(), getSiteSettings()]);

  return NextResponse.json({ counts, adminLogo: settings.adminLogo });
}
