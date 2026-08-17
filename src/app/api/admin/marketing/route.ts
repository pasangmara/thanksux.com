import { NextResponse } from "next/server";
import { getMarketingSettings, saveMarketingSettings } from "@/lib/cms/siteContentRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { MarketingSettings } from "@/types/marketing";

/** [Phase L] Admin-only — mirrors src/app/api/admin/settings/route.ts's pattern exactly. [Phase 1] `requireAdmin()` = defense-in-depth alongside proxy.ts. */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const marketing = await getMarketingSettings();
  return NextResponse.json({ marketing });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const body = (await request.json()) as MarketingSettings;
  const saved = await saveMarketingSettings(body);
  return NextResponse.json({ marketing: saved });
}
