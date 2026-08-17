import type {
  AboutContent,
  AdminProject,
  ContactContent,
  HeroContent,
  HomepageContent,
  SiteSettings,
} from "./types";
import type { LeadFormSettings, MarketingSettings } from "@/types/marketing";
import type { FollowUpStatus, Lead, LeadPriority, LeadStatus } from "@/types/leads";

/**
 * [CMS Phase D2] Admin data-access layer — now a thin, browser-side async
 * client over the real, server-persisted store, replacing D1's
 * localStorage overlay. Every exported function keeps the same name it
 * had in D1 (`listProjects`, `getProject`, `saveProject`, …) — call sites
 * in the admin UI didn't need to be renamed, only updated to `await`
 * them, since a `fetch()` call is unavoidably asynchronous where a
 * `localStorage` read/write wasn't.
 *
 * Architecture: Admin UI (browser) -> fetch -> `/api/admin/**` Route
 * Handlers (server) -> `src/lib/cms/*Repository.ts` (server) ->
 * `data/*.json` (filesystem). This module never touches the filesystem
 * itself — it can't, it runs in the browser — it only ever calls the API
 * routes. The public site does NOT go through this module or these API
 * routes at all; it reads the repository directly, server-side, via
 * `src/content/projects.ts` (see that file's header comment). That's the
 * real "admin write / public read" separation this phase's brief asked
 * for: two different call paths into the same underlying store, not one
 * shared client-side cache.
 *
 * `discardXEdits()` functions are kept, now as deliberate no-ops: D1's
 * "discard" meant "delete the localStorage overlay entry, revert to the
 * shipped file." Now that Save writes straight to the real store, there
 * is no separate overlay to delete — "discard" just means "throw away
 * whatever's currently typed into the form and re-fetch the last-saved
 * version," which every call site already does immediately afterward via
 * `getProject()`/`getAbout()`/etc. Kept as real (if trivial) functions
 * rather than deleted, so no call site needed to change shape.
 */

/**
 * [Project creation fix] On failure, reads the response body for a real
 * `{ error: string }` message (e.g. the slug-collision message
 * `projectsRepository.ts`'s `saveProjectRecord` now throws) before falling
 * back to the generic status-code message — previously this discarded the
 * body entirely on every failure, so a specific, actionable server error
 * never reached the admin UI's `SaveStatusMessage`. No existing call site
 * is affected: none of them returned a JSON error body on failure before
 * this change, so the fallback path is unchanged for all of them.
 */
async function parseJsonResponse<T>(response: Response, errorContext: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || `${errorContext} failed: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function listProjects(): Promise<AdminProject[]> {
  const res = await fetch("/api/admin/projects", { cache: "no-store" });
  const data = await parseJsonResponse<{ projects: AdminProject[] }>(res, "Listing projects");
  return data.projects;
}

export async function getProject(id: string): Promise<AdminProject | undefined> {
  const res = await fetch(`/api/admin/projects/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  const data = await parseJsonResponse<{ project: AdminProject }>(res, "Loading project");
  return data.project;
}

