# CMS_IMPLEMENTATION_PLAN.md

## Phase A — Full Current-System Audit

**Status:** Audit and plan only. No production component, route, schema, or content file was modified while producing this document. Verified by direct inspection of the current repository state — not by memory of prior sessions, which is explicitly untrustworthy here (see §0).

---

## 0. Why this audit starts from zero trust in prior context

This project has been worked on across multiple sessions/agents beyond what's visible in this conversation. Confirmed by direct inspection, not assumption: a full local-CMS admin dashboard already exists (`src/app/admin/**`, `src/components/admin/**`, `src/lib/admin/**`), five documents already exist in `docs/` that were not produced in this thread (`21ST_COMPONENT_AUDIT.md`, `COMPONENT_NORMALIZATION.md`, `IMAGE_PIPELINE_AUDIT.md`, `PORTFOLIO_CMS_ARCHITECTURE.md`, `REAL_PORTFOLIO_CONTENT_PLAN.md`), and `src/content/real-projects.ts` already contains one real, published project (Gridmark, a Branding identity, 7 real gallery images) — `src/content/projects.ts` has already been switched from `demoProjects` to `realProjects`. Every finding below was re-verified against the actual current files, per this task's explicit Phase A instructions.

---

## 1. Current architecture

Next.js 16.3 (App Router) + React 19 + TypeScript + Tailwind CSS v4. **Zero runtime dependencies beyond `next`/`react`/`react-dom`** (`package.json` confirmed) — the entire admin dashboard, media picker, and gallery manager were built using only React state, `fetch`, and Node's `fs`, no new package installed. This is a deliberate, documented policy (`COMPONENT_NORMALIZATION.md` §11) and this plan does not propose breaking it.

```
src/
  app/
    page.tsx                       Homepage (server component)
    work/page.tsx                  Work page (server, searchParams-driven category filter)
    work/[slug]/page.tsx           Project detail (server, generateStaticParams over publishedProjects)
    not-found.tsx                  Sitewide 404
    (lab)/lab/*                    Dev-only isolated component test surface (COMPONENT_NORMALIZATION.md §13)
    admin/                         Admin dashboard — ALL "use client", zero server persistence
      layout.tsx, page.tsx, projects/page.tsx, projects/[id]/page.tsx,
      projects/[id]/preview/page.tsx, about/page.tsx, contact/page.tsx, settings/page.tsx
    api/admin/images/route.ts      Read-only fs listing of public/images/projects/**
  components/
    ui/                            Button, Container, Chip — the closed public design-system primitives
    site/                          ~30 public components (Hero, WorkGrid, ProjectStory, CaseStudyGallery, …)
    admin/                         AdminShell, fields.tsx (form primitives), media.tsx (picker/gallery manager), SocialLinksEditor.tsx
  content/
    projects.ts                    THE seam every public component reads through (selectors, not raw data)
    real-projects.ts                1 real project (Gridmark) — no longer empty
    demo-projects.ts                8 placeholder projects — untouched, unimported by anything live
    personal.ts, site.ts, media.ts
  lib/admin/
    store.ts                       localStorage draft-overlay CRUD (listProjects/getProject/saveProject/…)
    types.ts                       AdminProject/AdminMedia/AboutContent/ContactContent/SiteSettings
    gallery.ts                     Flattens every image array into one section-tagged list for the unified gallery UI
  types/project.ts                 Project/CaseStudy/CoverMedia schema — the one source of truth
```

**The critical architectural fact governing everything else in this document:** the admin dashboard's persistence is a **browser-localStorage draft overlay**, entirely decoupled from the public site. `src/lib/admin/store.ts`'s own header comment states this outright, and it was verified by grep: `localStorage` appears only in `src/app/admin/**` and `src/lib/admin/store.ts` — zero occurrences anywhere in `src/components/site/**`, `src/app/page.tsx`, `src/app/work/**`. The public site reads `real-projects.ts`/`personal.ts`/`site.ts` directly, server-side, at build/request time; it has no mechanism to see anything saved in a browser's localStorage. **Editing a project in `/admin` today does not change what a real visitor sees.** This isn't a bug — it's the deliberately conservative Stage-1 design documented in `PORTFOLIO_CMS_ARCHITECTURE.md` §12 — but it is the single most important fact for anyone approaching this codebase expecting a working save button.

