# CONTENT_GUIDE.md
## Adding real portfolio projects — workflow, image specs, content checklist

**Status:** Reference document. Nothing in this file requires a code change to use — it documents the existing `src/types/project.ts` schema and `public/images/projects/` convention, both already built and ready.

---

## 1. How to add a project — the full workflow

1. **Write the content** using the checklist in Section 3 below, organized by your project's category.
2. **Prepare images** per the specs in Section 2, and place them in `public/images/projects/<your-slug>/` following the structure documented in `public/images/projects/README.md`.
3. **Add the entry** to `src/content/real-projects.ts`, using the commented template already in that file. Copy it, fill it in, delete whichever `caseStudy` fields don't apply to your project (see Section 3).
4. **Switch the site to real data** — in `src/content/projects.ts`, change:
   ```ts
   import { demoProjects } from "./demo-projects";
   export const projects: Project[] = demoProjects;
   export const usingDemoData = true;
   ```
   to:
   ```ts
   import { realProjects } from "./real-projects";
   export const projects: Project[] = realProjects;
   export const usingDemoData = false;
   ```
   This one change is what removes the "Sample project" marker from every page and switches Featured Work, the Work page, category showcases, and every project detail page over to your real projects — no component anywhere needs to change.
5. Until you're ready to flip that switch, you can leave `published: false` on individual real projects while you write them up, or work in `real-projects.ts` entirely separately from the live demo site.

**You can do this incrementally.** Add one project, leave the rest as `published: false` or just not yet written, and the site handles a partial real-projects list exactly the same way it handles the demo set today.

---

## 2. Image specifications

Every image on the site renders through one component (`PortfolioMedia`), which crops via `object-fit: cover` inside a fixed-aspect-ratio frame. That means: **supply images at generous resolution and a roughly-matching aspect ratio — exact pixel-perfect cropping isn't required**, the frame handles it. If a specific crop matters (e.g., keep a logo centered), set `objectPosition` on that image's data entry (e.g., `"center top"`).

All `next/image`-served images are automatically re-encoded to modern formats (WebP/AVIF) and resized per-device at request time — **you don't need to pre-generate multiple sizes or convert formats yourself.** Supply one good-quality source file per image.

| Image type | Used for | Recommended source size | Aspect ratio | Format | Target file size | Naming |
|---|---|---|---|---|---|---|
| **1. Project cover** | `coverImage` — hero banner (detail page), homepage exhibition tiles | 2400×1350px min | Flexible landscape (source ~16:9); site crops to 21:9 or 4:3 depending on placement | JPG | ≤400KB | `cover.jpg` |
| **2. Project thumbnail** | `thumbnail` — grid/card views (Featured Work, Work page, showcases) | 1200×900px | 4:3 (matches the card frame exactly — least cropping) | JPG | ≤200KB | `thumbnail.jpg` |
| **3. Gallery image** | `gallery[]`, any `caseStudy` image array | 2000px on the longest edge | Flexible — site crops to 21:9 (`layout:"full"`), 4:3 (`"half"`), or 1:1 (`"third"`) per the `layout` field you set | JPG | ≤350KB | `gallery/01.jpg`, `02.jpg`… sequential |
| **4. UI screenshot** (desktop) | `wireframes`/`finalDesign` for UI/UX projects | Native resolution, e.g. 2560×1440 or 1920×1080 | 16:9 | PNG (crisp UI edges/text) | ≤500KB | `case-study/final-design/desktop-01.png` |
| **5. Mobile screenshot** | Same fields, mobile context | Native device resolution, e.g. 1170×2532 | ~9:19.5 (portrait) | PNG | ≤400KB | `case-study/final-design/mobile-01.png`. **Set `objectPosition: "top"`** — a portrait screenshot cropped into a landscape tile (`"half"`/`"third"`) will otherwise lose the bottom of the screen, not the top, by default center-crop. |
| **6. Branding mockup / application shot** | `applications`, `logo` | 2400×1800px (or 2000×2000 for square-composed shots) | 4:3 or 1:1, matching the mockup's natural composition | JPG | ≤400KB | `case-study/applications/tote-bag.jpg` — descriptive, not just numbered, since these vary a lot |
| **7. Case-study image (general)** | `moodboard`, `exploration`, any process shot | 2000px longest edge | Flexible | JPG for photos/mockups, PNG for anything with sharp vector edges (logo marks, wireframes) | ≤350KB | `case-study/<field>/01.jpg` |

### 2a. Hero visuals, Logo, Brand Mark, Favicon, Custom icons *(new — Homepage/Site Identity CMS)*

Not covered by the table above, which predates the Hero Visuals editor (`/admin/homepage` §3) and Site Identity (`/admin/settings` → "Site Identity"). Hero visual tiles are independently uploaded per `HeroVisual.image` — they are no longer automatically the top featured projects' cover images, so they need their own sizing guidance:

| Image type | Used for | Recommended source size | Aspect ratio | Format | Notes |
|---|---|---|---|---|---|
| **Hero visual — tall tile** | `hero.visuals[0]` (position 1 — the large left tile on desktop) | 1600×2100px min | 3:4 portrait | JPG/PNG | Renders `object-fit: cover`; a source noticeably off this ratio crops from center. |
| **Hero visual — square tile** | `hero.visuals[1]`/`[2]` (positions 2–3) | 1600×1600px min | 1:1 | JPG/PNG | |
| **Hero visual — wide tile** | `hero.visuals[3]` (position 4 — the bottom banner tile) | 2400×1030px min | 21:9 | JPG/PNG | Same banner ratio as a project cover. |
| **Logo** | `SiteSettings.logo`, nav + footer brand row | Native vector size, or ≥240px tall if raster | Any — rendered `object-contain`, height-capped, never stretched | **SVG preferred**; PNG/WEBP with a transparent background otherwise | Uploaded via `/api/admin/icons` (SVG sanitized server-side — see that route's header comment), rendered via plain `<img>`, not `next/image`. |
| **Brand Mark** | `SiteSettings.brandMark` (reserved — not yet rendered publicly) | Same as Logo | Square-ish, works small | SVG preferred | |
| **Favicon** | `SiteSettings.favicon`, browser tab icon | 32×32 to 512×512px | 1:1 | SVG, PNG, or ICO | Falls back to Next's default `app/favicon.ico` handling when unset. |
| **Custom social icon** | `SocialLink.customIcon` — overrides one channel's built-in glyph | ~64×64px | 1:1, simple/monochrome reads best at 12–24px render size | SVG preferred | Overrides only; the built-in `icon` enum value stays set as the fallback if cleared. |

### Alt text — required, not optional

`alt` is a required field on every image in the schema (TypeScript will refuse to compile a project missing one). The bar for a good one:

- **Specific, not generic.** "Northbound onboarding, KYC step before redesign" — not "UI screenshot" or "Northbound image 3."
- **Describes what's actually visible**, not the project's marketing pitch. Alt text is for someone who can't see the image, or for search engines — it's not a caption.
- **No "image of" / "photo of" prefix** — screen readers already announce it's an image.

---

## 3. Content checklist, by category

Every project needs the **universal fields** below regardless of category. Then work through whichever category section matches — **skip any field that doesn't apply to your project.** The site only renders sections with real content; nothing shows as an empty placeholder box.

### Universal (every project)

- [ ] Title
- [ ] Slug (URL-safe, e.g. `my-project-name` — must match the image folder name)
- [ ] Category (`Graphic Design` / `Branding` / `UI/UX` / `Web Design` / `UX Research` / `Editorial` / `Campaign`)
- [ ] Project type (free text, e.g. "Mobile App," "Poster Series")
- [ ] Year
- [ ] Client (or omit if personal/unpublished work)
- [ ] Role
- [ ] Short description (one sentence, for cards)
- [ ] Tools used
- [ ] Services this falls under
- [ ] Cover image + thumbnail
- [ ] Whether it's featured, and in what order
- [ ] Overview (1–2 sentences framing the project) and Outcome (honest — see the important note below)

### Graphic Design

- [ ] Objective — what the piece needed to accomplish
- [ ] Description — fuller framing paragraph
- [ ] Gallery images
- [ ] Applications — where/how it was used in the real world
- [ ] *(optional)* Context, Concept, Design Direction, Exploration (rejected/earlier directions), Final Design

### Branding

- [ ] Brand context — who the client is, what they needed
- [ ] Research
- [ ] Strategy — the reasoning that shaped the direction (renders as "Brand Strategy")
- [ ] Moodboard
- [ ] Logo concept — the idea behind the mark
- [ ] Logo system — the actual mark(s), variations
- [ ] Typography — the type choices and why
- [ ] Color — the palette and why
- [ ] Applications / mockups — real-world use
- [ ] Final gallery

### UI/UX

- [ ] Problem
- [ ] Research
- [ ] Research methods (a short list — e.g. "User interviews," "Usability testing")
- [ ] Insights
- [ ] User flow (renders as "User Journey")
- [ ] Information architecture
- [ ] Wireframes
- [ ] Design direction
- [ ] UI (final interface screens)
- [ ] Design system (if one was built)
- [ ] Testing
- [ ] Outcome
- [ ] Reflection — what you'd do differently, or what you learned
- [ ] Final screens (same as "UI" above — one field, don't duplicate)

---

## Important — do not fabricate

This guide exists to make writing real projects fast, not to encourage filling every field for its own sake. Specifically:

- **Never invent a client name, a metric, or a case-study result.** If you don't have a number, write the outcome as a process statement ("shipped and adopted across 3 channels") rather than guessing a percentage.
- **Leave a field blank (delete it from the template) rather than writing filler.** A shorter, honest case study is stronger than a padded one — this is also just how the page is designed to work: absent fields don't render, so there's no "empty section" penalty for leaving something out.
- **Demo projects stay clearly marked** (`usingDemoData = true` in `src/content/projects.ts`) until you've actually populated `real-projects.ts` and made the switch in Section 1, step 4.
