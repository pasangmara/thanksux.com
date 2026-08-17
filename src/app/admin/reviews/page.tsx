"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminButtonSmall, adminButtonSmallDanger, ReorderControls, SaveStatusMessage, Spinner } from "@/components/admin/fields";
import { createReviewRecord, deleteReviewRecord, listReviews, runReviewAction, type AdminClientReview } from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";

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

function Avatar({ review }: { review: AdminClientReview }) {
  if (review.avatarUrl) {
    // [Perf] Was a plain <img> shipping the full uploaded source photo
    // (uploads run up to 8MB, see api/admin/images' MAX_UPLOAD_BYTES) for a
    // 48x48 circle — next/image requests/generates an appropriately-sized
    // version instead. Only JPEG/PNG/WEBP are ever accepted by the upload
    // endpoint, so this is never handed an SVG (the one case elsewhere in
    // this codebase that genuinely needs a plain <img>).
    return (
      <Image
        src={review.avatarUrl}
        alt={review.avatarAlt ?? ""}
        width={48}
        height={48}
        className="h-12 w-12 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background-alt text-caption text-text-tertiary">
      {review.clientName.slice(0, 1).toUpperCase() || "?"}
    </div>
  );
}

/**
 * [Phase 6G Part B §9/§10] `/admin/reviews` — mirrors /admin/projects'
 * list-page shape exactly (table + row actions + create form), extended
 * with Feature/Unfeature and Move up/down (`ReorderControls`, the same
 * fixed-size icon-button component every other reorderable list in this
 * admin already uses — see fields.tsx's header comment on why: a
 * predictable box so `flex-wrap` never lets a row's actions overflow its
 * table cell).
 */
export default function AdminReviewsListPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<AdminClientReview[] | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const createState = useSaveStatus();
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  function refresh(): Promise<void> {
    return listReviews().then(setReviews);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAction(review: AdminClientReview, action: Parameters<typeof runReviewAction>[1]) {
    if (busyRowId) return;
    setBusyRowId(review.id);
    setRowError(null);
    try {
      await runReviewAction(review.id, action);
      await refresh();
    } catch (err) {
      setRowError({ id: review.id, message: err instanceof Error ? err.message : "Could not update this review." });
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleDelete(review: AdminClientReview) {
    if (busyRowId) return;
    const warning = `Permanently delete the review from "${review.clientName}"? This removes it from the persisted store entirely — it will disappear from the homepage as well as this list. This cannot be undone from the UI.`;
    if (!window.confirm(warning)) return;
    setBusyRowId(review.id);
    setRowError(null);
    try {
      await deleteReviewRecord(review.id);
      await refresh();
    } catch (err) {
      setRowError({ id: review.id, message: err instanceof Error ? err.message : "Could not delete this review." });
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleCreate() {
    if (!newClientName.trim() || createState.isBusy) return;
    await createState.run(async () => {
      const review = await createReviewRecord(newClientName.trim(), "");
      setNewClientName("");
      await refresh();
      router.push(`/admin/reviews/${review.id}`);
    });
  }

  if (!reviews) return <p className="text-body text-text-secondary">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h1">Reviews</h1>
          <p className="text-body mt-2 text-text-secondary">
            {reviews.length} review{reviews.length === 1 ? "" : "s"} — persisted server-side in Supabase. Only published
            reviews render on the homepage.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              disabled={createState.isBusy}
              placeholder="Client name"
              className="rounded-md border border-border bg-surface px-3 py-2 text-body text-ink focus:border-accent focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              disabled={!newClientName.trim() || createState.isBusy}
              onClick={handleCreate}
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-ink px-4 py-2 text-body text-white transition-colors duration-150 ease-out hover:bg-ink-hover active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 focus-visible:shadow-focus focus-visible:outline-none"
            >
              {createState.isBusy ? <Spinner className="text-white" /> : null}
              {createState.isBusy ? "Creating…" : "+ New review"}
            </button>
          </div>
          <SaveStatusMessage status={createState.status} error={createState.error} savedLabel="Created" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-tertiary">
              <th className="p-3">Client</th>
              <th className="p-3">Review</th>
              <th className="p-3">Project</th>
              <th className="p-3">Published</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Order</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-caption text-text-tertiary">
                  No reviews yet — add one above.
                </td>
              </tr>
            ) : (
              reviews.map((review, i) => (
                <tr key={review.id} className="border-b border-border text-body last:border-b-0 align-top">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar review={review} />
                      <div>
                        <p className="text-body text-ink">{review.clientName}</p>
                        <p className="text-caption text-text-tertiary">
                          {[review.clientRole, review.company].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[280px] p-3 text-caption text-text-secondary">
                    {review.reviewText ? `${review.reviewText.slice(0, 120)}${review.reviewText.length > 120 ? "…" : ""}` : "—"}
                  </td>
                  <td className="p-3 text-caption text-text-secondary">{review.projectTitle ?? "—"}</td>
                  <td className="p-3">
                    <StatusBadge on={review.published} onLabel="Published" offLabel="Draft" />
                  </td>
                  <td className="p-3">
                    <StatusBadge on={review.featured} onLabel="Featured" offLabel="Not featured" />
                  </td>
                  <td className="p-3">
                    <ReorderControls
                      canMoveUp={i > 0}
                      canMoveDown={i < reviews.length - 1}
                      onMoveUp={() => handleAction(review, "moveUp")}
                      onMoveDown={() => handleAction(review, "moveDown")}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/reviews/${review.id}`} className={adminButtonSmall}>
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyRowId === review.id}
                        onClick={() => handleAction(review, review.published ? "unpublish" : "publish")}
                        className={adminButtonSmall}
                      >
                        {busyRowId === review.id ? <Spinner /> : null}
                        {review.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        disabled={busyRowId === review.id}
                        onClick={() => handleAction(review, review.featured ? "unfeature" : "feature")}
                        className={adminButtonSmall}
                      >
                        {review.featured ? "Unfeature" : "Feature"}
                      </button>
                      <button
                        type="button"
                        disabled={busyRowId === review.id}
                        onClick={() => handleDelete(review)}
                        className={adminButtonSmallDanger}
                      >
                        {busyRowId === review.id ? <Spinner className="text-error" /> : null}
                        Delete
                      </button>
                    </div>
                    {rowError?.id === review.id ? <p className="mt-1 text-caption text-error">{rowError.message}</p> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
