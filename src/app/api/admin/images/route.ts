import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { requireAdmin } from "@/lib/auth/requireAuth";
import { isSupabaseBackendEnabled } from "@/lib/cms/dataBackend";
import { createMediaAsset, listMediaAssets } from "@/lib/cms/supabase/mediaUpload";

/**
 * Admin-only route handler for the project image library.
 *
 * GET lists image files that actually exist under public/images/projects/,
 * so the admin media picker can only ever select a real, already-uploaded
 * file (never an invented path). No database, no new dependency — plain
 * Node `fs`, read-only.
 *
 * [CMS Phase E] POST adds the real upload path this GET-only route never
 * had — src/components/admin/media.tsx's "Choose existing image" could
 * only select a file that was already manually placed on disk; there was
 * no way to get a new file onto disk from the browser at all. Writes go
 * through plain Node `fs`, same posture as GET: no new dependency, no
 * database, and the destination is always derived server-side from a
 * validated project slug (or the `site` fallback for content not scoped to
 * one project, e.g. an About photo or an SEO OG image) — never a
 * client-supplied path, so nothing can be written outside
 * public/images/.
 */

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/** Same slug shape src/app/admin/projects/[id]/page.tsx's `validateProject()` already enforces — kept in sync deliberately, not re-derived from a shared constant, since this is the one other place a slug is trusted to become part of a filesystem path. */
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Validated against the file's actual browser-reported MIME type, not its
 * filename extension — the destination filename's extension is always
 * derived from this map, never from whatever the uploader named the file.
 * SVG is deliberately excluded: `next.config.ts` doesn't set
 * `images.dangerouslyAllowSVG`, and enabling it for arbitrary
 * admin-uploaded SVGs (which can embed `<script>`) is a real XSS surface
 * this phase isn't taking on to support an image type the CMS's own
 * category-config `type: "color"`/upload fields don't otherwise need —
 * every current image field is a photograph or UI screenshot, not vector
 * art.
 */
const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB — generous for a source photo per docs/CONTENT_GUIDE.md's own recommended sizes (all well under 1MB).

function walk(dir: string, publicRoot: string): string[] {
  const results: string[] = [];
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walk(fullPath, publicRoot));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry).toLowerCase())) {
      const relative = path.relative(publicRoot, fullPath).split(path.sep).join("/");
      results.push(`/${relative}`);
    }
  }
  return results;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  if (isSupabaseBackendEnabled()) {
    const images = await listMediaAssets();
    return NextResponse.json({ images });
  }

  const publicRoot = path.join(process.cwd(), "public");
  const projectsRoot = path.join(publicRoot, "images", "projects");
  // [CMS Phase E] Also walked so an uploaded About photo / SEO OG image
  // (not scoped to any one project — see POST's `site` fallback below)
  // reappears in "Choose existing image" the next time that picker opens,
  // not just immediately after its own upload.
  const siteRoot = path.join(publicRoot, "images", "site");

  const projectFiles = walk(projectsRoot, publicRoot).sort();
  const siteFiles = walk(siteRoot, publicRoot).sort();

  const images = [
    ...projectFiles.map((src) => {
      // src looks like /images/projects/<slug>/cover.jpg or /images/projects/<slug>/gallery/01.jpg
      const parts = src.split("/").filter(Boolean); // ["images","projects",slug,...]
      const project = parts[2] ?? "unknown";
      return { src, project };
    }),
    ...siteFiles.map((src) => ({ src, project: "site" })),
  ];

  return NextResponse.json({ images });
}

/**
 * [CMS Phase E] Real upload — writes the file to disk and returns its
 * public path, in the same `{ src, project }` shape GET already returns
 * per image, so client code has one shape to handle either way.
 */
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

  const ext = ALLOWED_UPLOAD_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type — upload a JPG, PNG, or WEBP image." },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB) — the limit is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`,
      },
      { status: 400 },
    );
  }

  const rawSlug = formData.get("projectSlug");
  // Falls back to the shared `site` bucket for uploads not tied to one
  // project (About photo, SEO OG image on About/Contact/Settings) — same
  // fallback MediaField already uses today when no `projectSlug` prop is
  // passed. An invalid/unexpected slug value also falls back here rather
  // than erroring, since it can only ever narrow *where* a valid upload is
  // filed, never allow a path outside public/images/.
  const slug = typeof rawSlug === "string" && SLUG_RE.test(rawSlug) ? rawSlug : null;

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Failed to read the uploaded file." }, { status: 500 });
  }

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  if (isSupabaseBackendEnabled()) {
    const storagePath = slug ? `projects/${slug}/${safeName}` : `site/${safeName}`;
    try {
      const { src } = await createMediaAsset({ storagePath, bytes: buffer, contentType: file.type, projectSlug: slug });
      return NextResponse.json({ image: { src, project: slug ?? "site" } });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Upload failed — please try again." },
        { status: 500 },
      );
    }
  }

  const publicRoot = path.join(process.cwd(), "public");
  const destDir = slug
    ? path.join(publicRoot, "images", "projects", slug, "uploads")
    : path.join(publicRoot, "images", "site", "uploads");
  const destPath = path.join(destDir, safeName);

  try {
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, buffer);
  } catch {
    return NextResponse.json({ error: "Failed to save the uploaded file." }, { status: 500 });
  }

  const relative = path.relative(publicRoot, destPath).split(path.sep).join("/");
  const src = `/${relative}`;

  return NextResponse.json({ image: { src, project: slug ?? "site" } });
}
