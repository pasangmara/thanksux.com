import { NextResponse } from "next/server";
import { getHomepageContent, saveHomepageContent } from "@/lib/cms/siteContentRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { HomepageContent } from "@/lib/admin/types";

/** [Homepage CMS — Services/Design Process] Admin-only — mirrors src/app/api/admin/hero/route.ts exactly. See src/app/api/admin/projects/route.ts's header comment for posture/boundary notes. [Phase 1] `requireAdmin()` = defense-in-depth alongside proxy.ts. */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const homepage = await getHomepageContent();
  return NextResponse.json({ homepage });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const body = (await request.json()) as HomepageContent;
  const saved = await saveHomepageContent(body);
  return NextResponse.json({ homepage: saved });
}
