import { supabaseDelete, supabaseInsert, supabaseSelect, supabaseUpdate } from "@/lib/supabase/rest";
import { deleteMediaAssetIfUnreferenced } from "@/lib/cms/supabase/mediaReferences";

/**
 * [Promotional Banner / Campaign System] Server-only repository for the
 * `promo_banners` table (migration 0024). Same architectural boundary as
 * every other admin-authored CMS repository (reviewsRepository.ts being
 * the closest sibling this was modeled on): the hand-rolled admin has no
 * Supabase Auth session, so every write here uses the service-role key via
 * src/lib/supabase/rest.ts, gated by `requireAdmin()` + proxy.ts at the API
 * route layer — never RLS's `is_admin()` path. `promo_banners`' own RLS
 * (migration 0024) is the defense-in-depth backstop for a direct anon
 * request against Supabase's own REST API, not the enforcement this
 * repository relies on.
 */

export type BannerVariant = "gradient" | "dark" | "light" | "image";

interface BannerRow {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string | null;
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  image_media_id: string | null;
  image_alt: string | null;
  image_decorative: boolean;
  variant: BannerVariant;
  badge_label: string | null;
  campaign_name: string | null;
  start_at: string | null;
  end_at: string | null;
  enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface PromoBanner {
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

export interface PromoBannerInput {
  title?: string;
  eyebrow?: string | null;
  description?: string | null;
  primaryCtaLabel?: string | null;
  primaryCtaUrl?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaUrl?: string | null;
  imageMediaId?: string | null;
  imageAlt?: string | null;
  imageDecorative?: boolean;
  variant?: BannerVariant;
  badgeLabel?: string | null;
  campaignName?: string | null;
  startAt?: string | null;
  endAt?: string | null;
}

/** Public-facing shape for the homepage — no id-adjacent moderation/scheduling internals a visitor has no use for. */
export interface PublishedBanner {
  id: string;
  title: string;
  eyebrow: string | null;
  description: string | null;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageDecorative: boolean;
  variant: BannerVariant;
  badgeLabel: string | null;
}

async function resolveImageUrls(rows: BannerRow[]) {
  const mediaIds = [...new Set(rows.map((r) => r.image_media_id).filter((v): v is string => Boolean(v)))];
  const media = mediaIds.length
    ? await supabaseSelect<{ id: string; storage_path: string }[]>(
        "media_assets",
        `select=id,storage_path&id=in.(${mediaIds.join(",")})`,
      )
    : [];
  return new Map(media.map((m) => [m.id, m.storage_path]));
}

function toPromoBanner(row: BannerRow, urlByMediaId: Map<string, string>): PromoBanner {
  return {
    id: row.id,
    title: row.title,
    eyebrow: row.eyebrow,
    description: row.description,
    primaryCtaLabel: row.primary_cta_label,
    primaryCtaUrl: row.primary_cta_url,
    secondaryCtaLabel: row.secondary_cta_label,
    secondaryCtaUrl: row.secondary_cta_url,
    imageMediaId: row.image_media_id,
    imageUrl: row.image_media_id ? (urlByMediaId.get(row.image_media_id) ?? null) : null,
    imageAlt: row.image_alt,
    imageDecorative: row.image_decorative,
    variant: row.variant,
    badgeLabel: row.badge_label,
    campaignName: row.campaign_name,
    startAt: row.start_at,
    endAt: row.end_at,
    enabled: row.enabled,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function listBannersForAdmin(): Promise<PromoBanner[]> {
  const rows = await supabaseSelect<BannerRow[]>("promo_banners", "select=*&order=display_order.asc");
  const urlByMediaId = await resolveImageUrls(rows);
  return rows.map((r) => toPromoBanner(r, urlByMediaId));
}

export async function getBannerForAdmin(id: string): Promise<PromoBanner | null> {
  const rows = await supabaseSelect<BannerRow[]>("promo_banners", `select=*&id=eq.${id}`);
  const row = rows[0];
  if (!row) return null;
  const urlByMediaId = await resolveImageUrls([row]);
  return toPromoBanner(row, urlByMediaId);
}

export async function createBanner(title: string): Promise<PromoBanner> {
  const existing = await supabaseSelect<{ display_order: number }[]>(
    "promo_banners",
    "select=display_order&order=display_order.desc&limit=1",
  );
  const nextOrder = existing.length > 0 ? existing[0].display_order + 1 : 0;
  const [row] = await supabaseInsert<BannerRow[]>("promo_banners", {
    title,
    display_order: nextOrder,
  });
  return toPromoBanner(row, new Map());
}

async function patchBanner(id: string, patch: Record<string, unknown>): Promise<PromoBanner | null> {
  const rows = await supabaseUpdate<BannerRow[]>("promo_banners", `id=eq.${id}`, {
    ...patch,
    updated_at: new Date().toISOString(),
  });
  const row = rows[0];
  if (!row) return null;
  const urlByMediaId = await resolveImageUrls([row]);
  return toPromoBanner(row, urlByMediaId);
}

/** Content-only update — never touches `enabled`/`display_order` (see the dedicated setters below), same "content vs. moderation" separation reviewsRepository.ts already documents. */
export async function updateBanner(id: string, input: PromoBannerInput): Promise<PromoBanner | null> {
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.eyebrow !== undefined) patch.eyebrow = input.eyebrow;
  if (input.description !== undefined) patch.description = input.description;
  if (input.primaryCtaLabel !== undefined) patch.primary_cta_label = input.primaryCtaLabel;
  if (input.primaryCtaUrl !== undefined) patch.primary_cta_url = input.primaryCtaUrl;
  if (input.secondaryCtaLabel !== undefined) patch.secondary_cta_label = input.secondaryCtaLabel;
  if (input.secondaryCtaUrl !== undefined) patch.secondary_cta_url = input.secondaryCtaUrl;
  if (input.imageMediaId !== undefined) patch.image_media_id = input.imageMediaId;
  if (input.imageAlt !== undefined) patch.image_alt = input.imageAlt;
  if (input.imageDecorative !== undefined) patch.image_decorative = input.imageDecorative;
  if (input.variant !== undefined) patch.variant = input.variant;
  if (input.badgeLabel !== undefined) patch.badge_label = input.badgeLabel;
  if (input.campaignName !== undefined) patch.campaign_name = input.campaignName;
  if (input.startAt !== undefined) patch.start_at = input.startAt;
  if (input.endAt !== undefined) patch.end_at = input.endAt;
  return patchBanner(id, patch);
}

export async function setBannerEnabled(id: string, enabled: boolean): Promise<PromoBanner | null> {
  return patchBanner(id, { enabled });
}

/** Swaps `display_order` with the adjacent banner in `direction` — same swap-the-two-neighbors semantics reviewsRepository.ts's moveReview() already uses. */
export async function moveBanner(id: string, direction: -1 | 1): Promise<void> {
  const all = await listBannersForAdmin(); // already ordered by display_order asc
  const index = all.findIndex((b) => b.id === id);
  const targetIndex = index + direction;
  if (index === -1 || targetIndex < 0 || targetIndex >= all.length) return;
  const a = all[index];
  const b = all[targetIndex];
  const now = new Date().toISOString();
  await Promise.all([
    supabaseUpdate("promo_banners", `id=eq.${a.id}`, { display_order: b.displayOrder, updated_at: now }),
    supabaseUpdate("promo_banners", `id=eq.${b.id}`, { display_order: a.displayOrder, updated_at: now }),
  ]);
}

/** Deletes the banner row; if it had an image, that `media_assets` row/Storage object is only reclaimed once nothing else references it — same shared-vs-orphaned check reviewsRepository.ts's deleteReview() already performs. */
export async function deleteBanner(id: string): Promise<void> {
  const rows = await supabaseSelect<{ image_media_id: string | null }[]>("promo_banners", `select=image_media_id&id=eq.${id}`);
  const imageMediaId = rows[0]?.image_media_id ?? null;

  await supabaseDelete("promo_banners", `id=eq.${id}`);

  if (imageMediaId) {
    await deleteMediaAssetIfUnreferenced(imageMediaId).catch(() => {
      // Best-effort — the banner row itself is already gone regardless of
      // whether the shared/orphaned image could also be reclaimed.
    });
  }
}

// ---------------------------------------------------------------------------
// Public (Homepage)
// ---------------------------------------------------------------------------

/**
 * Enabled, in-schedule banners only, ordered by `display_order`. The
 * homepage renders only the single top-priority banner (see
 * PromoBanner.tsx's call site) — showing several stacked promo banners at
 * once would compete with the Hero and contradict the "don't over-engineer
 * it" instruction; `display_order`/`enabled` together still give the admin
 * real control over which campaign is "live" without deleting the others.
 */
export async function listActiveBanners(limit?: number): Promise<PublishedBanner[]> {
  const nowIso = new Date().toISOString();
  const rows = await supabaseSelect<BannerRow[]>(
    "promo_banners",
    `select=*&enabled=eq.true&or=(start_at.is.null,start_at.lte.${nowIso})&or=(end_at.is.null,end_at.gte.${nowIso})&order=display_order.asc`,
  );
  const urlByMediaId = await resolveImageUrls(rows);
  const sliced = typeof limit === "number" ? rows.slice(0, limit) : rows;
  return sliced.map((r) => {
    const b = toPromoBanner(r, urlByMediaId);
    return {
      id: b.id,
      title: b.title,
      eyebrow: b.eyebrow,
      description: b.description,
      primaryCtaLabel: b.primaryCtaLabel,
      primaryCtaUrl: b.primaryCtaUrl,
      secondaryCtaLabel: b.secondaryCtaLabel,
      secondaryCtaUrl: b.secondaryCtaUrl,
      imageUrl: b.imageUrl,
      imageAlt: b.imageAlt,
      imageDecorative: b.imageDecorative,
      variant: b.variant,
      badgeLabel: b.badgeLabel,
    };
  });
}
