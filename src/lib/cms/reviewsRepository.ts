import { supabaseDelete, supabaseInsert, supabaseSelect, supabaseUpdate } from "@/lib/supabase/rest";
import { deleteMediaAssetIfUnreferenced } from "@/lib/cms/supabase/mediaReferences";

/**
 * [Phase 6G Part B — Client Reviews / Testimonials] Server-only repository
 * for the new `client_reviews` table (migration 0016). Same architectural
 * boundary as every other admin-authored CMS repository in this app
 * (projectsRepository.ts's Supabase path, adminThanksSignalsRepository.ts,
 * adminContributionsRepository.ts): the hand-rolled admin has no Supabase
 * Auth session, so every write here uses the service-role key via
 * src/lib/supabase/rest.ts, gated by `requireAdmin()` + proxy.ts at the API
 * route layer — never RLS's `is_admin()` path. `client_reviews`' own RLS
 * (migration 0016) is the defense-in-depth backstop for a direct anon/
 * authenticated request against Supabase's own REST API, not the
 * enforcement this repository relies on.
 *
 * Reviews are modeled as CMS content, like `projects` — not community
 * user-generated content like `thanks_signals` — so `avatar_media_id`/
 * `project_id` are resolved here via the same service-role reads
 * `mapProject.ts` already uses for `cover_image_id`/`thumbnail_id`, not the
 * RLS-bound session client the community repositories use (which would hit
 * the exact `media_assets` public-RLS gap publicMedia.ts's header comment
 * documents — Reviews sidesteps that gap the same way Projects always has).
 */

