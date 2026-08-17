import { cache } from "react";
import { readJsonFile, writeJsonFile } from "./fileStore";
import { isSupabaseBackendEnabled } from "./dataBackend";
import {
  fetchAboutContentFromSupabase,
  fetchContactContentFromSupabase,
  fetchHeroContentFromSupabase,
  fetchHomepageContentFromSupabase,
  fetchLeadFormSettingsFromSupabase,
  fetchMarketingSettingsFromSupabase,
  fetchSiteSettingsFromSupabase,
} from "./supabase/mapSiteContent";
import {
  saveAboutContentToSupabase,
  saveContactContentToSupabase,
  saveHeroContentToSupabase,
  saveHomepageContentToSupabase,
  saveLeadFormSettingsToSupabase,
  saveMarketingSettingsToSupabase,
  saveSiteSettingsToSupabase,
} from "./supabase/writeSiteContent";
import { personal, socialLinks } from "@/content/personal";
import {
  aboutFacts,
  designPhilosophy,
  differentiator,
  experienceSummary,
  footerCopyright,
  nav,
  positioning,
  process as designProcessSteps,
  projectTypes,
  responseTimeLine,
  services as homepageServices,
  skills,
} from "@/content/site";
import type {
  AboutContent,
  ContactContent,
  HeroContent,
  HeroVisual,
  HomepageCard,
  HomepageContent,
  SiteSettings,
} from "@/lib/admin/types";
import type { LeadFormFieldConfig, LeadFormSettings, MarketingSettings } from "@/types/marketing";

/**
 * [CMS Phase D2] Server-only repository for About/Contact/Settings — the
 * real persistence layer replacing D1's localStorage overlay, mirroring
 * projectsRepository.ts's pattern exactly. `personal.ts`/`site.ts` are
 * read once, only to seed `data/about.json`/`contact.json`/`settings.json`
 * the first time each is used; they're never written back to. Once
 * seeded, the JSON files are the live source for both the admin editors
 * and (for the fields that have public-facing consumers — see
 * src/components/site/SiteNav.tsx and friends) the public site.
 */

const ABOUT_FILE = "about.json";
const CONTACT_FILE = "contact.json";
const SETTINGS_FILE = "settings.json";
const MARKETING_FILE = "marketing.json";
const LEAD_FORM_FILE = "leadform.json";
const HERO_FILE = "hero.json";
const HOMEPAGE_FILE = "homepage.json";

function seedAbout(): AboutContent {
  return {
    name: personal.name,
    title: personal.title,
    roles: [...personal.roles],
    bio: personal.bio,
    designPhilosophy,
    aboutFacts: [...aboutFacts],
    location: personal.location,
    experienceSummary: experienceSummary ?? undefined,
    skillsDesign: [...skills.design],
    skillsTools: [...skills.tools],
  };
}

function seedContact(): ContactContent {
  return {
    heading: "Contact",
    description:
      "Direct channels first — the form is here too, but it's not the fastest way to reach me.",
    socialLinks: socialLinks.map((s) => ({ ...s })),
    projectTypes: [...projectTypes],
    responseTimeLine,
    successMessage: "Thanks — that opens your email client with the message pre-filled.",
  };
}

function seedSettings(): SiteSettings {
  return {
    siteTitle: `${personal.name} — Portfolio`,
    siteDescription: positioning,
    positioning,
    differentiator,
    navLabels: nav.map((n) => ({ label: n.label, href: n.href })),
    footerText: footerCopyright,
    socialLinks: socialLinks.map((s) => ({ ...s })),
    seoDefaults: {
      metaTitle: `${personal.name} — Portfolio`,
      metaDescription: positioning,
    },
    // [Site Identity] "name-only" reproduces exactly what the nav/footer
    // already render today (a plain text wordmark, no logo image) — this
    // field is purely additive until an admin picks a different mode.
    logoDisplayMode: "name-only",
  };
}

