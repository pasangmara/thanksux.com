import { NextResponse } from "next/server";
import { getLeadFormSettings, saveLeadFormSettings } from "@/lib/cms/siteContentRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { LeadFormSettings } from "@/types/marketing";

/** [Phase L] Admin-only — mirrors src/app/api/admin/settings/route.ts's pattern exactly. [Phase 1] `requireAdmin()` = defense-in-depth alongside proxy.ts. */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const leadForm = await getLeadFormSettings();
  return NextResponse.json({ leadForm });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const body = (await request.json()) as LeadFormSettings;
  const saved = await saveLeadFormSettings(body);
  return NextResponse.json({ leadForm: saved });
}
