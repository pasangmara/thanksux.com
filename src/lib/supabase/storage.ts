/**
 * [Phase 4C — media storage] Minimal, dependency-free Supabase Storage
 * client — same pattern as rest.ts, plain fetch against Storage's own REST
 * API rather than @supabase/supabase-js. Server-only: every call uses the
 * service-role key, never exposed to the browser (all callers are Route
 * Handlers — /api/admin/images, /api/admin/icons — gated by requireAdmin()
 * before this module is ever reached).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "portfolio-media";

function requireCredentials() {
  if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set — cannot reach Supabase Storage.");
  if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — cannot reach Supabase Storage.");
}

/** Uploads a file to `portfolio-media/<storagePath>` and returns its stable public URL. Never overwrites (`x-upsert: false`) — every caller generates a collision-safe path, so a 409 here would mean a genuine (near-impossible) collision, surfaced as a real error rather than silently overwriting someone else's file. */
export async function uploadToStorage(storagePath: string, bytes: Buffer, contentType: string): Promise<string> {
  requireCredentials();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: new Uint8Array(bytes),
  });
  if (!res.ok) {
    throw new Error(`Storage upload failed (${storagePath}): HTTP ${res.status} — ${await res.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

/** Best-effort delete — used both for real cleanup and orphan-rollback (upload succeeded, DB insert failed). Failures are swallowed by the caller where rollback is advisory, never thrown from here so a delete failure can't mask the original error. */
export async function deleteFromStorage(storagePath: string): Promise<void> {
  requireCredentials();
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: "DELETE",
    headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Storage delete failed (${storagePath}): HTTP ${res.status} — ${await res.text()}`);
  }
}

/** True if `url` points inside this app's Supabase Storage bucket — distinguishes a Storage-hosted reference from a pre-existing local /images/... path, which must never be passed to deleteFromStorage. */
export function isStorageUrl(url: string): boolean {
  return Boolean(SUPABASE_URL) && url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`);
}

/** Inverse of the public-URL construction in uploadToStorage — the bucket-relative path, for delete calls. */
export function storagePathFromUrl(url: string): string {
  return url.slice(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`.length);
}
