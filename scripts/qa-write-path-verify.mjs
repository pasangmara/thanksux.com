#!/usr/bin/env node
/**
 * [Phase 4B QA] Exercises the exact sequence of Supabase REST operations
 * src/lib/cms/supabase/writeProject.ts performs (upsert -> replace gallery
 * children -> verify -> delete -> verify cascade), against a clearly-
 * labeled temporary QA project, never Gridmark. Cleans up after itself.
 * Read-only with respect to data/*.json (never touched).
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
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function req(method, table, query, body, extraHeaders = {}) {
  const res = await fetch(`${URL}/rest/v1/${table}${query ? `?${query}` : ""}`, {
    method,
    headers: { ...headers, ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${table}: HTTP ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const SLUG = "zz-qa-test-project-delete-me";
let failures = [];
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label);
  if (!cond) failures.push(label);
}

console.log("=== Phase 4B write-path QA: " + SLUG + " ===");

// 1. Pre-check: confirm this slug doesn't already exist (clean start)
const pre = await req("GET", "projects", `select=id&slug=eq.${SLUG}`);
check("no pre-existing QA row", pre.length === 0);

// 2. Insert (mirrors saveProjectToSupabase's insert branch)
const [inserted] = await req(
  "POST",
  "projects",
  "",
  {
    slug: SLUG,
    title: "ZZ QA Test Project (delete me)",
    category: "Graphic Design",
    project_type: "",
    year: 2026,
    role: "",
    short_description: "Temporary QA record — safe to delete.",
    published: false,
    featured: false,
    tags: [],
    tools: [],
    services: [],
    order: 999999,
    case_study_overview: "QA overview",
    case_study_outcome: "QA outcome",
    case_study: { constraint: "QA constraint value" },
  },
  { Prefer: "return=representation" },
);
check("insert returned a row with an id", Boolean(inserted?.id));
const projectId = inserted.id;

// 3. Insert 2 gallery_items children
await req(
  "POST",
  "gallery_items",
  "",
  [
    { project_id: projectId, section: "gallery", alt: "QA image 1", layout: "half", order: 0 },
    { project_id: projectId, section: "gallery", alt: "QA image 2", layout: "half", order: 1 },
  ],
  { Prefer: "return=representation" },
);
const galleryAfterInsert = await req("GET", "gallery_items", `select=id,alt,order&project_id=eq.${projectId}&order=order.asc`);
check("2 gallery_items created", galleryAfterInsert.length === 2);
check("gallery order preserved (0,1)", galleryAfterInsert[0].order === 0 && galleryAfterInsert[1].order === 1);

// 4. Update (mirrors saveProjectToSupabase's update branch — resolve by
//    slug=eq.<appId>, since appId===slug here with no rename involved)
await req("PATCH", "projects", `id=eq.${projectId}`, { title: "ZZ QA Test Project (UPDATED, delete me)", published: true });
const [afterUpdate] = await req("GET", "projects", `select=title,published&id=eq.${projectId}`);
check("update applied (title)", afterUpdate.title === "ZZ QA Test Project (UPDATED, delete me)");
check("update applied (published=true)", afterUpdate.published === true);

// 5. Replace-all children (delete then recreate with 1 item instead of 2 — simulates removing a gallery image on save)
await req("DELETE", "gallery_items", `project_id=eq.${projectId}`);
await req("POST", "gallery_items", "", [{ project_id: projectId, section: "gallery", alt: "QA image replaced", layout: "half", order: 0 }], {
  Prefer: "return=representation",
});
const galleryAfterReplace = await req("GET", "gallery_items", `select=id,alt&project_id=eq.${projectId}`);
check("gallery replace-all resulted in exactly 1 row", galleryAfterReplace.length === 1);
check("replaced row has the new content", galleryAfterReplace[0].alt === "QA image replaced");

// 6. Slug-conflict check simulation: a second insert with the same slug should be rejected by the unique constraint
let conflictRejected = false;
try {
  await req("POST", "projects", "", { slug: SLUG, title: "duplicate", category: "Graphic Design", project_type: "", year: 2026, role: "", short_description: "", published: false, featured: false, tags: [], tools: [], services: [], order: 0, case_study_overview: "", case_study_outcome: "" });
} catch {
  conflictRejected = true;
}
check("duplicate slug insert rejected by unique constraint", conflictRejected);

// 7. Delete + cascade verification
await req("DELETE", "projects", `id=eq.${projectId}`);
const [projectAfterDelete] = [await req("GET", "projects", `select=id&id=eq.${projectId}`)];
check("project row gone after delete", projectAfterDelete.length === 0);
const galleryAfterDelete = await req("GET", "gallery_items", `select=id&project_id=eq.${projectId}`);
check("gallery_items cascade-deleted", galleryAfterDelete.length === 0);

// 8. Confirm Gridmark untouched throughout
const [gridmark] = await req("GET", "projects", "select=slug,title,published&slug=eq.gridmark");
check("Gridmark still present", Boolean(gridmark));
check("Gridmark title unchanged", gridmark?.title === "Gridmark");
check("Gridmark still published", gridmark?.published === true);

console.log("\n" + (failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES:\n" + failures.join("\n")));
process.exit(failures.length === 0 ? 0 : 1);
