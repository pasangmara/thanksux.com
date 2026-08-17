-- [Admin Dashboard Brand Identity] Adds a logo field for the admin panel's
-- own chrome (AdminShell.tsx sidebar header), distinct from `logo_id`
-- (the public site's nav/footer wordmark, SiteSettings.logo). Same
-- media_assets-backed pattern as every other brand asset column on this
-- table (logo_id, logo_mobile_id, favicon_id, brand_mark_id) — reuses the
-- existing media pipeline (/api/admin/icons, IconField.tsx) rather than a
-- new upload path. Purely additive, nullable columns — unset means "show
-- the existing 'Thanks UX CMS' text," the exact current behavior.

alter table public.site_settings add column if not exists admin_logo_id uuid references public.media_assets(id);
alter table public.site_settings add column if not exists admin_logo_alt text;