/**
 * [CMS architecture correction] Seeds `data/hero.json` the first time it's
 * read — same one-time bootstrap pattern every other `seed*()` function
 * here already uses. `positioning`/`differentiator` are read here only as
 * *initial values* so the homepage's visible copy doesn't change the
 * moment this file starts existing (it's currently rendering exactly
 * these two strings) — this is not an ongoing runtime dependency;
 * `Hero.tsx` never reads `positioning`/`differentiator` directly, only
 * `getHeroContent()`'s persisted, independently-editable result. The CTA
 * values match `heroCtas`, previously a hardcoded constant in
 * src/content/site.ts (removed — fully superseded by this).
 *
 * [Phase D3.5] `visuals` reproduces exactly what Hero.tsx rendered before
 * this phase — 4 honest, category-labeled placeholders — because no
 * project is currently marked Featured (verified live against
 * data/projects.json before writing this, not assumed). This is a
 * one-time seed, same convention as every field above: once
 * data/hero.json exists, this function is never consulted again for that
 * key, and the admin's Hero Visuals editor is the only thing that changes
 * it from this point on.
 */
function seedHeroVisuals(): HeroVisual[] {
  return [
    {
      id: "visual-1",
      image: { kind: "placeholder", category: "brand-mark", alt: "Featured work — cover image placeholder" },
      title: "Brand Identity",
      order: 0,
      visible: true,
    },
    {
      id: "visual-2",
      image: { kind: "placeholder", category: "ui-screen", alt: "Featured work — cover image placeholder" },
      title: "UI Screen",
      order: 1,
      visible: true,
    },
    {
      id: "visual-3",
      image: {
        kind: "placeholder",
        category: "typography",
        alt: "General Sans and Inter type specimen — cover image placeholder",
      },
      title: "Typography",
      order: 2,
      visible: true,
    },
    {
      id: "visual-4",
      image: { kind: "placeholder", category: "campaign", alt: "Featured work — cover image placeholder" },
      title: "Campaign",
      order: 3,
      visible: true,
    },
  ];
}

function seedHero(): HeroContent {
  return {
    headline: positioning,
    description: differentiator,
    primaryCtaLabel: "View Selected Work",
    primaryCtaUrl: "#featured-work",
    primaryCtaVisible: true,
    secondaryCtaLabel: "Let's Talk",
    secondaryCtaUrl: "#contact",
    secondaryCtaVisible: true,
    visuals: seedHeroVisuals(),
  };
}

/**
 * [Homepage CMS — Services/Design Process] One-time seed for
 * `data/homepage.json`, reproducing `site.ts`'s `services`/`process`
 * constants exactly (title, description, sequential `order`, `visible:
 * true`, no `icon`/`url` — those were never part of the previous
 * hardcoded cards, so leaving them unset here is the honest byte-identical
 * starting point, not an invented default). Once `data/homepage.json`
 * exists, this function is never consulted again — the admin's Services/
 * Design Process editors are the only thing that changes it from then on,
 * same convention as `seedHeroVisuals()` above.
 */
function seedHomepageContent(): HomepageContent {
  const toCards = (items: readonly { title: string; description: string }[]): HomepageCard[] =>
    items.map((item, i) => ({
      id: `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${i}`,
      title: item.title,
      description: item.description,
      order: i,
      visible: true,
    }));

  return {
    services: toCards(homepageServices),
    process: toCards(designProcessSteps),
  };
}

/**
 * [Phase L] Every integration defaults to disabled with an empty id —
 * "no invented credentials" applies to the seed too. An admin enters real
 * values at `/admin/marketing`; nothing here ever ships a placeholder ID.
 */
function seedMarketingSettings(): MarketingSettings {
  return {
    ga4: { measurementId: "", enabled: false },
    gtm: { containerId: "", enabled: false },
    googleAds: { conversionId: "", enabled: false },
    conversions: [],
    remarketing: { enabled: false },
    consent: { required: false },
  };
}

