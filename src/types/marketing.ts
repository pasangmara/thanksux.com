/**
 * [Phase L — Analytics, Tracking, Leads & CRM] Marketing/analytics
 * configuration schema. Every integration is admin-configured, never
 * hardcoded — `data/marketing.json` (via `/admin/marketing`) is the one
 * place a real GA4/GTM/Google Ads ID gets entered. Nothing here contains
 * a real ID; every default is empty/disabled, exactly the "no invented
 * credentials, no fake connection" requirement this was built to satisfy.
 */

export interface GA4Settings {
  measurementId: string;
  enabled: boolean;
}

export interface GTMSettings {
  containerId: string;
  enabled: boolean;
}

export interface GoogleAdsSettings {
  conversionId: string;
  enabled: boolean;
}

/**
 * One admin-defined mapping from an internal trigger event (one of the
 * fixed `AnalyticsEventName`s this codebase actually fires — see
 * `src/lib/analytics/events.ts`) to a real Google Ads conversion
 * id/label. `fireConversion()` looks this list up at call time; a
 * trigger with no enabled mapping simply doesn't fire anything — never a
 * fabricated conversion.
 */
export interface ConversionMapping {
  id: string;
  /** Admin-facing name, e.g. "Lead Form Submitted". */
  name: string;
  /** Which internal event triggers this conversion — see AnalyticsEventName. */
  triggerEvent: string;
  conversionId: string;
  conversionLabel: string;
  enabled: boolean;
}

export interface RemarketingSettings {
  enabled: boolean;
}

/**
 * [Privacy] `required: true` gates GTM/GA4 script injection behind an
 * explicit visitor choice (`ConsentBanner`/`useConsent`) — "Necessary"
 * (site function, never gated) is always on; "Analytics" and "Marketing"
 * are independently toggleable by the visitor and only loaded once
 * granted. `required: false` (default) loads them immediately, matching
 * how most of this project's audience/jurisdiction assumptions already
 * work elsewhere in this codebase — an explicit admin decision, not a
 * silent default this file makes unilaterally.
 */
export interface ConsentSettings {
  required: boolean;
}

export interface MarketingSettings {
  ga4: GA4Settings;
  gtm: GTMSettings;
  googleAds: GoogleAdsSettings;
  conversions: ConversionMapping[];
  remarketing: RemarketingSettings;
  consent: ConsentSettings;
}

/** "Configured" (an ID is present and enabled) vs "Not configured" — deliberately never "Connected"; this codebase cannot verify a real Google-side connection, only that admin input exists. */
export type IntegrationStatus = "configured" | "not-configured";

export function ga4Status(settings: GA4Settings): IntegrationStatus {
  return settings.enabled && settings.measurementId.trim() ? "configured" : "not-configured";
}
export function gtmStatus(settings: GTMSettings): IntegrationStatus {
  return settings.enabled && settings.containerId.trim() ? "configured" : "not-configured";
}
export function googleAdsStatus(settings: GoogleAdsSettings): IntegrationStatus {
  return settings.enabled && settings.conversionId.trim() ? "configured" : "not-configured";
}

// ---------------------------------------------------------------------------
// Lead form field configuration
// ---------------------------------------------------------------------------

export type LeadFormFieldKey =
  | "name"
  | "email"
  | "phone"
  | "company"
  | "service"
  | "projectType"
  | "budget"
  | "timeline"
  | "message"
  | "preferredContactMethod";

export interface LeadFormFieldConfig {
  key: LeadFormFieldKey;
  label: string;
  enabled: boolean;
  required: boolean;
  order: number;
}

export interface LeadFormSettings {
  fields: LeadFormFieldConfig[];
}
