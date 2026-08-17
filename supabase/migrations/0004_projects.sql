-- [Phase 3A prep] Not yet applied anywhere.
--
-- Core portfolio table. `case_study_overview` / `case_study_outcome` are
-- pulled out as real columns (the only two CaseStudy fields the current
-- app actually filters on, via getCaseStudyPreviewProject()); every other
-- category-specific narrative field stays inside `case_study` jsonb,
-- unchanged key names, per the Phase 2B/2C mapping.
--
-- `slug` (not `id`) is what /work/[slug] resolves by, matching current
-- behavior exactly — see docs/PHASE_3A_SUPABASE_PREP.md, "ID/slug
-- preservation".

create table if not exists public.projects (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  title               text not null,
  category            text not null,
  project_type        text not null default '',
  year                int not null,
  client              text,
  role                text not null default '',
  short_description   text not null default '',
  description         text,
  cover_image_id      uuid references public.media_assets(id),
  cover_image_alt     text,
  thumbnail_id        uuid references public.media_assets(id),
  thumbnail_alt       text,
  featured            boolean not null default false,
  featured_order      int,
  published           boolean not null default false,
  tags                text[] not null default '{}',
  tools               text[] not null default '{}',
  services            text[] not null default '{}',
  project_url         text,
  "order"             int not null default 0,
  seo                 jsonb,
  case_study_overview text not null default '',
  case_study_outcome  text not null default '',
  case_study          jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists projects_published_idx on public.projects (published);
create index if not exists projects_category_idx on public.projects (category);
