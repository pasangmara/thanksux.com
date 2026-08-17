import { cache } from "react";
import { readJsonFile, writeJsonFile } from "./fileStore";
import { realProjects } from "@/content/real-projects";
import { isSupabaseBackendEnabled } from "./dataBackend";
import { fetchAllProjectsFromSupabase } from "./supabase/mapProject";
import { checkSlugConflict, deleteProjectFromSupabase, saveProjectToSupabase } from "./supabase/writeProject";
import type { AdminProject } from "@/lib/admin/types";
import type { CanonicalProjectCategory } from "@/types/project";

/**
 * [CMS Phase D2] Server-only project repository — the real persistence
 * layer replacing D1's localStorage overlay. `data/projects.json` is now
 * the live source of truth for every project (including Gridmark), not
 * `real-projects.ts` — that file is read exactly once, the first time
 * this repository is ever used, purely to seed the JSON store with the
 * real, approved content that already existed. It is never written back
 * to; nothing here can rewrite Gridmark's source file. Once seeded, every
 * read/write goes through `data/projects.json`.
 *
 * This is the module the new `/api/admin/projects/**` Route Handlers call
 * (browser → API route → this file → filesystem) and the module
 * `src/content/projects.ts` calls directly for public reads (same Node
 * process, no HTTP round-trip needed for a server-to-server read).
 */

const PROJECTS_FILE = "projects.json";

function seedProjects(): AdminProject[] {
  // Structurally, AdminProject is Project plus optional admin-only
  // fields (seo, isAdminDraft) and AdminMedia (CoverMedia plus optional
  // caption/order/description) in place of CoverMedia — every
  // real-projects.ts entry already satisfies that shape as-is.
  return realProjects as unknown as AdminProject[];
}

/**
 * [Carried forward from D1's store.ts, unchanged in behavior] Fills safe
 * defaults for any field a stored `AdminProject` might be missing — e.g. a
 * record written before a schema field existed. Every default is an
 * empty/neutral value, never an invented fact; real, already-complete
 * records (like Gridmark's) pass through with no change.
 */
function normalizeProject(project: AdminProject): AdminProject {
  return {
    ...project,
    gallery: project.gallery ?? [],
    tags: project.tags ?? [],
    tools: project.tools ?? [],
    services: project.services ?? [],
    coverImage: project.coverImage ?? { kind: "placeholder", category: "brand-mark", alt: "" },
    caseStudy: project.caseStudy
      ? { ...project.caseStudy, overview: project.caseStudy.overview ?? "", outcome: project.caseStudy.outcome ?? "" }
      : { overview: "", outcome: "" },
  };
}

async function readAllProjects(): Promise<AdminProject[]> {
  const raw = await readJsonFile<AdminProject[]>(PROJECTS_FILE, seedProjects);
  return raw.map(normalizeProject);
}

