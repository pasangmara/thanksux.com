import { NextResponse } from "next/server";
import { createProjectRecord, listAllProjects } from "@/lib/cms/projectsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { PROJECT_CATEGORIES, type CanonicalProjectCategory } from "@/types/project";

/**
 * [CMS Phase D2] Admin-only mutation boundary for the project list —
 * mirrors /api/admin/images' existing pattern (plain Route Handler, no
 * new dependency). Never linked from public navigation; the public site
 * never calls this route, it reads projectsRepository directly server-
 * side (see src/content/projects.ts).
 * [Phase 1 — Authentication Foundation] Real auth now exists —
 * `requireAdmin()` here is defense-in-depth alongside `proxy.ts`'s
 * route-level gate (see that file's header comment for why both layers
 * exist). The "development only, no authentication" posture this
 * comment used to describe is what Phase 1 replaced.
 */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const projects = await listAllProjects();
  return NextResponse.json({ projects });
}

function isCanonicalCategory(value: unknown): value is CanonicalProjectCategory {
  return typeof value === "string" && (PROJECT_CATEGORIES as string[]).includes(value);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const body = (await request.json()) as { title?: string; category?: string };
  const category = isCanonicalCategory(body.category) ? body.category : undefined;
  const project = await createProjectRecord(body.title ?? "", category);
  return NextResponse.json({ project }, { status: 201 });
}
