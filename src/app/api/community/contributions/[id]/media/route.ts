import { NextResponse } from "next/server";
import { getOwnContributionBundle } from "@/lib/community/contributionsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { createMediaAsset } from "@/lib/cms/supabase/mediaUpload";
import {
  attachDesignResponseMedia,
  countDesignResponseMedia,
  MAX_MEDIA_PER_RESPONSE,
  nextMediaOrder,
  reorderDesignResponseMedia,
} from "@/lib/community/designResponseMediaRepository";
import { getDesignResponseMedia } from "@/lib/community/publicMedia";
import type { ContributionBundle } from "@/lib/community/contributionsRepository";

const UPLOAD_RATE_LIMIT = 20;
const UPLOAD_RATE_WINDOW_MS = 15 * 60 * 1000;

/**
 * [Phase 6G Part A] Matches `/api/admin/images/route.ts`'s own file-type/
 * size limits exactly, kept in sync deliberately rather than re-derived
 * from a shared constant — same "kept in sync deliberately" convention
 * that file's own SLUG_RE comment already documents. SVG is excluded for
 * the identical reason that route excludes it for photo-type uploads: no
 * `images.dangerouslyAllowSVG`, no sanitizer built for gallery-shaped SVG
 * content (only the separate admin icon/logo route has that, and only for
 * small vector marks, not arbitrary contributor photos) — "SVG only where
 * the existing security rules safely permit it" resolves to "not here."
 */
const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const EDITABLE_DESIGN_RESPONSE_STATUSES = new Set(["draft", "submitted", "under_review"]);

/**
 * Ownership + edit-window check shared by POST/PATCH — mirrors
 * /contribute/[id]/page.tsx's own explicit `contributorId !== authUserId`
 * check (getOwnContributionBundle()'s RLS-backed read alone isn't "owner
 * only" — a Signal author can also read a Contribution attached to their
 * Signal). The edit window is design_response.status, not
 * contribution.status — matching `design_response_media_author_write`'s
 * own RLS precondition (migration 0012) exactly, which is the real
 * enforcement for the join-table write either way.
 */
async function loadEditableBundle(id: string, authUserId: string): Promise<ContributionBundle | null> {
  const bundle = await getOwnContributionBundle(id);
  if (!bundle || bundle.contribution.contributorId !== authUserId) return null;
  if (!EDITABLE_DESIGN_RESPONSE_STATUSES.has(bundle.designResponse.status)) return null;
  return bundle;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const { id } = await params;
    const bundle = await getOwnContributionBundle(id);
    if (!bundle || bundle.contribution.contributorId !== current.authUserId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const media = await getDesignResponseMedia(bundle.designResponse.id);
    return NextResponse.json({ media });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not load media." }, { status: 502 });
  }
}

/**
 * [Part A §1/§2] Upload one image, attach it to the caller's own
 * DesignResponse. Upload -> Storage/media_assets (service-role, via
 * createMediaAsset — media_assets has no RLS an authenticated contributor
 * session could write through) -> attach the join row (RLS-bound client,
 * so `design_response_media_author_write` is the real gate on that step).
 * "Uploaded" is never reported to the client until both steps succeed.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rateLimit = checkRateLimit(`contribution-media-upload:${clientIp(request)}`, UPLOAD_RATE_LIMIT, UPLOAD_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many uploads — please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { id } = await params;
    const bundle = await loadEditableBundle(id, current.authUserId);
    if (!bundle) {
      return NextResponse.json(
        { error: "Could not upload — this response may no longer be editable, or isn't yours." },
        { status: 403 },
      );
    }

    const existingCount = await countDesignResponseMedia(bundle.designResponse.id);
    if (existingCount >= MAX_MEDIA_PER_RESPONSE) {
      return NextResponse.json({ error: `You can attach up to ${MAX_MEDIA_PER_RESPONSE} images.` }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No file selected." }, { status: 400 });
    }

    const ext = ALLOWED_UPLOAD_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Unsupported file type — upload a JPG, PNG, or WEBP image." }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB) — the limit is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`,
        },
        { status: 400 },
      );
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(await file.arrayBuffer());
    } catch {
      return NextResponse.json({ error: "Failed to read the uploaded file." }, { status: 500 });
    }

    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const storagePath = `community/contributions/${bundle.contribution.id}/${safeName}`;

    let created: { id: string; src: string };
    try {
      created = await createMediaAsset({
        storagePath,
        bytes: buffer,
        contentType: file.type,
        uploadedBy: current.authUserId,
      });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed — please try again." }, { status: 500 });
    }

    const order = await nextMediaOrder(bundle.designResponse.id);
    try {
      const row = await attachDesignResponseMedia(bundle.designResponse.id, created.id, order);
      return NextResponse.json({ media: { id: row.id, url: created.src, order: row.order } });
    } catch (err) {
      // The Storage object/media_assets row from above is left in place
      // rather than deleted here — same orphan trade-off this file's
      // header comment documents for removeDesignResponseMedia().
      return NextResponse.json({ error: err instanceof Error ? err.message : "Could not attach the uploaded image." }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 502 });
  }
}

/** [Part A §2 — reorder] Body: `{ order: string[] }` — join-row ids in the desired display order. Rows outside the caller's own DesignResponse are excluded structurally (reorderDesignResponseMedia's own `.eq()` filter), not merely by this route trusting the input. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const { id } = await params;
    const bundle = await loadEditableBundle(id, current.authUserId);
    if (!bundle) return NextResponse.json({ error: "Not found or not editable." }, { status: 403 });

    let body: { order?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (!Array.isArray(body.order) || !body.order.every((v) => typeof v === "string")) {
      return NextResponse.json({ error: "order must be an array of media ids." }, { status: 400 });
    }

    await reorderDesignResponseMedia(bundle.designResponse.id, body.order as string[]);
    const media = await getDesignResponseMedia(bundle.designResponse.id);
    return NextResponse.json({ media });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not reorder media." }, { status: 502 });
  }
}
