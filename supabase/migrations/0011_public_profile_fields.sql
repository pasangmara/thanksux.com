-- [Phase 5 — Public user auth foundation] Additive, nullable columns on the
-- existing `profiles` table (created in Phase 3B, migration 0002) — no new
-- table, per "do not duplicate existing structures". `id`/`name`/`role`/
-- `created_at`/`updated_at` are untouched. Zero impact on existing rows
-- (the one real admin profile, if it has ever been created — Phase 1's
-- hand-rolled admin system never touched Supabase Auth, so today's
-- auth.users/profiles are likely still empty; this migration doesn't care
-- either way, it's purely additive).

alter table public.profiles add column if not exists username text unique;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists website text;

-- RLS: profile data (display name, avatar, bio, links) is not sensitive —
-- no email/password lives on this table (that stays in Supabase's own
-- auth.users, governed by Supabase Auth itself, not this policy). Public
-- read is the correct shape for a profile table a future community
-- feature will need to browse; write stays strictly self-only.
create policy "profiles_public_select" on public.profiles for select using (true);

create policy "profiles_self_update" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'user');
-- `role = 'user'` in the check clause: a user can update their own row,
-- but can never set their own role away from 'user' (e.g. to 'admin') —
-- role escalation stays impossible through this policy regardless of what
-- the update payload contains. profiles_admin_write (existing, Phase 3B)
-- is still the only policy that can ever change `role`.