const LEAD_FORM_FIELD_DEFAULTS: LeadFormFieldConfig[] = [
  { key: "name", label: "Name", enabled: true, required: true, order: 0 },
  { key: "email", label: "Email", enabled: true, required: true, order: 1 },
  { key: "phone", label: "Phone", enabled: true, required: false, order: 2 },
  { key: "company", label: "Company", enabled: false, required: false, order: 3 },
  { key: "service", label: "Service", enabled: true, required: false, order: 4 },
  { key: "projectType", label: "Project Type", enabled: false, required: false, order: 5 },
  { key: "budget", label: "Budget", enabled: false, required: false, order: 6 },
  { key: "timeline", label: "Timeline", enabled: false, required: false, order: 7 },
  { key: "preferredContactMethod", label: "Preferred Contact Method", enabled: false, required: false, order: 8 },
  { key: "message", label: "Message", enabled: true, required: true, order: 9 },
];

function seedLeadFormSettings(): LeadFormSettings {
  return { fields: LEAD_FORM_FIELD_DEFAULTS.map((f) => ({ ...f })) };
}

// [Phase 4 — Read-path migration] Each get*Content() below branches on
// isSupabaseBackendEnabled() first — Supabase when DATA_BACKEND=supabase, JSON
// (unchanged) otherwise. Every save*Content() function stays JSON-only,
// untouched, regardless of the flag — see docs/PHASE_4_READ_MIGRATION.md.
/**
 * [Perf — request-level dedup] `cache()`-wrapped: this and every other
 * `get*` read below in this file is called from multiple independent
 * places within a single request (root layout, a route's own
 * `generateMetadata`, and/or several page components) — measured via
 * temporary query-timing instrumentation to run its underlying Supabase
 * fetch 2-5x per request before this change. `cache()` scopes the
 * memoization to a single render pass only (React's per-request cache),
 * so a fresh request — including the very next request after an admin
 * save — always re-fetches; this never introduces stale data across
 * requests, only removes redundant *duplicate* fetches within one.
 */
export const getAboutContent = cache(async (): Promise<AboutContent> => {
  if (isSupabaseBackendEnabled()) return fetchAboutContentFromSupabase();
  const stored = await readJsonFile<Partial<AboutContent>>(ABOUT_FILE, seedAbout);
  // Merge over a fresh seed, not a full replace — see store.ts's D1-era
  // comment (now superseded by this file) for why: a record saved before
  // a field existed shouldn't leave that field `undefined` and crash a
  // component that assumes it's always an array/string.
  return { ...seedAbout(), ...stored };
});

export async function saveAboutContent(content: AboutContent): Promise<AboutContent> {
  if (isSupabaseBackendEnabled()) {
    await saveAboutContentToSupabase(content);
    return content;
  }
  await writeJsonFile(ABOUT_FILE, content);
  return content;
}

/**
 * [Social link duplication fix] `socialLinks` is no longer an
 * independently-authoritative value read from `data/contact.json` —
 * `SiteSettings.socialLinks` (`data/settings.json`) is now the single
 * canonical source, matching `/admin/settings`' own "Social Links"
 * section. Both `/admin/contact` and `/admin/settings` keep editing the
 * exact same shared `SocialLinksEditor` component and the exact same
 * `ContactContent.socialLinks` / `SiteSettings.socialLinks` field names as
 * before — this change is entirely at the repository layer, so no admin
 * page or public component needed to change. Confirmed before this change
 * that both files held identical link data, so consolidating loses
 * nothing already configured.
 */
export const getContactContent = cache(async (): Promise<ContactContent> => {
  if (isSupabaseBackendEnabled()) return fetchContactContentFromSupabase();
  const stored = await readJsonFile<Partial<ContactContent>>(CONTACT_FILE, seedContact);
  const settings = await getSiteSettings();
  return { ...seedContact(), ...stored, socialLinks: settings.socialLinks };
});

export async function saveContactContent(content: ContactContent): Promise<ContactContent> {
  if (isSupabaseBackendEnabled()) {
    // saveContactContentToSupabase already replaces the canonical
    // settings.socialLinks copy itself — see that function's own comment.
    await saveContactContentToSupabase(content);
    return content;
  }
  // Every edit made via /admin/contact's Social / Contact Methods section
  // now writes straight into the canonical Settings record, so a save
  // from either admin surface is immediately visible on the other.
  const settings = await getSiteSettings();
  await saveSiteSettings({ ...settings, socialLinks: content.socialLinks });
  await writeJsonFile(CONTACT_FILE, content);
  return content;
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (isSupabaseBackendEnabled()) return fetchSiteSettingsFromSupabase();
  const stored = await readJsonFile<Partial<SiteSettings>>(SETTINGS_FILE, seedSettings);
  return { ...seedSettings(), ...stored };
});

