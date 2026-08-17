#!/usr/bin/env node
/**
 * [Phase 4B QA, part 2] Site-content singleton upsert-by-id + social_links
 * replace-all, and Leads CRUD. Site-content values are captured before and
 * restored exactly after — these are real singleton rows (site_settings,
 * about_content), not disposable test data.
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

let failures = [];
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + "  " + label);
  if (!cond) failures.push(label);
}

console.log("=== Site content singleton write QA (about_content) ===");
const [aboutBefore] = await req("GET", "about_content", "select=*&limit=1");
check("about_content row exists", Boolean(aboutBefore));

// Apply a QA-safe temporary change (append a marker to bio), verify, then restore exactly.
await req("PATCH", "about_content", `id=eq.${aboutBefore.id}`, { bio: aboutBefore.bio + " [QA-TEMP-MARKER]" });
const [aboutDuring] = await req("GET", "about_content", `select=bio&id=eq.${aboutBefore.id}`);
check("temporary marker applied", aboutDuring.bio.endsWith("[QA-TEMP-MARKER]"));

await req("PATCH", "about_content", `id=eq.${aboutBefore.id}`, { bio: aboutBefore.bio });
const [aboutRestored] = await req("GET", "about_content", `select=*&id=eq.${aboutBefore.id}`);
check("bio restored exactly", aboutRestored.bio === aboutBefore.bio);
check("name unaffected by the round-trip", aboutRestored.name === aboutBefore.name);
check("skills_design unaffected", JSON.stringify(aboutRestored.skills_design) === JSON.stringify(aboutBefore.skills_design));

console.log("\n=== social_links replace-all QA ===");
const before = await req("GET", "social_links", "select=*&owner=eq.settings&order=order.asc");
check(`social_links has ${before.length} rows before`, before.length === 7);

// Simulate a settings save with the same 7 links (round-trip, not an actual content change)
await req("DELETE", "social_links", "owner=eq.settings");
const afterDelete = await req("GET", "social_links", "select=id&owner=eq.settings");
check("delete-all worked", afterDelete.length === 0);

await req(
  "POST",
  "social_links",
  "",
  before.map((l, i) => ({ owner: "settings", label: l.label, value: l.value, href: l.href, icon: l.icon, priority: l.priority, visible: l.visible, order: i })),
  { Prefer: "return=representation" },
);
const after = await req("GET", "social_links", "select=label,href,icon&owner=eq.settings&order=order.asc");
check("7 rows recreated", after.length === 7);
check("labels match original set", JSON.stringify(after.map((r) => r.label)) === JSON.stringify(before.map((r) => r.label)));

console.log("\n=== Leads CRUD QA ===");
const [lead] = await req(
  "POST",
  "leads",
  "",
  { form_name: "QA Test Form", name: "QA Test Lead (delete me)", email: "qa-test@localhost.test", status: "New", priority: "Medium", follow_up_status: "none", tags: [] },
  { Prefer: "return=representation" },
);
check("lead created with id", Boolean(lead?.id));

await req("POST", "lead_activity", "", { lead_id: lead.id, type: "created", detail: "QA test" });
await req("POST", "lead_notes", "", { lead_id: lead.id, text: "QA test note" });
await req("PATCH", "leads", `id=eq.${lead.id}`, { status: "Contacted" });

const [leadAfter] = await req("GET", "leads", `select=status&id=eq.${lead.id}`);
check("status update applied", leadAfter.status === "Contacted");
const notes = await req("GET", "lead_notes", `select=id&lead_id=eq.${lead.id}`);
check("note attached", notes.length === 1);
const activity = await req("GET", "lead_activity", `select=id&lead_id=eq.${lead.id}`);
check("activity attached", activity.length === 1);

await req("DELETE", "leads", `id=eq.${lead.id}`);
const leadGone = await req("GET", "leads", `select=id&id=eq.${lead.id}`);
check("lead deleted", leadGone.length === 0);
const notesGone = await req("GET", "lead_notes", `select=id&lead_id=eq.${lead.id}`);
check("lead_notes cascade-deleted", notesGone.length === 0);
const activityGone = await req("GET", "lead_activity", `select=id&lead_id=eq.${lead.id}`);
check("lead_activity cascade-deleted", activityGone.length === 0);

console.log("\n" + (failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES:\n" + failures.join("\n")));
process.exit(failures.length === 0 ? 0 : 1);
