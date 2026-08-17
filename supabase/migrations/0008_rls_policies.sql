-- [Phase 3A prep] Not yet applied anywhere.
--
-- Row Level Security as DB-layer defense-in-depth alongside (not instead
-- of) requireAdmin()/proxy.ts. Two shapes repeat throughout:
--   1. Admin-only tables: public can SELECT nothing, admin role can do
--      everything.
--   2. Public-readable content: anyone can SELECT published/visible rows;
--      only admin can write.
-- leads is the one deliberate exception: anon may INSERT (the public lead
-- form), but never SELECT/UPDATE/DELETE.

alter table public.profiles          enable row level security;
alter table public.media_assets      enable row level security;
alter table public.projects          enable row level security;
alter table public.gallery_items     enable row level security;
alter table public.custom_sections   enable row level security;
alter table public.site_settings     enable row level security;
alter table public.social_links      enable row level security;
alter table public.hero_content      enable row level security;
alter table public.hero_visuals      enable row level security;
alter table public.homepage_cards    enable row level security;
alter table public.about_content     enable row level security;
alter table public.contact_content   enable row level security;
alter table public.leads             enable row level security;
alter table public.lead_notes        enable row level security;
alter table public.lead_activity     enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: a user can read their own row; admin can read/write all.
create policy "profiles_self_select" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_write" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- media_assets: admin-only in every direction (no public listing endpoint exists today).
create policy "media_assets_admin_all" on public.media_assets for all using (public.is_admin()) with check (public.is_admin());

-- projects: public can read published rows; admin can read/write everything.
create policy "projects_public_select" on public.projects for select using (published = true or public.is_admin());
create policy "projects_admin_write" on public.projects for insert with check (public.is_admin());
create policy "projects_admin_update" on public.projects for update using (public.is_admin()) with check (public.is_admin());
create policy "projects_admin_delete" on public.projects for delete using (public.is_admin());

-- gallery_items / custom_sections: follow the parent project's published state.
create policy "gallery_items_public_select" on public.gallery_items for select using (
  public.is_admin() or exists (select 1 from public.projects p where p.id = project_id and p.published = true)
);
create policy "gallery_items_admin_write" on public.gallery_items for all using (public.is_admin()) with check (public.is_admin());

create policy "custom_sections_public_select" on public.custom_sections for select using (
  public.is_admin() or exists (select 1 from public.projects p where p.id = project_id and p.published = true)
);
create policy "custom_sections_admin_write" on public.custom_sections for all using (public.is_admin()) with check (public.is_admin());

-- Site-wide content: always publicly readable (mirrors today's public pages), admin-only writes.
create policy "site_settings_public_select" on public.site_settings for select using (true);
create policy "site_settings_admin_write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "social_links_public_select" on public.social_links for select using (visible = true or public.is_admin());
create policy "social_links_admin_write" on public.social_links for all using (public.is_admin()) with check (public.is_admin());

create policy "hero_content_public_select" on public.hero_content for select using (true);
create policy "hero_content_admin_write" on public.hero_content for all using (public.is_admin()) with check (public.is_admin());

create policy "hero_visuals_public_select" on public.hero_visuals for select using (visible = true or public.is_admin());
create policy "hero_visuals_admin_write" on public.hero_visuals for all using (public.is_admin()) with check (public.is_admin());

create policy "homepage_cards_public_select" on public.homepage_cards for select using (visible = true or public.is_admin());
create policy "homepage_cards_admin_write" on public.homepage_cards for all using (public.is_admin()) with check (public.is_admin());

create policy "about_content_public_select" on public.about_content for select using (true);
create policy "about_content_admin_write" on public.about_content for all using (public.is_admin()) with check (public.is_admin());

create policy "contact_content_public_select" on public.contact_content for select using (true);
create policy "contact_content_admin_write" on public.contact_content for all using (public.is_admin()) with check (public.is_admin());

-- leads: public (anon) may submit; only admin may ever read or manage.
create policy "leads_public_insert" on public.leads for insert with check (true);
create policy "leads_admin_select" on public.leads for select using (public.is_admin());
create policy "leads_admin_update" on public.leads for update using (public.is_admin()) with check (public.is_admin());
create policy "leads_admin_delete" on public.leads for delete using (public.is_admin());

create policy "lead_notes_admin_all" on public.lead_notes for all using (public.is_admin()) with check (public.is_admin());
create policy "lead_activity_admin_all" on public.lead_activity for all using (public.is_admin()) with check (public.is_admin());
