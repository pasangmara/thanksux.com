import { NextResponse } from "next/server";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { getUnreadNotificationCount, listMyNotifications } from "@/lib/community/notificationsRepository";

/** [Part G/H] The signed-in visitor's own notifications + real, database-backed unread count — never a fake/local count. Anonymous callers get an empty, zero-count response rather than a 401, so the header bell can poll unconditionally without special-casing logged-out visitors. */
export async function GET() {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ notifications: [], unreadCount: 0 });
    const [notifications, unreadCount] = await Promise.all([listMyNotifications(), getUnreadNotificationCount()]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not load notifications." }, { status: 502 });
  }
}
