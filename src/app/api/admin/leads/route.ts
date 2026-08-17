import { NextResponse } from "next/server";
import { listAllLeads } from "@/lib/cms/leadsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";

/** [Phase L — CRM] Admin-only read of the full lead list. Lead creation is public (see src/app/api/leads/route.ts) — this route is list-only, no POST here. [Phase 1] `requireAdmin()` = defense-in-depth alongside proxy.ts — CRM data must never be reachable without it. */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const leads = await listAllLeads();
  return NextResponse.json({ leads });
}
