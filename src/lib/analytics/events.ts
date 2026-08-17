/**
 * [Phase L — GA4 Event Architecture] The fixed, canonical event vocabulary
 * every tracking call in this codebase uses — `trackEvent()` (`track.ts`)
 * only accepts one of these, so there's no way for a scattered call site
 * to invent an ad-hoc event name that drifts from what's documented here
 * (or from what `/admin/marketing`'s Conversion Tracking mapping can
 * actually reference — see `ConversionMapping.triggerEvent`).
 */
export const ANALYTICS_EVENTS = [
  "page_view",
  "view_project",
  "view_case_study",
  "click_cta",
  "click_contact",
  "click_email",
  "click_phone",
  "click_whatsapp",
  "click_social",
  "click_external_link",
  "click_figma",
  "lead_form_start",
  "lead_form_submit",
  "lead_form_success",
  "lead_form_error",
  "download",
  "project_inquiry",
  "custom_event",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/**
 * [Privacy — never send PII to GA4] Any parameter whose key matches one
 * of these (case-insensitive) is stripped by `trackEvent()` before the
 * event is ever pushed to `dataLayer` — a structural guard, not just a
 * documented convention every call site has to remember on its own.
 */
export const PII_PARAM_KEYS = [
  "email",
  "phone",
  "phonenumber",
  "message",
  "name",
  "company",
  "address",
  "fullname",
];

/** Loosely-typed per-event params — every field optional, since not every event needs every param and this file's job is documenting shape, not enforcing a rigid schema per event. */
export interface AnalyticsEventParams {
  project_id?: string;
  project_slug?: string;
  project_category?: string;
  project_year?: number;
  cta_name?: string;
  cta_location?: string;
  destination?: string;
  form_name?: string;
  lead_source?: string;
  page?: string;
  platform?: string;
  file_name?: string;
  [key: string]: string | number | boolean | undefined;
}
