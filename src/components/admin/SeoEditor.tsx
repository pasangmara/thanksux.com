"use client";

/**
 * [CMS Phase D1] One shared SEO section, reused by the Project editor and
 * the About/Contact/Settings editors — previously each of those four hand-
 * rolled its own 2-field (Meta Title/Meta Description) block independently,
 * which is exactly the kind of duplicated-in-multiple-places pattern this
 * CMS work has consistently avoided for category config. All four now
 * render the same, more complete field set (item 6): SEO title, meta
 * description, OG title, OG description, OG image, canonical URL, no-
 * index. All fields stay optional.
 *
 * [CMS Phase D3] `Project.seo` (work/[slug]/page.tsx), `AboutContent.seo`
 * (/about's `generateMetadata()`), and `ContactContent.seo` (/contact's
 * `generateMetadata()`) are all now actually read as an override layered
 * on top of each route's existing title/description derivation — see
 * docs/PORTFOLIO_CMS_ARCHITECTURE.md §10. `SiteSettings.seoDefaults` is
 * the one field this editor saves that still isn't read anywhere — Site
 * Settings has no dedicated public route of its own to attach it to.
 *
 * "Keywords" was in Phase D1's requested field list but is explicitly
 * gated on "if already supported" — no `keywords` field exists anywhere
 * in the documented content model (`SeoMeta`, `CMS_CONTENT_MODEL.md` §13),
 * so it's intentionally omitted rather than invented. "Slug" is shown
 * read-only for reference where a project slug is available — it's edited
 * in Basic Information, not duplicated here as a second editable field.
 */

import { Section, TextAreaField, TextField, ToggleField } from "./fields";
import { MediaField } from "./media";
import type { SeoMeta } from "@/lib/admin/types";

const DEFAULT_DESCRIPTION =
  "Read as an override layered on top of this page's automatic title/description derivation — leave any field blank to keep using the automatic value.";

export function SeoEditor({
  seo,
  onChange,
  projectSlug,
  slugForReference,
  title = "SEO",
  description = DEFAULT_DESCRIPTION,
}: {
  seo: SeoMeta | undefined;
  onChange: (patch: Partial<SeoMeta>) => void;
  /** Scopes the OG image picker to a project's image folder, same as any other MediaField — omit for site-wide content (About/Contact/Settings) that isn't tied to one project's folder. */
  projectSlug?: string;
  /** Read-only display only — e.g. a project's slug, shown for reference since canonical URLs are usually slug-derived. Not editable here. */
  slugForReference?: string;
  /** [Phase D3.5] Section heading override — e.g. "6. Homepage SEO" to match a numbered admin page structure. Defaults to "SEO", unchanged for every existing caller. */
  title?: string;
  /** [Phase D3.5] Description override — the default text asserts this record is actually read by a route's generateMetadata(), which is true for Project/About/Contact/Homepage but NOT for Site Settings' seoDefaults (no dedicated public route to attach it to) — Settings' call site passes its own accurate description instead of the default. */
  description?: string;
}) {
  return (
    <Section title={title} description={description}>
      {slugForReference ? (
        <p className="text-caption text-text-tertiary">
          Slug (edit in Basic Information above): <span className="text-ink">{slugForReference}</span>
        </p>
      ) : null}

      <TextField
        id="seoMetaTitle"
        label="SEO Title"
        value={seo?.metaTitle ?? ""}
        help="Falls back to the page's own title when left blank"
        onChange={(v) => onChange({ metaTitle: v || undefined })}
      />
      <TextAreaField
        id="seoMetaDescription"
        label="Meta Description"
        rows={2}
        value={seo?.metaDescription ?? ""}
        onChange={(v) => onChange({ metaDescription: v || undefined })}
      />
      <TextField
        id="seoCanonicalPath"
        label="Canonical URL"
        value={seo?.canonicalPath ?? ""}
        help="Rare override — auto-derived from the route/slug by default"
        onChange={(v) => onChange({ canonicalPath: v || undefined })}
      />

      <TextField
        id="seoOgTitle"
        label="OG Title"
        value={seo?.ogTitle ?? ""}
        help="Social-share title — falls back to SEO Title when left blank"
        onChange={(v) => onChange({ ogTitle: v || undefined })}
      />
      <TextAreaField
        id="seoOgDescription"
        label="OG Description"
        rows={2}
        value={seo?.ogDescription ?? ""}
        help="Falls back to Meta Description when left blank"
        onChange={(v) => onChange({ ogDescription: v || undefined })}
      />
      <MediaField
        label="OG Image"
        media={seo?.ogImage ?? { kind: "placeholder", category: "brand-mark", alt: "" }}
        projectSlug={projectSlug}
        help="Custom social-share image — falls back to the cover image when left as a placeholder"
        onChange={(m) => onChange({ ogImage: m })}
      />

      <ToggleField
        id="seoNoIndex"
        label="No Index"
        checked={seo?.noIndex ?? false}
        onChange={(v) => onChange({ noIndex: v })}
        help="Keep this page out of search results"
      />
    </Section>
  );
}
