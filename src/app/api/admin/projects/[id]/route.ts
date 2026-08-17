import { NextResponse } from "next/server";
import { deleteProjectRecord, getProjectById, saveProjectRecord } from "@/lib/cms/projectsRepository";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { AdminProject } from "@/lib/admin/types";

/** [CMS Phase D2] Admin-only — see src/app/api/admin/projects/route.ts's header comment for the same notes on posture/boundary. [Phase 1] `requireAdmin()` on every handler = defense-in-depth alongside proxy.ts. */

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const body = (await request.json()) as AdminProject;
  if (body.id !== id) {
    return NextResponse.json({ error: "Body id does not match route id" }, { status: 400 });
  }
  try {
    const saved = await saveProjectRecord(body);
    return NextResponse.json({ project: saved });
  } catch (err) {
    // [Project creation fix] `saveProjectRecord` throws a real, specific
    // message on a slug collision (see that function's doc comment) —
    // surfaced here as a 400 so the admin editor's save error actually
    // says what went wrong, instead of a generic "failed: 500".
    const message = err instanceof Error ? err.message : "Failed to save the project.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  await deleteProjectRecord(id);
  return NextResponse.json({ ok: true });
}
