import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicProfile, ProfileUpdateInput } from "@/types/publicProfile";

interface ProfileRow {
  id: string;
  name: string;
  role: "user" | "creator" | "admin";
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

function rowToProfile(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    username: row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    website: row.website,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * The signed-in visitor's own identity + profile, or null if not signed
 * in. Uses the RLS-bound server client (see server.ts) — this can only
 * ever read the caller's own row via profiles_self_select, or any row via
 * the new profiles_public_select (Phase 5's migration), never bypasses
 * anything.
 */
export async function getCurrentPublicUser(): Promise<{ authUserId: string; email?: string; profile: PublicProfile } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profileRow) return null;

  return { authUserId: user.id, email: user.email, profile: rowToProfile(profileRow as ProfileRow) };
}

/**
 * Updates the signed-in visitor's own profile. RLS (profiles_self_update,
 * Phase 5's migration) is the real enforcement — `id=eq.<their own id>`
 * here is belt-and-suspenders, not the only guard; even if this function
 * were called with a forged id, the database would reject any row that
 * isn't the caller's own.
 */
export async function updateOwnProfile(input: ProfileUpdateInput): Promise<PublicProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.username !== undefined) patch.username = input.username;
  if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.website !== undefined) patch.website = input.website;

  const { data, error } = await supabase.from("profiles").update(patch).eq("id", user.id).select("*").single();
  if (error) throw new Error(error.message);
  return data ? rowToProfile(data as ProfileRow) : null;
}
