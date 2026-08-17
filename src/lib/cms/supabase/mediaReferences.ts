import { supabaseDelete, supabaseSelect } from "@/lib/supabase/rest";
import { deleteFromStorage, isStorageUrl, storagePathFromUrl } from "@/lib/supabase/storage";

/**
 * [Phase 6H Part 7 — media reference check] Before this phase, no code
 * path anywhere in the app ever deleted a `media_assets` row (verified by
 * grep across src/ — the only `deleteFromStorage` call was upload-rollback
 * in mediaUpload.ts's `createMediaAsset`). Every "remove" action in the
 * admin/contributor UI (gallery item removal, review deletion, contributor
 * media removal) has always only ever detached the *reference*, leaving
 * the underlying asset in place — maximally safe, but never actually able
 * to answer "is this asset now genuinely orphaned and reclaimable."
 *
 * This is that check: every column in the schema that can point at
 * `media_assets(id)`, enumerated once here (grep `references
 * public.media_assets` across supabase/migrations/*.sql is how this list
 * was built, and is how it should be re-verified if a future migration
 * adds another one):
 *   projects.cover_image_id / .thumbnail_id
 *   gallery_items.media_asset_id
 *   custom_sections.image_id
 *   site_settings.logo_id / .logo_mobile_id / .favicon_id / .brand_mark_id
 *   social_links.custom_icon_id
 *   hero_visuals.image_id
 *   homepage_cards.icon_id
 *   about_content.photo_id
 *   contribution_media.media_asset_id
 *   design_response_media.media_asset_id
 *   client_reviews.avatar_media_id
 *   thanks_signal_media.media_asset_id
 */

interface ReferenceCheck {
  table: string;
  column: string;
}

const REFERENCE_CHECKS: ReferenceCheck[] = [
  { table: "projects", column: "cover_image_id" },
  { table: "projects", column: "thumbnail_id" },
  { table: "gallery_items", column: "media_asset_id" },
  { table: "custom_sections", column: "image_id" },
  { table: "site_settings", column: "logo_id" },
  { table: "site_settings", column: "logo_mobile_id" },
  { table: "site_settings", column: "favicon_id" },
  { table: "site_settings", column: "brand_mark_id" },
  { table: "social_links", column: "custom_icon_id" },
  { table: "hero_visuals", column: "image_id" },
  { table: "homepage_cards", column: "icon_id" },
  { table: "about_content", column: "photo_id" },
  { table: "contribution_media", column: "media_asset_id" },
  { table: "design_response_media", column: "media_asset_id" },
  { table: "client_reviews", column: "avatar_media_id" },
  { table: "thanks_signal_media", column: "media_asset_id" },
];

/**
 * True if `mediaAssetId` is pointed at by any row in any table above —
 * checked in parallel, short-circuiting on the first hit isn't attempted
 * (Promise.all keeps this simple; the check list is small and this is a
 * rare, low-frequency admin/contributor action, not a hot path).
 */
export async function isMediaAssetReferenced(mediaAssetId: string, options?: { excludeContributionMediaRowId?: string; excludeDesignResponseMediaRowId?: string; excludeClientReviewId?: string }): Promise<boolean> {
  const results = await Promise.all(
    REFERENCE_CHECKS.map(async ({ table, column }) => {
      let query = `select=id&limit=2&${column}=eq.${mediaAssetId}`;
      // A caller checking "is this asset orphaned after I remove/am about to
      // remove *this specific row*" excludes that row's own id from the
      // count — otherwise the row being removed would always make the
      // asset look "still referenced" by itself.
      if (table === "contribution_media" && options?.excludeContributionMediaRowId) {
        query += `&id=neq.${options.excludeContributionMediaRowId}`;
      }
      if (table === "design_response_media" && options?.excludeDesignResponseMediaRowId) {
        query += `&id=neq.${options.excludeDesignResponseMediaRowId}`;
      }
      if (table === "client_reviews" && options?.excludeClientReviewId) {
        query += `&id=neq.${options.excludeClientReviewId}`;
      }
      const rows = await supabaseSelect<{ id: string }[]>(table, query);
      return rows.length > 0;
    }),
  );
  return results.some(Boolean);
}

/**
 * Deletes the `media_assets` row and its Storage object ONLY if nothing
 * else references it — never a blind/cascading delete. Returns
 * `{ deleted: false }` (a preserved, shared asset) rather than throwing,
 * so a caller unlinking one reference never fails just because the asset
 * is legitimately still in use elsewhere.
 */
export async function deleteMediaAssetIfUnreferenced(
  mediaAssetId: string,
  options?: Parameters<typeof isMediaAssetReferenced>[1],
): Promise<{ deleted: boolean }> {
  const referenced = await isMediaAssetReferenced(mediaAssetId, options);
  if (referenced) return { deleted: false };

  const rows = await supabaseSelect<{ storage_path: string }[]>("media_assets", `select=storage_path&id=eq.${mediaAssetId}`);
  const storagePath = rows[0]?.storage_path;

  await supabaseDelete("media_assets", `id=eq.${mediaAssetId}`);

  // Best-effort: only a real Storage-hosted path can be deleted from
  // Storage (a pre-existing local /images/... path — the 9 JSON-era rows —
  // was never uploaded to Storage, so there's nothing there to remove).
  // Storage cleanup failing doesn't fail the operation — the media_assets
  // row (the thing that actually made this asset "reachable") is already
  // gone either way, same non-fatal posture createMediaAsset()'s own
  // rollback already uses.
  if (storagePath && isStorageUrl(storagePath)) {
    await deleteFromStorage(storagePathFromUrl(storagePath)).catch(() => {});
  }

  return { deleted: true };
}
