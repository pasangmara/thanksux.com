import type { MetadataRoute } from "next";
import { getPublishedProjects } from "@/content/projects";
import { getSiteSettings } from "@/lib/cms/siteContentRepository";

/**
 * [Production prep — thanksux.com] Absolute URLs need a real base, so this
 * reads the same admin-editable `settings.siteUrl` field layout.tsx already
 * uses for `metadataBase` (Settings → Site Identity → Site URL) rather than
 * a second, independent source of truth. Unset/invalid → empty sitemap
 * (no broken relative/localhost URLs shipped) until an admin sets it post-
 * deploy; nothing here needs a code change once they do.
 *
 * Only the static top-level public pages plus published, non-noIndex
 * project detail pages are listed. Community content (signals, responses,
 * contributions) is deliberately left out of this first pass — listing it
 * correctly would mean depending on repositories/visibility rules this
 * change doesn't otherwise touch; add it as a deliberate follow-up, not a
 * guess made here.
 */
const STATIC_ROUTES = ["", "/work", "/about", "/contact", "/signals", "/audit"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  let base: string | undefined;
  if (settings.siteUrl) {
    try {
      base = new URL(settings.siteUrl).origin;
    } catch {
      base = undefined;
    }
  }
  if (!base) return [];

  const projects = await getPublishedProjects();
  const lastModified = new Date();

  return [
    ...STATIC_ROUTES.map((path) => ({ url: `${base}${path}`, lastModified })),
    ...projects
      .filter((p) => !p.seo?.noIndex)
      .map((p) => ({ url: `${base}/work/${p.slug}`, lastModified })),
  ];
}
