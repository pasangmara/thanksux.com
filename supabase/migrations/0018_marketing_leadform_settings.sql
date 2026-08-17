-- [Phase A.2.2 — persistence migration] Two new singleton settings tables —
-- `data/marketing.json` and `data/leadform.json` had no Supabase table at
-- all before this (per dataBackend.ts's own comment: "Marketing/LeadForm:
-- no Supabase table exists yet"). Both are genuinely flat, admin-only
-- config blobs — `conversions`/`fields` are small, never individually
-- queried/joined/filtered lists (always read/written as one whole array,
-- same "the whole record is authoritative" semantics social_links/
-- homepage_cards already use for their own child lists) — so each stays a
-- single row with a jsonb array column rather than a new child table,
-- matching the same jsonb-for-genuinely-flexible-structure convention
-- `site_settings.nav_labels`/`seo_defaults` already established.
--
-- Purely additive: no existing table touched. RLS mirrors `site_settings`/
-- `hero_content` exactly (public select `using (true)` — these values are
-- never secret, a GA4/GTM id is always visible in any site's rendered
-- <script> tag regardless; admin-only write).

create table if not exists public.marketing_settings (
  id                        uuid primary key default gen_random_uuid(),
  ga4_measurement_id        text not null default '',
  ga4_enabled               boolean not null default false,
  gtm_container_id          text not null default '',
  gtm_enabled               boolean not null default false,
  google_ads_conversion_id  text not null default '',
  google_ads_enabled        boolean not null default false,
  conversions               jsonb not null default '[]',
  remarketing_enabled       boolean not null default false,
  consent_required          boolean not null default false,
  updated_at                timestamptz not null default now()
);

create table if not exists public.lead_form_settings (
  id          uuid primary key default gen_random_uuid(),
  fields      jsonb not null default '[]',
  updated_at  timestamptz not null default now()
);

alter table public.marketing_settings enable row level security;
alter table public.lead_form_settings enable row level security;

create policy "marketing_settings_public_select" on public.marketing_settings for select using (true);
create policy "marketing_settings_admin_write" on public.marketing_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "lead_form_settings_public_select" on public.lead_form_settings for select using (true);
create policy "lead_form_settings_admin_write" on public.lead_form_settings for all using (public.is_admin()) with check (public.is_admin());
