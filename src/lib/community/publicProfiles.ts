import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface PublicContributorInfo {
  name: string;
  username: string | null;
}

/**
 * [Phase 6F §13 — minimum public profile info] Batch display-name lookup
 * for public community pages. `profiles` is fully public-readable
 * (`profiles_public_select`, migration 0011 — `using (true)`), so this
 * uses the same RLS-bound session client as every other public community
 * read in this phase, not a service-role read. Only `name`/`username` are
 * selected — never `bio`/`avatar_url`/`website`/`role`, and never
 * anything from `auth.users` (email) — the minimum the product loop
 * actually needs ("by <name>"), per the explicit instruction not to
 * expose more than that until a later public-profiles phase.
 */
export async function getContributorNames(ids: string[]): Promise<Map<string, PublicContributorInfo>> {
  if (ids.length === 0) return new Map();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, username")
    .in("id", [...new Set(ids)]);
  if (error) throw new Error(error.message);
  return new Map(
    (data as { id: string; name: string; username: string | null }[]).map((p) => [
      p.id,
      { name: p.name, username: p.username },
    ]),
  );
}
