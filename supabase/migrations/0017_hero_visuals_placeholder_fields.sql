-- [Phase A.2.1 — persistence migration] Closes the exact gap
-- siteContentRepository.ts's getHeroContent() has documented since Phase 4's
-- read-path migration: `hero_visuals` has an `image_id` FK but no column to
-- reconstruct a placeholder image's `category`, and no `alt` column at all.
-- All 4 of today's real Hero visuals are placeholders with real, specific
-- alt text (data/hero.json) — reading from Supabase without these columns
-- would either lose that alt text or collapse every placeholder to the same
-- hardcoded category (the exact behavior mapProject.ts's own `toCoverMedia`
-- already documents as a known gap for cover/gallery images). Purely
-- additive, nullable columns — no existing row or column is touched.

alter table public.hero_visuals add column if not exists placeholder_category text;
alter table public.hero_visuals add column if not exists image_alt text;