async function writeAllProjects(records: AdminProject[]): Promise<void> {
  await writeJsonFile(PROJECTS_FILE, records);
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * [Project creation fix] Appends `-2`, `-3`, … until `candidate` doesn't
 * collide with any id in `taken` — the uniqueness guard
 * `docs/PROJECT_EDITOR_ARCHITECTURE.md` §2/§9 identified as missing and
 * this pass implements. Root cause of the broken "+ New draft project"
 * flow: two drafts created with the same (or same-slugifying) title used
 * to silently produce two rows sharing one `id` in `data/projects.json` —
 * every id-keyed lookup (`getProjectById`, `saveProjectRecord`'s
 * `findIndex`) matches the *first* one, so the second became a permanently
 * unreachable duplicate and any edit made after opening it landed on the
 * wrong project instead.
 */
function uniqueId(candidate: string, taken: ReadonlySet<string>): string {
  if (!taken.has(candidate)) return candidate;
  let suffix = 2;
  while (taken.has(`${candidate}-${suffix}`)) suffix += 1;
  return `${candidate}-${suffix}`;
}

/**
 * [Phase 4 — Read-path migration] Reads come from Supabase when
 * DATA_BACKEND=supabase (see dataBackend.ts), JSON otherwise — the only
 * two lines that branch in this whole file. Writes (createProjectRecord/
 * saveProjectRecord/deleteProjectRecord below) are untouched and always
 * go to data/projects.json regardless of this flag; see
 * docs/PHASE_4_READ_MIGRATION.md for why, and for the rollback path
 * (unset DATA_BACKEND).
 */
/**
 * [Perf — request-level dedup] `cache()`-wrapped: `/work/[slug]` calls
 * this chain (via getPublishedProjects/getProjects) from its own
 * `generateMetadata`, the page body, and `ProjectNavigation`'s own
 * prev/next lookup — measured (temporary query-timing instrumentation) at
 * 3 duplicate full-table `fetchAllProjectsFromSupabase()` calls (4 queries
 * each: projects/gallery_items/custom_sections/media_assets, all
 * unfiltered `select=*`) per single project-detail request before this
 * change. Scoped to one render pass only — the next request (including
 * right after an admin save) always re-reads.
 */
const readAllProjectsForCallers = cache(async (): Promise<AdminProject[]> => {
  if (isSupabaseBackendEnabled()) return fetchAllProjectsFromSupabase();
  return readAllProjects();
});

/** Every project, in display order. This is the full admin-facing list — includes unpublished drafts. */
export async function listAllProjects(): Promise<AdminProject[]> {
  const all = await readAllProjectsForCallers();
  return [...all].sort((a, b) => a.order - b.order);
}

export async function getProjectById(id: string): Promise<AdminProject | undefined> {
  const all = await readAllProjectsForCallers();
  return all.find((p) => p.id === id);
}

/**
 * Creates and persists a new, blank draft project — mirrors D1's
 * createProject() defaults exactly, plus the unique-id guard (`uniqueId()`
 * above) and an explicit `category` parameter so category can genuinely be
 * the first decision at creation time (defaults to "Graphic Design" only
 * if omitted, for backward compatibility with any existing caller).
 */
export async function createProjectRecord(
  title: string,
  category: CanonicalProjectCategory = "Graphic Design",
): Promise<AdminProject> {
  const all = await readAllProjectsForCallers();
  const base = slugify(title) || `project-${Date.now()}`;
  const id = uniqueId(base, new Set(all.map((p) => p.id)));
  const existingOrders = all.map((p) => p.order);
  const nextOrder = existingOrders.length > 0 ? Math.max(...existingOrders) + 1 : 1;

  const project: AdminProject = {
    id,
    title: title || "Untitled project",
    slug: id,
    category,
    projectType: "",
    year: new Date().getFullYear(),
    role: "",
    shortDescription: "",
    coverImage: { kind: "placeholder", category: "brand-mark", alt: "" },
    gallery: [],
    featured: false,
    published: false,
    tags: [],
    tools: [],
    services: [],
    order: nextOrder,
    isAdminDraft: true,
    caseStudy: { overview: "", outcome: "" },
  };

  if (isSupabaseBackendEnabled()) {
    await saveProjectToSupabase(project);
    return project;
  }
  all.push(project);
  await writeAllProjects(all);
  return project;
}

/**
 * Upserts a project record — creates if the id doesn't exist yet,
 * otherwise replaces it in place (preserving its position).
 *
 * [Project creation fix] Rejects the save (throws) if `project.slug`
 * collides with a *different* project's slug — `/work/[slug]` resolves by
 * `.find(p => p.slug === slug)`, so two projects sharing a slug would
 * silently make one of them permanently unreachable at that URL, with the
 * admin given no indication why. The route handler that calls this
 * surfaces the thrown message as a real, visible save error (see
 * `api/admin/projects/[id]/route.ts`) rather than the save just quietly
 * corrupting the other project's public URL — the "do not silently
 * overwrite another project" requirement this was written to satisfy.
 */
export async function saveProjectRecord(project: AdminProject): Promise<AdminProject> {
  const normalized = normalizeProject(project);

  if (isSupabaseBackendEnabled()) {
    await checkSlugConflict(normalized);
    await saveProjectToSupabase(normalized);
    return normalized;
  }

  const all = await readAllProjects();
  const slugConflict = all.find((p) => p.id !== project.id && p.slug === project.slug);
  if (slugConflict) {
    throw new Error(
      `Slug "${project.slug}" is already used by another project ("${slugConflict.title}"). Choose a different slug.`,
    );
  }
  const index = all.findIndex((p) => p.id === project.id);
  if (index >= 0) all[index] = normalized;
  else all.push(normalized);
  await writeAllProjects(all);
  return normalized;
}

/**
 * [CMS Phase D2] Real, complete deletion — removes the row from
 * `data/projects.json` outright. Unlike D1's tombstone (necessary back
 * when `real-projects.ts` was still the live source and couldn't be
 * rewritten), this is a genuine delete: `data/projects.json` IS the live
 * source now, so removing a row from it is the real thing, not a filtered
 * view. `real-projects.ts` itself is never touched by this — Gridmark's
 * source file stays exactly as written; only its (already-seeded) JSON
 * copy would be affected if it were ever deleted, which the admin UI
 * gates behind an explicit confirmation.
 */
export async function deleteProjectRecord(id: string): Promise<void> {
  if (isSupabaseBackendEnabled()) {
    // id maps to slug — see writeProject.ts's header comment. ON DELETE
    // CASCADE removes gallery_items/custom_sections automatically.
    await deleteProjectFromSupabase(id);
    return;
  }
  const all = await readAllProjects();
  const next = all.filter((p) => p.id !== id);
  await writeAllProjects(next);
}
