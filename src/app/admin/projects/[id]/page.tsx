"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  adminButtonDanger,
  adminButtonPrimary,
  adminButtonSecondary,
  FieldGrid,
  MultiCheckField,
  NumberField,
  SaveStatusMessage,
  Section,
  SelectField,
  Spinner,
  TagListField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/fields";
import { GalleryManager, MediaField } from "@/components/admin/media";
import { ProjectFieldRenderer } from "@/components/admin/ProjectFieldRenderer";
import { SeoEditor } from "@/components/admin/SeoEditor";
import { applyFlatGallery, flattenGallery } from "@/lib/admin/gallery";
import {
  deleteProject,
  discardProjectEdits,
  getHomepageContent,
  getProject,
  saveProject,
} from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { AdminMediaSection, AdminProject } from "@/lib/admin/types";
import { PROJECT_CATEGORIES } from "@/types/project";
import {
  getCategoryConfig,
  getCategoryDisplayName,
  getDynamicFields,
  relabelForCategory,
  type CategoryFieldDef,
} from "@/types/category-config";

/**
 * [CMS Phase C] Dedicated to a category's dynamic fields, so the same
 * heading style `Section` already uses for its own title doesn't need a
 * second, visually-different subsection component — no new design
 * language, just the existing Section title treatment nested one level
 * deeper.
 */
function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <p className="text-label text-text-tertiary">{title}</p>
      {children}
    </div>
  );
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Appropriate, non-blocking-on-optional-fields validation — item 20. Never makes an optional case-study field required. */
function validateProject(project: AdminProject): string[] {
  const errors: string[] = [];

  if (!project.title.trim()) errors.push("Title is required.");
  if (!project.slug.trim()) errors.push("Slug is required.");
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(project.slug)) {
    errors.push("Slug must be lowercase letters, numbers, and hyphens only (e.g. \"my-project\").");
  }
  if (!project.category) errors.push("Category is required.");

  const currentYear = new Date().getFullYear();
  if (!Number.isFinite(project.year) || project.year < 1990 || project.year > currentYear + 1) {
    errors.push(`Year should be between 1990 and ${currentYear + 1}.`);
  }

  if (project.projectUrl && !isValidUrl(project.projectUrl)) {
    errors.push("Project URL is not a valid URL.");
  }
  const prototypeUrl = (project.caseStudy as unknown as Record<string, unknown>).prototype;
  if (typeof prototypeUrl === "string" && prototypeUrl && !isValidUrl(prototypeUrl)) {
    errors.push("Prototype Link is not a valid URL.");
  }

  return errors;
}