export async function saveSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
  if (isSupabaseBackendEnabled()) {
    await saveSiteSettingsToSupabase(settings);
    return settings;
  }
  await writeJsonFile(SETTINGS_FILE, settings);
  return settings;
}

// [Phase A.2.1 — persistence migration] Now switched, same isSupabaseBackendEnabled()
// branch as About/Contact/Settings/Homepage above. The original blocker —
// hero_visuals had no column for a placeholder image's `category` or its
// `alt` text — is closed by migration 0017 (`placeholder_category`,
// `image_alt`), and the 4 existing rows were backfilled from data/hero.json
// before this switch, verified to match exactly. `data/hero.json` is left
// on disk, untouched, as the DATA_BACKEND rollback path — same as every
// other domain this flag already covers.
export const getHeroContent = cache(async (): Promise<HeroContent> => {
  if (isSupabaseBackendEnabled()) return fetchHeroContentFromSupabase();
  const stored = await readJsonFile<Partial<HeroContent>>(HERO_FILE, seedHero);
  return { ...seedHero(), ...stored };
});

export async function saveHeroContent(hero: HeroContent): Promise<HeroContent> {
  if (isSupabaseBackendEnabled()) {
    await saveHeroContentToSupabase(hero);
    return hero;
  }
  await writeJsonFile(HERO_FILE, hero);
  return hero;
}

export const getHomepageContent = cache(async (): Promise<HomepageContent> => {
  if (isSupabaseBackendEnabled()) return fetchHomepageContentFromSupabase();
  const stored = await readJsonFile<Partial<HomepageContent>>(HOMEPAGE_FILE, seedHomepageContent);
  return { ...seedHomepageContent(), ...stored };
});

export async function saveHomepageContent(content: HomepageContent): Promise<HomepageContent> {
  if (isSupabaseBackendEnabled()) {
    await saveHomepageContentToSupabase(content);
    return content;
  }
  await writeJsonFile(HOMEPAGE_FILE, content);
  return content;
}

// [Phase A.2.2 — persistence migration] Now switched — migration 0018
// added the `marketing_settings`/`lead_form_settings` tables that never
// existed before ("no Supabase table exists yet" was the original reason
// these stayed JSON-only). Existing data/marketing.json and
// data/leadform.json content was migrated in first, verified to match
// exactly, before this switch. Both files stay on disk, untouched, as the
// DATA_BACKEND rollback path.
export const getMarketingSettings = cache(async (): Promise<MarketingSettings> => {
  if (isSupabaseBackendEnabled()) return fetchMarketingSettingsFromSupabase();
  const stored = await readJsonFile<Partial<MarketingSettings>>(MARKETING_FILE, seedMarketingSettings);
  return { ...seedMarketingSettings(), ...stored };
});

export async function saveMarketingSettings(settings: MarketingSettings): Promise<MarketingSettings> {
  if (isSupabaseBackendEnabled()) {
    await saveMarketingSettingsToSupabase(settings);
    return settings;
  }
  await writeJsonFile(MARKETING_FILE, settings);
  return settings;
}

export async function getLeadFormSettings(): Promise<LeadFormSettings> {
  if (isSupabaseBackendEnabled()) return fetchLeadFormSettingsFromSupabase();
  const stored = await readJsonFile<Partial<LeadFormSettings>>(LEAD_FORM_FILE, seedLeadFormSettings);
  return { ...seedLeadFormSettings(), ...stored };
}

export async function saveLeadFormSettings(settings: LeadFormSettings): Promise<LeadFormSettings> {
  if (isSupabaseBackendEnabled()) {
    await saveLeadFormSettingsToSupabase(settings);
    return settings;
  }
  await writeJsonFile(LEAD_FORM_FILE, settings);
  return settings;
}
