import { cache } from "react";
import { supabaseSelect } from "@/lib/supabase/rest";
import type {
  AboutContent,
  AdminMedia,
  AdminSocialLink,
  ContactContent,
  HeroContent,
  HeroVisual,
  HomepageCard,
  HomepageContent,
  IconAsset,
  SiteSettings,
} from "@/lib/admin/types";
import type { MediaCategory } from "@/types/project";
import type { LeadFormSettings, MarketingSettings } from "@/types/marketing";

/**
 * [Phase 4 — Read-path migration] Reconstructs About/Contact/Settings/
 * Homepage content from Supabase — the inverse of
 * scripts/migrate-json-to-supabase.mjs. [Phase A.2.1] Hero is no longer
 * excluded — migration 0017 closed the placeholder-category/alt gap that
 * originally kept it JSON-only; see `fetchHeroContentFromSupabase()` below
 * and siteContentRepository.ts's getHeroContent() for the switch itself.
 *
 * KNOWN GAP, reported rather than papered over: `about_content` has a
 * `photo_id` FK but no matching `photo_alt` column, and `site_settings`
 * has `logo_alt` but no `logo_mobile_alt` / `brand_mark_alt` / `favicon_alt`
 * columns (an oversight in the Phase 3B schema, not caught until writing
 * this reverse mapping). Every reconstructed alt here defaults to `""`.
 * For today's actual data this is lossless by coincidence — About's photo
 * alt was already `""` in data/about.json, and settings' logoMobile/
 * brandMark/favicon are all unset — but it is a real structural gap for
 * any future non-empty alt text on those specific fields, flagged here
 * rather than silently reconstructed as correct.
 */

interface MediaAssetRow {
  id: string;
  storage_path: string;
}

/**
 * [Perf — request-level dedup] Every `fetch*FromSupabase()` below needs
 * this same full media_assets lookup map to resolve its own logo/photo/
 * card image ids — measured (temporary query-timing instrumentation) at
 * 4-8 duplicate full-table fetches per single page request before this
 * `cache()` wrap, since each caller independently invoked it. Scoped to
 * one render pass only, same as the `cache()` wraps in
 * siteContentRepository.ts — never stale across requests.
 */
const fetchMediaMap = cache(async (): Promise<Map<string, MediaAssetRow>> => {
  const rows = await supabaseSelect<MediaAssetRow[]>("media_assets", "select=id,storage_path");
  return new Map(rows.map((r) => [r.id, r]));
});

function iconAsset(id: string | null, alt: string | null, mediaMap: Map<string, MediaAssetRow>): IconAsset | undefined {
  if (!id) return undefined;
  const media = mediaMap.get(id);
  if (!media) return undefined;
  return { src: media.storage_path, alt: alt ?? "" };
}

interface SocialLinkRow {
  label: string;
  value: string | null;
  href: string | null;
  icon: string;
  priority: number;
  custom_icon_id: string | null;
  visible: boolean;
  order: number;
}

const PRIORITY_BY_INDEX = ["primary", "secondary", "passive"] as const;

async function fetchSocialLinks(mediaMap: Map<string, MediaAssetRow>): Promise<AdminSocialLink[]> {
  const rows = await supabaseSelect<SocialLinkRow[]>(
    "social_links",
    "select=label,value,href,icon,priority,custom_icon_id,visible,order&owner=eq.settings&order=order.asc",
  );
  return rows.map((r) => ({
    label: r.label,
    value: r.value ?? "",
    href: r.href ?? "",
    icon: r.icon as AdminSocialLink["icon"],
    priority: PRIORITY_BY_INDEX[r.priority] ?? "passive",
    customIcon: r.custom_icon_id ? iconAsset(r.custom_icon_id, null, mediaMap) : undefined,
    visible: r.visible,
  }));
}

interface AboutRow {
  name: string;
  title: string;
  roles: string[];
  bio: string | null;
  design_philosophy: string | null;
  about_facts: string[];
  photo_id: string | null;
  location: string | null;
  experience_summary: string | null;
  skills_design: string[];
  skills_tools: string[];
  resume_url: string | null;
  seo: Record<string, unknown> | null;
}

export async function fetchAboutContentFromSupabase(): Promise<AboutContent> {
  const [rows, mediaMap] = await Promise.all([
    supabaseSelect<AboutRow[]>("about_content", "select=*&limit=1"),
    fetchMediaMap(),
  ]);
  const row = rows[0];
  if (!row) throw new Error("Supabase read: about_content has no row.");
  const photoMedia = row.photo_id ? mediaMap.get(row.photo_id) : undefined;
  return {
    name: row.name,
    title: row.title,
    roles: row.roles,
    bio: row.bio ?? "",
    designPhilosophy: row.design_philosophy ?? "",
    aboutFacts: row.about_facts,
    photo: photoMedia ? { kind: "image", src: photoMedia.storage_path, alt: "" } : undefined,
    location: row.location ?? undefined,
    experienceSummary: row.experience_summary ?? undefined,
    skillsDesign: row.skills_design,
    skillsTools: row.skills_tools,
    resumeUrl: row.resume_url ?? undefined,
    seo: (row.seo as AboutContent["seo"]) ?? undefined,
  };
}

