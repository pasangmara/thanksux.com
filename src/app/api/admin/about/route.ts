import { NextResponse } from "next/server";
import { getAboutContent, saveAboutContent } from "@/lib/cms/siteContentRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { AboutContent } from "@/lib/admin/types";

/**
 * [CMS Phase D2] Admin-only — see src/app/api/admin/projects/route.ts's header comment for posture/boundary notes.
 * [Phase 1 — Authentication Foundation] `requireAdmin()` here is
 * defense-in-depth alongside `proxy.ts`'s route-level gate — see that
 * file's header comment for why both layers exist.
 */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const about = await getAboutContent();
  return NextResponse.json({ about });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const body = (await request.json()) as AboutContent;
  const saved = await saveAboutContent(body);
  return NextResponse.json({ about: saved });
}