export async function saveProject(project: AdminProject): Promise<AdminProject> {
  const res = await fetch(`/api/admin/projects/${encodeURIComponent(project.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  const data = await parseJsonResponse<{ project: AdminProject }>(res, "Saving project");
  return data.project;
}

/** No-op — see this file's header comment for why. Kept so existing call sites (discard, then re-fetch) don't need to change shape. `id` isn't used by the no-op itself; kept in the signature so call sites didn't need to change shape. */
export async function discardProjectEdits(id: string): Promise<void> {
  void id;
}

/**
 * Creates and persists a new, blank draft project. `category` makes
 * category genuinely the first decision at creation time (per
 * `docs/PROJECT_EDITOR_ARCHITECTURE.md` §9) — optional, so any existing
 * caller that only passes a title keeps working unchanged (the API route
 * defaults to "Graphic Design", same as before this parameter existed).
 */
export async function createProject(
  title: string,
  category?: AdminProject["category"],
): Promise<AdminProject> {
  const res = await fetch("/api/admin/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, category }),
  });
  const data = await parseJsonResponse<{ project: AdminProject }>(res, "Creating project");
  return data.project;
}

/**
 * [CMS Phase D2] Real, complete deletion — see
 * src/lib/cms/projectsRepository.ts's `deleteProjectRecord` doc comment.
 * D1's tombstone concept is gone: `data/projects.json` is the live source
 * now, so removing a row from it is a genuine delete, not a filtered view.
 */
export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/admin/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
  await parseJsonResponse<{ ok: true }>(res, "Deleting project");
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

export async function getAbout(): Promise<AboutContent> {
  const res = await fetch("/api/admin/about", { cache: "no-store" });
  const data = await parseJsonResponse<{ about: AboutContent }>(res, "Loading About content");
  return data.about;
}

export async function saveAbout(content: AboutContent): Promise<AboutContent> {
  const res = await fetch("/api/admin/about", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  const data = await parseJsonResponse<{ about: AboutContent }>(res, "Saving About content");
  return data.about;
}

/** No-op — see this file's header comment for why. */
export async function discardAboutEdits(): Promise<void> {
  return;
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export async function getContact(): Promise<ContactContent> {
  const res = await fetch("/api/admin/contact", { cache: "no-store" });
  const data = await parseJsonResponse<{ contact: ContactContent }>(res, "Loading Contact content");
  return data.contact;
}

export async function saveContact(content: ContactContent): Promise<ContactContent> {
  const res = await fetch("/api/admin/contact", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  const data = await parseJsonResponse<{ contact: ContactContent }>(res, "Saving Contact content");
  return data.contact;
}

/** No-op — see this file's header comment for why. */
export async function discardContactEdits(): Promise<void> {
  return;
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<SiteSettings> {
  const res = await fetch("/api/admin/settings", { cache: "no-store" });
  const data = await parseJsonResponse<{ settings: SiteSettings }>(res, "Loading site settings");
  return data.settings;
}

export async function saveSettings(settings: SiteSettings): Promise<SiteSettings> {
  const res = await fetch("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  const data = await parseJsonResponse<{ settings: SiteSettings }>(res, "Saving site settings");
  return data.settings;
}

/** No-op — see this file's header comment for why. */
export async function discardSettingsEdits(): Promise<void> {
  return;
}

// ---------------------------------------------------------------------------
// Homepage Hero
// ---------------------------------------------------------------------------

export async function getHero(): Promise<HeroContent> {
  const res = await fetch("/api/admin/hero", { cache: "no-store" });
  const data = await parseJsonResponse<{ hero: HeroContent }>(res, "Loading Homepage Hero content");
  return data.hero;
}

export async function saveHero(content: HeroContent): Promise<HeroContent> {
  const res = await fetch("/api/admin/hero", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  const data = await parseJsonResponse<{ hero: HeroContent }>(res, "Saving Homepage Hero content");
  return data.hero;
}

/** No-op — see this file's header comment for why. */
export async function discardHeroEdits(): Promise<void> {
  return;
}

// ---------------------------------------------------------------------------
// Homepage content (Services / Design Process)
// ---------------------------------------------------------------------------

export async function getHomepageContent(): Promise<HomepageContent> {
  const res = await fetch("/api/admin/homepage", { cache: "no-store" });
  const data = await parseJsonResponse<{ homepage: HomepageContent }>(res, "Loading Homepage content");
  return data.homepage;
}

export async function saveHomepageContent(content: HomepageContent): Promise<HomepageContent> {
  const res = await fetch("/api/admin/homepage", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(content),
  });
  const data = await parseJsonResponse<{ homepage: HomepageContent }>(res, "Saving Homepage content");
  return data.homepage;
}

/** No-op — see this file's header comment for why. */
export async function discardHomepageContentEdits(): Promise<void> {
  return;
}

// ---------------------------------------------------------------------------
// Marketing / Analytics settings
// ---------------------------------------------------------------------------

export async function getMarketingSettings(): Promise<MarketingSettings> {
  const res = await fetch("/api/admin/marketing", { cache: "no-store" });
  const data = await parseJsonResponse<{ marketing: MarketingSettings }>(res, "Loading Marketing settings");
  return data.marketing;
}

export async function saveMarketingSettings(settings: MarketingSettings): Promise<MarketingSettings> {
  const res = await fetch("/api/admin/marketing", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  const data = await parseJsonResponse<{ marketing: MarketingSettings }>(res, "Saving Marketing settings");
  return data.marketing;
}

export async function getLeadFormSettings(): Promise<LeadFormSettings> {
  const res = await fetch("/api/admin/leadform", { cache: "no-store" });
  const data = await parseJsonResponse<{ leadForm: LeadFormSettings }>(res, "Loading Lead Form settings");
  return data.leadForm;
}

export async function saveLeadFormSettings(settings: LeadFormSettings): Promise<LeadFormSettings> {
  const res = await fetch("/api/admin/leadform", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  const data = await parseJsonResponse<{ leadForm: LeadFormSettings }>(res, "Saving Lead Form settings");
  return data.leadForm;
}

// ---------------------------------------------------------------------------
// Leads / CRM
// ---------------------------------------------------------------------------

export async function listLeads(): Promise<Lead[]> {
  const res = await fetch("/api/admin/leads", { cache: "no-store" });
  const data = await parseJsonResponse<{ leads: Lead[] }>(res, "Loading leads");
  return data.leads;
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  const data = await parseJsonResponse<{ lead: Lead }>(res, "Loading lead");
  return data.lead;
}

export async function updateLead(
  id: string,
  patch: {
    status?: LeadStatus;
    priority?: LeadPriority;
    followUpDate?: string;
    followUpStatus?: FollowUpStatus;
    nextAction?: string;
    tags?: string[];
    note?: string;
    meetingNote?: string;
    markContacted?: boolean;
  },
): Promise<Lead> {
  const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await parseJsonResponse<{ lead: Lead }>(res, "Updating lead");
  return data.lead;
}

export async function deleteLead(id: string): Promise<void> {
  const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, { method: "DELETE" });
  await parseJsonResponse<{ ok: true }>(res, "Deleting lead");
}

// ---------------------------------------------------------------------------
// Notification channel status (Phase 5/9 — read-only, env-var-derived)
// ---------------------------------------------------------------------------

export async function getNotificationChannelStatus(): Promise<{ name: string; configured: boolean }[]> {
  const res = await fetch("/api/admin/notifications", { cache: "no-store" });
  const data = await parseJsonResponse<{ channels: { name: string; configured: boolean }[] }>(
    res,
    "Loading notification channel status",
  );
  return data.channels;
}

// ---------------------------------------------------------------------------
// ThanksSignals moderation (Phase 6D)
// ---------------------------------------------------------------------------

export interface AdminSignalListItem {
  id: string;
  title: string;
  category: string | null;
  status: string;
  visibility: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  mediaCount: number;
}

export interface AdminSignalMediaItem {
  id: string;
  url: string;
  order: number;
  mimeType: string | null;
  fileSize: number | null;
  filename: string | null;
}

export interface AdminSignalDetail extends AdminSignalListItem {
  description: string;
  context: string | null;
  audience: string | null;
  media: AdminSignalMediaItem[];
}

export type ModerationAction = "review" | "approve" | "reject" | "publish" | "archive";

export interface SignalModerationCounts {
  new: number;
  underReview: number;
  approved: number;
  published: number;
  archived: number;
}

export async function getSignalCounts(): Promise<SignalModerationCounts> {
  const res = await fetch("/api/admin/signals/counts", { cache: "no-store" });
  const data = await parseJsonResponse<{ counts: SignalModerationCounts }>(res, "Loading Signal counts");
  return data.counts;
}

export async function listSignals(filter?: { status?: string; visibility?: string }): Promise<AdminSignalListItem[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.set("status", filter.status);
  if (filter?.visibility) params.set("visibility", filter.visibility);
  const qs = params.toString();
  const res = await fetch(`/api/admin/signals${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  const data = await parseJsonResponse<{ signals: AdminSignalListItem[] }>(res, "Loading ThanksSignals");
  return data.signals;
}

export async function getSignal(id: string): Promise<AdminSignalDetail | undefined> {
  const res = await fetch(`/api/admin/signals/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  const data = await parseJsonResponse<{ signal: AdminSignalDetail }>(res, "Loading ThanksSignal");
  return data.signal;
}

export async function moderateSignal(id: string, action: ModerationAction): Promise<AdminSignalDetail> {
  const res = await fetch(`/api/admin/signals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await parseJsonResponse<{ signal: AdminSignalDetail }>(res, "Moderating ThanksSignal");
  return data.signal;
}

// ---------------------------------------------------------------------------
// Contributions moderation (Phase 6E)
// ---------------------------------------------------------------------------

export interface AdminContributionListItem {
  id: string;
  signalId: string;
  signalTitle: string;
  contributorName: string;
  title: string | null;
  contributionType: string | null;
  status: string;
  designResponseStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContributionDetail extends AdminContributionListItem {
  explanation: string | null;
  designResponse: {
    id: string;
    discipline: string;
    summary: string | null;
    researchFindings: string | null;
    designDecisions: string | null;
    outcome: string | null;
    problemStatement: string | null;
    approach: string | null;
    toolsUsed: string | null;
    prototypeUrl: string | null;
    figmaUrl: string | null;
    caseStudyUrl: string | null;
    externalUrl: string | null;
    status: string;
  } | null;
}

export type ContributionModerationAction = "review" | "approve" | "reject" | "archive" | "publish";

export async function listContributions(filter?: { status?: string; published?: boolean }): Promise<AdminContributionListItem[]> {
  const params = new URLSearchParams();
  if (filter?.status) params.set("status", filter.status);
  if (filter?.published) params.set("published", "true");
  const qs = params.toString();
  const res = await fetch(`/api/admin/contributions${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  const data = await parseJsonResponse<{ contributions: AdminContributionListItem[] }>(res, "Loading Contributions");
  return data.contributions;
}

export async function getContribution(id: string): Promise<AdminContributionDetail | undefined> {
  const res = await fetch(`/api/admin/contributions/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  const data = await parseJsonResponse<{ contribution: AdminContributionDetail }>(res, "Loading Contribution");
  return data.contribution;
}

export async function moderateContribution(id: string, action: ContributionModerationAction): Promise<AdminContributionDetail> {
  const res = await fetch(`/api/admin/contributions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await parseJsonResponse<{ contribution: AdminContributionDetail }>(res, "Moderating Contribution");
  return data.contribution;
}

// ---------------------------------------------------------------------------
// Client Reviews (Phase 6G Part B)
// ---------------------------------------------------------------------------

export interface AdminClientReview {
  id: string;
  clientName: string;
  clientRole: string | null;
  company: string | null;
  reviewText: string;
  avatarMediaId: string | null;
  avatarUrl: string | null;
  avatarAlt: string | null;
  projectId: string | null;
  projectSlug: string | null;
  projectTitle: string | null;
  rating: number | null;
  featured: boolean;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type ReviewAction = "publish" | "unpublish" | "feature" | "unfeature" | "moveUp" | "moveDown";

export interface ReviewContentInput {
  clientName?: string;
  clientRole?: string;
  company?: string;
  reviewText?: string;
  /** A storage URL (MediaField's AdminMedia.src) — the API route resolves this to a real media_assets id via resolveMediaAssetId(), the same pattern project cover/gallery images already use. `null` clears the avatar. */
  avatarSrc?: string | null;
  avatarAlt?: string;
  projectId?: string | null;
  rating?: number | null;
}

export async function listReviews(): Promise<AdminClientReview[]> {
  const res = await fetch("/api/admin/reviews", { cache: "no-store" });
  const data = await parseJsonResponse<{ reviews: AdminClientReview[] }>(res, "Loading Reviews");
  return data.reviews;
}

export async function getReview(id: string): Promise<AdminClientReview | undefined> {
  const res = await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  const data = await parseJsonResponse<{ review: AdminClientReview }>(res, "Loading Review");
  return data.review;
}

export async function createReviewRecord(clientName: string, reviewText: string): Promise<AdminClientReview> {
  const res = await fetch("/api/admin/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientName, reviewText }),
  });
  const data = await parseJsonResponse<{ review: AdminClientReview }>(res, "Creating Review");
  return data.review;
}

export async function saveReviewContent(id: string, input: ReviewContentInput): Promise<AdminClientReview> {
  const res = await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJsonResponse<{ review: AdminClientReview }>(res, "Saving Review");
  return data.review;
}

export async function deleteReviewRecord(id: string): Promise<void> {
  const res = await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: "DELETE" });
  await parseJsonResponse<{ ok: boolean }>(res, "Deleting Review");
}

export async function runReviewAction(id: string, action: ReviewAction): Promise<AdminClientReview> {
  const res = await fetch(`/api/admin/reviews/${encodeURIComponent(id)}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await parseJsonResponse<{ review: AdminClientReview }>(res, "Updating Review");
  return data.review;
}

// ---------------------------------------------------------------------------
// Promotional Banners
// ---------------------------------------------------------------------------

export type BannerVariant = "gradient" | "dark" | "light" | "image";

export interface AdminPromoBanner {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string | null;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  imageMediaId: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageDecorative: boolean;
  variant: BannerVariant;
  badgeLabel: string | null;
  campaignName: string | null;
  startAt: string | null;
  endAt: string | null;
  enabled: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type BannerAction = "enable" | "disable" | "moveUp" | "moveDown";

export interface BannerContentInput {
  title?: string;
  eyebrow?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  /** A storage URL (MediaField's AdminMedia.src) — the API route resolves this to a real media_assets id via resolveMediaAssetId(), the same pattern the Review avatar / project cover images already use. `null` clears the image. */
  imageSrc?: string | null;
  imageAlt?: string;
  imageDecorative?: boolean;
  variant?: BannerVariant;
  badgeLabel?: string;
  campaignName?: string;
  /** ISO datetime string, or `null` to clear. */
  startAt?: string | null;
  endAt?: string | null;
}

export async function listBanners(): Promise<AdminPromoBanner[]> {
  const res = await fetch("/api/admin/banners", { cache: "no-store" });
  const data = await parseJsonResponse<{ banners: AdminPromoBanner[] }>(res, "Loading Banners");
  return data.banners;
}

export async function getBanner(id: string): Promise<AdminPromoBanner | undefined> {
  const res = await fetch(`/api/admin/banners/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (res.status === 404) return undefined;
  const data = await parseJsonResponse<{ banner: AdminPromoBanner }>(res, "Loading Banner");
  return data.banner;
}

export async function createBannerRecord(title: string): Promise<AdminPromoBanner> {
  const res = await fetch("/api/admin/banners", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await parseJsonResponse<{ banner: AdminPromoBanner }>(res, "Creating Banner");
  return data.banner;
}

export async function saveBannerContent(id: string, input: BannerContentInput): Promise<AdminPromoBanner> {
  const res = await fetch(`/api/admin/banners/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJsonResponse<{ banner: AdminPromoBanner }>(res, "Saving Banner");
  return data.banner;
}

export async function deleteBannerRecord(id: string): Promise<void> {
  const res = await fetch(`/api/admin/banners/${encodeURIComponent(id)}`, { method: "DELETE" });
  await parseJsonResponse<{ ok: boolean }>(res, "Deleting Banner");
}

export async function runBannerAction(id: string, action: BannerAction): Promise<AdminPromoBanner> {
  const res = await fetch(`/api/admin/banners/${encodeURIComponent(id)}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await parseJsonResponse<{ banner: AdminPromoBanner }>(res, "Updating Banner");
  return data.banner;
}
