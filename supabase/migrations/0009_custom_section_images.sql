-- [Phase 4B write-path] Additive, nullable column. CustomSection.images
-- (src/types/project.ts) is a full CoverMedia[] gallery distinct from the
-- section's single `image` (already covered by custom_sections.image_id) —
-- discovered missing while building the write path: no current project
-- uses it (Gridmark has zero custom sections), but saving one without this
-- column would silently drop that array. Stored as plain jsonb (embedded
-- CoverMedia objects), not decomposed into gallery_items — this is a rare,
-- secondary field with no cross-project reuse need, so the extra FK layer
-- isn't justified. Does not touch any existing row/data.

alter table public.custom_sections add column if not exists images jsonb;
