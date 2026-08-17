import { supabaseSelect, supabaseUpdate } from "@/lib/supabase/rest";

/**
 * [Phase 6C — minimal admin integration; Phase 6D — moderation] The
 * hand-rolled admin system (Phase 1) has no Supabase Auth session at all,
 * so it can't rely on the `is_admin()` RLS path the way a real
 * Supabase-authenticated admin user could — this uses the service-role
 * key instead, exactly the same boundary every other admin repository in
 * this app already uses (src/lib/cms/supabase/**), gated by
 * `requireAdmin()` + proxy.ts's `/admin/*` matcher, not by RLS.
 *
 * [Phase 6D] Every moderation write below is one hardcoded status
 * transition — mirroring thanksSignalsRepository.ts's `submitSignal()`
 * pattern exactly — never a general "set status to X" setter, and never
 * accepts a caller-supplied status/visibility value. Each transition's
 * PostgREST filter includes the *required current status*, so the
 * database itself is the guard against a stale double-click race, not
 * just the pre-check the API route also performs.
 *
 * The real `thanks_signals.status` CHECK constraint (0012 migration) is
 * `draft, submitted, reviewed, open, in_progress, resolved, archived` —
 * there is no `under_review`, `approved`, `published`, or `rejected`
 * value. Per the explicit instruction to inspect and reuse exact existing
 * values rather than invent a second status system:
 *   - "Mark under review"  -> status: submitted -> reviewed
 *   - "Approve"            -> status: reviewed  -> open
 *   - "Publish"            -> visibility: private -> public (status
 *                              untouched — `visibility` is architecturally
 *                              independent of `status`, see
 *                              docs/THANKS_UX_COMMUNITY_ARCHITECTURE.md §7)
 *   - "Reject"             -> status: submitted|reviewed -> archived
 *                              (+ visibility forced private)
 *   - "Archive"            -> status: open|in_progress|resolved -> archived
 *                              (+ visibility forced private)
 * "Reject" and "Archive" are exposed as two distinct admin actions (for
 * two distinct real situations — turning away a submission vs. closing out
 * something that was already open) but land on the identical `archived`
 * status, because the schema has exactly one terminal non-active value,
 * not two. There is also no moderation-note/reason column on
 * `thanks_signals` — per the instruction not to silently modify the
 * database when the schema doesn't support a requested field, no note is
 * persisted anywhere; Reject/Archive only ask for on-screen confirmation.
 */

export interface AdminSignalListItem {
  id: string;
  title: string;
  category: string | null;
  status: string;
  visibility: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  /** [Signal media attachments Part C] Attachment count only — the list view shows a contained indicator, not thumbnails; the full media panel is the detail page's job. */
  mediaCount: number;
}

export interface AdminSignalMediaItem {
  id: string;
  url: string;
  order: number;
  mimeType: string | null;
  fileSize: number | null;
  filename: string | null;
}

export interface AdminSignalDetail extends AdminSignalListItem {
  description: string;
  context: string | null;
  audience: string | null;
  media: AdminSignalMediaItem[];
}

interface SignalRow {
  id: string;
  title: string;
  description: string;
  category: string | null;
  context: string | null;
  audience: string | null;
  status: string;
  visibility: string;
  created_at: string;
  updated_at: string;
  author_id: string;
}

async function authorNames(authorIds: string[]): Promise<Map<string, string>> {
  if (authorIds.length === 0) return new Map();
  const profiles = await supabaseSelect<{ id: string; name: string }[]>("profiles", "select=id,name");
  return new Map(profiles.map((p) => [p.id, p.name]));
}

function toListItem(s: SignalRow, nameById: Map<string, string>, mediaCountById: Map<string, number>): AdminSignalListItem {
  return {
    id: s.id,
    title: s.title,
    category: s.category,
    status: s.status,
    visibility: s.visibility,
    authorName: nameById.get(s.author_id) || "Unknown",
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    mediaCount: mediaCountById.get(s.id) ?? 0,
  };
}

/** One lightweight query — id + parent id only, reduced into a per-signal count in JS, same convention getSignalModerationCounts() already uses. */
async function mediaCountsBySignal(signalIds: string[]): Promise<Map<string, number>> {
  if (signalIds.length === 0) return new Map();
  const rows = await supabaseSelect<{ thanks_signal_id: string }[]>(
    "thanks_signal_media",
    `select=thanks_signal_id&thanks_signal_id=in.(${signalIds.join(",")})`,
  );
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.thanks_signal_id, (counts.get(row.thanks_signal_id) ?? 0) + 1);
  return counts;
}

export async function listSignalsForAdmin(filter?: { status?: string; visibility?: string }): Promise<AdminSignalListItem[]> {
  const params = new URLSearchParams({ select: "*", order: "updated_at.desc" });
  if (filter?.status) params.set("status", `eq.${filter.status}`);
  if (filter?.visibility) params.set("visibility", `eq.${filter.visibility}`);
  const signals = await supabaseSelect<SignalRow[]>("thanks_signals", params.toString());
  const [nameById, mediaCountById] = await Promise.all([
    authorNames(signals.map((s) => s.author_id)),
    mediaCountsBySignal(signals.map((s) => s.id)),
  ]);
  return signals.map((s) => toListItem(s, nameById, mediaCountById));
}

export interface SignalModerationCounts {
  /** status = 'submitted' — needs the admin's first look. */
  new: number;
  /** status = 'reviewed' — looked at once, awaiting an approve/reject decision. */
  underReview: number;
  /** status in (open, in_progress, resolved) AND visibility = 'private' — approved but not yet made public. */
  approved: number;
  /** visibility = 'public', regardless of status — what's actually live on /signals right now. */
  published: number;
  /** status = 'archived' — the schema's one terminal non-active status (also covers "rejected", see this file's own header comment on why there's no separate value). */
  archived: number;
}