---

## 2. Current data model

`src/types/project.ts` (verified in full, current version):

- `Project` — `id, title, slug, category (7-value enum), projectType (free text), year, client?, role, shortDescription, description?, coverImage, thumbnail?, gallery[], featured, featuredOrder?, published, tags[], tools[], services[], projectUrl?, caseStudy, order`.
- `CaseStudy` — only `overview`/`outcome` required; 20 further optional fields covering the full UI/UX research→design→testing arc plus Branding/Graphic-Design-specific extensions (`concept`, `typography`, `colorSystem`, `logo`, `applications`, `exploration`, `moodboard`). No `variant` switch — `ProjectStory.tsx` renders whichever fields are present, using one of 3 named narrative flows (Branding/Graphic Design/UI-UX) or a generic fallback for the other 4 categories.
- `CoverMedia` — discriminated union, `{kind:"image", src, alt, objectPosition?, layout?, aspect?, fit?}` or `{kind:"placeholder", category, alt, layout?}`. **Already extended since the schema was last fully documented**: `aspect` (`landscape`/`portrait`/`square` — an explicit frame-shape override) and `fit` (`cover`/`contain`, with `PortfolioMedia.tsx` auto-detecting a sensible default by comparing the loaded image's real ratio against its frame) were added to fix a real rendering bug (blurry/wrongly-cropped images) — documented in `IMAGE_PIPELINE_AUDIT.md`. This is now the actual production media type, more capable than `PORTFOLIO_CMS_ARCHITECTURE.md` §1's table shows (that doc predates this addition).
- `alt` is required on every `CoverMedia` variant, enforced by the TypeScript compiler — not a soft convention.

`src/content/projects.ts` exposes the only seam any component reads: `projects`, `featuredProjects`, `publishedProjects`, `projectsByCategory()`, `getCaseStudyPreviewProject()`, `usingDemoData`. Confirmed by grep: no component outside `ProjectHero.tsx` (which only reads the `usingDemoData` boolean) imports `demo-projects.ts` or `real-projects.ts` directly.

**Current live data:** exactly one real project — Gridmark (Branding, published, **not** featured). This has a real, observable consequence documented in §5's Current State Findings below.

---

## 3. Existing admin capabilities (verified by reading every admin file, not inferred)

| Capability | Status | Detail |
|---|---|---|
| Dashboard overview | **Built** | Project counts (total/published/drafts/featured), quick links, 5 most recent projects |
| Project list | **Built** | Table: cover thumb, title, category, year, client, published/featured badges, Edit/Preview links |
| Create project | **Built** | `createProject(title)` — blank draft, auto-slugified id, `isAdminDraft: true` |
| Edit project | **Built** | One long-scroll form: Basic Info, Case Study (universal), Design Process, Branding, Media/Gallery, Publishing, SEO |
| Delete project | **Not built** | No delete function exists in `store.ts`, no delete control in the UI — only `discardProjectEdits()` (reverts a draft back to base data / removes an admin-only draft, not a true delete of a `real-projects.ts` entry) |
| Save (draft) | **Built** | Writes the full `AdminProject` to `localStorage`, keyed by id |
| Discard local edits | **Built** | Per-project and per-content-type (About/Contact/Settings) |
| Publish/unpublish | **Built** | A `Published` toggle field — but see §12: this only toggles a value in the localStorage draft, it does not affect the live site |
| Preview | **Built, and genuinely good** | `/admin/projects/[id]/preview` renders the draft through the **real public components** (`ProjectHero`, `ProjectOverview`, `ProjectStory`, `CaseStudyGallery`) unmodified — `AdminProject` is a structural superset of `Project` so it can be passed straight in. This is a real, working draft-preview capability, more than `PORTFOLIO_CMS_ARCHITECTURE.md` §12 assumed existed |
| Category-specific dynamic fields | **Not built as intended** | See §9 — the form shows every field for every category simultaneously (with category-aware *labels*, e.g. "Design Direction" relabeled "shown publicly as Brand Strategy"), not a category-driven show/hide |
| Media: select existing | **Built** | `/api/admin/images` (read-only `fs` walk of `public/images/projects/`) + a picker grid scoped to the current project's slug folder |
| Media: upload new file | **Not built** | No write/upload endpoint exists — "upload" today means placing a file on disk by hand, then selecting it |
| Media: replace/clear | **Built** | `MediaField`'s "Clear" resets to an honest placeholder; re-picking replaces |
| Media: alt/caption | **Built** | `alt` (existing schema field) and `caption` (prototype-only addition, not yet rendered publicly anywhere) |
| Media: dimensions shown | **Not built** | No width/height/file-size readout in the picker UI |
| Gallery: section assignment | **Built** | One unified flat list across `gallery` + all 6 case-study image arrays, tagged per item, reassignable via dropdown |
| Gallery: reorder | **Built** | Up/down buttons, writes an explicit `order` |
| Gallery: layout/aspect/fit | **Built** | Per-image `layout` (full/half/third), `aspect` (landscape/portrait/square), `fit` (cover/contain/auto) — all wired to the real schema fields added for the image-pipeline fix |
| About editor | **Built** | Name, title, roles, bio, design philosophy, about-facts, photo, location, experience summary, skills/tools, resume URL, SEO (prototype) |
| Contact editor | **Built** | Heading, description, email/phone/location (prototype fields not yet read publicly), social links (shared component), project-type options, success message, SEO (prototype) |
| Social accounts editor | **Built** | Shared `SocialLinksEditor` used by both `/admin/contact` and `/admin/settings` — one underlying list, not duplicated |
| Site settings editor | **Built** | Site title/description, positioning, differentiator, nav labels, footer text, social links, SEO defaults |
| Navigation editor | **Partially built** | Nav *labels* editable in Settings; no separate enable/disable/reorder/footer-nav-distinct-from-header-nav capability |
| Authentication | **Not built** | Explicitly, loudly flagged: a permanent red banner on every admin page ("DEVELOPMENT ONLY — local admin prototype. No authentication.") |
| Validation | **Partial** | Required-field asterisks are visual only (no submit-blocking); TypeScript enforces `alt` at the data-shape level but the form doesn't stop a save with a missing required field |

---

## 4. Missing admin capabilities (relative to the master task's 22-phase brief)

Distilled from §3 plus a direct read of every remaining phase's ask:

1. **No real persistence.** The single biggest gap — see §1 and §12.
2. **No dynamic, category-driven progressive-disclosure editor.** The brief explicitly asks for "Select category → form dynamically loads relevant fields" and "do not create one giant form containing every possible field." The current editor is one long form with every section always visible — see §9.
3. **No delete capability** for a project (create + edit + discard-draft exist; true delete does not).
4. **No file upload** — only selection of files already placed on disk.
5. **No authentication boundary implementation** (correctly flagged as dev-only, per §20 of the master brief — this is the right interim posture, not a bug).
6. **No SEO wiring** — every SEO field (`seo.metaTitle`, etc., on `AdminProject`/`AboutContent`/`ContactContent`/`SiteSettings`) saves into the overlay but nothing in any route's `generateMetadata()` reads it yet.
7. **No dedicated `/about` or `/contact` public routes** — the About/Contact admin editors edit content that today only renders as homepage anchor sections (`#about`, `#skills`, `#contact`). This is a pre-existing site-architecture fact, not something introduced by the admin build, but it means "Contact CMS"/"About CMS" (master brief Phases 11–12) currently has no dedicated page to fully govern.
8. **No image-dimension/file-size display** in the media picker.
9. **No navigation enable/disable/reorder**, and no distinct header-vs-footer nav model (today one `nav` list feeds both).
10. **No CTA configuration surface** beyond what's implicitly in Settings' positioning/differentiator text.
11. **No draft-preview for an unpublished project outside `/admin`** — `published: false` means the real `/work/[slug]` route doesn't exist at all (`generateStaticParams`/`getProject` both filter to `publishedProjects` only). The admin's own `/preview` route is the only way to see a draft, which is a real, working substitute, but it's admin-only, not a shareable preview link.

---

## 5. Existing public routes — and a live current-state finding

| Route | Type | Notes |
|---|---|---|
| `/` | Static | Homepage — Hero, Featured Work, Designer Intro, Services, Case Study Preview, Graphic Design Showcase, UI/UX Showcase, Design Process, About/Skills, Hiring CTA, Contact, all as sections |
| `/work` | Dynamic (searchParams) | Category filter via `?category=`, canonical always `/work` |
| `/work/[slug]` | SSG | `generateStaticParams()` over `publishedProjects` only |
| `/not-found` | Static | Sitewide 404 |
| `/admin/**` | Client-only, `robots: noindex`, self-hidden `SiteNav`/`SiteFooter` | Never linked from public nav |
| `/(lab)/lab/**` | Dev-only | Guarded to 404 in production (`COMPONENT_NORMALIZATION.md` §13) |
| `/about`, `/contact` | **Do not exist** | `nav` in `site.ts` links to both; both 404. Pre-existing, confirmed still true today |

**Live current-state finding, verified by loading the site**: Gridmark (the only real project) has `featured: false`. `Hero.tsx` and `FeaturedWork.tsx` were both already defensively hardened for this exact scenario (fewer than 3 featured projects) — `Hero` falls back to honest placeholder tiles per missing slot, `FeaturedWork` simply omits the primary-card block when there's no featured project — so the site does **not** crash or render broken UI. But the practical effect is that the homepage's Hero exhibition and Featured Work section currently show mostly placeholder tiles / an empty section, and `CaseStudyPreview` renders nothing at all (`getCaseStudyPreviewProject()` requires a *featured* project with a written `overview`). This is expected given only 1 unfeatured real project exists — not a bug — but worth stating plainly: **marking Gridmark `featured: true` would visibly improve the homepage today**, at zero code cost, and is a content decision, not one this audit makes unilaterally.

---

## 6. Existing components that can be reused as-is

Every component in `src/components/site/**` and `src/components/ui/**` — none need to change for the CMS work in Phases B–K, because they already read only through `@/content/projects`' selectors or receive props. Specifically load-bearing for the CMS effort:

- `ProjectHero`, `ProjectOverview`, `ProjectStory`, `CaseStudyGallery` — already proven reusable *for admin purposes too* (the `/admin/projects/[id]/preview` route already feeds them `AdminProject` data directly).
- `PortfolioMedia`/`PlaceholderMedia` — the one image-rendering path; already handles the full `CoverMedia` shape including the new `aspect`/`fit` fields.
- `Button`, `Container`, `Chip` — the closed public design-system primitives (`COMPONENT_NORMALIZATION.md` §05 formally forbids a second Button implementation; the admin UI correctly does **not** reuse these — see §7).

---

## 7. Components that need adaptation (not rewriting)

- **`ProjectCard`/`ProjectGrid`/`WorkGrid`** — no code change needed, but their visual output is currently sparse because of the single-unfeatured-project state (§5); this is a content issue, not a component issue.
- **`CaseStudyPreview`** — already fixed (the `usingDemoData`-gated "Sample project" label bug flagged in `REAL_PORTFOLIO_CONTENT_PLAN.md` §11 is resolved in the current code — verified directly, not assumed).
- **`generateMetadata()` in `work/page.tsx` and `work/[slug]/page.tsx`** — will need small, additive changes in Phase H (SEO) to read the new `SeoMeta` overrides once a real persistence layer exists — additive only, existing fallback derivation stays intact.
- **Admin form components (`fields.tsx`, `media.tsx`)** are a **deliberately separate, internal design language** — `AdminShell.tsx`'s own comment states this is intentional: an internal tool borrows the same color/radius/spacing tokens for consistency but is not bound by the public `Button`/`Container` API. This is a reasonable, explicit decision already made and documented; this plan does not propose unifying them, since `COMPONENT_NORMALIZATION.md`'s entire standard is scoped to the **public-facing** design system.
- **`src/app/admin/projects/[id]/page.tsx`** is the one component that most needs adaptation, not for style but for *architecture* — see §9. Its current one-giant-form structure works but doesn't match the master brief's explicit "progressive disclosure, category-driven fields" requirement.

---

## 8. Proposed CMS schema

**No schema change is proposed in Phase A.** `PORTFOLIO_CMS_ARCHITECTURE.md` §§1–10 already did this work in full detail (Media object, Project basic fields, case-study universal fields, Branding-specific fields, gallery, Work-page settings, About, Contact, Social link, SEO schemas) and remains accurate except for one now-stale detail: its §1 `CoverMedia` table predates the `aspect`/`fit` fields documented in §2 above. This plan's contribution is not a new schema — it's confirming the existing one is sufficient for Phases B–H and pointing at the one place it needs a one-line update (adding `aspect`/`fit` to that table) when that document is next touched, not as part of this audit.

`src/lib/admin/types.ts`'s `AdminProject`/`AdminMedia`/`AboutContent`/`ContactContent`/`SiteSettings`/`SeoMeta` are the CMS-facing shapes already implementing that schema — verified structurally sound (e.g. `AdminProject` is a real structural superset of `Project`, provably so by the fact that the preview route passes it directly into public components with only a type-level cast, not a runtime transform).

---

## 9. Dynamic category-field architecture — the real gap

This is the most significant mismatch between what exists and what the master brief asks for, so it gets its own section.

**What exists today:** `admin/projects/[id]/page.tsx` renders one continuous form with sections — Basic Information, Case Study (universal), Design Process, Branding, Media/Gallery, Publishing, SEO — and every field in every section is always visible regardless of the selected category. Category-awareness is expressed only as **label text**: `designDirection`'s field label literally reads `Design Direction (shown publicly as "Brand Strategy" for this project's category)`, computed from `project.category === "Branding" ? "Brand Strategy" : "Design Direction"`. This mirrors `ProjectStory.tsx`'s real public-facing relabeling logic faithfully — the *labels* are correct — but the brief's explicit "Step 2: form dynamically loads the relevant fields for that category" / "Do not create one giant form containing every possible field" is not implemented.

**Why this is a real gap, not a nitpick:** a Graphic Design project's editor currently still shows Research/Research Methods/User Journey/Information Architecture/Design System/Testing fields (all UI/UX-flow-only in `ProjectStory.tsx`'s actual rendering) even though none of them will ever appear on that project's public page. Nothing breaks — `ProjectStory`'s `hasContent()` filter means an unused field saved as empty just doesn't render — but the editing *experience* doesn't match the brief.

**Proposed fix (Phase C, not this phase):** introduce a small, explicit per-category field-visibility map — e.g. `CATEGORY_FIELD_SETS: Record<ProjectCategory, (keyof CaseStudy)[]>` derived directly from `ProjectStory.tsx`'s own `categoryStages()` switch (so the two can never drift silently out of sync — ideally, `categoryStages()` itself becomes the single source both the public renderer and the admin form's visibility logic read from, rather than two hand-maintained lists). The editor then conditionally renders each `Section` based on whether the current category's field set includes anything in it, collapsing to something closer to the brief's step-by-step flow via disclosure (accordion/tabs) rather than a full rewrite of the field primitives already built in `fields.tsx` — those stay; only the page-level composition changes.

---

## 10. Media architecture

Already substantially built and directly aligned with the schema (§2, §3's Media rows). Current state:

- **Storage:** local files under `public/images/projects/<slug>/`, convention documented in that folder's own `README.md` and `CONTENT_GUIDE.md` §2 — cover/thumbnail/gallery/`case-study/<stage>/`.
- **Discovery:** `/api/admin/images` walks the filesystem read-only and returns every image path found, tagged by which project-slug folder it lives under.
- **Selection:** `MediaField` (single image) and `GalleryManager` (flat, section-tagged, reorderable list) both restrict choice to files this API actually finds — **the admin can never reference a path that doesn't exist**, which directly satisfies the master brief's "never invent an image."
- **Rendering:** unchanged, unified through `PortfolioMedia.tsx` — every placement (cover/thumbnail/gallery/case-study stage) already respects the image's real aspect ratio via the `aspect`/`fit` fields (§2), fixing the actual blur/crop bug found in production (`IMAGE_PIPELINE_AUDIT.md`) before this Phase A audit even began.
- **Genuine gap:** no upload endpoint. A real upload capability (Phase D) needs a server route that writes into the correct `public/images/projects/<slug>/` (or future CDN) location — a small, well-scoped addition on top of the existing read-only lister, not a rebuild of it.
- **Aspect-ratio/dimension awareness:** the picker shows a thumbnail but not pixel dimensions or file size — `IMAGE_PIPELINE_AUDIT.md`'s root-cause finding (Gridmark's source files are ~344×289px against a documented 2400×1350px minimum) means a dimension readout in the picker would have caught that problem immediately; worth prioritizing in Phase D.

---

## 11. Social/contact architecture

Already correctly unified — **not duplicated**, which the master brief explicitly required ("Avoid duplicated social/contact data"). `personal.ts`'s `socialLinks` is the single production source, consumed by both `SiteFooter.tsx` and `ContactSection.tsx`. On the admin side, `SocialLinksEditor.tsx` is one shared component used identically by both `/admin/contact` and `/admin/settings`, both reading/writing the same conceptual list (currently two separate `ContactContent.socialLinks` / `SiteSettings.socialLinks` overlay copies at the *storage* level — worth consolidating to one overlay key in Phase G so editing it in one admin screen doesn't require also updating the other, though today's UI at least keeps the *editor component* single-sourced).

---

## 12. About architecture

Content model exists (`AboutContent`), editor exists (`/admin/about`), but **no dedicated public route** — this content renders today via `DesignerIntro.tsx` (`#about`) and `AboutSkills.tsx` (`#skills`) as homepage sections, sourced directly from `personal.ts`/`site.ts`, not from anything the admin overlay touches. Two genuinely unconsumed fields surfaced by direct inspection: `personal.ts`'s `bio` and `location` exist and are editable in `/admin/about`, but no inspected public component renders either one today.

