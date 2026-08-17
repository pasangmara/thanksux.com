# CMS_PHASE_E.md

## Phase E — Public Content Wiring + Media Upload

**Status:** Two confirmed functional bugs fixed. No redesign, no new persistence system, no new package, no database, no auth added. Gridmark's content is unmodified — verified byte-for-byte before/after via live round-trip tests (see §6).

---

## 0. Scope

Two problems reported from browser testing:

1. **Media upload was missing** — the admin image picker could only select a file that was already manually placed on disk (`GET /api/admin/images`, read-only). There was no way to get a new file onto disk from the browser.
2. **The homepage Hero headline was not data-driven** — editing the Positioning Statement in `/admin/settings` did not change the homepage headline, even though that field was already persisted and already consumed elsewhere (the footer tagline).

Both are fixed. Nothing else was redesigned — see §7 for the one deliberate, minimal layout change (removing manually-inserted line breaks the old hardcoded headline needed) required to make the headline genuinely render arbitrary admin text.

---

## 1. Root cause — Hero headline

**The bug:** `src/components/site/Hero.tsx` rendered `heroHeadlineLines`, a hardcoded 3-string array in `src/content/site.ts`, instead of `settings.positioning` — the actual CMS-persisted field `/admin/settings`'s "Positioning Statement" field edits (`data/settings.json`, via `saveSiteSettings()`).

`heroHeadlineLines` was created purely so the headline could have a manual line break at the desktop split-column width (avoiding an orphaned "design," on its own line, per its own code comment: *"Same sentence as `positioning`, pre-segmented for the hero's controlled line breaks... Joining these with a space must reproduce `positioning` exactly; update both together if the approved copy ever changes."*) — a manual sync step that nothing enforced once `positioning` became a live, admin-editable CMS field. The two values matched by coincidence at the moment `heroHeadlineLines` was written, then silently diverged the instant an admin edited Positioning — the footer tagline (which already read `settings.positioning` directly) would update; the homepage headline, sitting one component away, would not.

This was not a persistence bug — `saveSiteSettings()`/`data/settings.json`/`getSiteSettings()` all worked correctly the whole time. It was a **wrong data source** bug: Hero.tsx read a stale constant instead of the value it already had in scope (`settings`, fetched via the same `getSiteSettings()` call already used two lines above for `settings.differentiator`).

---

## 2. Root cause — missing media upload

**The bug:** `src/app/api/admin/images/route.ts` only exported `GET` — a read-only directory listing of whatever already existed under `public/images/projects/`. `src/components/admin/media.tsx`'s `MediaField`/`GalleryManager` only ever called this `GET` endpoint; there was no `POST` handler anywhere, so there was no code path that could write a new file to disk from a browser file-picker interaction. The `<input type="file">` element that a genuine upload needs didn't exist in the admin UI at all.

This wasn't a bug in `PortfolioMedia`, `next/image`, or `next.config.ts` — all three already work correctly for any local file under `public/`, uploaded or not (see §5). The gap was specifically: no server endpoint accepted a file, and no client UI offered to send one.

---

## 3. Files modified

**Hero fix:**
- `src/components/site/Hero.tsx` — headline now renders `settings.positioning`; removed the `heroHeadlineLines` import and its manual `<br>`-insertion `.map()`.
- `src/content/site.ts` — removed the dead `heroHeadlineLines` export; updated `positioning`'s doc comment to state it only *seeds* `data/settings.json` and that the live value is what Hero/Footer actually render.

**Media upload:**
- `src/app/api/admin/images/route.ts` — added `POST` (validates type/size, writes to `public/images/projects/<slug>/uploads/` or `public/images/site/uploads/`, returns `{ image: { src, project } }`); `GET` now also walks `public/images/site/` so a non-project-scoped upload (About photo, SEO OG image) reappears in "Choose existing image" on a later visit, not just immediately after its own upload.
- `src/components/admin/media.tsx` — added `uploadImage()` (client-side POST helper with a fast client-side type/size precheck), `UploadButton` (shared upload control used by both `MediaField` and `GalleryManager`), and `refresh()` on `useImageLibrary` (re-fetches the picker list after a successful upload). Wired `UploadButton` into both `MediaField` (Cover/Thumbnail/single-image fields, including the SEO OG image field which reuses `MediaField`) and `GalleryManager` (all gallery-section images). "Choose existing image" and "Clear" are unchanged, still present.

