-- [Phase A.2.3 — persistence migration, highest-risk step] Moves the
-- hand-rolled admin system's storage (data/users.json, data/sessions.json)
-- to Supabase — the auth *model* itself (opaque random session tokens in a
-- cookie, scrypt password hashing, requireAdmin()/proxy.ts's own gate) is
-- completely unchanged; only where the rows live changes. See
-- src/lib/auth/usersRepository.ts / sessionsRepository.ts for the read/
-- write side of this same phase.
--
-- Deliberately named `admin_users`/`admin_sessions`, not `users`/`sessions`
-- — this is NOT the `profiles`/Supabase Auth identity system the community
-- features (ThanksSignals/Contributions/Client Reviews) already use. The
-- two are, and remain, completely separate identity systems with zero
-- shared rows, exactly as every prior phase's docs have stated. `role`
-- reuses the exact three existing values from src/types/auth.ts's
-- `UserRole` — no new role invented.
--
-- SECURITY — the most locked-down tables in this entire schema, more so
-- than media_assets' admin-only policy: RLS is enabled on both, but
-- **zero policies are created**. This is deliberate, not an oversight —
-- with RLS enabled and no policy, Postgres denies all access to every
-- role except the service-role key (which bypasses RLS by design in
-- Supabase). An `is_admin()`-gated policy (the pattern every other
-- admin-write table in this schema uses) would be semantically wrong
-- here: `is_admin()` checks `profiles.role = 'admin'` — a Supabase Auth
-- concept this hand-rolled system has no session for and no relationship
-- to. Password hashes and session tokens must never be reachable through
-- the anon/publishable key under any RLS condition; every legitimate
-- access to these two tables is server-only, via the service-role key,
-- exactly matching proxy.ts's own documented security boundary.

create table if not exists public.admin_users (
  id                 text primary key,
  email              text not null unique,
  password_hash      text not null,
  name               text not null,
  role               text not null check (role in ('user', 'creator', 'admin')),
  email_verified_at  timestamptz,
  created_at         timestamptz not null,
  updated_at         timestamptz not null
);

create table if not exists public.admin_sessions (
  id          text primary key,
  user_id     text not null references public.admin_users(id) on delete cascade,
  created_at  timestamptz not null,
  expires_at  timestamptz not null
);

create index if not exists admin_sessions_user_idx on public.admin_sessions (user_id);
create index if not exists admin_sessions_expires_idx on public.admin_sessions (expires_at);

alter table public.admin_users enable row level security;
alter table public.admin_sessions enable row level security;
-- No policies — see this file's own header comment for why that's the
-- deliberate, correct choice for these two tables specifically.
