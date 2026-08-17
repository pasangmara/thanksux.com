#!/usr/bin/env node
/**
 * [Phase 3C] JSON -> Supabase/Postgres migration script.
 *
 * DRY RUN BY DEFAULT. Reads only from data/*.json (never writes to them) and
 * builds the exact rows this migration would insert, in FK-dependency order,
 * printing a plan and per-table row counts. Nothing is sent to Supabase
 * unless --execute is passed explicitly.
 *
 * Usage:
 *   node scripts/migrate-json-to-supabase.mjs             # dry run: build + validate only
 *   node scripts/migrate-json-to-supabase.mjs --verify     # dry run + confirm target tables are reachable/empty
 *   node scripts/migrate-json-to-supabase.mjs --execute    # real run: inserts rows (requires this flag)
 *
 * NOT handled by this script (by design, not oversight):
 *   - `profiles` / auth identity: requires the Supabase Auth Admin API, not a
 *     plain table insert (profiles.id must reference a real auth.users row).
 *     The existing data/users.json password hash (scrypt) cannot be imported
 *     into Supabase Auth's own hashing scheme — a real cutover step, not a
 *     silent data copy. See docs/PHASE_3C_MIGRATION_PLAN.md, "Users/sessions".
 *   - data/leadform.json, data/marketing.json: no destination table exists in
 *     the schema created in Phase 3B. Flagged as a schema gap, not migrated.
 *   - data/sessions.json: retired, not migrated — Supabase Auth manages its
 *     own sessions.
 *
 * Zero new dependencies: uses only Node's built-in fs/path/crypto/fetch.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const EXECUTE = process.argv.includes("--execute");
const VERIFY = process.argv.includes("--verify") || !EXECUTE;

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  const env = {};
  if (!existsSync(p)) return env;
  for (const line of readFileSync(p, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1).replace(/\r$/, "");
  }
  return env;
}

const env = { ...loadEnvLocal(), ...process.env };
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check .env.local.");
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(readFileSync(path.join(ROOT, "data", file), "utf-8"));
}

const uuid = () => crypto.randomUUID();

// ---------------------------------------------------------------------------
// 1. Load source JSON — read-only, never written back to.
// ---------------------------------------------------------------------------
const projects = readJson("projects.json");
const settings = readJson("settings.json");
const hero = readJson("hero.json");
const homepage = readJson("homepage.json");
const about = readJson("about.json");
const contact = readJson("contact.json");
const leads = readJson("leads.json");

// ---------------------------------------------------------------------------
// 2. media_assets — one row per unique real (non-placeholder) file path.
//    Deduplicated by storage_path so the same file referenced twice (e.g. an
//    og:image reusing a gallery photo) only ever gets one row.
// ---------------------------------------------------------------------------
const mediaByPath = new Map();
function mediaAsset(media) {
  if (!media || media.kind !== "image" || !media.src) return null;
  if (mediaByPath.has(media.src)) return mediaByPath.get(media.src);
  const row = { id: uuid(), storage_path: media.src };
  mediaByPath.set(media.src, row);
  return row;
}

// ---------------------------------------------------------------------------
// 3. projects, gallery_items, custom_sections
// ---------------------------------------------------------------------------
const GALLERY_SECTIONS = ["gallery", "wireframes", "finalDesign", "moodboard", "logo", "applications", "exploration", "brandGuidelines"];

const projectRows = [];
const galleryItemRows = [];
const customSectionRows = [];

for (const p of projects) {
  const cover = mediaAsset(p.coverImage);
  const thumb = mediaAsset(p.thumbnail);
  const projectId = uuid();
  const cs = p.caseStudy ?? {};
  const { overview = "", outcome = "", customSections = [], ...restCaseStudy } = cs;
  for (const section of GALLERY_SECTIONS) delete restCaseStudy[section];

  projectRows.push({
    id: projectId,
    slug: p.slug ?? p.id,
    title: p.title,
    category: p.category,
    project_type: p.projectType ?? "",
    year: p.year,
    client: p.client ?? null,
    role: p.role ?? "",
    short_description: p.shortDescription ?? "",
    description: p.description ?? null,
    cover_image_id: cover?.id ?? null,
    cover_image_alt: p.coverImage?.alt ?? null,
    thumbnail_id: thumb?.id ?? null,
    thumbnail_alt: p.thumbnail?.alt ?? null,
    featured: !!p.featured,
    featured_order: p.featuredOrder ?? null,
    published: !!p.published,
    tags: p.tags ?? [],
    tools: p.tools ?? [],
    services: p.services ?? [],
    project_url: p.projectUrl ?? null,
    order: p.order ?? 0,
    seo: p.seo ?? null,
    case_study_overview: overview,
    case_study_outcome: outcome,
    case_study: restCaseStudy,
  });

  for (const section of GALLERY_SECTIONS) {
    const arr = section === "gallery" ? p.gallery : cs[section];
    (arr ?? []).forEach((item, i) => {
      const asset = mediaAsset(item);
      galleryItemRows.push({
        id: uuid(),
        project_id: projectId,
        section,
        media_asset_id: asset?.id ?? null,
        alt: item.alt ?? "",
        caption: item.caption ?? null,
        description: item.description ?? null,
        layout: item.layout ?? "half",
        aspect: item.aspect ?? null,
        fit: item.fit ?? null,
        object_position: item.objectPosition ?? null,
        order: i,
      });
    });
  }

  customSections.forEach((s, i) => {
    const img = mediaAsset(s.image);
    customSectionRows.push({
      id: uuid(),
      project_id: projectId,
      label: s.label ?? "",
      description: s.description ?? null,
      type: s.type ?? null,
      text: s.text ?? null,
      image_id: img?.id ?? null,
      video_url: s.videoUrl ?? null,
      embed_url: s.embedUrl ?? null,
      figma_url: s.figmaUrl ?? null,
      link_url: s.linkUrl ?? null,
      link_label: s.linkLabel ?? null,
      quote_attribution: s.quoteAttribution ?? null,
      items: s.items ?? null,
      order: s.order ?? i,
      visible: s.visible ?? true,
      animation: s.animation ?? null,
    });
  });
}

// ---------------------------------------------------------------------------
// 4. site_settings + social_links (owner='settings' only — contact.json's
//    socialLinks array is an identical duplicate at the JSON layer; the app
//    already treats settings.socialLinks as the single source of truth, so
//    this migration does not create a second owner='contact' copy).
// ---------------------------------------------------------------------------
const PRIORITY_ORDER = { primary: 0, secondary: 1, passive: 2 };

const siteSettingsRow = {
  id: uuid(),
  site_title: settings.siteTitle ?? "",
  site_description: settings.siteDescription ?? null,
  positioning: settings.positioning ?? null,
  differentiator: settings.differentiator ?? null,
  brand_name: settings.brandName ?? "",
  footer_brand_name: settings.footerBrandName ?? null,
  site_url: settings.siteUrl ?? null,
  logo_id: null,
  logo_alt: null,
  logo_mobile_id: null,
  favicon_id: null,
  brand_mark_id: null,
  logo_display_mode: settings.logoDisplayMode ?? null,
  nav_labels: settings.navLabels ?? null,
  footer_text: settings.footerText ?? null,
  seo_defaults: settings.seoDefaults ?? null,
};

const socialLinkRows = (settings.socialLinks ?? []).map((s, i) => ({
  id: uuid(),
  owner: "settings",
  label: s.label ?? "",
  value: s.value ?? null,
  href: s.href ?? null,
  icon: s.icon ?? null,
  priority: PRIORITY_ORDER[s.priority] ?? 9,
  custom_icon_id: null,
  visible: true,
  order: i,
}));

// ---------------------------------------------------------------------------
// 5. hero_content + hero_visuals ("placeholder" kind images stay image_id=null,
//    matching that no real hero visual has been uploaded yet)
// ---------------------------------------------------------------------------
const heroId = uuid();
const heroContentRow = {
  id: heroId,
  eyebrow: hero.eyebrow ?? null,
  headline: hero.headline ?? "",
  description: hero.description ?? "",
  primary_cta_label: hero.primaryCtaLabel ?? null,
  primary_cta_url: hero.primaryCtaUrl ?? null,
  primary_cta_visible: hero.primaryCtaVisible ?? true,
  primary_cta_new_tab: hero.primaryCtaNewTab ?? false,
  secondary_cta_label: hero.secondaryCtaLabel ?? null,
  secondary_cta_url: hero.secondaryCtaUrl ?? null,
  secondary_cta_visible: hero.secondaryCtaVisible ?? true,
  secondary_cta_new_tab: hero.secondaryCtaNewTab ?? false,
  seo: hero.seo ?? null,
};
const heroVisualRows = (hero.visuals ?? []).map((v, i) => {
  const asset = mediaAsset(v.image);
  return {
    id: uuid(),
    hero_id: heroId,
    image_id: asset?.id ?? null,
    title: v.title ?? null,
    description: v.description ?? null,
    href: v.href ?? null,
    order: v.order ?? i,
    visible: v.visible ?? true,
    animation: v.animation ?? null,
  };
});

// ---------------------------------------------------------------------------
// 6. homepage_cards (services + process, discriminated by `kind`)
// ---------------------------------------------------------------------------
function homepageCard(kind, c, i) {
  return {
    id: uuid(),
    kind,
    title: c.title ?? "",
    description: c.description ?? "",
    icon_id: null,
    icon_size: c.iconSize ?? null,
    icon_position: c.iconPosition ?? null,
    url: c.url ?? null,
    order: c.order ?? i,
    visible: c.visible ?? true,
    animation: c.animation ?? null,
  };
}
const homepageCardRows = [
  ...(homepage.services ?? []).map((c, i) => homepageCard("service", c, i)),
  ...(homepage.process ?? []).map((c, i) => homepageCard("process", c, i)),
];

// ---------------------------------------------------------------------------
// 7. about_content
// ---------------------------------------------------------------------------
const aboutPhoto = mediaAsset(about.photo);
const aboutContentRow = {
  id: uuid(),
  name: about.name ?? "",
  title: about.title ?? "",
  roles: about.roles ?? [],
  bio: about.bio ?? null,
  design_philosophy: about.designPhilosophy ?? null,
  about_facts: about.aboutFacts ?? [],
  photo_id: aboutPhoto?.id ?? null,
  location: about.location ?? null,
  experience_summary: about.experienceSummary ?? null,
  skills_design: about.skillsDesign ?? [],
  skills_tools: about.skillsTools ?? [],
  resume_url: about.resumeUrl ?? null,
  seo: about.seo ?? null,
};

// ---------------------------------------------------------------------------
// 8. contact_content (socialLinks intentionally excluded — see §4 note)
// ---------------------------------------------------------------------------
const contactContentRow = {
  id: uuid(),
  heading: contact.heading ?? "",
  description: contact.description ?? null,
  email: contact.email ?? null,
  phone: contact.phone ?? null,
  location: contact.location ?? null,
  project_types: contact.projectTypes ?? [],
  response_time_line: contact.responseTimeLine ?? null,
  success_message: contact.successMessage ?? null,
  seo: contact.seo ?? null,
};

// ---------------------------------------------------------------------------
// 9. leads / lead_notes / lead_activity (data/leads.json is [] today — this
//    mapper still runs so the script stays correct if leads exist by the
//    time it's actually executed).
// ---------------------------------------------------------------------------
const leadRows = [];
const leadNoteRows = [];
const leadActivityRows = [];
for (const l of leads) {
  const leadId = uuid();
  leadRows.push({
    id: leadId,
    form_name: l.formName ?? null,
    name: l.name ?? null,
    email: l.email ?? null,
    phone: l.phone ?? null,
    company: l.company ?? null,
    service: l.service ?? null,
    project_type: l.projectType ?? null,
    budget: l.budget ?? null,
    timeline: l.timeline ?? null,
    preferred_contact_method: l.preferredContactMethod ?? null,
    message: l.message ?? null,
    first_touch: l.firstTouch ?? null,
    latest_touch: l.latestTouch ?? null,
    context: l.context ?? null,
    status: l.status ?? "New",
    priority: l.priority ?? "Medium",
    follow_up_date: l.followUpDate ?? null,
    follow_up_status: l.followUpStatus ?? "none",
    last_contacted_at: l.lastContactedAt ?? null,
    next_action: l.nextAction ?? null,
    tags: l.tags ?? [],
  });
  for (const n of l.notes ?? []) leadNoteRows.push({ id: uuid(), lead_id: leadId, text: n.text, created_at: n.createdAt });
  for (const a of l.activity ?? []) leadActivityRows.push({ id: uuid(), lead_id: leadId, type: a.type, detail: a.detail ?? null, created_at: a.createdAt });
}

// ---------------------------------------------------------------------------
// Assemble the plan in strict FK-dependency / migration order.
// ---------------------------------------------------------------------------
const plan = [
  ["media_assets", [...mediaByPath.values()]],
  ["projects", projectRows],
  ["gallery_items", galleryItemRows],
  ["custom_sections", customSectionRows],
  ["site_settings", [siteSettingsRow]],
  ["social_links", socialLinkRows],
  ["hero_content", [heroContentRow]],
  ["hero_visuals", heroVisualRows],
  ["homepage_cards", homepageCardRows],
  ["about_content", [aboutContentRow]],
  ["contact_content", [contactContentRow]],
  ["leads", leadRows],
  ["lead_notes", leadNoteRows],
  ["lead_activity", leadActivityRows],
];

console.log("=== MIGRATION PLAN (row counts, in insert order) ===");
for (const [table, rows] of plan) console.log(`  ${table}: ${rows.length}`);
console.log("\nNOT included in this script (see header comment): profiles (Auth Admin API, manual),");
console.log("sessions.json (retired), leadform.json / marketing.json (no destination table yet).");

// ---------------------------------------------------------------------------
// Verification (dry run and --verify): confirm each target table is reachable
// and report its CURRENT remote row count. Read-only GET requests only.
// ---------------------------------------------------------------------------
async function currentCount(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, Prefer: "count=exact", Range: "0-0" },
  });
  const range = res.headers.get("content-range"); // "0-0/N"
  const total = range ? Number(range.split("/")[1]) : null;
  return { status: res.status, total };
}

if (VERIFY) {
  console.log("\n=== REMOTE VERIFICATION (read-only, no writes) ===");
  for (const [table] of plan) {
    const { status, total } = await currentCount(table);
    console.log(`  ${table}: HTTP ${status}, current remote rows = ${total}`);
  }
}

if (!EXECUTE) {
  console.log("\nDRY RUN — no rows were written to Supabase. Re-run with --execute to insert for real.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Execute (only reached with --execute)
// ---------------------------------------------------------------------------
async function insert(table, rows) {
  if (rows.length === 0) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${table} insert failed: HTTP ${res.status} — ${await res.text()}`);
}

console.log("\n=== EXECUTING ===");
for (const [table, rows] of plan) {
  await insert(table, rows);
  console.log(`  inserted ${rows.length} into ${table}`);
}
console.log("\nDone.");
