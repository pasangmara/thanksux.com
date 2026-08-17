/**
 * Site-wide copy and structural data.
 *
 * Copy quoted directly from docs/PROJECT_SPEC.md / Portfolio-Strategy-
 * Blueprint.md is noted as such. Everything else is placeholder content
 * written to fill a real structural slot (bio facts, contact handles,
 * tool list) — flagged inline with NEEDS REAL DATA where the docs never
 * actually confirmed the value. Replace before launch.
 */

import { personal } from "./personal";

export const nav = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

// PROJECT_SPEC.md §1 — approved positioning statement, used verbatim. Seeds
// `settings.positioning` (data/settings.json) the first time it's read —
// see siteContentRepository.ts's seedSettings(). `settings.positioning` is
// Site Settings' global/footer field — SiteFooter's tagline renders it;
// the "Positioning Statement" admin field's own help text says exactly
// this ("Shown in the footer, under the site name"). [CMS architecture
// correction] It is deliberately NOT the homepage Hero headline — an
// earlier pass wired Hero.tsx to read this field directly, which was a
// semantically incorrect shortcut (Hero copy now lives in its own
// `HeroContent` record instead — see siteContentRepository.ts's
// `seedHero()` and src/app/admin/hero/page.tsx).
export const positioning = "Systems-minded design, from brand to product.";

// PROJECT_SPEC.md §1 — approved differentiator, lightly trimmed for hero
// voice. Seeds `settings.differentiator` (Site Settings' global field) —
// NOT the homepage Hero's description; see the note on `positioning`
// above for why Hero copy doesn't borrow Settings fields. Also seeds
// `HeroContent.description`'s initial value (siteContentRepository.ts's
// `seedHero()`) purely so the homepage's visible copy didn't change the
// moment that record started existing — the two are independently
// editable from that point on.
export const differentiator =
  "Graphic design, branding, and UI/UX — proven side by side, not as two separate portfolios.";

// [Real owner profile sync] Now confirmed via the owner's real CV — "4+
// years of experience" is stated there explicitly, so this is no longer
// the invented-employer/region risk this comment originally warned
// against; it's the CV's own claim, not a guess.
export const experienceSummary: string | null =
  "4+ years of experience across online marketplaces and agency environments — dashboard/SaaS UI, responsive websites, branding, and print.";

// NEEDS REAL DATA — not specified in any source doc; placeholder capability
// framing grounded in the 3 fixed categories (PROJECT_SPEC.md §9) plus the
// UX-research differentiator from the Blueprint's positioning (§01).
export const services = [
  {
    title: "Brand Identity & Systems",
    description:
      "Marks, type systems, and print collateral built to hold together without a designer in the room for every future update.",
  },
  {
    title: "Product & UI/UX Design",
    description:
      "Interfaces designed from research and information architecture first, not screens designed backward from a mockup.",
  },
  {
    title: "UX Research & Strategy",
    description:
      "Lightweight, real research — usability sessions and flow audits sized to fit inside an actual project timeline.",
  },
] as const;

// Design Process section — PROJECT_SPEC.md §4.1 / Blueprint §05: "a short
// 3–4 step framework... presented visually, not as a wall of text."
export const process = [
  {
    title: "Understand",
    description: "Learn the actual constraint — business, user, or technical — before proposing a direction.",
  },
  {
    title: "Define",
    description: "Turn research into a strategy and a stated reason for every major decision that follows.",
  },
  {
    title: "Design",
    description: "Build the system, not just the screen — components and rules that outlast the first version.",
  },
  {
    title: "Refine",
    description: "Test against real use, then cut anything that doesn't earn its place.",
  },
] as const;

// Design philosophy — restates the approved positioning/differentiator in
// first-person "how I work" voice for the About section. Not a new claim;
// grounded entirely in the already-approved copy above.
export const designPhilosophy =
  "Every project starts with the same question: what's actually constraining this, and what's the smallest system that solves it without needing me back in the room for every future change.";

// About Snapshot / Designer Introduction — PROJECT_SPEC.md §4.4: "specific,
// not generic." The first line's location was originally an explicit
// `[Location]` placeholder marker (not a guess — an earlier draft of this
// file stated a specific location as fact without confirmation, which is
// exactly the invented-personal-info problem homepage-polish brief §07
// calls out). [Phase 7] Now filled in with "Dhaka, Bangladesh" — not a new
// guess, synced from the real value the site owner already entered in
// Contact CMS (`contact_content.location`). The other two lines are kept
// because they're grounded in the approved differentiator copy and
// Blueprint's mention of Joy's design-systems background, not invented.
export const aboutFacts = [
  "Dhaka, Bangladesh — available for remote and on-site collaboration.",
  "Splits time between brand identity work and product UI/UX — not sequentially, side by side on the same roster of clients.",
  "Background in structured design-systems work — component libraries, tokens, and documentation, not just visual output.",
] as const;

// [Real owner profile sync] Matches the owner's real CV Skills/Tools
// sections exactly — no longer a placeholder guess.
export const skills = {
  design: [
    "UI Design — Web & Mobile",
    "UX Flows & Wireframing",
    "Dashboard & SaaS UI",
    "Responsive Website Design",
    "Prototyping & Interaction",
    "Graphic Design",
    "Branding & Visual Identity",
    "Design Systems",
  ],
  tools: ["Adobe Illustrator", "Adobe Photoshop", "Adobe InDesign", "Adobe XD", "Figma"],
} as const;

// Contact channels moved to src/content/personal.ts (`socialLinks`) as
// part of the content-architecture pass — personal/contact info is now
// centralized there rather than split across this file.

// PROJECT_SPEC.md §4.5 — optional response-time line, exact copy.
export const responseTimeLine = "Usually replies within 24 hours";

export const projectTypes = [
  "Brand identity",
  "UI/UX design",
  "UX research",
  "Something else",
] as const;

export const footerCopyright = `© ${new Date().getFullYear()} ${personal.name}. All rights reserved.`;