**Documentation:**
- `docs/CMS_PHASE_E.md` — this file (new).

Nothing else was touched. `real-projects.ts`, `demo-projects.ts`, `data/projects.json`'s Gridmark entry, `data/about.json`, `data/contact.json`, `data/settings.json`'s non-`positioning` fields, every admin editor page's layout, and every public route's file are unchanged.

---

## 4. Hero data flow

### Before
```
Admin (/admin/settings, "Positioning Statement")
      → saveSettings() → PUT /api/admin/settings
      → saveSiteSettings() → data/settings.json   ✅ persisted correctly

SiteFooter  ← settings.positioning (layout.tsx → getSiteSettings())   ✅ correct
Hero        ← heroHeadlineLines (hardcoded import, src/content/site.ts)   ❌ never reads settings at all
```

### After
```
Admin (/admin/settings, "Positioning Statement")
      → saveSettings() → PUT /api/admin/settings
      → saveSiteSettings() → data/settings.json

SiteFooter  ← settings.positioning (unchanged)
Hero        ← settings.positioning (getSiteSettings(), same call Hero already made for `differentiator`)
```

Both the headline and the footer tagline now read the exact same persisted value, through the exact same repository function, on every request (`Hero`/homepage route is already `force-dynamic`, unchanged from Phase D2).

### Full Hero field audit (per the requested checklist)

