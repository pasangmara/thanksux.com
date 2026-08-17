"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminButtonSmall, adminButtonSmallDanger, SaveStatusMessage, Spinner } from "@/components/admin/fields";
import { createProject, deleteProject, listProjects, saveProject } from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { AdminProject } from "@/lib/admin/types";
import { PROJECT_CATEGORIES, type CanonicalProjectCategory } from "@/types/project";
import { getCategoryDisplayName } from "@/types/category-config";

function Thumb({ project }: { project: AdminProject }) {
  const media = project.thumbnail ?? project.coverImage;
  if (media.kind === "image") {
    // [Perf] Same fix as admin/reviews' Avatar — was a plain <img> shipping
    // the full uploaded source image for an 80x56 thumbnail. Only
    // JPEG/PNG/WEBP are ever uploaded (see api/admin/images), so this is
    // never handed an SVG.
    return (
      <Image
        src={media.src}
        alt={media.alt}
        width={80}
        height={56}
        className="h-14 w-20 rounded-sm border border-border object-cover"
      />
    );
  }
  return (
    <div className="flex h-14 w-20 items-center justify-center rounded-sm border border-border bg-background-alt">
      <span className="text-caption text-text-tertiary">No image</span>
    </div>
  );
}

function StatusBadge({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-caption ${
        on ? "border-ink bg-ink text-white" : "border-border text-text-tertiary"
      }`}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

export default function AdminProjectsListPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<AdminProject[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<CanonicalProjectCategory>("Graphic Design");
  const createState = useSaveStatus();
  // [Task 12/13 — list-level actions] Which row a Publish/Unpublish or
  // Delete action is currently in flight for, plus that row's error (if
  // any) — a single shared `useSaveStatus` instance can't distinguish
  // between rows, and every other admin action in this app already gives
  // visible loading/error feedback, so the list's own actions shouldn't be
  // the one place that goes silent.
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  function refresh(): Promise<void> {
    return listProjects().then(setProjects);
  }

  async function handleTogglePublish(p: AdminProject) {
    if (busyRowId) return;
    setBusyRowId(p.id);
    setRowError(null);
    try {
      await saveProject({ ...p, published: !p.published });
      await refresh();
    } catch (err) {
      setRowError({ id: p.id, message: err instanceof Error ? err.message : "Could not update this project." });
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleDelete(p: AdminProject) {
    if (busyRowId) return;
    // [Task 13 — delete safety] Explicit confirmation, same pattern as the
    // full editor's own Delete button (admin/projects/[id]/page.tsx) —
    // reused, not a second delete flow.
    const warning = `Permanently delete "${p.title}"? This removes it from the persisted project store entirely — it will disappear from the public site as well as the admin dashboard. This cannot be undone from the UI.`;
    if (!window.confirm(warning)) return;
    setBusyRowId(p.id);
    setRowError(null);
    try {
      await deleteProject(p.id);
      await refresh();
    } catch (err) {
      setRowError({ id: p.id, message: err instanceof Error ? err.message : "Could not delete this project." });
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim() || createState.isBusy) return;
    await createState.run(async () => {
      const p = await createProject(newTitle.trim(), newCategory);
      setNewTitle("");
      await refresh();
      router.push(`/admin/projects/${p.id}`);
    });
  }

  useEffect(() => {
    // Client-only fetch, deferred past hydration on purpose — see
    // src/app/admin/about/page.tsx for the same pattern.
    listProjects().then(setProjects);
  }, []);

  if (!projects) return <p className="text-body text-text-secondary">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h1">Projects</h1>
          <p className="text-body mt-2 text-text-secondary">
            {projects.length} project{projects.length === 1 ? "" : "s"} — persisted server-side
            in data/projects.json.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as CanonicalProjectCategory)}
              disabled={createState.isBusy}
              aria-label="Category for the new project"
              className="rounded-md border border-border bg-surface px-3 py-2 text-body text-ink focus:border-accent focus:outline-none disabled:opacity-60"
            >
              {PROJECT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {getCategoryDisplayName(c)}
                </option>
              ))}
            </select>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              disabled={createState.isBusy}
              placeholder="New project title"
              className="rounded-md border border-border bg-surface px-3 py-2 text-body text-ink focus:border-accent focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              disabled={!newTitle.trim() || createState.isBusy}
              onClick={handleCreate}
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-ink px-4 py-2 text-body text-white transition-colors duration-150 ease-out hover:bg-ink-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 focus-visible:shadow-focus focus-visible:outline-none"
            >
              {createState.isBusy ? <Spinner className="text-white" /> : null}
              {createState.isBusy ? "Creating…" : "+ New draft project"}
            </button>
          </div>
          <SaveStatusMessage status={createState.status} error={createState.error} savedLabel="Created" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-tertiary">
              <th className="p-3">Cover</th>
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Year</th>
              <th className="p-3">Client</th>
              <th className="p-3">Published</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-border text-body last:border-b-0">
                <td className="p-3">
                  <Thumb project={p} />
                </td>
                <td className="p-3">
                  <p className="text-body text-ink">{p.title}</p>
                  <p className="text-caption text-text-tertiary">
                    /work/{p.slug} {p.isAdminDraft ? "· admin-only draft" : ""}
                  </p>
                </td>
                <td className="p-3 text-body text-text-secondary">{p.category}</td>
                <td className="p-3 text-body text-text-secondary">{p.year}</td>
                <td className="p-3 text-body text-text-secondary">{p.client ?? "—"}</td>
                <td className="p-3">
                  <StatusBadge on={p.published} onLabel="Published" offLabel="Draft" />
                </td>
                <td className="p-3">
                  <StatusBadge on={p.featured} onLabel="Featured" offLabel="Not featured" />
                </td>
                <td className="p-3">
                  {/* [Admin UI/interaction fix] Same fixed action-button
                      language as every other admin surface now
                      (adminButtonSmall/adminButtonSmallDanger from
                      fields.tsx) instead of bare underlined text links —
                      consistent hover/active/disabled state, and
                      flex-wrap means this row degrades to a second line
                      at narrow widths instead of overflowing the table
                      cell. */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/projects/${p.id}`} className={adminButtonSmall}>
                      Edit
                    </Link>
                    <Link href={`/admin/projects/${p.id}/preview`} className={adminButtonSmall}>
                      Preview
                    </Link>
                    <button
                      type="button"
                      disabled={busyRowId === p.id}
                      onClick={() => handleTogglePublish(p)}
                      className={adminButtonSmall}
                    >
                      {busyRowId === p.id ? <Spinner /> : null}
                      {busyRowId === p.id ? "Working…" : p.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      type="button"
                      disabled={busyRowId === p.id}
                      onClick={() => handleDelete(p)}
                      className={adminButtonSmallDanger}
                    >
                      {busyRowId === p.id ? <Spinner className="text-error" /> : null}
                      Delete
                    </button>
                  </div>
                  {rowError?.id === p.id ? (
                    <p className="mt-1 text-caption text-error">{rowError.message}</p>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
