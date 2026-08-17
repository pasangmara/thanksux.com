import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseInsert } from "@/lib/supabase/rest";
import type { AppNotification } from "@/types/notification";

/**
 * ["I can solve this" real notification flow] Read/mark-read use the
 * RLS-bound session client — `notifications_select_own`/`_update_own`
 * (migration 0021) are the real enforcement, same architectural boundary
 * as every other user-owned community table in this app. Creation is the
 * one exception: `createNotification()` uses the service-role key
 * (`supabaseInsert`, same helper `mediaUpload.ts` uses), because the
 * notification's recipient is a *different* user than whoever's session
 * triggered it (the contributor notifying the signal author) — there is
 * deliberately no RLS insert policy a normal session could satisfy for
 * that. This function is only ever called from trusted server code, after
 * the triggering action has already been authorized through its own
 * RLS-bound write.
 */

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string | null;
  reference_type: string | null;
  reference_id: string | null;
  read_at: string | null;
  created_at: string;
}

function rowToNotification(r: NotificationRow): AppNotification {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    referenceType: r.reference_type,
    referenceId: r.reference_id,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

export async function createNotification(params: {
  recipientId: string;
  type: string;
  title: string;
  message?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
}): Promise<void> {
  await supabaseInsert("notifications", {
    recipient_id: params.recipientId,
    type: params.type,
    title: params.title,
    message: params.message ?? null,
    reference_type: params.referenceType ?? null,
    reference_id: params.referenceId ?? null,
  });
}

const RECENT_LIMIT = 20;

/** The signed-in visitor's own notifications, most recent first — RLS scopes this to their own rows regardless. */
export async function listMyNotifications(): Promise<AppNotification[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(RECENT_LIMIT);
  if (error) throw new Error(error.message);
  return (data as NotificationRow[]).map(rowToNotification);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Idempotent — only ever sets `read_at` if it's still null, so re-opening
 * an already-read notification never touches its original read timestamp.
 * RLS's `notifications_update_own` is the real ownership gate. Returns
 * `true` whenever the notification exists and belongs to the caller
 * (whether this call is what marked it read, or it already was) — `false`
 * only when it genuinely doesn't exist or isn't theirs, so a second click
 * on an already-read notification isn't mistaken for "not found."
 */
export async function markNotificationRead(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data: updated, error: updateErr } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null)
    .select("id")
    .maybeSingle();
  if (updateErr) throw new Error(updateErr.message);
  if (updated) return true;

  const { data: existing, error: selectErr } = await supabase.from("notifications").select("id").eq("id", id).maybeSingle();
  if (selectErr) throw new Error(selectErr.message);
  return Boolean(existing);
}
