# IMAGE_PIPELINE_AUDIT.md

## Status
Audit only. No production code, config, or image files were modified.

---

## 1. Current problem

Gridmark's real gallery/cover images render soft, blurry, and low-fidelity everywhere on the site — the project detail hero, the Work/homepage cards, and every tier of the case-study gallery (`full`/`half`/`third`).

---

## 2. Root cause

**The seven source JPEGs are natively far smaller than the frames the site renders them into — the site is upscaling small raster images, and no code change can fix that.**

### 2.1 Actual source file inspection (`public/images/projects/gridmark/`)

| File | Dimensions | Format | Size |
|---|---|---|---|
| `cover.jpg` | 344×289 | JPEG, baseline, 72 DPI | 40.9 KB |
| `gallery/01.jpg` | 344×289 | JPEG | 40.9 KB |
| `gallery/02.jpg` | 344×289 | JPEG | 35.3 KB |
| `gallery/03.jpg` | 344×289 | JPEG | 36.0 KB |
| `gallery/04.jpg` | 344×269 | JPEG | 35.5 KB |
| `gallery/05.jpg` | 344×289 | JPEG | 34.5 KB |
| `gallery/06.jpg` | 344×289 | JPEG | 38.0 KB |
| `gallery/07.jpg` | 397×289 | JPEG | 44.4 KB |

Verified byte-identical against the original files in `Downloads/logo branding/` — **these dimensions are the native resolution of the supplied assets**, not an artifact of the copy/ingestion step. Nothing in this repo's pipeline downscaled them.

`CONTENT_GUIDE.md` §2 documents the site's actual required source sizes:

| Placement | Documented minimum | Actual Gridmark source | Shortfall |
|---|---|---|---|
| Cover | 2400×1350 | 344×289 | ~7x narrower, ~4.7x shorter (~32x fewer total pixels) |
| Thumbnail | 1200×900 | 344×289 | ~3.5x narrower, ~3.1x shorter |
| Gallery | 2000px longest edge | 397px longest edge | ~5x short |

File sizes (34–44 KB) are normal and unremarkable *for images this small* — this isn't a case of over-aggressive JPEG compression on top of a reasonable resolution; the pixel dimensions themselves are the entire problem. These read as small web-preview/thumbnail exports rather than production-resolution deliverables.

### 2.2 What the rendering pipeline does with them

`PortfolioMedia.tsx` (`src/components/site/PortfolioMedia.tsx`) is the single component every image on the site renders through. It wraps `next/image` correctly:

```tsx
<Image src={media.src} alt={media.alt} fill sizes={sizes} priority={priority}
  style={{ objectFit: "cover", objectPosition: media.objectPosition ?? "center" }} .../>
```

`fill` makes the `<img>` stretch to 100% of its parent `<div>`, whose box size is set by the caller's `aspectRatio` (from `src/content/media.ts`'s `ASPECT` constants) inside a `container-wide` (max 1280px). That parent box is sized for a real portfolio image — it has no idea, and no way to know, that the underlying source file is only 344px wide.

Rendered-box-width vs. source-width, by placement (desktop, `container-wide` ≈ 1280px):

| Placement | Component | Frame | Approx. rendered width | Source width | Upscale factor |
|---|---|---|---|---|---|
| Project detail hero | `ProjectHero.tsx` | `ASPECT.spotlight` (21:9), full container | ~1200px | 344px | **~3.5x** |
| Gallery, `layout:"full"` (gallery/07) | `CaseStudyGallery.tsx` | `ASPECT.galleryFull` (16:9), full container | ~1200px | 397px | **~3x** |
| Gallery, `layout:"half"` (most gallery images) | `CaseStudyGallery.tsx` | `ASPECT.card` (4:3), 2-up | ~600px | 344px | **~1.7x** |
| Gallery, `layout:"third"` | `CaseStudyGallery.tsx` | `ASPECT.square` (1:1), 3-up desktop | ~400px | 344px | **~1.2x** |
| Work/homepage card | `ProjectCard.tsx` | `ASPECT.card` (4:3) or `.wide` (21:9 if primary) | 350–1200px | 344px (falls back to `coverImage`, no `thumbnail` set) | **~1–3.5x** |

`object-fit: cover` also crops before this upscale happens — the near-square 344×289 (~1.19:1) source is cropped to fit 21:9/16:9/4:3/1:1 frames, so the pipeline is enlarging an already-cropped (i.e., even smaller-than-344px-wide) region in the worst cases (hero, full-width gallery tile). This is expected, correct `object-fit` behavior, not a bug — it just makes the fundamental resolution shortfall more visible on the widest placements.

**Every symptom traces back to one fact: the source pixels don't exist.** No amount of correct `next/image` usage, `sizes` tuning, or CSS can synthesize detail that was never captured in the original 344×289 file.

### 2.3 Secondary, minor code-level contributor (does not explain most of the blur)

