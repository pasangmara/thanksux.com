import { NextResponse } from "next/server";
import { deleteBanner, getBannerForAdmin, updateBanner, type BannerVariant } from "@/lib/cms/bannersRepository";
import { resolveMediaAssetId } from "@/lib/cms/supabase/mediaAssets";
import { requireAdmin } from "@/lib/auth/requireAuth";

const MAX_LEN = { title: 200, eyebrow: 80, description: 500, ctaLabel: 60, badge: 40, campaign: 120 } as const;
const VARIANTS: BannerVariant[] = ["gradient", "dark", "light", "image"];

function str(value: unknown, max: number): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

/** Validates a URL string (relative path like "/contact" or absolute http(s)) — same permissive-but-safe rule the public contact/audit forms already use via isValidHttpUrl, extended to allow site-relative CTA destinations since most banner CTAs will point at /work, /contact, etc. */
function isValidCtaUrl(value: string): boolean {
  if (value.startsWith("/") || value.startsWith("#")) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function ctaUrl(value: unknown, error: string[], label: string): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!isValidCtaUrl(trimmed)) {
    error.push(`${label} must be a relative path (/work) or a full http(s) URL.`);
    return undefined;
  }
  return trimmed;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const banner = await getBannerForAdmin(id);
  if (!banner) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ banner });
}

/** Content-only update (title/eyebrow/description/CTAs/image/variant/badge/campaign/schedule) — enable/disable and reorder go through the dedicated /action route below. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : undefined;
  if (title === "") return NextResponse.json({ error: "Banner title is required." }, { status: 400 });

  const errors: string[] = [];
  const primaryCtaUrl = ctaUrl(body.primaryCtaUrl, errors, "Primary CTA URL");
  const secondaryCtaUrl = ctaUrl(body.secondaryCtaUrl, errors, "Secondary CTA URL");
  if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });

  let variant: BannerVariant | undefined;
  if (body.variant !== undefined) {
    if (typeof body.variant !== "string" || !VARIANTS.includes(body.variant as BannerVariant)) {
      return NextResponse.json({ error: "Background style must be one of: gradient, dark, light, image." }, { status: 400 });
    }
    variant = body.variant as BannerVariant;
  }

  // [Same pattern writeProject.ts/reviewsRepository.ts's PATCH route already
  // uses for cover/avatar images] The admin editor works in terms of
  // AdminMedia (a storage URL + alt text), never a raw media_assets id —
  // resolveMediaAssetId() looks up an existing row by storage_path (dedup)
  // or creates one, so "Upload new image"/"Choose existing image" in
  // MediaField both just work here without this route knowing which
  // happened.
  let imageMediaId: string | null | undefined;
  const imageAlt = str(body.imageAlt, MAX_LEN.title);
  if (body.imageSrc === null) {
    imageMediaId = null;
  } else if (typeof body.imageSrc === "string" && body.imageSrc) {
    imageMediaId = await resolveMediaAssetId({ kind: "image", src: body.imageSrc, alt: imageAlt ?? "" });
  }

  const startAt = body.startAt === null ? null : typeof body.startAt === "string" && body.startAt ? body.startAt : undefined;
  const endAt = body.endAt === null ? null : typeof body.endAt === "string" && body.endAt ? body.endAt : undefined;

  const updated = await updateBanner(id, {
    title,
    eyebrow: str(body.eyebrow, MAX_LEN.eyebrow),
    description: str(body.description, MAX_LEN.description),
    primaryCtaLabel: str(body.primaryCtaLabel, MAX_LEN.ctaLabel),
    primaryCtaUrl,
    secondaryCtaLabel: str(body.secondaryCtaLabel, MAX_LEN.ctaLabel),
    secondaryCtaUrl,
    imageMediaId,
    imageAlt,
    imageDecorative: typeof body.imageDecorative === "boolean" ? body.imageDecorative : undefined,
    variant,
    badgeLabel: str(body.badgeLabel, MAX_LEN.badge),
    campaignName: str(body.campaignName, MAX_LEN.campaign),
    startAt,
    endAt,
  });
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ banner: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  await deleteBanner(id);
  return NextResponse.json({ ok: true });
}
