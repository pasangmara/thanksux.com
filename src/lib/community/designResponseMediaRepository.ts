import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteMediaAssetIfUnreferenced } from "@/lib/cms/supabase/mediaReferences";

/**
 * [Phase 6G Part A — contributor media upload, write path] The actual
 * Storage upload + `media_assets` row creation happens in the API route
 * via `createMediaAsset()` (service-role, same as every admin upload —
 * `media_assets` has no public RLS policy to write through, see
 * publicMedia.ts's header comment). This file only ever touches the
 * `design_response_media` *join* table, through the RLS-bound session
 * client — `design_response_media_author_write`'s policy (migration 0012:
 * author owns the parent DesignResponse AND its status is still
 * draft/submitted/under_review) is the real enforcement for attach/detach/
 * reorder, not the API route's own status check alone.
 */

export interface DesignResponseMediaRow {
  id: string;
  mediaAssetId: string;
  order: number;
}

/** Cap on attached images per DesignResponse — a curated gallery, not an unbounded upload target. Not a file-size limit (that's MAX_UPLOAD_BYTES in the API route, matching /api/admin/images' existing 8MB) — this is a separate, new count limit this phase introduces deliberately for a feature that didn't exist before. */
export const MAX_MEDIA_PER_RESPONSE = 10;

export async function countDesignResponseMedia(designResponseId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("design_response_media")
    .select("id", { count: "exact", head: true })
    .eq("design_response_id", designResponseId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function nextMediaOrder(designResponseId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("design_response_media")
    .select("order")
    .eq("design_response_id", designResponseId)
    .order("order", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const rows = data as { order: number }[];
  return rows.length > 0 ? rows[0].order + 1 : 0;
}

export async function attachDesignResponseMedia(
  designResponseId: string,
  mediaAssetId: string,
  order: number,
): Promise<DesignResponseMediaRow> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("design_response_media")
    .insert({ design_response_id: designResponseId, media_asset_id: mediaAssetId, order })
    .select("id, media_asset_id, order")
    .single();
  if (error) throw new Error(error.message);
  const row = data as { id: string; media_asset_id: string; order: number };
  return { id: row.id, mediaAssetId: row.media_asset_id, order: row.order };
}

/**
 * [Phase 6H Part 7] Removes one attached image — always removes the join
 * row; the underlying `media_assets` row/Storage object is only deleted if
 * `mediaReferences.ts`'s `isMediaAssetReferenced()` finds nothing else
 * pointing at it (contribution_media, projects, gallery_items,
 * client_reviews, hero_visuals, etc. — the full list is that file's own
 * header comment). A shared asset is preserved; a now-orphaned one is
 * actually reclaimed — real, non-cascading deletion, not the "never touch
 * media_assets at all" placeholder this function had before this phase.
 */
export async function removeDesignResponseMedia(designResponseId: string, mediaRowId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("design_response_media")
    .delete()
    .eq("id", mediaRowId)
    .eq("design_response_id", designResponseId)
    .select("id, media_asset_id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  const row = data as { id: string; media_asset_id: string } | null;
  if (!row) return false;

  await deleteMediaAssetIfUnreferenced(row.media_asset_id).catch(() => {
    // Best-effort cleanup — the join row (the thing that actually made
    // this attachment visible/manageable) is already gone regardless of
    // whether the underlying asset could also be reclaimed.
  });
  return true;
}

/** Re-numbers every row in `orderedRowIds` to its array index. Rows not owned by `designResponseId` are structurally excluded by the `.eq()` filter on every update, not merely skipped client-side. */
export async function reorderDesignResponseMedia(designResponseId: string, orderedRowIds: string[]): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await Promise.all(
    orderedRowIds.map((rowId, index) =>
      supabase.from("design_response_media").update({ order: index }).eq("id", rowId).eq("design_response_id", designResponseId),
    ),
  );
}
