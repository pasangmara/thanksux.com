import { supabaseDelete, supabaseInsert, supabaseSelect, supabaseUpsert } from "@/lib/supabase/rest";
import { resolveMediaAssetId } from "./mediaAssets";
import type { AboutContent, ContactContent, HeroContent, HomepageContent, SiteSettings } from "@/lib/admin/types";
import type { LeadFormSettings, MarketingSettings } from "@/types/marketing";

/**
 * [Phase 4B — write path] About/Contact/Settings/Homepage are all
 * singleton-row tables (exactly one row each, created by Phase 3C's
 * migration) — every write here upserts by `id` using that row's real
 * Supabase id, fetched once and cached per process. Social links are a
 * child list, replaced wholesale on every settings save (same
 * delete-then-recreate strategy as project galleries — matches the JSON
 * backend's "the whole record is authoritative" semantics exactly).
 */

let cachedSettingsId: string | null = null;
let cachedContactId: string | null = null;
let cachedAboutId: string | null = null;
let cachedHeroId: string | null = null;
let cachedMarketingId: string | null = null;
let cachedLeadFormId: string | null = null;

async function singletonId(table: string, cache: string | null, setCache: (id: string) => void): Promise<string> {
  if (cache) return cache;
  const rows = await supabaseSelect<{ id: string }[]>(table, "select=id&limit=1");
  if (!rows[0]) throw new Error(`Supabase write: ${table} has no row to update — Phase 3C migration may not have run.`);
  setCache(rows[0].id);
  return rows[0].id;
}

const PRIORITY_BY_INDEX = ["primary", "secondary", "passive"] as const;
function priorityIndex(p: string): number {
  const i = PRIORITY_BY_INDEX.indexOf(p as (typeof PRIORITY_BY_INDEX)[number]);
  return i === -1 ? 2 : i;
}

async function replaceSocialLinks(links: SiteSettings["socialLinks"]): Promise<void> {
  await supabaseDelete("social_links", "owner=eq.settings");
  if (links.length === 0) return;
  const rows = await Promise.all(
    links.map(async (l, i) => ({
      owner: "settings",
      label: l.label,
      value: l.value || null,
      href: l.href || null,
      icon: l.icon,
      priority: priorityIndex(l.priority),
      custom_icon_id: l.customIcon ? await resolveMediaAssetId({ kind: "image", src: l.customIcon.src, alt: l.customIcon.alt }) : null,
      visible: l.visible !== false,
      order: i,
    })),
  );
  await supabaseInsert("social_links", rows);
}

export async function saveSiteSettingsToSupabase(settings: SiteSettings): Promise<void> {
  const id = await singletonId("site_settings", cachedSettingsId, (v) => (cachedSettingsId = v));
  const logoId = settings.logo ? await resolveMediaAssetId({ kind: "image", src: settings.logo.src, alt: settings.logo.alt }) : null;
  const logoMobileId = settings.logoMobile
    ? await resolveMediaAssetId({ kind: "image", src: settings.logoMobile.src, alt: settings.logoMobile.alt })
    : null;
  const faviconId = settings.favicon ? await resolveMediaAssetId({ kind: "image", src: settings.favicon.src, alt: settings.favicon.alt }) : null;
  const brandMarkId = settings.brandMark
    ? await resolveMediaAssetId({ kind: "image", src: settings.brandMark.src, alt: settings.brandMark.alt })
    : null;
  const adminLogoId = settings.adminLogo
    ? await resolveMediaAssetId({ kind: "image", src: settings.adminLogo.src, alt: settings.adminLogo.alt })
    : null;

  await supabaseUpsert(
    "site_settings",
    {
      id,
      site_title: settings.siteTitle,
      site_description: settings.siteDescription || null,
      positioning: settings.positioning || null,
      differentiator: settings.differentiator || null,
      brand_name: settings.brandName ?? "",
      footer_brand_name: settings.footerBrandName || null,
      site_url: settings.siteUrl || null,
      logo_id: logoId,
      logo_alt: settings.logo?.alt ?? null,
      logo_mobile_id: logoMobileId,
      favicon_id: faviconId,
      brand_mark_id: brandMarkId,
      admin_logo_id: adminLogoId,
      admin_logo_alt: settings.adminLogo?.alt ?? null,
      logo_display_mode: settings.logoDisplayMode,
      nav_labels: settings.navLabels,
      footer_text: settings.footerText || null,
      seo_defaults: settings.seoDefaults,
    },
    "id",
  );

  await replaceSocialLinks(settings.socialLinks);
}

export async function saveContactContentToSupabase(content: ContactContent): Promise<void> {
  const id = await singletonId("contact_content", cachedContactId, (v) => (cachedContactId = v));
  await supabaseUpsert(
    "contact_content",
    {
      id,
      heading: content.heading,
      description: content.description || null,
      email: content.email || null,
      phone: content.phone || null,
      location: content.location || null,
      project_types: content.projectTypes,
      response_time_line: content.responseTimeLine || null,
      success_message: content.successMessage || null,
      seo: content.seo ?? null,
    },
    "id",
  );
  // socialLinks is consolidated into settings' own copy — same rule the
  // JSON backend's saveContactContent() already follows: whatever the
  // contact editor saved becomes the new settings.socialLinks, always,
  // unconditionally (no fallback) — matching writeAllProjects-style "the
  // whole record is authoritative" semantics used throughout this phase.
  await replaceSocialLinks(content.socialLinks);
}

