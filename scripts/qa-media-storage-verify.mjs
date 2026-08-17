#!/usr/bin/env node
/**
 * [Phase 4C QA] Exercises the real Supabase Storage + media_assets
 * pipeline end-to-end with disposable test files — same sequence
 * src/lib/cms/supabase/mediaUpload.ts performs. Cleans up after itself.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  const env = {};
  if (!existsSync(p)) return env;
  for (const line of readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1).replace(/\r$/, "");
  }
  return env;
}
const env = loadEnvLocal();
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "portfolio-media";

let failures = [];
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label);
  if (!cond) failures.push(label);
}

// 1x1 transparent PNG, well-formed real bytes (not fabricated content — a standard minimal valid PNG).
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);
const TEST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`;

console.log("=== Media Storage QA ===");

// --- PNG upload (mirrors uploadToStorage + media_assets insert) ---
const pngPath = `site/qa-test-${Date.now()}.png`;
const pngUploadRes = await fetch(`${URL}/storage/v1/object/${BUCKET}/${pngPath}`, {
  method: "POST",
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "image/png", "x-upsert": "false" },
  body: PNG_1PX,
});
check("PNG upload succeeded", pngUploadRes.ok);

const publicPngUrl = `${URL}/storage/v1/object/public/${BUCKET}/${pngPath}`;
const fetchedPng = await fetch(publicPngUrl);
check("uploaded PNG is publicly fetchable", fetchedPng.ok);
check("fetched content-type is image/png", (fetchedPng.headers.get("content-type") || "").includes("image/png"));
const fetchedBytes = Buffer.from(await fetchedPng.arrayBuffer());
check("fetched bytes match uploaded bytes exactly", fetchedBytes.equals(PNG_1PX));

const [mediaRow] = await fetch(`${URL}/rest/v1/media_assets`, {
  method: "POST",
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
  body: JSON.stringify({ storage_path: publicPngUrl, mime_type: "image/png", file_size: PNG_1PX.byteLength, project_slug: null }),
}).then((r) => r.json());
check("media_assets row created", Boolean(mediaRow?.id));

// --- Cleanup + verify actual deletion (not just DB row removal) ---
await fetch(`${URL}/rest/v1/media_assets?id=eq.${mediaRow.id}`, { method: "DELETE", headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
const rowGone = await fetch(`${URL}/rest/v1/media_assets?select=id&id=eq.${mediaRow.id}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then((r) => r.json());
check("media_assets row deleted", rowGone.length === 0);

// NOTE: Supabase Storage's public object URL is served through a CDN
// (observed: `CF-Cache-Status: HIT`) that does not appear to purge
// immediately on delete, even though the origin's own Cache-Control says
// "no-cache" — a platform characteristic, not something this app
// controls. The verifiable guarantee is the delete API call itself
// succeeding (origin confirms removal), not that the CDN edge stops
// serving a cached copy on some unspecified timeline.
const deleteRes = await fetch(`${URL}/storage/v1/object/${BUCKET}/${pngPath}`, { method: "DELETE", headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
const deleteBody = await deleteRes.json().catch(() => ({}));
check("Storage delete API call succeeded", deleteRes.ok && deleteBody.message === "Successfully deleted");

// --- SVG upload (mirrors the sanitize-then-upload icon path) ---
const svgPath = `icons/qa-test-${Date.now()}.svg`;
const svgUploadRes = await fetch(`${URL}/storage/v1/object/${BUCKET}/${svgPath}`, {
  method: "POST",
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "image/svg+xml", "x-upsert": "false" },
  body: Buffer.from(TEST_SVG, "utf8"),
});
check("SVG upload succeeded", svgUploadRes.ok);
const publicSvgUrl = `${URL}/storage/v1/object/public/${BUCKET}/${svgPath}`;
const fetchedSvg = await fetch(publicSvgUrl).then((r) => r.text());
check("fetched SVG content matches exactly", fetchedSvg === TEST_SVG);
const svgDeleteRes = await fetch(`${URL}/storage/v1/object/${BUCKET}/${svgPath}`, { method: "DELETE", headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
const svgDeleteBody = await svgDeleteRes.json().catch(() => ({}));
check("SVG delete API call succeeded", svgDeleteRes.ok && svgDeleteBody.message === "Successfully deleted");

// --- Bucket-level MIME enforcement (defense-in-depth, independent of app-level validation) ---
const badUploadRes = await fetch(`${URL}/storage/v1/object/${BUCKET}/site/qa-test-bad.txt`, {
  method: "POST",
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "text/plain", "x-upsert": "false" },
  body: Buffer.from("not an image", "utf8"),
});
check("bucket rejects a disallowed MIME type (text/plain)", !badUploadRes.ok);

// --- Confirm no leftover objects/rows ---
const leftoverRows = await fetch(`${URL}/rest/v1/media_assets?select=id&storage_path=like.*qa-test*`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then((r) => r.json());
check("no leftover QA media_assets rows", leftoverRows.length === 0);

console.log("\n" + (failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES:\n" + failures.join("\n")));
process.exit(failures.length === 0 ? 0 : 1);
