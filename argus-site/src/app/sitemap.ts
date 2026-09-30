import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { en: `${SITE_URL}/`, bn: `${SITE_URL}/bn/` };
  return [
    { url: `${SITE_URL}/`, lastModified: new Date("2026-09-30"), changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: `${SITE_URL}/bn/`, lastModified: new Date("2026-09-30"), changeFrequency: "monthly", priority: 0.9, alternates: { languages } },
  ];
}
