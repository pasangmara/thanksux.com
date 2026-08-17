import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

/** [Phase 1 — Authentication Foundation] Client-side "am I logged in" check — the admin login page and AdminShell use this rather than each re-implementing cookie/session lookup. */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user });
}