| Field | Source | Status |
|---|---|---|
| Eyebrow / label | `about.name` + `about.roles` (`getAboutContent()`) | Already CMS-driven — unchanged |
| Headline | `settings.positioning` (`getSiteSettings()`) | **Fixed this phase** — was hardcoded |
| Supporting description | `settings.differentiator` (`getSiteSettings()`) | Already CMS-driven — unchanged |
| Primary CTA label/URL | `heroCtas.primary` (`src/content/site.ts`, static) | **Still static** — see §7, no field exists in `SiteSettings` for this; left as-is rather than inventing a new schema field mid-bugfix |
| Secondary CTA label/URL | `heroCtas.secondary` (static) | Same as above; also reused as-is by `HiringCTA.tsx`'s "Start a project" button |
| Hero image / visual | `getFeaturedProjects()` (top 3 featured projects' `coverImage`) | Already CMS-driven via each project's `featured`/`coverImage` fields — unchanged |
| Supporting tiles | One fixed typography specimen tile (design element, not content) + the 3 featured-project tiles above | No field exists or should exist here — not a gap |

---

## 5. Upload flow

```
Admin (MediaField or GalleryManager "Upload new image" button)
  → <input type="file" accept="image/jpeg,image/png,image/webp"> file picked
  → client-side precheck (type + ≤8MB) — fails fast without a network round trip
  → POST /api/admin/images  (multipart/form-data: file, projectSlug?)
      → server re-validates MIME type (not filename extension) and size
      → destination: public/images/projects/<slug>/uploads/  (or public/images/site/uploads/ if unscoped)
      → filename: <timestamp>-<random>.<ext derived from validated MIME type>
      → fs.mkdirSync(recursive) + fs.writeFileSync
      → returns { image: { src: "/images/projects/<slug>/uploads/...", project: "<slug>" } }
  → onUploaded(image):
      - MediaField:     onChange({ kind: "image", src, alt }) — field updates immediately, no picker interaction needed
      - GalleryManager: add(src) — appended to the currently-selected section immediately
      - both:           refresh() — re-fetches the picker list so the new file also appears under "Choose existing image" next time it's opened
  → admin still clicks the page's own Save button to persist the field onto the project/About/Contact/Settings record (upload ≠ save — uploading only gets the file onto disk and into the form; Save is what writes it into data/*.json, same as any other field edit)
```

Reused, not reinvented: `PortfolioMedia`/`CoverMedia`/`next/image` are completely untouched — an uploaded file is just a normal local path under `public/`, indistinguishable from a hand-placed one the moment it's on disk. `next.config.ts` needed **no changes** — confirmed live (see §6): local `/public` paths are optimized by `next/image` automatically, with no `images.domains`/`remotePatterns` entry required (that config only matters for *remote* URLs).

**Format support:** JPG/JPEG, PNG, WEBP. **SVG excluded, deliberately** — `next.config.ts` doesn't set `images.dangerouslyAllowSVG`, and turning that on for arbitrary admin-uploaded SVGs (which can embed `<script>`) is a real XSS surface not worth taking on for an image type nothing in the current schema needs (every image field is a photo or UI screenshot, never vector art).

**Validation, all producing a visible admin error** (not a silent failure):
- Unsupported file type → `"Unsupported file type — upload a JPG, PNG, or WEBP image."`
- File over 8MB → `"File is too large (X.XMB) — the limit is 8MB."`
- No file selected → `"No file selected."`
- Server/write failure → `"Failed to save the uploaded file."` (or "Failed to read...")

All four route through the same `useSaveStatus` state machine every Save/Delete action in the admin already uses (`SaveStatusMessage`, `Spinner`, disabled-while-busy button) — upload feedback looks and behaves identically to save feedback elsewhere in the admin, not a bespoke pattern.

---

## 6. QA results — actually performed against the running dev server

**Static checks:**
- `npx tsc --noEmit` — clean.
- `npm run lint` — clean (one `react-hooks/set-state-in-effect` violation was hit and fixed during development — see media.tsx's `useImageLibrary`).
- `npm run build` — succeeds; route table unchanged in shape from before this phase (`/about`, `/contact` still present from Phase D3; no new routes added — upload reuses the existing `/api/admin/images` route, just adds a method to it).

**Live, through the actual running dev server (`npm run dev`, `http://localhost:3000`) — not simulated:**

*Route sweep:* `/`, `/work`, `/work/gridmark`, `/about`, `/contact`, `/admin`, `/admin/projects/gridmark` — all returned `200`.

*Hero fix, full round trip:*
1. Read live `settings.positioning` via `GET /api/admin/settings` → confirmed present on homepage HTML.
2. `PUT /api/admin/settings` with a marker string in `positioning`.
3. Re-fetched `/` → marker present.
4. Re-fetched `/` again (independent request, simulating a browser refresh) → marker still present.
5. Reverted `positioning` to its original value → confirmed original text restored, marker gone.

*Upload mechanism, all 6 cases tested directly against `POST /api/admin/images`:*
1. Valid PNG upload (throwaway test slug, not Gridmark) → `200`, returned a real `/images/projects/.../uploads/...png` path.
2. That path appeared in the next `GET /api/admin/images` listing.
3. The file itself was fetchable over HTTP → `200`, `content-type: image/png`.
4. Next's own image optimizer (`/_next/image?url=...`) successfully processed the uploaded file → `200`, `content-type: image/png` — confirms the pipeline requirement in §5, not just that the raw file exists.
5. `.txt` file with `text/plain` → `400`, `"Unsupported file type..."`.
6. 9MB PNG (over the 8MB limit) → `400`, `"File is too large (9.0MB)..."`.
7. Empty `FormData` (no file field) → `400`, `"No file selected."`.

*Full end-to-end flow (upload → select → Save → public render → refresh → revert), against Gridmark:*
1. Uploaded a real PNG scoped to `projectSlug: "gridmark"`.
2. Fetched Gridmark's current record, captured its original `thumbnail` (`undefined`).
3. `PUT`'d Gridmark with the new upload set as `thumbnail`, Saved.
4. Fetched `/work` → the new thumbnail's `src` was present in the rendered HTML (Work grid cards render `thumbnail ?? coverImage`).
5. Re-fetched `/work` (refresh) → still present.
6. Reverted `thumbnail` back to `undefined`, deleted the test upload file/directory.
7. Confirmed Gridmark's `client`, `year`, `coverImage.src`, `gallery` (all 7 images), and `published` are byte-identical to the pre-test baseline.

All test upload directories (`phase-e-upload-test/`, `gridmark/uploads/`) were deleted after verification — nothing test-related was left in `public/images/`.

**Browser interaction could not be live-tested** — this session has no browser automation available, so mouse/keyboard interaction with the actual `<input type="file">` picker dialog, and visual confirmation of hover/active/focus/disabled button states, were not observed in a real browser. Every functional claim above (upload succeeds, validation errors fire, save persists, public page reflects the change, refresh preserves it) was verified through direct HTTP requests against the same API routes the browser UI calls — the same requests a browser would make — but the actual rendered pixels and click interactions were not visually inspected. See §10 for exact manual test steps.

---

## 7. The one deliberate layout change

Removing `heroHeadlineLines`'s hardcoded 3-line break meant the headline now wraps naturally instead of breaking at fixed points. This is **not a design change** in the sense of altered typography, spacing, or color — `text-display mt-4` is the exact same class the headline always used. It's a **necessary consequence** of the fix: a manual, pre-computed 3-line split cannot exist for text an admin can freely rewrite to any length. Natural wrapping is also already how every other headline on the site behaves (`WorkHero`, `ProjectHero`, `DesignerIntro`, etc.) — Hero was the one outlier using a bespoke manual-break trick, specifically because its text used to be a hardcoded constant instead of variable admin content.

---

## 8. Admin fields now publicly connected (this phase)

| Field | Editor | Previously | Now |
|---|---|---|---|
| Positioning Statement | `/admin/settings` | Saved correctly, but ignored by the homepage headline | Drives the homepage headline (and still the footer tagline) |
| Any Cover/Thumbnail/Gallery/OG image | `/admin/projects/[id]`, `/admin/about`, `/admin/contact`, `/admin/settings` (SEO OG image) | Could only be set from a file already manually copied onto disk | Can be uploaded directly from the browser and used immediately |

---

## 9. Known limitations (carried forward or introduced this phase)

- **Hero primary/secondary CTA label/URL are still static** (`heroCtas` in `src/content/site.ts`), not admin-editable. No `SiteSettings` field exists for them today. Adding one is a real, deliberate schema decision (and touches `HiringCTA.tsx`, which reuses `heroCtas.secondary.href`) — left out of this bugfix pass rather than invented on the spot; flagged here for the user to decide on explicitly.
- **Upload has no authentication** — same posture as every other `/api/admin/*` route today (the `/admin` shell's own banner already states "DEVELOPMENT ONLY — local admin prototype. No authentication."). Not introduced or worsened by this phase.
- **SVG uploads are not supported**, by deliberate security decision (see §5) — would require `next.config.ts`'s `images.dangerouslyAllowSVG` plus real SVG sanitization, neither of which exists today.
- **8MB upload limit** is a fixed constant (`MAX_UPLOAD_BYTES` in both the route and `media.tsx`), not admin-configurable.
- **Uploaded files accumulate under `.../uploads/`** with generated names — there's no admin-facing delete-from-disk action (consistent with the project's existing posture: images are managed as files, not as database rows with their own lifecycle).
- **WorkHero's copy is still fully hardcoded**, with no CMS field at all (not a regression from this phase — documented as a real, pre-existing gap in `docs/PORTFOLIO_CMS_ARCHITECTURE.md` §6/§13, out of scope for a bugfix pass targeting a *disconnected* field, since no field exists here to reconnect).
- **`SiteSettings.seoDefaults`** is still saved but not read by any route — Settings has no dedicated public page of its own to attach it to (unchanged from Phase D3).

---

## 10. Exact manual browser test steps

1. **Hero headline:**
   - Open `http://localhost:3000/admin/settings`.
   - Change "Positioning Statement" to something new, click **Save**. Confirm the button shows a spinner + "Saving…", then "✓ Saved".
   - Open `http://localhost:3000/` in a new tab. Confirm the homepage headline (large text near the top) now shows the new text.
   - Refresh that tab. Confirm the new text is still there.

2. **Image upload:**
   - Open `http://localhost:3000/admin/projects/gridmark` (or any project).
   - In the Media / Gallery section, find "Upload new image" next to "Choose existing image" (on Cover Image, Thumbnail, or any gallery section).
   - Click it, pick a JPG/PNG/WEBP file from your computer. Confirm the button shows "Uploading…" then "✓ Uploaded", and the field's preview immediately updates to the new image.
   - Click **Save**. Confirm the save button's own "Saving…" → "✓ Saved" sequence.
   - Open `http://localhost:3000/work/gridmark` (or `/work`, depending on which field you changed) in a new tab. Confirm the uploaded image renders.
   - Refresh. Confirm it's still there.
   - Try uploading a `.txt` file or a file over 8MB to confirm the visible error message appears and the button returns to a usable state.

---

*This document covers Phase E only. Phases A–D3 remain documented in their own files (`CMS_IMPLEMENTATION_PLAN.md`, `PORTFOLIO_CMS_ARCHITECTURE.md`, `CMS_CONTENT_MODEL.md`).*