---

## 13. Site settings architecture

`SiteSettings` (title, description, positioning, differentiator, nav labels, footer text, social links, SEO defaults) exists and is editable at `/admin/settings`, sourced from `site.ts`/`personal.ts`. Not yet wired: none of this actually overrides `layout.tsx`'s real `metadata` export, nav labels editing doesn't affect `SiteNav`'s real rendered links, footer text editing doesn't affect `SiteFooter`'s real rendered copyright — all correctly scoped as prototype-only per this phase's persistence model (§1).

---

## 14. SEO architecture

`SeoMeta` (`metaTitle`, `metaDescription`, `ogImage`, `canonicalPath`, `noIndex`) is defined and has an editing surface on every content type (`AdminProject`, `AboutContent`, `ContactContent`, `SiteSettings`), but **zero of it is read by any route's `generateMetadata()`**. Today's real metadata (verified in `work/page.tsx` and `work/[slug]/page.tsx`) is entirely *derived* — title/description computed from `project.title`/`shortDescription`/`description`, OG image only set when `coverImage.kind === "image"` (never a placeholder). This derivation is good, working, sensible-default behavior; Phase H's job is to make the `SeoMeta` fields an *optional override* on top of it, not a replacement.

---

## 15. Migration strategy

`PORTFOLIO_CMS_ARCHITECTURE.md` §12 already lays out the 3-stage path (TS files → Admin Dashboard file/JSON-backed → real database) in detail; this plan adopts it unchanged and adds the concrete Stage-1→Stage-1.5 step this audit found half-built:

