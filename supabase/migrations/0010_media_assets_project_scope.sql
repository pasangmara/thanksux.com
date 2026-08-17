-- [Phase 4C — media storage] Additive, nullable column. The local-filesystem
-- upload path scopes "Choose existing image" to a project by folder
-- (public/images/projects/<slug>/...); media_assets has no equivalent way
-- to know which project a Storage upload belongs to. NULL means
-- site-level/unscoped (matches every already-migrated row's real status —
-- not backfilled retroactively, per "do not modify existing project data
-- unnecessarily"). Only new Supabase-Storage uploads populate this.

alter table public.media_assets add column if not exists project_slug text;
create index if not exists media_assets_project_slug_idx on public.media_assets (project_slug);
