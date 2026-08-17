# Content architecture

## Adding real portfolio projects

**Full workflow, image specs, and per-category content checklist: see `docs/CONTENT_GUIDE.md`.** This file stays a short technical reference.

Demo data and real data are deliberately kept apart so replacing one with the other never touches a component:

- `demo-projects.ts` — the 8 placeholder projects currently on the site. Clearly marked, not real work.
- `real-projects.ts` — where your actual projects go. Currently an empty array with a full commented template matching `src/types/project.ts` exactly.
- `projects.ts` — the file every component actually imports (`FeaturedWork`, `GraphicDesignShowcase`, `UIUXShowcase`, `CaseStudyPreview`, the Work page, and every project detail page). Right now it re-exports the demo data.

**To switch to real projects**, in `projects.ts` change:
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
Nothing else changes. `featuredProjects`, `publishedProjects`, `projectsByCategory()`, and `getCaseStudyPreviewProject()` all derive from `projects` automatically, and every component reads through those, never the raw file. `usingDemoData` also controls the "Sample project" marker shown on project detail pages — flip it in the same edit.

You can add projects incrementally — `published: false` keeps a project out of every listing while you're still writing its case study, without deleting it.

### Images

Every project's `coverImage` (and `thumbnail`, `gallery`, and case-study image fields) currently use `{ kind: "placeholder", category: "...", alt: "..." }`, which renders an honest labeled frame instead of a photo. To use a real image, change the field to:

```ts
{ kind: "image", src: "/images/projects/your-project-slug/cover.jpg", alt: "Description of the actual image" }
```

Image files go under `public/images/projects/<your-project-slug>/` — see that folder's own `README.md` for the subfolder convention (mapped 1:1 to schema fields) and `docs/CONTENT_GUIDE.md` for recommended dimensions/format/file-size per image type. No component changes are needed; `PortfolioMedia` renders either kind identically aside from the placeholder-vs-photo difference, including responsive sizing, lazy loading, and the site's rounded-corner presentation frames.

## Personal information

`personal.ts` is the single source for name, title, bio, and every contact/social channel (email, WhatsApp, Facebook, LinkedIn, Instagram, Behance, Dribbble). Fields marked `NEEDS REAL DATA` in that file are placeholders — update them there and the change propagates to the nav, footer, hero, and Contact section automatically.

## Everything else

`site.ts` holds section-level copy that isn't project- or person-specific: nav labels, hero CTA labels, the Services/Process lists, About-page facts, and the skills/tools lists. `media.ts` holds the shared aspect-ratio constants every image container uses — add a new named constant there rather than hardcoding a ratio inside a component.
