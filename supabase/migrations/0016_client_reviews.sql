-- [Phase 6G Part B — Client Reviews / Testimonials] New, additive table.
-- Inspected first: no equivalent testimonial/review structure exists
-- anywhere in this project (data/*.json, src/types/*, every existing
-- migration) — `projects.case_study` has no review/quote field, and
-- `leads`/`lead_notes` (CRM) model inbound sales inquiries, not client
-- feedback about finished work. This is a genuinely new entity.
--
-- Modeled as CMS content (like `projects`), not community user-generated
-- content (like `thanks_signals`) — a review is admin-authored/curated,
-- never submitted by a public visitor, so it follows `projects`'/
-- `homepage_cards`' own RLS shape (`published = true or is_admin()` select,
-- one combined admin-write policy), not the community tables'
-- author-owned-row shape. The admin CMS itself still writes via the
-- existing service-role path (src/lib/supabase/rest.ts, gated by
-- requireAdmin() + proxy.ts) exactly like every other admin-authored
-- table — RLS here is the same defense-in-depth backstop `projects`
-- already has, not the primary write gate.
--
-- avatar_alt lives on this table, not on media_assets — same
-- "placement-specific data lives on the referencing table" rule
-- docs/PHASE_3A_SUPABASE_PREP.md established for cover_image_alt/
-- thumbnail_alt on `projects`.

create table if not exists public.client_reviews (
  id              uuid primary key default gen_random_uuid(),
  client_name     text not null,
  client_role     text,
  company         text,
  review_text     text not null,
  avatar_media_id uuid references public.media_assets(id) on delete set null,
  avatar_alt      text,
  project_id      uuid references public.projects(id) on delete set null,
  rating          int check (rating is null or (rating between 1 and 5)),
  featured        boolean not null default false,
  published       boolean not null default false,
  display_order   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists client_reviews_published_idx on public.client_reviews (published);
create index if not exists client_reviews_display_order_idx on public.client_reviews (display_order);
create index if not exists client_reviews_project_idx on public.client_reviews (project_id);

alter table public.client_reviews enable row level security;

-- Same shape as homepage_cards_public_select/hero_visuals_public_select
-- (migration 0008): anonymous/authenticated non-admin can read published
-- rows only; admin (is_admin() — the real-Supabase-Auth admin path) can
-- read/write everything. The hand-rolled CMS admin's own writes go
-- through the service-role key regardless, same as every sibling table.
create policy "client_reviews_public_select" on public.client_reviews
  for select using (published = true or public.is_admin());
create policy "client_reviews_admin_write" on public.client_reviews
  for all using (public.is_admin()) with check (public.is_admin());
