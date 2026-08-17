import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { sanitizeSvgUpload } from "@/lib/cms/svgSanitize";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { isSupabaseBackendEnabled } from "@/lib/cms/dataBackend";
import { createMediaAsset } from "@/lib/cms/supabase/mediaUpload";
import { supabaseSelect } from "@/lib/supabase/rest";

/**
 * [Icon/Logo CMS] Admin-only upload path for icon/logo/favicon assets —
 * deliberately separate from `/api/admin/images` (photos/screenshots),
 * which stays exactly as it was (JPG/PNG/WEBP only, served through
 * next/image). This route exists because SVG needs different handling on
 * both ends:
 *  - `next/image`'s built-in optimizer refuses to process SVG unless
 *    `images.dangerouslyAllowSVG` is set in next.config.ts (a real risk for
 *    *remote* SVGs it would otherwise pass through unmodified) — nothing
 *    here touches that flag; every asset from this route is rendered via a
 *    plain `<img>` tag instead (see IconField.tsx / SiteNav.tsx), so the
 *    optimizer never sees it.
 *  - An SVG file can carry `<script>`/event-handler markup a JPG/PNG/WEBP
 *    cannot, so it needs its own validation + sanitization pass
 *    (`sanitizeSvgUpload`) before being written to disk. See that file's
 *    header comment for the actual safety model — sanitization here is
 *    defense-in-depth; the real guarantee is "only ever rendered via
 *    `<img src>`, never inlined."
 *
 * Written files live under public/images/site/icons/ — never inside a
 * project's own folder (icons/logos are site-wide assets, not per-project
 * media), and never at a client-supplied path.
 */

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB — generous for a vector icon/logo/favicon; these are not photographs.

const RASTER_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/webp": ".webp",
};

const ICONS_DIR_SEGMENTS = ["images", "site", "icons"];

function iconsDir(): string {
  return path.join(process.cwd(), "public", ...ICONS_DIR_SEGMENTS);
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  if (isSupabaseBackendEnabled()) {
    // Icons live under the icons/ storage prefix specifically — distinct
    // from photo uploads (projects/<slug>/..., site/...) in the same
    // media_assets table, so this picker only ever shows icon-shaped assets.
    const rows = await supabaseSelect<{ storage_path: string }[]>(
      "media_assets",
      "select=storage_path&storage_path=like.*/icons/*&order=uploaded_at.desc",
    );
    return NextResponse.json({ icons: rows.map((r) => ({ src: r.storage_path })) });
  }

  const dir = iconsDir();
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    entries = [];
  }
  const icons = entries
    .filter((name) => /\.(svg|png|webp)$/i.test(name))
    .sort()
    .map((name) => ({ src: `/${ICONS_DIR_SEGMENTS.join("/")}/${name}` }));
  return NextResponse.json({ icons });
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

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

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB) — the limit is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`,
      },
      { status: 400 },
    );
  }

  const dir = iconsDir();
  const safeStem = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg")) {
    let text: string;
    try {
      text = await file.text();
    } catch {
      return NextResponse.json({ error: "Failed to read the uploaded file." }, { status: 500 });
    }
    // Sanitized BEFORE it ever reaches Storage or disk — unchanged from
    // before this phase, the one real safety gate for uploaded SVG markup.
    const result = sanitizeSvgUpload(text);
    if (!result.ok || !result.cleaned) {
      return NextResponse.json({ error: result.error ?? "Invalid SVG file." }, { status: 400 });
    }

    if (isSupabaseBackendEnabled()) {
      try {
        const { src } = await createMediaAsset({
          storagePath: `icons/${safeStem}.svg`,
          bytes: Buffer.from(result.cleaned, "utf8"),
          contentType: "image/svg+xml",
        });
        return NextResponse.json({ icon: { src } });
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Upload failed — please try again." },
          { status: 500 },
        );
      }
    }

    const destPath = path.join(dir, `${safeStem}.svg`);
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(destPath, result.cleaned, "utf8");
    } catch {
      return NextResponse.json({ error: "Failed to save the uploaded file." }, { status: 500 });
    }
    return NextResponse.json({ icon: { src: `/${ICONS_DIR_SEGMENTS.join("/")}/${safeStem}.svg` } });
  }

  const ext = RASTER_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type — upload an SVG, PNG, or WEBP image." },
      { status: 400 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Failed to read the uploaded file." }, { status: 500 });
  }

  if (isSupabaseBackendEnabled()) {
    try {
      const { src } = await createMediaAsset({ storagePath: `icons/${safeStem}${ext}`, bytes: buffer, contentType: file.type });
      return NextResponse.json({ icon: { src } });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Upload failed — please try again." },
        { status: 500 },
      );
    }
  }

  const destPath = path.join(dir, `${safeStem}${ext}`);
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(destPath, buffer);
  } catch {
    return NextResponse.json({ error: "Failed to save the uploaded file." }, { status: 500 });
  }

  return NextResponse.json({ icon: { src: `/${ICONS_DIR_SEGMENTS.join("/")}/${safeStem}${ext}` } });
}
