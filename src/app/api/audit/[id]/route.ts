import { NextResponse } from "next/server";
import { getAuditById } from "@/lib/audit/auditsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";

/**
 * [UX Audit Engine] GET /api/audit/[id] — used by the result page's client
 * refresh/poll (and directly by any client-side navigation). Ownership is
 * enforced inside getAuditById() itself (service-role read + application-
 * layer check), not here — see auditsRepository.ts's header comment for
 * why service-role reads need that check in the first place.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const current = await getCurrentPublicUser();
    const audit = await getAuditById(id, current?.authUserId ?? null);
    if (!audit) return NextResponse.json({ error: "Audit not found." }, { status: 404 });
    return NextResponse.json({ audit });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not load this audit." }, { status: 502 });
  }
}
