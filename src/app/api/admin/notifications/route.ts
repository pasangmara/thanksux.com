import { NextResponse } from "next/server";
import { notificationChannelStatus } from "@/lib/notifications/dispatch";
import { requireAdmin } from "@/lib/auth/requireAuth";

/** [Phase 9 — Marketing Admin] Real, env-var-derived channel configuration status for /admin/marketing — never "Connected," only "Configured" (env var present) vs "Not configured." [Phase 1] `requireAdmin()` = defense-in-depth alongside proxy.ts. */

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  return NextResponse.json({ channels: notificationChannelStatus() });
}
