#!/usr/bin/env node
/**
 * [Phase 4C QA] End-to-end: real Storage upload -> media_assets ->
 * referenced as a QA project's cover -> read back through the same shape
 * the app's read mapper produces -> verify the src resolves to the real
 * Storage URL -> replace -> verify -> delete project (cascade) -> delete
 * the Storage objects this test created. Never touches Gridmark.
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
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const jsonHeaders = { ...headers, "Content-Type": "application/json" };

async function req(method, table, query, body, extra = {}) {
  const res = await fetch(`${URL}/rest/v1/${table}${query ? `?${query}` : ""}`, { method, headers: { ...jsonHeaders, ...extra }, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${method} ${table}: HTTP ${res.status} ${await res.text()}`);
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}
async function uploadPng(storagePath, bytes) {
  const res = await fetch(`${URL}/storage/v1/object/${BUCKET}/${storagePath}`, { method: "POST", headers: { ...headers, "Content-Type": "image/png", "x-upsert": "false" }, body: bytes });
  if (!res.ok) throw new Error(`upload failed: HTTP ${res.status} ${await res.text()}`);
  return `${URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}
async function deleteStorage(storagePath) {
  return fetch(`${URL}/storage/v1/object/${BUCKET}/${storagePath}`, { method: "DELETE", headers });
}

let failures = [];
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label);
  if (!cond) failures.push(label);
}

const PNG_RED = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const PNG_BLUE = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9Qz4AAmJVdCzUAAAAASUVORK5CYII=", "base64");
const SLUG = "zz-qa-media-integration-delete-me";
const stamp = Date.now();
const coverPath1 = `projects/${SLUG}/cover-${stamp}-a.png`;
const coverPath2 = `projects/${SLUG}/cover-${stamp}-b.png`;

console.log("=== Media integration QA: " + SLUG + " ===");

// 1. Upload cover v1, create media_assets row (mirrors createMediaAsset)
const coverUrl1 = await uploadPng(coverPath1, PNG_RED);
const [media1] = await req("POST", "media_assets", "", { storage_path: coverUrl1, mime_type: "image/png", file_size: PNG_RED.byteLength, project_slug: SLUG }, { Prefer: "return=representation" });
check("cover v1 uploaded + media_assets row created", Boolean(media1?.id));

// 2. Save QA project referencing it as cover (mirrors saveProjectToSupabase)
const [project] = await req(
  "POST",
  "projects",
  "on_conflict=slug",
  {
    slug: SLUG,
    title: "ZZ QA Media Integration (delete me)",
    category: "Graphic Design",
    project_type: "",
    year: 2026,
    role: "",
    short_description: "QA",
    cover_image_id: media1.id,
    cover_image_alt: "QA cover v1",
    published: false,
    featured: false,
    tags: [],
    tools: [],
    services: [],
    order: 999999,
    case_study_overview: "",
    case_study_outcome: "",
  },
  { Prefer: "resolution=merge-duplicates,return=representation" },
);
check("project saved with cover_image_id set", project.cover_image_id === media1.id);

// 3. Read back exactly as the app's read mapper would (join projects -> media_assets)
const [readBack] = await req("GET", "projects", `select=cover_image_alt,cover_image_id&slug=eq.${SLUG}`);
const [joinedMedia] = await req("GET", "media_assets", `select=storage_path&id=eq.${readBack.cover_image_id}`);
check("reconstructed cover src equals the real Storage public URL", joinedMedia.storage_path === coverUrl1);
const liveFetch1 = await fetch(joinedMedia.storage_path);
check("reconstructed cover URL is actually renderable (200)", liveFetch1.ok);

// 4. Replace: upload cover v2, update project, verify old reference is gone and new one resolves
const coverUrl2 = await uploadPng(coverPath2, PNG_BLUE);
const [media2] = await req("POST", "media_assets", "", { storage_path: coverUrl2, mime_type: "image/png", file_size: PNG_BLUE.byteLength, project_slug: SLUG }, { Prefer: "return=representation" });
await req("PATCH", "projects", `id=eq.${project.id}`, { cover_image_id: media2.id, cover_image_alt: "QA cover v2 (replaced)" });
const [afterReplace] = await req("GET", "projects", `select=cover_image_id,cover_image_alt&id=eq.${project.id}`);
check("replace updated cover_image_id", afterReplace.cover_image_id === media2.id);
check("replace updated alt text", afterReplace.cover_image_alt === "QA cover v2 (replaced)");
const [replacedMedia] = await req("GET", "media_assets", `select=storage_path&id=eq.${media2.id}`);
const liveFetch2 = await fetch(replacedMedia.storage_path);
check("replaced cover URL is renderable (200)", liveFetch2.ok);
check("old cover v1's Storage object is untouched by the replace (still fetchable)", (await fetch(coverUrl1)).ok);

// 5. Delete the QA project — confirm cascade, and confirm this does NOT touch media_assets (matches existing "Clear never deletes the file" pattern — orphaned media rows aren't auto-swept, by design, same as the local-fs backend today)
await req("DELETE", "projects", `id=eq.${project.id}`);
const projGone = await req("GET", "projects", `select=id&slug=eq.${SLUG}`);
check("QA project deleted", projGone.length === 0);
const mediaStillThere = await req("GET", "media_assets", `select=id&id=in.(${media1.id},${media2.id})`);
check("media_assets rows NOT auto-deleted by project delete (matches existing behavior — not a bug)", mediaStillThere.length === 2);

// 6. QA-only cleanup: remove the media_assets rows and Storage objects this test created (the app itself never does this automatically — see check above)
await req("DELETE", "media_assets", `id=in.(${media1.id},${media2.id})`);
await deleteStorage(coverPath1);
await deleteStorage(coverPath2);
const cleanupCheck = await req("GET", "media_assets", `select=id&id=in.(${media1.id},${media2.id})`);
check("QA media_assets rows cleaned up", cleanupCheck.length === 0);

// 7. Gridmark untouched
const [gridmark] = await req("GET", "projects", "select=slug,title,published,cover_image_id&slug=eq.gridmark");
check("Gridmark still present and unchanged", Boolean(gridmark) && gridmark.title === "Gridmark" && gridmark.published === true);

console.log("\n" + (failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES:\n" + failures.join("\n")));
process.exit(failures.length === 0 ? 0 : 1);
