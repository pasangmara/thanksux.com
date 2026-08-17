-- [Phase 3A prep] Not yet applied anywhere — no Supabase project exists.
-- Enables gen_random_uuid(), used as the default PK generator for every
-- table below. Supabase projects normally have pgcrypto enabled already;
-- this is here so the migration set is self-contained and re-creatable
-- from scratch on a fresh project.

create extension if not exists pgcrypto;
