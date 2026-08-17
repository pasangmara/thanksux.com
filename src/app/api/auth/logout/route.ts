import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/sessionsRepository";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

/** [Phase 1 — Authentication Foundation] Real server-side revocation — deletes the session row, not just the cookie, so a stolen cookie value stops working immediately rather than remaining valid until natural expiry. */
export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) await deleteSession(sessionId);

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
