# PHASE_3A_SUPABASE_PREP.md

## Phase 3A — Supabase connection preparation

**Status:** Preparation only. No Supabase project exists, no package is installed, no data has moved. Nothing in this phase changes runtime behavior — `data/*.json` via `fileStore.ts` remains the only active data path, exactly as before. This document, `.env.example`'s new (empty) variable block, and `supabase/migrations/*.sql` (written but never executed against anything) are the only outputs.

---

## 1. Environment variables required

| Variable | Exposure | Used by | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (safe) | Server client, browser client | Project URL from Supabase Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (safe) | Server client, browser client | RLS enforces access control, not secrecy of this key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, secret | Admin/service-role client only | Bypasses RLS entirely — see boundary rules in §2 |

All three are now present, **blank**, in `.env.example`, with a comment stating they are not yet read by any code. No fourth variable (e.g. a direct Postgres connection string) is required for the client architecture below — Supabase's REST/PostgREST layer via the anon/service keys is sufficient for everything this app does. A direct `postgres://` connection string would only become relevant if a future step chooses to run raw SQL migrations via the Supabase CLI/`psql` rather than pasting them into the SQL editor — a decision deferred to whoever runs Phase 3, not required now.

---

## 2. Client architecture

Three distinct Supabase clients are the standard Next.js App Router pattern (`@supabase/ssr` + `@supabase/supabase-js`). This app needs some, not all, of them immediately:

### Server client (needed, primary)
- **Package:** `@supabase/ssr`'s `createServerClient`, backed by `next/headers`' `cookies()`.
- **Used by:** Server Components, Route Handlers — the same layer that today calls `projectsRepository.ts` / `leadsRepository.ts` / `usersRepository.ts` directly.
- **Behavior:** runs as the requesting user (or anonymous), RLS-enforced. This is the client every repository's future `DatabaseRepository` implementation would use.
- **Must never be imported into a `"use client"` file** — it reads request cookies via `next/headers`, which is server-only, the same constraint `fileStore.ts` already documents for `fs`.

### Browser client (not needed yet)
- **Package:** `@supabase/ssr`'s `createBrowserClient`.
- **Used by:** Client Components only — specifically, a future Supabase-Auth-backed `/admin/login`/`/admin/setup` form that needs to keep the browser's session cookie in sync during sign-in/sign-out.
- **Why not needed now:** every current data mutation in this app already goes through a Route Handler (`fetch('/api/admin/...')`) called from a Client Component — never a direct client-to-database call. That pattern doesn't change in Phase 3A. A browser client only becomes necessary when Phase 3's step 4 (Auth integration, see `docs/PHASE_2_DATABASE_FOUNDATION` conceptually / the Phase 2I sequence) actually replaces Phase 1's hand-rolled session cookie with Supabase Auth's own. Documented here so its future addition isn't a surprise, not built now.

