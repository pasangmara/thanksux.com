-- [Phase 3A prep] Not yet applied anywhere.
--
-- One row per current data/*.json site-content file (settings.json,
-- hero.json, homepage.json, about.json, contact.json). social_links.owner
-- reflects the already-completed consolidation where ContactContent's
-- social links transparently redirect to SiteSettings' — one real table,
-- not two. See docs/PHASE_3A_SUPABASE_PREP.md, field mapping table.

create table if not exists public.site_settings (
  id                 uuid primary key default gen_random_uuid(),
  site_title         text not null default '',
  site_description   text,
  positioning        text,
  differentiator     text,
  brand_name         text not null default '',
  footer_brand_name  text,
  site_url           text,
  logo_id            uuid references public.media_assets(id),
  logo_alt           text,
  logo_mobile_id     uuid references public.media_assets(id),
  favicon_id         uuid references public.media_assets(id),
  brand_mark_id      uuid references public.media_assets(id),
  logo_display_mode  text,
  nav_labels         jsonb,
  footer_text        text,
  seo_defaults       jsonb,
  updated_at         timestamptz not null default now()
);

create table if not exists public.social_links (
  id              uuid primary key default gen_random_uuid(),
  owner           text not null default 'settings' check (owner in ('settings', 'contact')),
  label           text not null default '',
  value           text,
  href            text,
  icon            text,
  priority        int not null default 0,
  custom_icon_id  uuid references public.media_assets(id),
  visible         boolean not null default true,
  "order"         int not null default 0
);

create table if not exists public.hero_content (
  id                       uuid primary key default gen_random_uuid(),
  eyebrow                  text,
  headline                 text not null default '',
  description              text not null default '',
  primary_cta_label        text,
  primary_cta_url          text,
  primary_cta_visible      boolean not null default true,
  primary_cta_new_tab      boolean not null default false,
  secondary_cta_label      text,
  secondary_cta_url        text,
  secondary_cta_visible    boolean not null default true,
  secondary_cta_new_tab    boolean not null default false,
  seo                      jsonb,
  updated_at               timestamptz not null default now()
);

create table if not exists public.hero_visuals (
  id           uuid primary key default gen_random_uuid(),
  hero_id      uuid not null references public.hero_content(id) on delete cascade,
  image_id     uuid references public.media_assets(id),
  title        text,
  description  text,
  href         text,
  "order"      int not null default 0,
  visible      boolean not null default true,
  animation    jsonb
);

create table if not exists public.homepage_cards (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('service', 'process')),
  title         text not null default '',
  description   text not null default '',
  icon_id       uuid references public.media_assets(id),
  icon_size     text,
  icon_position text,
  url           text,
  "order"       int not null default 0,
  visible       boolean not null default true,
  animation     jsonb
);

create index if not exists homepage_cards_kind_idx on public.homepage_cards (kind, "order");

create table if not exists public.about_content (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null default '',
  title                  text not null default '',
  roles                  text[] not null default '{}',
  bio                    text,
  design_philosophy      text,
  about_facts            text[] not null default '{}',
  photo_id               uuid references public.media_assets(id),
  location               text,
  experience_summary     text,
  skills_design          text[] not null default '{}',
  skills_tools           text[] not null default '{}',
  resume_url             text,
  seo                    jsonb
);

create table if not exists public.contact_content (
  id                    uuid primary key default gen_random_uuid(),
  heading               text not null default '',
  description           text,
  email                 text,
  phone                 text,
  location              text,
  project_types         text[] not null default '{}',
  response_time_line    text,
  success_message       text,
  seo                   jsonb
);
