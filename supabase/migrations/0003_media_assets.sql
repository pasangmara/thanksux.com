-- [Phase 3A prep] Not yet applied anywhere.
--
-- One row per physical uploaded file. Placement-specific data (alt text,
-- caption, layout, ordering) lives on the referencing table, not here —
-- see docs/PHASE_3A_SUPABASE_PREP.md, "media_assets vs. placement fields".
--
-- storage_path holds today's existing /images/... public path at first
-- cutover (no file move required); a later, separately-approved step
-- would repoint it at Supabase Storage.

create table if not exists public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null,
  width         int,
  height        int,
  file_size     int,
  mime_type     text,
  uploaded_at   timestamptz not null default now(),
  uploaded_by   uuid references public.profiles(id)
);
