import { NextResponse } from "next/server";
import { getSignalById } from "@/lib/community/thanksSignalsRepository";
import { getCurrentPublicUser } from "@/lib/auth/publicProfile";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { createMediaAsset } from "@/lib/cms/supabase/mediaUpload";
import {
  attachThanksSignalMedia,
  countThanksSignalMedia,
  MAX_MEDIA_PER_SIGNAL,
  nextThanksSignalMediaOrder,
} from "@/lib/community/thanksSignalMediaRepository";
import { getThanksSignalMedia } from "@/lib/community/publicMedia";
import type { ThanksSignal } from "@/types/thanksSignal";

const UPLOAD_RATE_LIMIT = 20;
const UPLOAD_RATE_WINDOW_MS = 15 * 60 * 1000;

/**
 * [Signal media attachments Part A/B] Images use the same limits as every
 * other contributor upload path (`/api/community/contributions/[id]/media`,
 * `/api/admin/images`) — 8MB, jpg/png/webp. PDF is new for this feature
 * (Share/Signal attachments explicitly need document support that no
 * existing upload route offers) — capped higher since a scanned/exported
 * document is legitimately larger than a photo, still bounded rather than
 * unlimited. SVG is excluded for the same reason the contribution route
 * excludes it: no sanitizer built for arbitrary contributor-supplied vector
 * content.
 */
const ALLOWED_UPLOAD_TYPES: Record<string, { ext: string; maxBytes: number }> = {
  "image/jpeg": { ext: ".jpg", maxBytes: 8 * 1024 * 1024 },
  "image/png": { ext: ".png", maxBytes: 8 * 1024 * 1024 },
  "image/webp": { ext: ".webp", maxBytes: 8 * 1024 * 1024 },
  "application/pdf": { ext: ".pdf", maxBytes: 15 * 1024 * 1024 },
};

const EDITABLE_STATUSES = new Set(["draft", "submitted"]);

/** Ownership + edit-window check — mirrors the contribution media route's own `loadEditableBundle`, adapted to Signal's own editable window (`thanks_signals_author_update`'s precondition: draft/submitted, migration 0012). */
async function loadEditableSignal(id: string, authUserId: string): Promise<ThanksSignal | null> {
  const signal = await getSignalById(id);
  if (!signal || signal.authorId !== authUserId) return null;
  if (!EDITABLE_STATUSES.has(signal.status)) return null;
  return signal;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    const { id } = await params;
    const signal = await getSignalById(id);
    if (!signal || signal.authorId !== current.authUserId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const media = await getThanksSignalMedia(signal.id);
    return NextResponse.json({ media });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Could not load media." }, { status: 502 });
  }
}

/**
 * [Part A §1/§2, Part E] Upload one file, attach it to the caller's own
 * Signal. Upload -> Storage/media_assets (service-role) -> attach the join
 * row (RLS-bound client, so `thanks_signal_media_author_write` is the real
 * gate). "Uploaded" is never reported to the client until both steps
 * succeed — Part A §10 ("must not create orphaned media records if the
 * signal submission fails"): if the join-row attach fails after a
 * successful Storage/media_assets write, that row is simply never created,
 * and `deleteMediaAssetIfUnreferenced` (run the next time anything checks
 * that asset) would reclaim it since nothing references it — an orphaned
 * Storage object never becomes an orphaned *visible* attachment.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentPublicUser();
    if (!current) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

    const rateLimit = checkRateLimit(`signal-media-upload:${clientIp(request)}`, UPLOAD_RATE_LIMIT, UPLOAD_RATE_WINDOW_MS);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many uploads — please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)) } },
      );
    }

    const { id } = await params;
    const signal = await loadEditableSignal(id, current.authUserId);
    if (!signal) {
      return NextResponse.json(
        { error: "Could not upload — this signal may no longer be editable, or isn't yours." },
        { status: 403 },
      );
    }

    const existingCount = await countThanksSignalMedia(signal.id);
    if (existingCount >= MAX_MEDIA_PER_SIGNAL) {
      return NextResponse.json({ error: `You can attach up to ${MAX_MEDIA_PER_SIGNAL} files.` }, { status: 400 });
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

    // Never trust the client-side accept="" filter alone (Part A §8) — MIME
    // type and size are both re-checked here, server-side, against the same
    // allowlist regardless of what the browser reported.
    const spec = ALLOWED_UPLOAD_TYPES[file.type];
    if (!spec) {
      return NextResponse.json(
        { error: "Unsupported file type — upload a JPG, PNG, WEBP image, or a PDF." },
        { status: 400 },
      );
    }
    if (file.size > spec.maxBytes) {
      return NextResponse.json(
        {
          error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB) — the limit is ${spec.maxBytes / (1024 * 1024)}MB.`,
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

    // Storage path is always a generated, collision-safe name — never the
    // client-supplied filename (path traversal / arbitrary-path prevention,
    // Part E) — the original filename is preserved separately, in the
    // media_assets row, for display only.
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${spec.ext}`;
    const storagePath = `community/signals/${signal.id}/${safeName}`;
    const originalFilename = typeof file.name === "string" ? file.name.slice(0, 200) : null;

    let created: { id: string; src: string };
    try {
      created = await createMediaAsset({
        storagePath,
        bytes: buffer,
        contentType: file.type,
        uploadedBy: current.authUserId,
        originalFilename,
      });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed — please try again." }, { status: 500 });
    }

    const order = await nextThanksSignalMediaOrder(signal.id);
    try {
      const row = await attachThanksSignalMedia(signal.id, created.id, order);
      return NextResponse.json({
        media: { id: row.id, url: created.src, order: row.order, mimeType: file.type, fileSize: file.size, filename: originalFilename },
      });
    } catch (err) {
      // The Storage object/media_assets row from above is left in place
      // rather than deleted here — same orphan trade-off
      // designResponseMediaRepository.ts's own header comment documents;
      // it's unreferenced and reclaimable the next time anything checks it.
      return NextResponse.json({ error: err instanceof Error ? err.message : "Could not attach the uploaded file." }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed." }, { status: 502 });
  }
}
