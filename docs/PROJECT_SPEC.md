# PROJECT_SPEC.md
## Personal Portfolio — Graphic Design + UI/UX + UX Research
**Status:** Approved strategy → actionable spec. No code yet.

---

## 1. Product Strategy (Approved)

**Positioning:** Systems-minded design, from brand to product. A designer who solves problems through both graphic/brand craft and UI/UX rigor — proven side by side as one coherent point of view, not two separate portfolios.

**Primary audience:** Startup founders, recruiters/hiring managers.
**Secondary audience:** Small business clients, creative agencies/creative directors.

**5-second impression target:** "This is a designer who solves real problems, has strong visual craft, and can be trusted with both a brand and a product."

**Differentiator:** Credible range across Graphic Design + Branding + UI/UX, presented as one design intelligence rather than fragmented specialties.

**Open decision (must resolve before Phase 03 — Design System):**
Palette in this spec (off-white / deep blue / orange) differs from the existing Joy UI Designs brand identity (navy #0F1F3D / gold #C9943A, Syne Bold). Decide: extend existing brand identity into this site, or intentionally run a distinct portfolio identity. Spec below assumes the new palette unless overridden.

---

## 2. Information Architecture

### Site map (final — 5 pages)
```
/                    Home
/work                Work (unified grid, filterable)
/work/[slug]         Case Study (dynamic template)
/about               About
/contact             Contact
```

**Explicitly excluded at launch:** separate top-level pages per discipline (`/graphic-design`, `/branding`, `/ui-ux`), a Services page, a Blog/Journal page, an Admin login link in public nav.

### Navigation
- **Primary nav (max 4 items):** Home · Work · About · Contact
- **Secondary nav (Work page only):** filter chips — All / UI-UX / Branding / Graphic Design
- **Footer:** Work, About, Contact links + social/contact icons (Email, WhatsApp, LinkedIn, Behance, Fiverr) + copyright
- **Persistent element:** small "Let's talk" CTA visible in nav or as a mobile-only bottom bar

---

## 3. User Flows

### Flow A — Recruiter / Hiring Manager
```
Land on Home
→ Read hero + positioning statement
→ Scroll Featured Work (scan 3–4 projects)
→ Click into 1–2 Case Studies
→ Check process depth (Problem → Process → Outcome)
→ Visit About (verify credibility, role fit)
→ Contact (or exit to LinkedIn/resume)
```
**Success condition:** reaches at least one full case study and the About page before leaving.

### Flow B — Startup Founder / Client (high intent)
```
Land on Home (often via referral/social link)
→ Skim hero
→ Jump to Work or directly to a shared Case Study
→ Evaluate range (brand + product work visible)
→ Go to Contact
→ Use WhatsApp or Email direct link
```
**Success condition:** reaches Contact within 2–3 clicks, uses a direct channel (not just the form).

### Flow C — Creative Director / Agency (craft evaluation)
```
Land on Work page directly or via Home
→ Browse full grid (all categories, not just featured)
→ Open multiple Case Studies to assess consistency of quality
→ Evaluate visual craft + typography across projects
→ Optional: About for tone/POV
→ Passive contact (LinkedIn/Behance) more likely than form
```
**Success condition:** browses across category filters, opens 3+ projects.

### Flow D — Mobile visitor (any persona)
```
Land on Home (mobile)
→ Hero stacks vertically, single strong image
→ Scroll featured work (single column)
→ Tap into a case study (sequential, image-first sections)
→ Tap persistent bottom contact bar (WhatsApp/Email) OR full-screen nav → Contact
```
**Success condition:** can reach a direct contact channel without hunting past the fold repeatedly.

---

## 4. Page Requirements

### 4.1 Home
Required sections, in order:
1. **Hero** — name, positioning statement, 1-line differentiator, primary CTA ("View Selected Work"), secondary CTA ("Let's Talk"), visual proof (composed work fragments — Split Proof Hero concept)
2. **Quick Proof strip** — years of experience, current role, industries/clients (short credibility line)
3. **Featured Work** — 3–4 manually curated projects (mixed disciplines), each with image, title, 1-line outcome
4. **Approach** — 3–4 step process framework, visual not text-heavy
5. **About snapshot** — photo, short bio (2–3 specific facts), link to full About
6. **Testimonials** — 2–3 quotes with name/role (if available; omit block entirely if none, do not fake)
7. **Final CTA / Contact band** — direct restatement of availability + fastest contact channel

### 4.2 Work
Requirements:
- Featured projects pinned at top regardless of active filter
- Filter chips: All / UI-UX / Branding / Graphic Design (single row, no nested/faceted filtering)
- Project card: image, title, 1-line outcome/insight, category tag
- Grid: 3-column desktop / 2-column tablet / 1-column mobile
- No search bar, no pagination unless project count exceeds ~24 (not expected at launch)

### 4.3 Case Study (dynamic template, `/work/[slug]`)
Two content variants sharing one visual template:

**UI/UX variant sections:**
Problem → Research → Insights → Strategy → Information Architecture → Wireframes → UI → Testing → Outcome

**Branding variant sections:**
Context → Research → Strategy → Moodboard → Concept → Logo → Typography → Color → Identity → Applications → Outcome

**Every case study must include, regardless of variant:**
- Stated constraint (budget/timeline/stakeholder/technical) near the top
- At least one non-final-polish artifact (sketch, flow diagram, rejected direction, research note)
- A stated "why" for at least one major decision
- An honest outcome statement (metric-based if available, process-based if not)
- End-of-page CTA ("See more work" + "Get in touch")
- Text density cap: ~40–60 words per section

### 4.4 About
Required content:
- Full bio (specific, not generic — background, current role, focus areas, philosophy)
- Real photo
- Process/philosophy explanation (can expand on Home's Approach section)
- Tools/skills list
- Resume/CV download link
- Link to Contact

### 4.5 Contact
Required content:
- Reinforcing headline
- Direct contact methods listed with icons: Email (primary), WhatsApp (secondary), LinkedIn, Behance, Fiverr
- Short form (max 4 fields: name, email, project type dropdown, message) — supplementary, never the only path
- Optional response-time expectation line (e.g., "Usually replies within 24 hours")

### 4.6 Admin (internal, not public-facing polish priority)
See Section 9 for full CMS requirements. UI requirements here are functional, not premium-visual:
- Dashboard (project counts, draft/published breakdown, recent activity)
- Projects list (title, category, status, featured flag, last updated)
- Project editor (structured fields per content model in Section 9)
- Media library (upload/reuse)
- Single-user auth (email/password or magic link)

---

## 5. Design Direction (Approved)

**Direction: Structured Studio**, with typographic confidence borrowed from an editorial-minimal approach.

- **Mood:** precise, systems-minded, professional — directly reinforces the positioning
- **Typography:** geometric sans-serif throughout, tight tracking on headlines; strong type hierarchy carries visual weight instead of decoration
- **Color usage:** off-white base, deep blue as dominant structural color (text, headers, nav), orange as functional accent only (CTAs, links, active states) — never decorative/background use of orange
- **Grid:** visible structure as a design motif — subtle rule lines, numbered sections, strict column alignment
- **Image treatment:** consistent aspect ratios and uniform framing across all project cards
- **Card style:** light 1px borders, no heavy shadows, sharp or near-sharp corners
- **Motion:** subtle hover states and scroll-triggered reveals only — no decorative or excessive animation
- **Explicitly avoid:** generic SaaS look, glassmorphism, excessive rounded corners, dark-mode-heavy design, AI-template appearance, excessive gradients

---

## 6. Design System

### Color tokens
| Token | Usage |
|---|---|
| `background` | off-white base |
| `background-alt` | subtle warm-white, section breaks |
| `text-primary` | deep blue / near-black |
| `text-secondary` | muted blue-gray |
| `accent` | orange — CTAs, links, active states only |
| `border` | light neutral |

### Typography scale
Modular scale (1.25 ratio): Display / H1 / H2 / H3 / Body-Large / Body / Caption.
Max 2 font families: one headline/display face, one body/workhorse face.

### Spacing system
8px base unit: 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128.

### Grid
12-column desktop grid, generous gutters. Container widths: narrow (case study copy / readable line-length), wide (project grids / hero).

### Border radius
Minimal to none — sharp/near-sharp corners system-wide.

### Shadows
Avoid heavy drop shadows; use borders and whitespace for separation.

### Components (required set)
- Buttons: primary (solid deep blue or orange), secondary (outline/text-link)
- Cards: project card, case-study-section card, testimonial card
- Navigation: top nav (desktop), full-screen overlay menu (mobile)
- Tags: small, uppercase, letter-spaced category labels
- Forms: underline/minimal-border inputs (not boxy SaaS-style fields)
- Project components: project card, project grid, filter chip
- Case study components: section header, process step block, image-with-caption, pull-quote, outcome summary block

---

## 7. Responsive Rules

| Element | Desktop | Tablet | Mobile |
|---|---|---|---|
| Navigation | Full horizontal nav | Full horizontal nav | Icon → full-screen overlay menu |
| Hero | Split composition (headline + work fragments side-by-side) | Split, condensed | Stacked, headline first, single strong image |
| Typography | Full display scale, longer line length | Stepped-down scale | Distinct mobile scale — tighter headlines, shorter lines |
| Project grid | 3-column | 2-column | 1-column, full-width cards |
| Case study layout | Side-by-side text/image sections | Side-by-side or stacked (case by case) | Strictly sequential, image-first per section |
| Images | Full-resolution responsive serve | Responsive serve | Optimized/smaller responsive serve |
| CTA | Inline | Inline | Persistent bottom contact bar |
| Footer | Multi-column | Multi-column or stacked | Single stacked list, no accordions |
| Contact | Direct links + form both visible | Direct links + form | Direct tap-links (call/WhatsApp/email) prioritized above form |
| Admin | Full desktop tool | Functional | Simplified read-only/quick-edit only — not a design priority |

---

## 8. Technical Requirements

- **Framework:** Next.js (App Router) + TypeScript
- **Rendering:** SSG/ISR for project and case study pages (SEO + speed)
- **Styling:** Tailwind CSS, theme config mapped 1:1 to Section 6 tokens
- **CMS/database:** headless CMS (e.g., Sanity or Payload) preferred over fully custom admin build, given modest content volume
- **Authentication:** single-user auth for admin only (email/password or magic link) — no multi-role complexity
- **Image storage/optimization:** CDN-backed asset pipeline (Cloudinary or CMS-native) + Next.js Image component
- **SEO:** per-project meta tags and OG images, sitemap.xml, semantic HTML structure
- **Performance target:** sub-2s LCP; lazy-load below-the-fold images; aggressive hero asset optimization
- **Accessibility:** proper heading hierarchy, CMS-required alt-text fields (not optional), verified color contrast for deep-blue-on-off-white and any orange-on-white text use
- **Analytics:** lightweight, privacy-respecting (e.g., Plausible or Vercel Analytics)
- **Responsive implementation:** mobile-first Tailwind breakpoints, matched against Section 7 rules exactly (not default scaling)

---

## 9. CMS Requirements

### Content model
`[implementation note]` The content-architecture pass expanded `category` to 7 values (`Graphic Design, Branding, UI/UX, Web Design, UX Research, Editorial, Campaign`) and `status` to a `published: boolean` field, and added `id`, `projectType`, `description`, `thumbnail`, `services`, `projectUrl`, and `order` — see `src/types/project.ts` for the authoritative shape now in code. The original 3-category enum below is preserved for history; nothing about the filter-chip UI (§4.2, still `All / UI-UX / Branding / Graphic Design`) has changed yet — a future Work-page pass should confirm whether the filter chips grow to match the fuller category list or stay scoped to the original 3.
```
Project {
  title: string
  slug: string
  category: enum(UI/UX, Branding, Graphic Design)
  tags: string[]
  status: enum(draft, published)
  featured: boolean
  featuredOrder: number
  coverImage: image (alt text required)
  summary: string (1-line, used on project cards)
  client: string (optional)
  role: string
  year: number
  caseStudy: {
    variant: enum(ui-ux, branding)
    constraint: string
    problem: string
    research: string
    insights: string
    strategy: string
    process: repeatable[ { title, description, image (alt required) } ]
    // UI/UX-specific fields:
    ia: string (optional)
    wireframes: image[] (optional)
    ui: image[] (optional)
    testing: string (optional)
    // Branding-specific fields:
    moodboard: image[] (optional)
    concept: string (optional)
    logo: image[] (optional)
    typography: string (optional)
    colorSystem: string (optional)
    applications: image[] (optional)
    outcome: string (required)
  }
}
```

### Admin capabilities (minimum viable)
- Dashboard: project counts by status, recent activity
- Project list: filter/sort by category, status, featured
- Project editor: full structured form matching content model above (not a single freeform rich-text field)
- Draft/Published toggle per project
- Featured toggle + manual ordering control (drives Home's Featured Work section)
- Media library: upload once, reuse across projects
- Required-field validation: alt text and outcome statement cannot be empty on publish

### Explicitly out of scope for v1
- Multi-user roles/permissions
- Comments/collaboration features
- Public blog/CMS content type
- Complex tagging/taxonomy beyond the fixed 3-category system

---

## Approval Checklist Before Phase 03 (Design System build in Figma)

- [ ] Palette decision confirmed (new direction vs. extend existing Joy UI Designs brand)
- [ ] Final project list selected (8–12 strongest projects, curation locked)
- [ ] Case study content gathered per project (constraint, process artifacts, outcome) for at least the featured 3–4
- [ ] CMS platform choice confirmed (headless CMS vs. custom build)
- [ ] Testimonials collected or explicitly excluded from Home

---

*This spec operationalizes the approved strategy. No visual design or code should begin until the Approval Checklist above is resolved.*
