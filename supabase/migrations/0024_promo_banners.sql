-- [Promotional Banner / Campaign System] New, additive table. Inspected
-- first: site_settings/hero_content/homepage_cards/media_assets and every
-- existing migration have no equivalent "reorderable, schedulable,
-- enable/disable-able promotional unit" concept — hero_content is a single
-- singleton record (one hero, not a list), homepage_cards models fixed
-- feature tiles, not campaign copy with CTAs/scheduling. This is modeled
-- directly on `client_reviews` (migration 0016) — the closest existing
-- shape (admin-authored CMS content, not community-submitted, its own
-- table with display_order + enable flag + service-role admin writes) —
-- rather than inventing a new architectural pattern.
--
-- Same write-path posture as every other admin-authored table: the
-- hand-rolled admin has no Supabase Auth session, so all writes go through
-- the service-role key (src/lib/supabase/rest.ts) gated by requireAdmin() +
-- proxy.ts's /admin/* matcher — RLS below is the defense-in-depth backstop
-- for a direct request against Supabase's own REST API, not the primary
-- write gate.
--
-- image_alt/image_decorative live on this table, not on media_assets —
-- same "placement-specific data lives on the referencing table" rule
-- already applied to `client_reviews.avatar_alt` and `projects.cover_image_alt`.

create table if not exists public.promo_banners (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  eyebrow               text,
  description           text,
  primary_cta_label     text,
  primary_cta_url       text,
  secondary_cta_label   text,
  secondary_cta_url     text,
  image_media_id        uuid references public.media_assets(id) on delete set null,
  image_alt             text,
  image_decorative      boolean not null default false,
  variant               text not null default 'gradient' check (variant in ('gradient', 'dark', 'light', 'image')),
  badge_label           text,
  campaign_name         text,
  start_at              timestamptz,
  end_at                timestamptz,
  enabled               boolean not null default false,
  display_order         int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists promo_banners_enabled_idx on public.promo_banners (enabled);
create index if not exists promo_banners_display_order_idx on public.promo_banners (display_order);

alter table public.promo_banners enable row level security;

-- Same shape as client_reviews_public_select, extended with the optional
-- schedule window: a visitor can read a row only while it's enabled AND
-- (if start_at/end_at are set) within that window; the admin (is_admin())
-- can always read every row regardless of schedule/enabled state, same as
-- every sibling CMS table.
create policy "promo_banners_public_select" on public.promo_banners
  for select using (
    (enabled = true and (start_at is null or start_at <= now()) and (end_at is null or end_at >= now()))
    or public.is_admin()
  );
create policy "promo_banners_admin_write" on public.promo_banners
  for all using (public.is_admin()) with check (public.is_admin());
