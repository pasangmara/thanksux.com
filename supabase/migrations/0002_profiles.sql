-- [Phase 3A prep] Not yet applied anywhere.
--
-- Extends Supabase's built-in auth.users (email, password hash, session
-- management — all managed by Supabase Auth, not by this schema) with the
-- one column this app actually needs on top: `role`. This is the
-- Phase-2-approved replacement for data/users.json — see
-- docs/PHASE_3A_SUPABASE_PREP.md for why user/session data is replaced
-- wholesale rather than migrated field-by-field.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  role       text not null default 'user' check (role in ('user', 'creator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row the moment a new auth.users row appears, so
-- application code never has to remember to do it manually.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
