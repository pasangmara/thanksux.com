-- [Phase 3A prep] Not yet applied anywhere.
--
-- gallery_items unifies the 8 current CoverMedia[] arrays (gallery,
-- wireframes, finalDesign, moodboard, logo, applications, exploration,
-- brandGuidelines) into one table with a `section` discriminator — the
-- same normalization src/types/project.ts's GalleryItem interface and
-- lib/admin/gallery.ts's flattenGallery()/applyFlatGallery() already do
-- today, made structural. See docs/PHASE_3A_SUPABASE_PREP.md §Schema.

create table if not exists public.gallery_items (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  section         text not null check (section in (
                    'gallery', 'wireframes', 'finalDesign', 'moodboard',
                    'logo', 'applications', 'exploration', 'brandGuidelines'
                  )),
  media_asset_id  uuid references public.media_assets(id),
  alt             text not null default '',
  caption         text,
  description     text,
  layout          text not null default 'half',
  aspect          text,
  fit             text,
  object_position text,
  "order"         int not null default 0
);

create index if not exists gallery_items_project_idx on public.gallery_items (project_id, section, "order");

create table if not exists public.custom_sections (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  label             text not null default '',
  description       text,
  type              text,
  text              text,
  image_id          uuid references public.media_assets(id),
  video_url         text,
  embed_url         text,
  figma_url         text,
  link_url          text,
  link_label        text,
  quote_attribution text,
  items             jsonb,
  "order"           int not null default 0,
  visible           boolean not null default true,
  animation         jsonb
);

create index if not exists custom_sections_project_idx on public.custom_sections (project_id, "order");