interface ReviewRow {
  id: string;
  client_name: string;
  client_role: string | null;
  company: string | null;
  review_text: string;
  avatar_media_id: string | null;
  avatar_alt: string | null;
  project_id: string | null;
  rating: number | null;
  featured: boolean;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ClientReview {
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

export interface ClientReviewInput {
  clientName: string;
  clientRole?: string | null;
  company?: string | null;
  reviewText: string;
  avatarMediaId?: string | null;
  avatarAlt?: string | null;
  projectId?: string | null;
  rating?: number | null;
}

/** Public-facing shape for the homepage section — no id/timestamps/moderation flags a visitor has no use for. */
export interface PublishedReview {
  id: string;
  clientName: string;
  clientRole: string | null;
  company: string | null;
  reviewText: string;
  avatarUrl: string | null;
  avatarAlt: string | null;
  projectSlug: string | null;
  projectTitle: string | null;
  rating: number | null;
  featured: boolean;
}

async function resolveLookups(rows: ReviewRow[]) {
  const mediaIds = [...new Set(rows.map((r) => r.avatar_media_id).filter((v): v is string => Boolean(v)))];
  const projectIds = [...new Set(rows.map((r) => r.project_id).filter((v): v is string => Boolean(v)))];
  const [media, projects] = await Promise.all([
    mediaIds.length
      ? supabaseSelect<{ id: string; storage_path: string }[]>("media_assets", `select=id,storage_path&id=in.(${mediaIds.join(",")})`)
      : Promise.resolve([]),
    projectIds.length
      ? supabaseSelect<{ id: string; slug: string; title: string }[]>("projects", `select=id,slug,title&id=in.(${projectIds.join(",")})`)
      : Promise.resolve([]),
  ]);
  return {
    urlByMediaId: new Map(media.map((m) => [m.id, m.storage_path])),
    projectById: new Map(projects.map((p) => [p.id, p])),
  };
}

function toClientReview(
  row: ReviewRow,
  urlByMediaId: Map<string, string>,
  projectById: Map<string, { id: string; slug: string; title: string }>,
): ClientReview {
  const project = row.project_id ? projectById.get(row.project_id) : undefined;
  return {
    id: row.id,
    clientName: row.client_name,
    clientRole: row.client_role,
    company: row.company,
    reviewText: row.review_text,
    avatarMediaId: row.avatar_media_id,
    avatarUrl: row.avatar_media_id ? (urlByMediaId.get(row.avatar_media_id) ?? null) : null,
    avatarAlt: row.avatar_alt,
    projectId: row.project_id,
    projectSlug: project?.slug ?? null,
    projectTitle: project?.title ?? null,
    rating: row.rating,
    featured: row.featured,
    published: row.published,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function listReviewsForAdmin(): Promise<ClientReview[]> {
  const rows = await supabaseSelect<ReviewRow[]>("client_reviews", "select=*&order=display_order.asc");
  const { urlByMediaId, projectById } = await resolveLookups(rows);
  return rows.map((r) => toClientReview(r, urlByMediaId, projectById));
}

export async function getReviewForAdmin(id: string): Promise<ClientReview | null> {
  const rows = await supabaseSelect<ReviewRow[]>("client_reviews", `select=*&id=eq.${id}`);
  const row = rows[0];
  if (!row) return null;
  const { urlByMediaId, projectById } = await resolveLookups([row]);
  return toClientReview(row, urlByMediaId, projectById);
}

export async function createReview(input: ClientReviewInput): Promise<ClientReview> {
  const existing = await supabaseSelect<{ display_order: number }[]>(
    "client_reviews",
    "select=display_order&order=display_order.desc&limit=1",
  );
  const nextOrder = existing.length > 0 ? existing[0].display_order + 1 : 0;
  const [row] = await supabaseInsert<ReviewRow[]>("client_reviews", {
    client_name: input.clientName,
    client_role: input.clientRole ?? null,
    company: input.company ?? null,
    review_text: input.reviewText,
    avatar_media_id: input.avatarMediaId ?? null,
    avatar_alt: input.avatarAlt ?? null,
    project_id: input.projectId ?? null,
    rating: input.rating ?? null,
    display_order: nextOrder,
  });
  const { urlByMediaId, projectById } = await resolveLookups([row]);
  return toClientReview(row, urlByMediaId, projectById);
}

async function patchReview(id: string, patch: Record<string, unknown>): Promise<ClientReview | null> {
  const rows = await supabaseUpdate<ReviewRow[]>("client_reviews", `id=eq.${id}`, {
    ...patch,
    updated_at: new Date().toISOString(),
  });
  const row = rows[0];
  if (!row) return null;
  const { urlByMediaId, projectById } = await resolveLookups([row]);
  return toClientReview(row, urlByMediaId, projectById);
}

/** Content-only update — client_name/review_text/etc. Never touches published/featured/display_order (see the dedicated setters below), same "content vs. moderation" separation adminContributionsRepository.ts already documents for its own two-row case. */
export async function updateReview(id: string, input: Partial<ClientReviewInput>): Promise<ClientReview | null> {
  const patch: Record<string, unknown> = {};
  if (input.clientName !== undefined) patch.client_name = input.clientName;
  if (input.clientRole !== undefined) patch.client_role = input.clientRole;
  if (input.company !== undefined) patch.company = input.company;
  if (input.reviewText !== undefined) patch.review_text = input.reviewText;
  if (input.avatarMediaId !== undefined) patch.avatar_media_id = input.avatarMediaId;
  if (input.avatarAlt !== undefined) patch.avatar_alt = input.avatarAlt;
  if (input.projectId !== undefined) patch.project_id = input.projectId;
  if (input.rating !== undefined) patch.rating = input.rating;
  return patchReview(id, patch);
}

export async function setReviewPublished(id: string, published: boolean): Promise<ClientReview | null> {
  return patchReview(id, { published });
}

export async function setReviewFeatured(id: string, featured: boolean): Promise<ClientReview | null> {
  return patchReview(id, { featured });
}

/**
 * Swaps `display_order` with the adjacent review in `direction` —
 * same "swap the two neighbors' order values" reorder semantics
 * HomepageCardsEditor.tsx already uses client-side, done here as two real
 * persisted writes since each review is its own database row, not an
 * array in a single JSON blob.
 */
export async function moveReview(id: string, direction: -1 | 1): Promise<void> {
  const all = await listReviewsForAdmin(); // already ordered by display_order asc
  const index = all.findIndex((r) => r.id === id);
  const targetIndex = index + direction;
  if (index === -1 || targetIndex < 0 || targetIndex >= all.length) return;
  const a = all[index];
  const b = all[targetIndex];
  const now = new Date().toISOString();
  await Promise.all([
    supabaseUpdate("client_reviews", `id=eq.${a.id}`, { display_order: b.displayOrder, updated_at: now }),
    supabaseUpdate("client_reviews", `id=eq.${b.id}`, { display_order: a.displayOrder, updated_at: now }),
  ]);
}

/**
 * [Phase 6H Part 7] Deletes the review row; if it had an avatar, that
 * `media_assets` row/Storage object is only deleted once the review row
 * itself is gone AND `mediaReferences.ts` finds nothing else pointing at
 * it (another review reusing the same uploaded photo, a project cover
 * image that happens to share the same asset, etc.) — a shared avatar is
 * preserved, an orphaned one is actually reclaimed. This replaces 6G's
 * original "never touch media_assets from here" placeholder now that the
 * real reference check exists.
 */
export async function deleteReview(id: string): Promise<void> {
  const rows = await supabaseSelect<{ avatar_media_id: string | null }[]>("client_reviews", `select=avatar_media_id&id=eq.${id}`);
  const avatarMediaId = rows[0]?.avatar_media_id ?? null;

  await supabaseDelete("client_reviews", `id=eq.${id}`);

  if (avatarMediaId) {
    await deleteMediaAssetIfUnreferenced(avatarMediaId).catch(() => {
      // Best-effort — the review row itself is already gone regardless of
      // whether the shared/orphaned avatar could also be reclaimed.
    });
  }
}

// ---------------------------------------------------------------------------
// Public (Homepage)
// ---------------------------------------------------------------------------

/**
 * [§13 — homepage behavior] Published reviews only. Featured reviews sort
 * first (each group internally by display_order) — "prefer featured" as a
 * real sort key rather than a separate query, so a `limit`-ed homepage
 * section favors featured reviews without ever excluding non-featured ones
 * outright when there aren't enough featured rows to fill it.
 */
export async function listPublishedReviews(limit?: number): Promise<PublishedReview[]> {
  const rows = await supabaseSelect<ReviewRow[]>("client_reviews", "select=*&published=eq.true&order=display_order.asc");
  const { urlByMediaId, projectById } = await resolveLookups(rows);
  const sorted = rows
    .map((r) => toClientReview(r, urlByMediaId, projectById))
    .sort((a, b) => (a.featured === b.featured ? a.displayOrder - b.displayOrder : a.featured ? -1 : 1));
  const sliced = typeof limit === "number" ? sorted.slice(0, limit) : sorted;
  return sliced.map((r) => ({
    id: r.id,
    clientName: r.clientName,
    clientRole: r.clientRole,
    company: r.company,
    reviewText: r.reviewText,
    avatarUrl: r.avatarUrl,
    avatarAlt: r.avatarAlt,
    projectSlug: r.projectSlug,
    projectTitle: r.projectTitle,
    rating: r.rating,
    featured: r.featured,
  }));
}