interface ContactRow {
  heading: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  project_types: string[];
  response_time_line: string | null;
  success_message: string | null;
  seo: Record<string, unknown> | null;
}

export async function fetchContactContentFromSupabase(): Promise<ContactContent> {
  const mediaMap = await fetchMediaMap();
  const [rows, socialLinks] = await Promise.all([
    supabaseSelect<ContactRow[]>("contact_content", "select=*&limit=1"),
    fetchSocialLinks(mediaMap),
  ]);
  const row = rows[0];
  if (!row) throw new Error("Supabase read: contact_content has no row.");
  return {
    heading: row.heading,
    description: row.description ?? "",
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    location: row.location ?? undefined,
    // Same single-source-of-truth consolidation as the JSON path's
    // getContactContent(): socialLinks always comes from settings, never
    // a second independently-stored copy.
    socialLinks,
    projectTypes: row.project_types,
    responseTimeLine: row.response_time_line ?? undefined,
    successMessage: row.success_message ?? undefined,
    seo: (row.seo as ContactContent["seo"]) ?? undefined,
  };
}

interface SettingsRow {
  site_title: string;
  site_description: string | null;
  positioning: string | null;
  differentiator: string | null;
  brand_name: string;
  footer_brand_name: string | null;
  site_url: string | null;
  logo_id: string | null;
  logo_alt: string | null;
  logo_mobile_id: string | null;
  favicon_id: string | null;
  brand_mark_id: string | null;
  admin_logo_id: string | null;
  admin_logo_alt: string | null;
  logo_display_mode: string | null;
  nav_labels: { label: string; href: string }[] | null;
  footer_text: string | null;
  seo_defaults: Record<string, unknown> | null;
}

export async function fetchSiteSettingsFromSupabase(): Promise<SiteSettings> {
  const [rows, mediaMap] = await Promise.all([
    supabaseSelect<SettingsRow[]>("site_settings", "select=*&limit=1"),
    fetchMediaMap(),
  ]);
  const row = rows[0];
  if (!row) throw new Error("Supabase read: site_settings has no row.");
  const socialLinks = await fetchSocialLinks(mediaMap);
  return {
    siteTitle: row.site_title,
    siteDescription: row.site_description ?? "",
    positioning: row.positioning ?? "",
    differentiator: row.differentiator ?? "",
    navLabels: row.nav_labels ?? [],
    footerText: row.footer_text ?? "",
    socialLinks,
    seoDefaults: (row.seo_defaults as SiteSettings["seoDefaults"]) ?? {},
    brandName: row.brand_name || undefined,
    logo: iconAsset(row.logo_id, row.logo_alt, mediaMap),
    logoMobile: iconAsset(row.logo_mobile_id, null, mediaMap),
    brandMark: iconAsset(row.brand_mark_id, null, mediaMap),
    favicon: iconAsset(row.favicon_id, null, mediaMap),
    adminLogo: iconAsset(row.admin_logo_id, row.admin_logo_alt, mediaMap),
    logoDisplayMode: (row.logo_display_mode as SiteSettings["logoDisplayMode"]) ?? "name-only",
    siteUrl: row.site_url ?? undefined,
    footerBrandName: row.footer_brand_name ?? undefined,
  };
}

interface HomepageCardRow {
  id: string;
  kind: "service" | "process";
  title: string;
  description: string;
  icon_id: string | null;
  icon_size: string | null;
  icon_position: string | null;
  url: string | null;
  order: number;
  visible: boolean;
  animation: unknown;
}

export async function fetchHomepageContentFromSupabase(): Promise<HomepageContent> {
  const [rows, mediaMap] = await Promise.all([
    supabaseSelect<HomepageCardRow[]>("homepage_cards", "select=*&order=order.asc"),
    fetchMediaMap(),
  ]);
  const toCard = (r: HomepageCardRow): HomepageCard => ({
    id: r.id,
    title: r.title,
    description: r.description,
    icon: iconAsset(r.icon_id, null, mediaMap),
    iconSize: (r.icon_size as HomepageCard["iconSize"]) ?? undefined,
    iconPosition: (r.icon_position as HomepageCard["iconPosition"]) ?? undefined,
    url: r.url ?? undefined,
    order: r.order,
    visible: r.visible,
    // Postgres JSONB NULL round-trips as JS `null`, not `undefined` — and
    // Animated.tsx's `config = DEFAULT_ANIMATION` default parameter only
    // triggers on `undefined` (JS semantics), so passing `null` through
    // crashed every animated component reading this field. `?? undefined`
    // normalizes "column unset" to the same "field absent" shape the JSON
    // backend has always produced.
    animation: (r.animation as HomepageCard["animation"]) ?? undefined,
  });
  return {
    services: rows.filter((r) => r.kind === "service").map(toCard),
    process: rows.filter((r) => r.kind === "process").map(toCard),
  };
}

