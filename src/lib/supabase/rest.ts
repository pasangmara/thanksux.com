/**
 * [Phase 4 — Read-path migration] Minimal, dependency-free Supabase REST
 * (PostgREST) client. No @supabase/supabase-js — this project has a
 * deliberate zero-runtime-dependency policy (see fileStore.ts's header
 * comment), and a thin fetch wrapper is all a read-only PostgREST call
 * needs; the same technique already proven live in
 * scripts/migrate-json-to-supabase.mjs.
 *
 * Every call here uses the service-role key, deliberately, not the public
 * publishable key: every repository function this feeds (listAllProjects,
 * getAboutContent, etc.) has always returned its *complete*, unfiltered
 * record under the JSON backend — draft projects included, hidden cards
 * included — with filtering happening one layer up at each specific
 * consumer (content/projects.ts's published filter, Services.tsx's
 * visible filter, etc.). Using the public key + RLS here would silently
 * change that contract (e.g. an admin editing a currently-hidden homepage
 * card would stop seeing it at all). The service-role key preserves the
 * existing "repository returns everything" behavior exactly. This is not
 * a public-facing key — every caller is server-only (Server Components,
 * Route Handlers), never a "use client" file, never proxy.ts. See
 * docs/PHASE_3A_SUPABASE_PREP.md's client-boundary table for the general
 * rule this follows.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireCredentials() {
  if (!SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set — cannot reach Supabase.");
  if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set — cannot reach Supabase.");
}

export async function supabaseSelect<T>(table: string, query: string): Promise<T> {
  requireCredentials();
  const __t0 = Date.now();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
    cache: "no-store",
  });
  if (process.env.PERF_DEBUG) {
    console.log(`[perf] SELECT ${table}?${query} — ${Date.now() - __t0}ms — status ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`Supabase read failed (${table}?${query}): HTTP ${res.status} — ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/**
 * [Phase 4B — write path] Insert new row(s). `Prefer: return=representation`
 * so the caller gets back the actual stored row (including any DB-generated
 * default) without a second round-trip.
 */
export async function supabaseInsert<T>(table: string, rows: object | object[]): Promise<T> {
  requireCredentials();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase insert failed (${table}): HTTP ${res.status} — ${await res.text()}`);
  return res.json() as Promise<T>;
}

/**
 * [Phase 4B — write path] Upsert by a unique column (e.g. `slug`) —
 * PostgREST's `on_conflict` + `resolution=merge-duplicates` does insert-or-
 * update in one round trip and returns the resulting row either way, so the
 * caller always gets the row's real `id` back without needing to know in
 * advance whether it already existed.
 */
export async function supabaseUpsert<T>(table: string, rows: object | object[], onConflictColumn: string): Promise<T> {
  requireCredentials();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflictColumn}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert failed (${table}): HTTP ${res.status} — ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** [Phase 4B — write path] `query` is a PostgREST filter, e.g. `id=eq.<uuid>` — always required, so a call can never accidentally patch every row in a table. */
export async function supabaseUpdate<T>(table: string, query: string, patch: object): Promise<T> {
  requireCredentials();
  if (!query) throw new Error(`Supabase update refused (${table}): an unfiltered update would touch every row.`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY!,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Supabase update failed (${table}?${query}): HTTP ${res.status} — ${await res.text()}`);
  return res.json() as Promise<T>;
}

/** [Phase 4B — write path] `query` is always required, same reasoning as supabaseUpdate. */
export async function supabaseDelete(table: string, query: string): Promise<void> {
  requireCredentials();
  if (!query) throw new Error(`Supabase delete refused (${table}): an unfiltered delete would remove every row.`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "DELETE",
    headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase delete failed (${table}?${query}): HTTP ${res.status} — ${await res.text()}`);
}