`PortfolioMedia.tsx`'s default `sizes` prop is `"(min-width: 1200px) 33vw, (min-width: 768px) 50vw, 100vw"`. Neither `ProjectHero.tsx` nor `CaseStudyGallery.tsx` overrides it, even though their images render far wider than 33vw of viewport on desktop (the hero spotlight and full-width gallery tile are effectively ~62vw of a 1920px screen, capped by `container-wide`'s 1280px). An inaccurate `sizes` hint can make the browser pick an undersized `srcset` candidate. This is real and worth fixing, but it's a rounding error next to the ~30x pixel-count shortfall above — even a perfectly-tuned `sizes` attribute cannot exceed the source file's own 344–397px ceiling. Flagged for completeness per the audit's own request to check `sizes`/`object-fit`, not because fixing it alone would resolve the reported quality problem.

### 2.4 Ruled out

- **`next.config.ts`** — effectively empty (`{ /* config options here */ }`). No `deviceSizes`/`imageSizes` override, no `unoptimized: true`, no custom `quality`. Next's default image pipeline (quality 75, WebP/AVIF re-encoding, standard device/image size steps) is active and correctly configured — it cannot be the cause, since it can only downscale/re-encode what it's given, never invent resolution.
- **No `quality` prop is set anywhere** in `PortfolioMedia.tsx` or any consuming component — grepped across `src/`, zero matches outside an unrelated code comment.
- **`object-position`** — none of Gridmark's images set a custom `objectPosition`; all default to `"center"`. This is a reasonable default for these source images' compositions and is not itself causing the quality loss (see 2.2 — cropping is expected behavior; the upscale afterward is the actual problem).
- **The copy/ingestion step** — confirmed byte-identical to the originals in `Downloads/logo branding/`. Nothing in this repo's process re-compressed or downscaled anything.

---

## 3. Exact files involved

| File | Role in this issue |
|---|---|
| `public/images/projects/gridmark/cover.jpg` + `gallery/01–07.jpg` | Root cause — native resolution (~344–397px wide) far below every documented placement's rendered size |
| `src/components/site/PortfolioMedia.tsx` | Correctly implemented; its default `sizes` attribute is imprecise for full-bleed placements (§2.3) |
| `src/components/site/ProjectHero.tsx` | Consumes `coverImage` at the largest rendered size (`ASPECT.spotlight`, full container) — no `sizes` override |
| `src/components/site/CaseStudyGallery.tsx` | Consumes `gallery[]` at `full`/`half`/`third` sizes — no `sizes` override; `layout:"full"` is the second-largest render |
| `src/components/site/ProjectCard.tsx` | Consumes `thumbnail ?? coverImage`; Gridmark has no `thumbnail`, so the same 344×289 source is reused at card size too |
| `src/components/site/ProjectOverview.tsx` | Not involved — renders text only, no images |
| `next.config.ts` | Not involved — default config, correctly minimal, not a contributing factor |
| `src/content/media.ts` (`ASPECT` constants) | Not the cause — these ratios are correct/unchanged; they simply define frames sized for real portfolio photography, which this source doesn't meet |
| `src/content/real-projects.ts` | Not the cause — `src` paths and `layout` assignments are correct; the referenced files are just too small |

---

## 4. Recommended fix

**Primary fix — not a code change: replace the seven Gridmark source files with higher-resolution exports of the same artwork**, per `CONTENT_GUIDE.md` §2's existing documented targets:

- Cover: ≥2400×1350px
- Thumbnail (optional, currently absent — adding one would also stop the card view from reusing the same small cover file): ≥1200×900px
- Gallery images: ≥2000px on the longest edge

This is a source-asset problem, not a rendering-pipeline problem — `next/image`, `PortfolioMedia`, and the `ASPECT` frame system are all working as designed. **No component, layout, or design-system change is needed or recommended to fix the reported blur.**

**Secondary, optional code fix** (small, non-visual, doesn't touch layout/design system): pass an accurate `sizes` prop from `ProjectHero.tsx` and `CaseStudyGallery.tsx`'s `layout:"full"`/`"half"` tiles instead of relying on `PortfolioMedia`'s generic default, so that once higher-resolution sources exist, the browser requests the right `srcset` candidate for full-bleed placements. This only matters once §4's primary fix is done — tuning `sizes` around a 344px source has no visible effect.

---

## 5. Do the source images need higher-resolution replacements?

**Yes — unambiguously.** This is the entire root cause. Every placement in the current design (hero spotlight, full-width gallery tile, half/third gallery tiles, and the project card fallback) renders these images at 1.2x to 3.5x their native pixel width. No CSS, `next/image` configuration, or component change can produce sharp output from a 344×289px source once it's displayed at 600–1200px — the fix has to happen at the asset level, by obtaining or re-exporting the original Gridmark artwork at the resolutions `CONTENT_GUIDE.md` already documents.

---

*No production code, configuration, or image files were modified in the course of this audit.*