export default function ProjectEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<AdminProject | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // [Service-catalog fix] Was a hardcoded `siteServices.map(s => s.title)`
  // read straight from src/content/site.ts's static array — stale as of
  // the Homepage CMS pass, which made Services genuinely admin-managed
  // (add/edit/remove/reorder at /admin/homepage §5) but left this
  // checklist still reading the old, no-longer-live constant. Fetching
  // the same `getHomepageContent()` every other Services consumer now
  // reads makes "the admin can add/edit/remove service types" (this
  // project's own brief) literally true: a service added in Homepage →
  // Services immediately becomes selectable here, for every category, not
  // just Graphic Design — no separate catalog to keep in sync.
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const saveState = useSaveStatus();
  const deleteState = useSaveStatus();

  useEffect(() => {
    // Client-only fetch, deferred past hydration on purpose — see
    // src/app/admin/about/page.tsx for the same pattern.
    let cancelled = false;
    getProject(params.id).then((p) => {
      if (cancelled) return;
      if (!p) {
        setNotFound(true);
        return;
      }
      setProject(p);
    });
    getHomepageContent().then((h) => {
      if (cancelled) return;
      setServiceOptions(
        [...h.services].filter((s) => s.visible).sort((a, b) => a.order - b.order).map((s) => s.title),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <div>
        <p className="text-body">No project with id &ldquo;{params.id}&rdquo; was found.</p>
        <Link href="/admin/projects" className="text-body text-accent underline">
          Back to projects
        </Link>
      </div>
    );
  }

  if (!project) return <p className="text-body text-text-secondary">Loading…</p>;

  function update(patch: Partial<AdminProject>) {
    setProject((p) => (p ? { ...p, ...patch } : p));
  }
  function updateCaseStudy(patch: Partial<AdminProject["caseStudy"]>) {
    setProject((p) => (p ? { ...p, caseStudy: { ...p.caseStudy, ...patch } } : p));
  }
  function updateSeo(patch: NonNullable<AdminProject["seo"]>) {
    setProject((p) => (p ? { ...p, seo: { ...p.seo, ...patch } } : p));
  }

  async function handleSave() {
    if (!project) return;
    const errors = validateProject(project);
    setValidationErrors(errors);
    if (errors.length > 0) return;
    await saveState.run(async () => {
      await saveProject(project);
    });
  }

  async function handleDiscard() {
    if (!project) return;
    saveState.reset();
    await discardProjectEdits(project.id);
    const fresh = await getProject(project.id);
    setProject(fresh ?? null);
    setNotFound(!fresh);
    setValidationErrors([]);
  }

  async function handleDelete() {
    if (!project) return;
    // [CMS Phase D2] Real deletion now — data/projects.json is the live
    // source, so this permanently removes the row, for any project
    // (including one seeded from real-projects.ts). D1's "hidden from
    // admin, but real-projects.ts and the public site are unaffected"
    // caveat no longer applies now that the JSON store is what the public
    // site actually reads.
    const warning = `Permanently delete "${project.title}"? This removes it from the persisted project store entirely — it will disappear from the public site as well as the admin dashboard. This cannot be undone from the UI.`;
    if (!window.confirm(warning)) return;
    // [CMS Phase D3 follow-up] Routed through useSaveStatus so a failed
    // delete (e.g. the API route erroring) surfaces a visible error and
    // re-enables the button, instead of the delete silently doing nothing
    // and leaving the admin unsure whether it worked — the same failure
    // mode useSaveStatus.ts's header comment documents for Save.
    await deleteState.run(async () => {
      await deleteProject(project.id);
      router.push("/admin/projects");
    });
  }

  const galleryItems = flattenGallery(project);
  const finalDesignLabel = relabelForCategory(project.category, "finalDesign");
  const saveLabel = project.published ? "Save & Publish" : "Save Draft";

  // [CMS Phase C] The category-driven core of this editor: everything
  // below is derived from CATEGORY_CONFIG (src/types/category-config.ts)
  // for the currently-selected category — nothing here hardcodes a
  // per-category field list a second time. `getDynamicFields` already
  // excludes anything covered by the fixed Basic Information/Case Study
  // Basics sections below, so no field renders twice.
  const categoryConfig = getCategoryConfig(project.category);
  const dynamicFields = getDynamicFields(project.category);
  const nonGalleryFields = dynamicFields.filter((f) => f.type !== "gallery");
  const gallerySections = Array.from(
    new Set<AdminMediaSection>([
      "gallery",
      ...dynamicFields
        .filter((f) => f.type === "gallery")
        .map((f) => f.key as AdminMediaSection),
    ]),
  );
  const fieldGroups: { name: string; fields: CategoryFieldDef[] }[] = [];
  for (const field of nonGalleryFields) {
    const name = field.group ?? "Details";
    let bucket = fieldGroups.find((g) => g.name === name);
    if (!bucket) {
      bucket = { name, fields: [] };
      fieldGroups.push(bucket);
    }
    bucket.fields.push(field);
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/projects" className="text-caption text-accent underline">
            ← All projects
          </Link>
          <h1 className="text-h1 mt-2">{project.title || "Untitled project"}</h1>
          <p className="text-caption mt-1 text-text-tertiary">
            id: {project.id} · {project.published ? "Published" : "Draft"}
            {project.isAdminDraft ? " · created in admin" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/projects/${project.id}/preview`} className={adminButtonSecondary}>
            Preview
          </Link>
          <button type="button" onClick={handleDiscard} disabled={saveState.isBusy} className={adminButtonSecondary}>
            Discard unsaved edits
          </button>
          <button type="button" onClick={handleDelete} disabled={deleteState.isBusy} className={adminButtonDanger}>
            {deleteState.isBusy ? <Spinner className="text-error" /> : null}
            {deleteState.isBusy ? "Deleting…" : "Delete"}
          </button>
          <button type="button" onClick={handleSave} disabled={saveState.isBusy} className={adminButtonPrimary}>
            {saveState.isBusy ? <Spinner className="text-white" /> : null}
            {saveState.isBusy ? "Saving…" : saveLabel}
          </button>
        </div>
      </div>

      {validationErrors.length === 0 ? (
        <SaveStatusMessage
          status={saveState.status}
          error={saveState.error}
          savedLabel="Saved to the persisted project store — the public site reads this on its next load."
        />
      ) : null}
      {deleteState.status === "error" ? (
        <SaveStatusMessage status={deleteState.status} error={deleteState.error} />
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="rounded-md border border-error bg-error/5 p-4">
          <p className="text-caption font-medium text-error">Fix these before saving:</p>
          <ul className="mt-1 list-inside list-disc text-caption text-error">
            {validationErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* BASIC INFORMATION */}
      <Section title="Basic Information" description="Core identity fields — every project needs these, regardless of category.">
        <FieldGrid>
          <TextField id="title" label="Title" required value={project.title} onChange={(v) => update({ title: v })} />
          <TextField
            id="slug"
            label="Slug"
            required
            value={project.slug}
            help="Must match the image folder name under public/images/projects/"
            onChange={(v) => update({ slug: v })}
          />
          <SelectField
            id="category"
            label="Category"
            required
            value={project.category}
            options={PROJECT_CATEGORIES}
            getOptionLabel={getCategoryDisplayName}
            help="Changing this changes which fields appear below — data already entered for other categories is kept, not deleted."
            onChange={(v) => update({ category: v })}
          />
          <TextField
            id="projectType"
            label="Project Type"
            required
            help={
              categoryConfig && categoryConfig.exampleProjectTypes.length > 0
                ? `Free text — e.g. ${categoryConfig.exampleProjectTypes.join(", ")}`
                : "Free text, e.g. Brand Identity, Mobile App"
            }
            value={project.projectType}
            onChange={(v) => update({ projectType: v })}
          />
          <NumberField id="year" label="Year" required value={project.year} onChange={(v) => update({ year: v })} />
          <TextField
            id="client"
            label="Client"
            value={project.client ?? ""}
            help="Leave blank for personal/unpublished work"
            onChange={(v) => update({ client: v || undefined })}
          />
          <TextField id="role" label="Role" required value={project.role} onChange={(v) => update({ role: v })} />
          <TextField
            id="projectUrl"
            label="Project URL"
            type="url"
            value={project.projectUrl ?? ""}
            help="Live shipped URL, if one exists"
            onChange={(v) => update({ projectUrl: v || undefined })}
          />
        </FieldGrid>

        <TextAreaField
          id="shortDescription"
          label="Short Description"
          required
          help="One line — shown on project cards"
          value={project.shortDescription}
          onChange={(v) => update({ shortDescription: v })}
          rows={2}
        />
        <TextAreaField
          id="description"
          label="Description"
          help="Longer hero paragraph — falls back to Short Description if left blank"
          value={project.description ?? ""}
          onChange={(v) => update({ description: v || undefined })}
        />

        <FieldGrid>
          <TagListField id="tags" label="Tags" values={project.tags} onChange={(v) => update({ tags: v })} />
          <TagListField id="tools" label="Tools" values={project.tools} onChange={(v) => update({ tools: v })} />
        </FieldGrid>
        <MultiCheckField
          label="Services"
          help="Managed at /admin/homepage → Services — add/edit/remove entries there, they appear here automatically"
          options={serviceOptions}
          values={project.services}
          onChange={(v) => update({ services: v })}
        />
      </Section>

      {/* CASE STUDY BASICS — common to every category, per docs/CMS_CONTENT_MODEL.md §3 */}
      <Section
        title="Case Study Basics"
        description="Overview and Outcome are the only fields required by the schema. Constraint (if present) always opens the public story; leave anything blank rather than padding it — absent fields simply don't render a section."
      >
        <TextAreaField
          id="overview"
          label="Overview"
          required
          help="Stored on the case study, not the basic fields — used by the homepage Case Study Preview"
          value={project.caseStudy.overview}
          onChange={(v) => updateCaseStudy({ overview: v })}
        />
        <TextAreaField
          id="challenge"
          label="Challenge"
          help="The core challenge/problem being solved"
          value={project.caseStudy.challenge ?? ""}
          onChange={(v) => updateCaseStudy({ challenge: v || undefined })}
          rows={2}
        />
        <TextAreaField
          id="constraint"
          label="Constraint"
          help="Budget/timeline/stakeholder/technical constraint — always opens the public story if present"
          value={project.caseStudy.constraint ?? ""}
          onChange={(v) => updateCaseStudy({ constraint: v || undefined })}
          rows={2}
        />
        <TextAreaField
          id="outcome"
          label="Outcome"
          required
          help="Honest outcome — never a fabricated metric"
          value={project.caseStudy.outcome}
          onChange={(v) => updateCaseStudy({ outcome: v })}
        />
      </Section>

      {/* CATEGORY CONTENT — dynamic, driven entirely by CATEGORY_CONFIG for the selected category. This is what replaces the old always-show-every-field Case Study/Design Process/Branding sections. */}
      {categoryConfig ? (
        <Section
          title={`${categoryConfig.displayName} Content`}
          description={categoryConfig.description}
        >
          {fieldGroups.map((group) => (
            <Subsection key={group.name} title={group.name.toUpperCase()}>
              {group.fields.map((field) => (
                <ProjectFieldRenderer
                  key={String(field.key)}
                  field={field}
                  project={project}
                  onProjectChange={update}
                  onCaseStudyChange={updateCaseStudy}
                  projectSlug={project.slug}
                />
              ))}
            </Subsection>
          ))}
        </Section>
      ) : (
        <Section
          title="Category Content"
          description={`"${project.category}" is a legacy category with no field schema — pick one of the current categories above to get category-specific fields, or continue editing this project's existing data directly via Preview.`}
        >
          <p className="text-caption text-text-tertiary">No dynamic fields for this category.</p>
        </Section>
      )}

      {/* MEDIA / GALLERY */}
      <Section
        title="Media / Gallery"
        description={`Cover and thumbnail are single images. Everything else — the general gallery plus this category's image stages (${gallerySections
          .filter((s) => s !== "gallery")
          .map((s) => (s === "finalDesign" ? finalDesignLabel : s))
          .join(", ") || "none for this category"}) — is managed as one unified list, tagged by section. Image selection is limited to files that already exist under public/images/projects/${project.slug}/ — nothing here is invented. Sections outside this category (e.g. left over after switching category) still appear and stay editable — nothing is hidden or deleted.`}
      >
        <MediaField
          label="Cover Image (featured image)"
          required
          media={project.coverImage}
          projectSlug={project.slug}
          onChange={(m) => update({ coverImage: m })}
          help="Hero banner + homepage exhibition tiles"
        />
        <MediaField
          label="Thumbnail"
          media={project.thumbnail ?? { kind: "placeholder", category: "brand-mark", alt: "" }}
          projectSlug={project.slug}
          onChange={(m) => update({ thumbnail: m })}
          help="Falls back to Cover Image on cards if left as a placeholder"
        />
        <GalleryManager
          items={galleryItems}
          projectSlug={project.slug}
          sections={gallerySections}
          onChange={(items) => setProject((p) => (p ? applyFlatGallery(p, items) : p))}
        />
      </Section>

      {/* PUBLISHING */}
      <Section title="Publishing" description="Visibility and ordering — controls what's live and where.">
        <FieldGrid>
          <ToggleField
            id="published"
            label="Published"
            checked={project.published}
            onChange={(v) => update({ published: v })}
            help="Off = the /work/[slug] route doesn't exist at all"
          />
          <ToggleField
            id="featured"
            label="Featured"
            checked={project.featured}
            onChange={(v) => update({ featured: v })}
            help="Appears in homepage Hero + Featured Work"
          />
        </FieldGrid>
        <FieldGrid>
          <NumberField id="order" label="Order" required value={project.order} onChange={(v) => update({ order: v })} />
          {project.featured ? (
            <NumberField
              id="featuredOrder"
              label="Featured Order"
              value={project.featuredOrder ?? 0}
              onChange={(v) => update({ featuredOrder: v })}
              help="Lower number shows first among featured projects"
            />
          ) : null}
        </FieldGrid>
      </Section>

      {/* SEO */}
      <SeoEditor
        seo={project.seo}
        onChange={updateSeo}
        projectSlug={project.slug}
        slugForReference={project.slug}
      />

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <SaveStatusMessage status={saveState.status} error={saveState.error} />
        <button
          type="button"
          onClick={() => router.push("/admin/projects")}
          disabled={saveState.isBusy}
          className={adminButtonSecondary}
        >
          Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saveState.isBusy} className={adminButtonPrimary}>
          {saveState.isBusy ? <Spinner className="text-white" /> : null}
          {saveState.isBusy ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
