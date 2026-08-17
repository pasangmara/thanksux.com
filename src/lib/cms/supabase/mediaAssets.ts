import { supabaseInsert, supabaseSelect } from "@/lib/supabase/rest";
import type { AdminMedia } from "@/lib/admin/types";
import type { CoverMedia } from "@/types/project";

/**
 * [Phase 4B — write path] Reuses an existing media_assets row by
 * storage_path if one already exists, otherwise creates one — same
 * dedup-by-path rule scripts/migrate-json-to-supabase.mjs established.
 * Placeholder-kind media never gets a row (nothing real to store).
 */
export async function resolveMediaAssetId(media: CoverMedia | AdminMedia | undefined): Promise<string | null> {
  if (!media || media.kind !== "image" || !media.src) return null;
  const existing = await supabaseSelect<{ id: string }[]>(
    "media_assets",
    `select=id&storage_path=eq.${encodeURIComponent(media.src)}&limit=1`,
  );
  if (existing[0]) return existing[0].id;
  const created = await supabaseInsert<{ id: string }[]>("media_assets", { storage_path: media.src });
  return created[0].id;
}
