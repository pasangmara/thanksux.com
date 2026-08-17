import { NextResponse } from "next/server";
import { getHeroContent, saveHeroContent } from "@/lib/cms/siteContentRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { HeroContent } from "@/lib/admin/types";

/** [CMS architecture correction] Admin-only — mirrors src/app/api/admin/about/route.ts exactly. See src/app/api/admin/projects/route.ts's header comment for posture/boundary notes. [Phase 1] `requireAdmin()` = defense-in-depth alongside proxy.ts. */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const hero = await getHeroContent();
  return NextResponse.json({ hero });
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const body = (await request.json()) as HeroContent;
  const saved = await saveHeroContent(body);
  return NextResponse.json({ hero: saved });
}
