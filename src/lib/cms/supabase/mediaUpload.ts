import { deleteFromStorage, uploadToStorage } from "@/lib/supabase/storage";
import { supabaseInsert, supabaseSelect } from "@/lib/supabase/rest";

/**
 * [Phase 4C — media storage] Upload -> Storage -> media_assets row, in
 * that order deliberately: if the DB insert fails after a successful
 * Storage upload, the orphaned object is removed (best-effort) rather than
 * left unreferenced — the "if upload succeeds but DB insert fails" rule.
 * The reverse case (DB row without a real object) can't happen with this
 * ordering, since the row is only ever created after upload succeeds.
 */
export async function createMediaAsset(params: {
  storagePath: string;
  bytes: Buffer;
  contentType: string;
  projectSlug?: string | null;
  /** [Phase 6G Part A] Attributes a Storage-backed upload to a real `profiles.id` — used by the contributor media route so a Design Response's attached images are traceable to their uploader. Optional and additive: every existing caller (admin image/icon uploads) omits it, which inserts `null`, byte-identical to this column's value before this parameter existed. */
  uploadedBy?: string | null;
  /** [Signal media attachments] The client-supplied original filename (migration 0020's `original_filename` column) — Storage itself never sees it (`storagePath` is always a generated, collision-safe name). Optional and additive: every existing caller omits it, inserting `null`, same as before this parameter existed. */
  originalFilename?: string | null;
}): Promise<{ id: string; src: string }> {
  const publicUrl = await uploadToStorage(params.storagePath, params.bytes, params.contentType);
  try {
    const [row] = await supabaseInsert<{ id: string }[]>("media_assets", {
      storage_path: publicUrl,
      mime_type: params.contentType,
      file_size: params.bytes.byteLength,
      project_slug: params.projectSlug ?? null,
      uploaded_by: params.uploadedBy ?? null,
      original_filename: params.originalFilename ?? null,
    });
    return { id: row.id, src: publicUrl };
  } catch (err) {
    await deleteFromStorage(params.storagePath).catch(() => {});
    throw err;
  }
}

interface MediaAssetRow {
  id: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  project_slug: string | null;
  uploaded_at: string;
}

/** Every media_assets row — including the 9 already-migrated JSON-era images (their storage_path is a local /images/... path, still valid, still rendered by the same <img>/next/image code either way). */
export async function listMediaAssets(): Promise<{ src: string; project: string }[]> {
  const rows = await supabaseSelect<MediaAssetRow[]>("media_assets", "select=storage_path,project_slug&order=uploaded_at.desc");
  return rows.map((r) => ({ src: r.storage_path, project: r.project_slug ?? "site" }));
}
