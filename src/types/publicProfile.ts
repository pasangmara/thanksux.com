/**
 * [Phase 5 — Public user auth foundation] The public-facing user profile —
 * distinct from src/types/auth.ts's User/PublicUser, which model the
 * existing hand-rolled ADMIN identity system (data/users.json). This type
 * models a Supabase Auth identity's row in the `profiles` table instead.
 * The two systems are deliberately not unified — see docs/PHASE_5_AUTH.md.
 */
export interface PublicProfile {
  id: string;
  name: string;
  role: "user" | "creator" | "admin";
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  website: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateInput {
  name?: string;
  username?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  website?: string | null;
}
