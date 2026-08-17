import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseSelect } from "@/lib/supabase/rest";

/**
 * [Phase 6F §8 — public media rendering] `media_assets` has no public RLS
 * policy — `media_assets_admin_all` (migration 0008) is the *only* policy
 * on that table, gated by `is_admin()`. This is the exact same gap the
 * public portfolio side already lives with and already works around:
 * `src/lib/cms/supabase/mapProject.ts` reads `media_assets` via the
 * service-role key (never the RLS-bound session client) for precisely
 * this reason — see that file's own header comment. This module mirrors
 * that established pattern rather than widening `media_assets`' RLS or
 * inventing a second media-resolution mechanism.
 *
 * Safety: `resolveMediaUrls` never receives an arbitrary/unbounded id list
 * straight from a client request. Every caller below first reads the
 * *join* table (`contribution_media`/`design_response_media`) through the
 * RLS-bound session client — those tables' own `_select` policies only
 * return rows whose parent Contribution/DesignResponse is already public
 * (`status = 'approved'`/`'published'`, or the caller's own row) — so the
 * ids reaching the service-role read here are already publicly-gated
 * before that read ever runs. Only display-safe columns are selected —
 * never `uploaded_by` or anything else on the row.
 */
interface MediaMeta {
  url: string;
  mimeType: string | null;
  fileSize: number | null;
  filename: string | null;
}

export async function resolveMediaUrls(mediaAssetIds: string[]): Promise<Map<string, MediaMeta>> {
  if (mediaAssetIds.length === 0) return new Map();
  const uniqueIds = [...new Set(mediaAssetIds)];
  const rows = await supabaseSelect<
    { id: string; storage_path: string; mime_type: string | null; file_size: number | null; original_filename: string | null }[]
  >("media_assets", `select=id,storage_path,mime_type,file_size,original_filename&id=in.(${uniqueIds.join(",")})`);
  return new Map(
    rows.map((r) => [
      r.id,
      { url: r.storage_path, mimeType: r.mime_type, fileSize: r.file_size, filename: r.original_filename },
    ]),
  );
}

export interface OrderedMedia {
  /** The join-table row's own id — `contribution_media.id`/`design_response_media.id`/`thanks_signal_media.id`, not `media_asset_id`. This is what the write-path (designResponseMediaRepository.ts/thanksSignalMediaRepository.ts) accepts for remove/reorder. */
  id: string;
  mediaAssetId: string;
  url: string;
  order: number;
  mimeType: string | null;
  fileSize: number | null;
  /** Client-supplied original filename (migration 0020) — null for anything uploaded before that column existed, or via a caller that never sent one. */
  filename: string | null;
}

async function getOrderedMedia(
  table: "contribution_media" | "design_response_media" | "thanks_signal_media",
  parentColumn: "contribution_id" | "design_response_id" | "thanks_signal_id",
  parentId: string,
): Promise<OrderedMedia[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .select("id, media_asset_id, order")
    .eq(parentColumn, parentId)
    .order("order", { ascending: true });
  if (error) throw new Error(error.message);
  const rows = data as { id: string; media_asset_id: string; order: number }[];
  if (rows.length === 0) return [];
  const metaById = await resolveMediaUrls(rows.map((r) => r.media_asset_id));
  return rows
    .map((r) => {
      const meta = metaById.get(r.media_asset_id);
      return {
        id: r.id,
        mediaAssetId: r.media_asset_id,
        url: meta?.url ?? "",
        order: r.order,
        mimeType: meta?.mimeType ?? null,
        fileSize: meta?.fileSize ?? null,
        filename: meta?.filename ?? null,
      };
    })
    .filter((m) => m.url);
}

/** Ordered, resolved media attached to one Contribution. Empty today for every real row — no contributor-facing upload path exists yet (see /admin/contributions/[id]'s own note) — but ready to render the moment one does. */
export async function getContributionMedia(contributionId: string): Promise<OrderedMedia[]> {
  return getOrderedMedia("contribution_media", "contribution_id", contributionId);
}

/** Same as getContributionMedia, for a DesignResponse. */
export async function getDesignResponseMedia(designResponseId: string): Promise<OrderedMedia[]> {
  return getOrderedMedia("design_response_media", "design_response_id", designResponseId);
}

/**
 * [Signal media attachments] Ordered, resolved media attached to one
 * ThanksSignal. RLS-gated the same way as the two functions above:
 * `thanks_signal_media_select` (migration 0020) only returns rows whose
 * parent Signal is already public, the caller's own, or admin — so by the
 * time `resolveMediaUrls` runs, the ids it receives are already legitimately
 * visible to the requesting session. This is the real enforcement of Part
 * D's "unpublished/private signal media must not become publicly
 * accessible" — server-side, at the RLS layer, not a React-only check.
 */
export async function getThanksSignalMedia(thanksSignalId: string): Promise<OrderedMedia[]> {
  return getOrderedMedia("thanks_signal_media", "thanks_signal_id", thanksSignalId);
}