### Admin / service-role client (needed later, narrowly scoped)
- **Package:** `@supabase/supabase-js`'s plain `createClient(url, serviceRoleKey)`, no cookie/session handling.
- **Used by:** the one-off JSON→Postgres migration script (Phase 3 step 7, not yet built) and any equivalent trusted, server-only maintenance task that must legitimately bypass RLS (e.g. writing rows before any admin `profiles` row exists to satisfy `is_admin()`).
- **Must never be used in:** `proxy.ts` (runs on every matched request — using a bypass-everything client there would defeat RLS's purpose and multiply the blast radius of any future misconfiguration), any Route Handler reachable pre-auth-check, any Client Component, or anywhere the service-role key could end up in a bundle reachable by the browser.
- **Rule of thumb documented for future implementers:** if a script or route can instead act as the authenticated admin user (via the server client, relying on the `is_admin()` RLS policies already written in `0008_rls_policies.sql`), prefer that — the service-role client is for the narrow case where no user session exists yet (bootstrap, migration).

### Where each client may / may not be used — summary table

| Client | Server Components / Route Handlers | Client Components | `proxy.ts` | Migration scripts |
|---|---|---|---|---|
| Server (anon key) | ✅ primary use | ❌ (no cookies() access) | ✅ (already the pattern `resolveAdminSession` uses today, conceptually) | ❌ not needed |
| Browser (anon key) | ❌ | ✅ (future auth forms only) | ❌ | ❌ |
| Admin (service key) | ⚠️ only the specific migration/bootstrap routes, never general CRUD | ❌ never | ❌ never | ✅ primary use |

---

## 3. Package/dependency requirements (confirmed, not installed)

- `@supabase/supabase-js` — core client, required by all three client types above.
- `@supabase/ssr` — cookie-aware server/browser client helpers for the App Router; required once the server client is actually wired in.

Both are the two-package combination Supabase's own Next.js App Router guidance uses; nothing else is required (no ORM — plain `.from(table).select()` calls plus the repository pattern already in place are sufficient, consistent with this project's zero-extra-dependency policy). **Not installed this phase** — installing without a project to test against would produce untestable code, the same reasoning `AUTH_PHASE_1.md` §1 already documented for Phase 1.

---

## 4. Minimum schema that must be created first

Per the approved Phase 2 architecture, minus the Thanks UX future-model tables (`problems`/`thanks_signals`/`contributions`/`design_responses`/`interactions`), which remain design-only and are not needed to migrate today's existing JSON data:

1. `profiles` (extends `auth.users`)
2. `media_assets`
3. `projects`
4. `gallery_items`, `custom_sections` (children of `projects`)
5. `site_settings`, `social_links`, `hero_content`, `hero_visuals`, `homepage_cards`, `about_content`, `contact_content`
6. `leads`, `lead_notes`, `lead_activity`

This is the complete set needed to eventually hold everything currently in `data/*.json` except `users.json`/`sessions.json`, which are replaced wholesale by Supabase Auth (`auth.users` + `profiles`), not migrated field-by-field — see §9 below.

---

## 5. SQL / migration files prepared

All under `supabase/migrations/`, numbered for explicit apply order, **written but not executed anywhere** (no project exists to run them against):

| File | Creates | Depends on |
|---|---|---|
| `0001_extensions.sql` | `pgcrypto` (for `gen_random_uuid()`) | — |
| `0002_profiles.sql` | `profiles`, `handle_new_user()` trigger on `auth.users` | Supabase's built-in `auth.users` |
| `0003_media_assets.sql` | `media_assets` | `profiles` (uploaded_by) |
| `0004_projects.sql` | `projects` | `media_assets` (cover/thumbnail) |
| `0005_gallery_and_sections.sql` | `gallery_items`, `custom_sections` | `projects`, `media_assets` |
| `0006_site_content.sql` | `site_settings`, `social_links`, `hero_content`, `hero_visuals`, `homepage_cards`, `about_content`, `contact_content` | `media_assets` |
| `0007_crm.sql` | `leads`, `lead_notes`, `lead_activity` | — (standalone) |
| `0008_rls_policies.sql` | `is_admin()` helper + RLS policies for every table above | all of the above |

## 6. Migration/dependency order between tables

```
0001 extensions
  └─ 0002 profiles (needs auth.users, which Supabase provides)
       ├─ 0003 media_assets (needs profiles for uploaded_by)
       │    ├─ 0004 projects (needs media_assets for cover/thumbnail)
       │    │    └─ 0005 gallery_items, custom_sections (need projects + media_assets)
       │    └─ 0006 site_content tables (need media_assets for image/icon/logo refs)
       └─ 0007 leads, lead_notes, lead_activity (no FK dependency on anything above — could
                run any time after 0001, ordered last here for a clean read-through only)
0008 rls_policies (needs every table + profiles.role to exist first)
```

This is also literally the apply order (`0001` → `0008`), since each file's foreign keys only ever point at a table created in an earlier-numbered file — no forward references anywhere.