export async function saveAboutContentToSupabase(content: AboutContent): Promise<void> {
  const id = await singletonId("about_content", cachedAboutId, (v) => (cachedAboutId = v));
  const photoId = content.photo && content.photo.kind === "image" ? await resolveMediaAssetId(content.photo) : null;
  await supabaseUpsert(
    "about_content",
    {
      id,
      name: content.name,
      title: content.title,
      roles: content.roles,
      bio: content.bio || null,
      design_philosophy: content.designPhilosophy || null,
      about_facts: content.aboutFacts,
      photo_id: photoId,
      location: content.location || null,
      experience_summary: content.experienceSummary || null,
      skills_design: content.skillsDesign,
      skills_tools: content.skillsTools,
      resume_url: content.resumeUrl || null,
      seo: content.seo ?? null,
    },
    "id",
  );
}

export async function saveHomepageContentToSupabase(content: HomepageContent): Promise<void> {
  await supabaseDelete("homepage_cards", "kind=eq.service");
  await supabaseDelete("homepage_cards", "kind=eq.process");

  async function cardRows(kind: "service" | "process", cards: HomepageContent["services"]) {
    return Promise.all(
      cards.map(async (c, i) => ({
        kind,
        title: c.title,
        description: c.description,
        icon_id: c.icon ? await resolveMediaAssetId({ kind: "image", src: c.icon.src, alt: c.icon.alt }) : null,
        icon_size: c.iconSize ?? null,
        icon_position: c.iconPosition ?? null,
        url: c.url ?? null,
        order: c.order ?? i,
        visible: c.visible,
        animation: c.animation ?? null,
      })),
    );
  }

  const rows = [...(await cardRows("service", content.services)), ...(await cardRows("process", content.process))];
  if (rows.length > 0) await supabaseInsert("homepage_cards", rows);
}

/** [Phase A.2.1] `hero_content` is a singleton (upsert by id, same pattern as settings/contact/about); `hero_visuals` is replaced wholesale on every save (same "the whole record is authoritative" semantics `saveHomepageContentToSupabase` already uses for its own child list). `placeholder_category`/`image_alt` (migration 0017) are always written, even for a real `image`, so a later "Clear" back to placeholder never loses the category/alt this visual last had. */
export async function saveHeroContentToSupabase(content: HeroContent): Promise<void> {
  const id = await singletonId("hero_content", cachedHeroId, (v) => (cachedHeroId = v));

  await supabaseUpsert(
    "hero_content",
    {
      id,
      eyebrow: content.eyebrow || null,
      headline: content.headline,
      description: content.description,
      primary_cta_label: content.primaryCtaLabel || null,
      primary_cta_url: content.primaryCtaUrl || null,
      primary_cta_visible: content.primaryCtaVisible,
      primary_cta_new_tab: content.primaryCtaOpenInNewTab ?? false,
      secondary_cta_label: content.secondaryCtaLabel || null,
      secondary_cta_url: content.secondaryCtaUrl || null,
      secondary_cta_visible: content.secondaryCtaVisible,
      secondary_cta_new_tab: content.secondaryCtaOpenInNewTab ?? false,
      seo: content.seo ?? null,
      updated_at: new Date().toISOString(),
    },
    "id",
  );

  await supabaseDelete("hero_visuals", `hero_id=eq.${id}`);
  if (content.visuals.length === 0) return;
  const visualRows = await Promise.all(
    content.visuals.map(async (v, i) => ({
      hero_id: id,
      image_id: v.image.kind === "image" ? await resolveMediaAssetId(v.image) : null,
      placeholder_category: v.image.kind === "placeholder" ? v.image.category : null,
      image_alt: v.image.alt || null,
      title: v.title || null,
      description: v.description || null,
      href: v.href || null,
      order: v.order ?? i,
      visible: v.visible,
      animation: v.animation ?? null,
    })),
  );
  await supabaseInsert("hero_visuals", visualRows);
}

/** [Phase A.2.2] Singleton upsert, same pattern as every other settings-shaped table above. `conversions` stays a jsonb array — never individually queried, so no child table needed (see migration 0018's own header comment). */
export async function saveMarketingSettingsToSupabase(settings: MarketingSettings): Promise<void> {
  const id = await singletonId("marketing_settings", cachedMarketingId, (v) => (cachedMarketingId = v));
  await supabaseUpsert(
    "marketing_settings",
    {
      id,
      ga4_measurement_id: settings.ga4.measurementId,
      ga4_enabled: settings.ga4.enabled,
      gtm_container_id: settings.gtm.containerId,
      gtm_enabled: settings.gtm.enabled,
      google_ads_conversion_id: settings.googleAds.conversionId,
      google_ads_enabled: settings.googleAds.enabled,
      conversions: settings.conversions,
      remarketing_enabled: settings.remarketing.enabled,
      consent_required: settings.consent.required,
      updated_at: new Date().toISOString(),
    },
    "id",
  );
}

export async function saveLeadFormSettingsToSupabase(settings: LeadFormSettings): Promise<void> {
  const id = await singletonId("lead_form_settings", cachedLeadFormId, (v) => (cachedLeadFormId = v));
  await supabaseUpsert("lead_form_settings", { id, fields: settings.fields, updated_at: new Date().toISOString() }, "id");
}