- **Stage 0 (done, historically):** hand-edited `real-projects.ts`.
- **Stage 1 (built, this session's predecessor work):** Admin Dashboard UI + `store.ts`'s abstracted CRUD-shaped functions — but writing only to `localStorage`, not back to `real-projects.ts` or any server-side store. This is *between* Stage 0 and Stage 1 as originally scoped: the editing UI exists, but "save" doesn't yet persist anywhere the public site or another browser can see.
- **Stage 1.5 (the real next step, Phase C/D territory, not decided in this audit):** give `saveProject`/`saveAbout`/`saveContact`/`saveSettings` a real write path — either a server action that regenerates the relevant `.ts` file (keeping "the file is the database" for now) or a lightweight local datastore (SQLite/JSON-on-disk via a server route). Either choice preserves every existing function signature in `store.ts` — this was explicitly designed for exactly this swap (`store.ts`'s own header comment states the intent).
- **Stage 2 (future, undecided):** real database/headless CMS, per `PROJECT_SPEC.md` §8's still-open Postgres/Sanity/Payload choice.

`master brief Phase 19`'s explicit list (`listProjects()`, `getProject()`, `saveProject()`, `deleteProject()`) is **already implemented in `store.ts` except `deleteProject()`**, which doesn't exist yet (§4 item 3) — this is the one concrete gap against that phase's stated interface, everything else matches.

---

## 16. QA strategy

For Phase A, QA was inspection-based (every claim in this document traces to a file actually read, a grep actually run, or a page actually loaded in-browser this session — confirmed zero console errors on `/`, `/work/gridmark` on a fresh browser tab; one apparent error on a stale tab was confirmed to be a leftover HMR-session artifact from an earlier dev-server restart, not a real bug, by reproducing cleanly on a new tab).

For Phases B–K, this plan adopts the master brief's own Phase 22 checklist verbatim as the QA gate, plus two additions this audit surfaces specifically:
- Explicitly verify Gridmark (the one real project) survives every phase — brief's own stated concern, and a real regression risk given how much of the admin/media system was built around exactly this project's data.
- Explicitly verify `usingDemoData` stays `false` and `demo-projects.ts` stays untouched-but-present through every phase (master brief rule 9).

---

## 17. Database-ready future architecture

Already the explicit design intent of `store.ts` (§1, §15) — every admin data-access function is written so a future swap only changes what's *inside* the function body, never a call site. The schema (`Project`/`CaseStudy`/`CoverMedia`, §2/§8) is already the shape a database table or CMS collection would use, per `PORTFOLIO_CMS_ARCHITECTURE.md` §12's Stage 2 description, which this audit found no reason to revise. The one architectural risk to flag for whoever builds Stage 2: `AdminProject`'s `seo`/`caption`/`order`/`isAdminDraft` fields are currently prototype-only additions layered on top of the real `Project` type via TypeScript `Omit`/intersection — a real migration needs to decide whether these become first-class columns on `Project` itself (promoting them out of "admin-only" status) or stay a separate admin-metadata table joined at read time. This document doesn't decide that; it's a Stage 2 design question, correctly out of scope for Phase A.

---

## Summary

### Files created
- `docs/CMS_IMPLEMENTATION_PLAN.md` (this document) — the only file touched.

### Files modified
None.

### Headline findings
1. A full admin dashboard already exists — dashboard, project CRUD (minus delete), a genuinely working preview that reuses real public components, About/Contact/Settings editors, a unified media/gallery manager, all built with zero new dependencies.
2. Its persistence is `localStorage`-only and **completely disconnected from the public site** — this is the single fact most likely to cause confusion or wasted work if not understood before Phase B begins.
3. The category-driven dynamic-field editing the master brief asks for (§9) is not yet built — today's editor shows every field for every category, with category-aware labels only.
4. The image rendering bug found in production (Gridmark's real photos rendering blurry) has already been root-caused and fixed at the architecture level (`aspect`/`fit` fields, auto-detection in `PortfolioMedia.tsx`) — the remaining work is swapping in higher-resolution source files, which is a content task, not a code task.
5. No component, route, or schema change is required before Phase B can begin — every gap found is additive.

### Recommended immediate next step
Phase B as scoped by the master brief — but note per §8 above, the "normalized content model" it asks for is already in place; Phase B's actual work is smaller than the master brief assumes and should focus on the real gaps this audit found: `deleteProject()`, the category-driven dynamic editor (§9), and deciding Stage 1.5's real write path (§15) before touching persistence.