---

## 7. How existing JSON IDs/slugs will be preserved

- **Projects:** today's string `id` (e.g. `"gridmark"`, already slug-shaped) becomes `projects.slug` — still unique, still what `/work/[slug]` resolves by, so **no public URL changes**. A new `uuid` `id` is generated as the real primary key / FK target for `gallery_items`/`custom_sections`. This was decided and documented in the approved Phase 2C field mapping and is unchanged here.
- **Ordering fields** (`order`, `featuredOrder`, gallery-item `order`) copy verbatim — every table above carries the same-named column.
- **Leads, homepage cards, hero visuals, social links:** none of these are referenced by external URL, so their current string IDs are simply dropped in favor of a fresh `uuid` at migration time — nothing depends on the old value.

## 8. Rollback mechanism (for this preparation phase specifically)

This phase adds only inert files — nothing runs, nothing is imported, nothing is read at runtime:
1. Delete `supabase/migrations/*.sql` and `supabase/` — no code references this directory.
2. Revert the three blank `NEXT_PUBLIC_SUPABASE_*`/`SUPABASE_SERVICE_ROLE_KEY` lines added to `.env.example` — no code reads them yet, so removing them changes nothing at runtime.
3. Delete this document.

All three steps are independent and safe in any order — there is no data, no migration, and no live connection to unwind, because none was created.

## 9. Note on `users.json` / `sessions.json` — not migrated, replaced

Per `AUTH_PHASE_1.md` §11 and the approved Phase 2C mapping: these two files do not map into a custom table. When Phase 3 actually swaps the auth provider, they are superseded by Supabase Auth's own `auth.users` + this phase's `profiles` extension — `usersRepository.ts`/`sessionsRepository.ts`'s internals change, callers (`proxy.ts`, `requireAuth.ts`, every API route) do not. Nothing about that story changes in this preparation pass.

---

## SUMMARY

**SUPABASE ENVIRONMENT REQUIREMENTS:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (both public-safe), `SUPABASE_SERVICE_ROLE_KEY` (server-only, secret) — all three now present and blank in `.env.example`.

**CLIENT ARCHITECTURE:** server client (primary, needed now conceptually, not installed) for Server Components/Route Handlers; browser client (not needed until Supabase Auth actually replaces Phase 1's session cookie); admin/service-role client (narrowly scoped to the future migration script only, never in `proxy.ts`, never client-side).

**SCHEMA CREATION ORDER:** extensions → profiles → media_assets → projects → (gallery_items, custom_sections) → site content tables → leads → RLS policies.

**MIGRATION ORDER:** `0001` through `0008`, strictly increasing — every FK points only at an earlier file, verified by inspection.

**ROLLBACK STRATEGY:** delete `supabase/`, revert the `.env.example` addition, delete this doc — all inert, nothing was ever executed.

**FILES CREATED/MODIFIED:**
- `.env.example` (modified — added blank Supabase variable block)
- `supabase/migrations/0001_extensions.sql` … `0008_rls_policies.sql` (new, 8 files)
- `docs/PHASE_3A_SUPABASE_PREP.md` (new, this file)

**RISKS:**
- These SQL files are unexecuted and unverified against a real Postgres instance — they are believed correct (standard Postgres/Supabase syntax, cross-checked against the approved Phase 2 schema) but syntax or constraint errors can only be confirmed by actually running them once a project exists.
- `case_study_overview`/`case_study_outcome` are `not null default ''` — if any current project genuinely has an empty overview, that's preserved as `''`, not `null`; confirmed acceptable since `CaseStudy.overview` is already a required string in `src/types/project.ts` today, not optional.
- No migration script exists yet (Phase 3 step 7) — these files only create empty tables; writing and testing the JSON→Postgres import tooling is real implementation work for whenever Phase 3 is approved, not part of this preparation pass.

**Stopping here — no Phase 3 migration started, no project provisioned, no packages installed.**
