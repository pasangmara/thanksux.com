import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteMediaAssetIfUnreferenced } from "@/lib/cms/supabase/mediaReferences";

/**
 * [Signal media attachments] Same split as designResponseMediaRepository.ts:
 * the actual Storage upload + `media_assets` row creation happens in the API
 * route via `createMediaAsset()` (service-role — `media_assets` has no
 * public RLS policy to write through). This file only ever touches the
 * `thanks_signal_media` *join* table, through the RLS-bound session client —
 * `thanks_signal_media_author_write`'s policy (migration 0020: author owns
 * the parent Signal AND it's still draft/submitted, or admin) is the real
 * enforcement for attach/detach, not the API route's own status check alone.
 */

export interface ThanksSignalMediaRow {
  id: string;
  mediaAssetId: string;
  order: number;
}

/** Cap on attachments per Signal — mirrors MAX_MEDIA_PER_RESPONSE's role for DesignResponses; a supporting-evidence attachment set, not an unbounded upload target. */
export const MAX_MEDIA_PER_SIGNAL = 10;

export async function countThanksSignalMedia(thanksSignalId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("thanks_signal_media")
    .select("id", { count: "exact", head: true })
    .eq("thanks_signal_id", thanksSignalId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function nextThanksSignalMediaOrder(thanksSignalId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("thanks_signal_media")
    .select("order")
    .eq("thanks_signal_id", thanksSignalId)
    .order("order", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const rows = data as { order: number }[];
  return rows.length > 0 ? rows[0].order + 1 : 0;
}

export async function attachThanksSignalMedia(
  thanksSignalId: string,
  mediaAssetId: string,
  order: number,
): Promise<ThanksSignalMediaRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("thanks_signal_media")
    .insert({ thanks_signal_id: thanksSignalId, media_asset_id: mediaAssetId, order })
    .select("id, media_asset_id, order")
    .single();
  if (error) throw new Error(error.message);
  const row = data as { id: string; media_asset_id: string; order: number };
  return { id: row.id, mediaAssetId: row.media_asset_id, order: row.order };
}

/**
 * Removes one attachment — always removes the join row; the underlying
 * `media_assets` row/Storage object is only deleted if `mediaReferences.ts`'s
 * `isMediaAssetReferenced()` finds nothing else pointing at it. A shared
 * asset is preserved; a now-orphaned one is actually reclaimed.
 */
export async function removeThanksSignalMedia(thanksSignalId: string, mediaRowId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("thanks_signal_media")
    .delete()
    .eq("id", mediaRowId)
    .eq("thanks_signal_id", thanksSignalId)
    .select("id, media_asset_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as { id: string; media_asset_id: string } | null;
  if (!row) return false;

  await deleteMediaAssetIfUnreferenced(row.media_asset_id).catch(() => {
    // Best-effort cleanup — the join row is already gone regardless of
    // whether the underlying asset could also be reclaimed.
  });
  return true;
}
