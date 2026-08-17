import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ThanksSignal, ThanksSignalDraftInput } from "@/types/thanksSignal";

/**
 * [Phase 6C — ThanksSignal submission system] Uses the RLS-bound server
 * client (the user's own session), never the service-role key — same
 * architectural boundary Phase 5's publicProfile.ts established: this is
 * user-owned community data, so Postgres RLS (thanks_signals_author_*
 * policies, Phase 6B) is the real enforcement, not an application-layer
 * check alone. Every write here only ever sets fields a normal user is
 * allowed to touch — author_id/status/visibility/created_at are never
 * accepted as client input; `submitSignal()` is the one, single,
 * hardcoded transition this phase exposes (draft -> submitted), not a
 * general status setter.
 */

interface SignalRow {
  id: string;
  author_id: string;
  title: string;
  description: string;
  category: string | null;
  context: string | null;
  audience: string | null;
  status: ThanksSignal["status"];
  visibility: ThanksSignal["visibility"];
  created_at: string;
  updated_at: string;
}

function rowToSignal(row: SignalRow): ThanksSignal {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    description: row.description,
    category: row.category,
    context: row.context,
    audience: row.audience,
    status: row.status,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** The signed-in visitor's own signals, most recently updated first. RLS's `thanks_signals_select` policy already scopes this to their own rows + public rows — filtered here to author_id for the dashboard's "My ThanksSignals" list specifically. */
export async function listMySignals(): Promise<ThanksSignal[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("thanks_signals")
    .select("*")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as SignalRow[]).map(rowToSignal);
}

/** One signal by id — RLS decides whether the caller (owner, or public+visible, or neither) can actually see it; returns null either way rather than distinguishing "doesn't exist" from "not visible to you" (the same non-leaking behavior every other RLS-gated read in this app already has). */
export async function getSignalById(id: string): Promise<ThanksSignal | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("thanks_signals").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToSignal(data as SignalRow) : null;
}

/** Creates a new draft, authored by the signed-in visitor. Throws if nobody is signed in — callers (API routes) must check auth before this, this is a second, structural guarantee, not the only one. */
export async function createDraftSignal(input: ThanksSignalDraftInput): Promise<ThanksSignal> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("thanks_signals")
    .insert({
      author_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category ?? null,
      context: input.context ?? null,
      audience: input.audience ?? null,
      status: "draft",
      visibility: "private",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToSignal(data as SignalRow);
}

/**
 * Updates the caller's own draft/submitted signal — only the safe content
 * fields, never status/visibility/author_id. RLS's `thanks_signals_author_update`
 * policy additionally refuses this entirely once the row has moved past
 * `draft`/`submitted` (see docs/THANKS_UX_COMMUNITY_ARCHITECTURE.md §6),
 * so an already-moderated signal can't be edited out from under a
 * reviewer even if this function were called on one.
 */
export async function updateOwnSignal(id: string, input: Partial<ThanksSignalDraftInput>): Promise<ThanksSignal | null> {
  const supabase = await createSupabaseServerClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.category !== undefined) patch.category = input.category || null;
  if (input.context !== undefined) patch.context = input.context || null;
  if (input.audience !== undefined) patch.audience = input.audience || null;

  const { data, error } = await supabase.from("thanks_signals").update(patch).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToSignal(data as SignalRow) : null;
}

/**
 * The one status transition this phase exposes: draft -> submitted.
 * Hardcoded target value, never accepts an arbitrary status from the
 * caller — a normal user has no code path anywhere in this phase that can
 * set `approved`/`published`/`reviewed`/etc., and RLS would refuse the
 * write even if one existed (`with_check` only allows `draft`/`submitted`
 * for a non-admin author).
 */
export async function submitSignal(id: string): Promise<ThanksSignal | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("thanks_signals")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft") // only a real draft can be submitted — already-submitted or moderated rows are left alone
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToSignal(data as SignalRow) : null;
}

/**
 * [Phase 6F — public discovery] Strips characters that are structurally
 * significant to PostgREST's `.or()` filter-string mini-DSL (`,`/`(`/`)`)
 * out of free-text search input before it's interpolated into that string
 * — not a SQL-injection concern (PostgREST always parameterizes the actual
 * value), just correctness: an unescaped comma would otherwise be parsed
 * as a second filter clause instead of literal search text.
 */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()%_]/g, " ").trim().slice(0, 100);
}

export interface ListPublicSignalsOptions {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListPublicSignalsResult {
  signals: ThanksSignal[];
  total: number;
}

/**
 * [Phase 6F §2 — public discovery] Anonymous-safe: relies on
 * `thanks_signals_select`'s `visibility = 'public'` clause (migration
 * 0012/0013) as the real gate, same as getSignalById() above — the
 * explicit `.eq("visibility", "public")` here is belt-and-suspenders, not
 * the only thing standing between an anonymous visitor and a private row.
 * Category/search only ever narrow an already-public result set further,
 * never widen it.
 */
export async function listPublicSignals(options: ListPublicSignalsOptions = {}): Promise<ListPublicSignalsResult> {
  const { category, search, limit = 12, offset = 0 } = options;
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("thanks_signals")
    .select("*", { count: "exact" })
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .range(offset, offset + Math.max(limit, 1) - 1);

  if (category) query = query.eq("category", category);
  const cleanedSearch = search ? sanitizeSearchTerm(search) : "";
  if (cleanedSearch) query = query.or(`title.ilike.%${cleanedSearch}%,description.ilike.%${cleanedSearch}%`);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { signals: (data as SignalRow[]).map(rowToSignal), total: count ?? 0 };
}

/**
 * Count of publicly-visible (approved) Contributions per Signal — powers
 * discovery/detail cards' "N designers responding" line. RLS's
 * `contributions_select` policy already treats `status = 'approved'` as
 * anon-readable (migration 0012); the explicit filter here is the same
 * belt-and-suspenders convention as everywhere else in this file.
 */
export async function getApprovedContributionCounts(signalIds: string[]): Promise<Map<string, number>> {
  if (signalIds.length === 0) return new Map();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("contributions")
    .select("thanks_signal_id")
    .in("thanks_signal_id", signalIds)
    .eq("status", "approved");
  if (error) throw new Error(error.message);
  const counts = new Map<string, number>();
  for (const row of data as { thanks_signal_id: string }[]) {
    counts.set(row.thanks_signal_id, (counts.get(row.thanks_signal_id) ?? 0) + 1);
  }
  return counts;
}