/**
 * [Signals dashboard §C/§D] One lightweight query — `status`/`visibility`
 * only, never full row content — reduced into the 5 real, database-backed
 * counts the admin dashboard and nav badge both read. Deliberately not 5
 * separate `count=exact` requests: at this project's real scale (a
 * handful of community submissions, not thousands), one full-column-pair
 * fetch reduced in JS is simpler and still genuinely correct — no count is
 * ever estimated or cached client-side across requests.
 */
export async function getSignalModerationCounts(): Promise<SignalModerationCounts> {
  const rows = await supabaseSelect<{ status: string; visibility: string }[]>(
    "thanks_signals",
    "select=status,visibility",
  );
  const counts: SignalModerationCounts = { new: 0, underReview: 0, approved: 0, published: 0, archived: 0 };
  for (const row of rows) {
    if (row.visibility === "public") {
      counts.published += 1;
      continue; // published takes priority in the summary even if status also matches another bucket
    }
    if (row.status === "submitted") counts.new += 1;
    else if (row.status === "reviewed") counts.underReview += 1;
    else if (row.status === "open" || row.status === "in_progress" || row.status === "resolved") counts.approved += 1;
    else if (row.status === "archived") counts.archived += 1;
    // "draft" rows are the author's own unsubmitted work — deliberately
    // excluded from every bucket here, same as the existing filter tabs'
    // "Draft" tab being separate from the moderation-focused ones.
  }
  return counts;
}

interface SignalMediaRow {
  id: string;
  order: number;
  media_assets: { storage_path: string; mime_type: string | null; file_size: number | null; original_filename: string | null } | null;
}

/**
 * [Signal media attachments Part C] Service-role read (same boundary as
 * every other function in this file — no Supabase Auth session for the
 * hand-rolled admin identity, so RLS's `thanks_signal_media_select` is
 * never the enforcement path here; `requireAdmin()` at the API route is).
 * A single embedded PostgREST select (`thanks_signal_media` -> its FK'd
 * `media_assets` row) rather than two round-trips — same "simple is fine
 * at this scale" convention rest.ts's own header comment documents.
 */
export async function getSignalMediaForAdmin(thanksSignalId: string): Promise<AdminSignalMediaItem[]> {
  const rows = await supabaseSelect<SignalMediaRow[]>(
    "thanks_signal_media",
    `select=id,order,media_assets(storage_path,mime_type,file_size,original_filename)&thanks_signal_id=eq.${thanksSignalId}&order=order.asc`,
  );
  return rows
    .filter((r) => r.media_assets)
    .map((r) => ({
      id: r.id,
      url: r.media_assets!.storage_path,
      order: r.order,
      mimeType: r.media_assets!.mime_type,
      fileSize: r.media_assets!.file_size,
      filename: r.media_assets!.original_filename,
    }));
}

export async function getSignalForAdmin(id: string): Promise<AdminSignalDetail | null> {
  const rows = await supabaseSelect<SignalRow[]>("thanks_signals", `select=*&id=eq.${id}`);
  const row = rows[0];
  if (!row) return null;
  const [nameById, media] = await Promise.all([authorNames([row.author_id]), getSignalMediaForAdmin(row.id)]);
  return {
    ...toListItem(row, nameById, new Map([[row.id, media.length]])),
    description: row.description,
    context: row.context,
    audience: row.audience,
    media,
  };
}

async function transition(id: string, allowedStatuses: string[], patch: Record<string, unknown>): Promise<AdminSignalDetail | null> {
  const query = `id=eq.${id}&status=in.(${allowedStatuses.join(",")})`;
  const rows = await supabaseUpdate<SignalRow[]>("thanks_signals", query, { ...patch, updated_at: new Date().toISOString() });
  const row = rows[0];
  if (!row) return null;
  const [nameById, media] = await Promise.all([authorNames([row.author_id]), getSignalMediaForAdmin(row.id)]);
  return {
    ...toListItem(row, nameById, new Map([[row.id, media.length]])),
    description: row.description,
    context: row.context,
    audience: row.audience,
    media,
  };
}

export type ModerationAction = "review" | "approve" | "reject" | "publish" | "archive";

/** The current-status precondition for each action — also used by the API route to produce a clear "why not" message before even attempting the write. */
export const MODERATION_PRECONDITIONS: Record<ModerationAction, string[]> = {
  review: ["submitted"],
  approve: ["reviewed"],
  reject: ["submitted", "reviewed"],
  publish: ["open", "in_progress", "resolved"],
  archive: ["open", "in_progress", "resolved"],
};

export async function markUnderReview(id: string): Promise<AdminSignalDetail | null> {
  return transition(id, MODERATION_PRECONDITIONS.review, { status: "reviewed" });
}

export async function approveSignal(id: string): Promise<AdminSignalDetail | null> {
  return transition(id, MODERATION_PRECONDITIONS.approve, { status: "open" });
}

export async function rejectSignal(id: string): Promise<AdminSignalDetail | null> {
  return transition(id, MODERATION_PRECONDITIONS.reject, { status: "archived", visibility: "private" });
}

export async function publishSignal(id: string): Promise<AdminSignalDetail | null> {
  return transition(id, MODERATION_PRECONDITIONS.publish, { visibility: "public" });
}

export async function archiveSignal(id: string): Promise<AdminSignalDetail | null> {
  return transition(id, MODERATION_PRECONDITIONS.archive, { status: "archived", visibility: "private" });
}
