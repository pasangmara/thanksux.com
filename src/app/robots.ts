import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/cms/siteContentRepository";

/**
 * [Production prep — thanksux.com] Same admin-editable `settings.siteUrl`
 * source as sitemap.ts/layout.tsx's metadataBase — one field, not a third
 * place to configure the domain. Unset/invalid → sitemap reference omitted
 * (crawl rules still apply; there's just no absolute sitemap URL to point
 * to yet).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  let base: string | undefined;
  if (settings.siteUrl) {
    try {
      base = new URL(settings.siteUrl).origin;
    } catch {
      base = undefined;
    }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