interface HeroContentRow {
  id: string;
  eyebrow: string | null;
  headline: string;
  description: string;
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  primary_cta_visible: boolean;
  primary_cta_new_tab: boolean;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  secondary_cta_visible: boolean;
  secondary_cta_new_tab: boolean;
  seo: unknown;
}

interface HeroVisualRow {
  id: string;
  image_id: string | null;
  placeholder_category: string | null;
  image_alt: string | null;
  title: string | null;
  description: string | null;
  href: string | null;
  order: number;
  visible: boolean;
  animation: unknown;
}

/** Same fallback-to-a-fixed-category shape as mapProject.ts's toCoverMedia() — but migration 0017 means this only ever hits the true "genuinely never configured" case, not "lost real data," since every existing row's real category was backfilled into `placeholder_category`. */
function toHeroVisualMedia(row: HeroVisualRow, mediaMap: Map<string, MediaAssetRow>): AdminMedia {
  const media = row.image_id ? mediaMap.get(row.image_id) : undefined;
  if (!media) {
    return {
      kind: "placeholder",
      category: (row.placeholder_category as MediaCategory) ?? "brand-mark",
      alt: row.image_alt ?? "",
    };
  }
  return { kind: "image", src: media.storage_path, alt: row.image_alt ?? "" };
}

/** [Phase A.2.1] `hero_content` is a singleton row (one per site, like about_content/site_settings); `hero_visuals` is its child list, ordered by `order`. */
export async function fetchHeroContentFromSupabase(): Promise<HeroContent> {
  const [heroRows, mediaMap] = await Promise.all([
    supabaseSelect<HeroContentRow[]>("hero_content", "select=*&limit=1"),
    fetchMediaMap(),
  ]);
  const hero = heroRows[0];
  if (!hero) {
    throw new Error("Supabase read: hero_content has no row — Phase A.2.1 migration may not have run.");
  }

  const visualRows = await supabaseSelect<HeroVisualRow[]>("hero_visuals", `select=*&hero_id=eq.${hero.id}&order=order.asc`);
  const visuals: HeroVisual[] = visualRows.map((r) => ({
    id: r.id,
    image: toHeroVisualMedia(r, mediaMap),
    title: r.title ?? "",
    description: r.description ?? undefined,
    href: r.href ?? undefined,
    order: r.order,
    visible: r.visible,
    animation: (r.animation as HeroVisual["animation"]) ?? undefined,
  }));

  return {
    eyebrow: hero.eyebrow ?? undefined,
    headline: hero.headline,
    description: hero.description,
    primaryCtaLabel: hero.primary_cta_label ?? "",
    primaryCtaUrl: hero.primary_cta_url ?? "",
    primaryCtaVisible: hero.primary_cta_visible,
    primaryCtaOpenInNewTab: hero.primary_cta_new_tab,
    secondaryCtaLabel: hero.secondary_cta_label ?? "",
    secondaryCtaUrl: hero.secondary_cta_url ?? "",
    secondaryCtaVisible: hero.secondary_cta_visible,
    secondaryCtaOpenInNewTab: hero.secondary_cta_new_tab,
    visuals,
    seo: (hero.seo as HeroContent["seo"]) ?? undefined,
  };
}

interface MarketingSettingsRow {
  id: string;
  ga4_measurement_id: string;
  ga4_enabled: boolean;
  gtm_container_id: string;
  gtm_enabled: boolean;
  google_ads_conversion_id: string;
  google_ads_enabled: boolean;
  conversions: unknown;
  remarketing_enabled: boolean;
  consent_required: boolean;
}

/** [Phase A.2.2] `marketing_settings`/`lead_form_settings` are both singleton rows, same "exactly one row" convention as hero_content/site_settings/about_content/contact_content. */
export async function fetchMarketingSettingsFromSupabase(): Promise<MarketingSettings> {
  const rows = await supabaseSelect<MarketingSettingsRow[]>("marketing_settings", "select=*&limit=1");
  const row = rows[0];
  if (!row) throw new Error("Supabase read: marketing_settings has no row — Phase A.2.2 migration may not have run.");
  return {
    ga4: { measurementId: row.ga4_measurement_id, enabled: row.ga4_enabled },
    gtm: { containerId: row.gtm_container_id, enabled: row.gtm_enabled },
    googleAds: { conversionId: row.google_ads_conversion_id, enabled: row.google_ads_enabled },
    conversions: (row.conversions as MarketingSettings["conversions"]) ?? [],
    remarketing: { enabled: row.remarketing_enabled },
    consent: { required: row.consent_required },
  };
}

interface LeadFormSettingsRow {
  id: string;
  fields: unknown;
}

export async function fetchLeadFormSettingsFromSupabase(): Promise<LeadFormSettings> {
  const rows = await supabaseSelect<LeadFormSettingsRow[]>("lead_form_settings", "select=*&limit=1");
  const row = rows[0];
  if (!row) throw new Error("Supabase read: lead_form_settings has no row — Phase A.2.2 migration may not have run.");
  return { fields: (row.fields as LeadFormSettings["fields"]) ?? [] };
}
