import { NextResponse } from "next/server";
import { getContactContent, saveContactContent } from "@/lib/cms/siteContentRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { ContactContent } from "@/lib/admin/types";

/** [CMS Phase D2] Admin-only — see src/app/api/admin/projects/route.ts's header comment for posture/boundary notes. [Phase 1] `requireAdmin()` = defense-in-depth alongside proxy.ts. */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const contact = await getContactContent();
  return NextResponse.json({ contact });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const body = (await request.json()) as ContactContent;
  const saved = await saveContactContent(body);
  return NextResponse.json({ contact: saved });
}
