"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MediaField } from "@/components/admin/media";
import {
  adminButtonDanger,
  adminButtonPrimary,
  adminButtonSecondary,
  FieldGrid,
  SaveStatusMessage,
  Section,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/fields";
import {
  deleteReviewRecord,
  getReview,
  listProjects,
  runReviewAction,
  saveReviewContent,
  type AdminClientReview,
} from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { AdminMedia } from "@/lib/admin/types";
import type { AdminProject } from "@/lib/admin/types";

const RATING_OPTIONS = ["No rating", "1", "2", "3", "4", "5"] as const;

function ratingToOption(rating: number | null): (typeof RATING_OPTIONS)[number] {
  return rating && rating >= 1 && rating <= 5 ? (String(rating) as (typeof RATING_OPTIONS)[number]) : "No rating";
}

/**
 * [Phase 6G Part B §11] Full editor for one Client Review. Avatar reuses
 * `MediaField` exactly as-is (Choose existing/Upload new/Preview/alt text/
 * Clear) — the same component every other single-image field in this admin
 * already uses (Logo, Brand Mark, project cover images), so this is zero
 * new media code, just a new call site.
 */
export default function AdminReviewEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [review, setReview] = useState<AdminClientReview | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [projects, setProjects] = useState<AdminProject[]>([]);

  const [clientName, setClientName] = useState("");
  const [clientRole, setClientRole] = useState("");
  const [company, setCompany] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [avatar, setAvatar] = useState<AdminMedia>({ kind: "placeholder", category: "brand-mark", alt: "" });
  const [projectId, setProjectId] = useState<string>("");
  const [ratingOption, setRatingOption] = useState<(typeof RATING_OPTIONS)[number]>("No rating");

  const saveState = useSaveStatus();
  const actionState = useSaveStatus();

  useEffect(() => {
    let cancelled = false;
    Promise.all([getReview(params.id), listProjects()]).then(([r, p]) => {
      if (cancelled) return;
      if (!r) {
        setNotFound(true);
        return;
      }
      setReview(r);
      setProjects(p);
      setClientName(r.clientName);
      setClientRole(r.clientRole ?? "");
      setCompany(r.company ?? "");
      setReviewText(r.reviewText);
      setAvatar(
        r.avatarUrl ? { kind: "image", src: r.avatarUrl, alt: r.avatarAlt ?? "" } : { kind: "placeholder", category: "brand-mark", alt: "" },
      );
      setProjectId(r.projectId ?? "");
      setRatingOption(ratingToOption(r.rating));
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <div>
        <p className="text-body">No review with id &ldquo;{params.id}&rdquo; was found.</p>
        <Link href="/admin/reviews" className="text-body text-accent underline">
          Back to Reviews
        </Link>
      </div>
    );
  }
  if (!review) return <p className="text-body text-text-secondary">Loading…</p>;

  async function handleSave() {
    await saveState.run(async () => {
      const updated = await saveReviewContent(params.id, {
        clientName: clientName.trim(),
        clientRole,
        company,
        reviewText: reviewText.trim(),
        avatarSrc: avatar.kind === "image" ? avatar.src : null,
        avatarAlt: avatar.kind === "image" ? avatar.alt : "",
        projectId: projectId || null,
        rating: ratingOption === "No rating" ? null : Number(ratingOption),
      });
      setReview(updated);
    });
  }

  async function handleAction(action: "publish" | "unpublish" | "feature" | "unfeature") {
    await actionState.run(async () => {
      const updated = await runReviewAction(params.id, action);
      setReview(updated);
    });
  }

  async function handleDelete() {
    if (!review) return;
    const warning = `Permanently delete the review from "${review.clientName}"? This cannot be undone from the UI.`;
    if (!window.confirm(warning)) return;
    await actionState.run(async () => {
      await deleteReviewRecord(params.id);
      router.push("/admin/reviews");
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <Link href="/admin/reviews" className="text-caption text-accent underline">
          ← All Reviews
        </Link>
        <h1 className="text-h1 mt-2">{review.clientName || "(untitled review)"}</h1>
      </div>

      <Section title="Content" description="What renders on the homepage once published.">
        <FieldGrid>
          <TextField id="review-name" label="Client name" required value={clientName} onChange={setClientName} />
          <TextField id="review-role" label="Client role" value={clientRole} onChange={setClientRole} />
        </FieldGrid>
        <FieldGrid>
          <TextField id="review-company" label="Company" value={company} onChange={setCompany} />
          <SelectField
            id="review-rating"
            label="Rating"
            value={ratingOption}
            options={RATING_OPTIONS}
            onChange={setRatingOption}
          />
        </FieldGrid>
        <TextAreaField id="review-text" label="Review text" required rows={5} value={reviewText} onChange={setReviewText} />

        <div>
          <p className="mb-1.5 text-caption font-medium text-ink">
            Linked project <span className="ml-1 text-text-tertiary">(optional)</span>
          </p>
          <select
            id="review-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink transition-colors duration-150 ease-out hover:border-text-tertiary focus:border-accent focus:shadow-focus focus:outline-none"
          >
            <option value="">No linked project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-caption text-text-tertiary">When set, the homepage card links to /work/{projectId ? (projects.find((p) => p.id === projectId)?.slug ?? "…") : "…"}.</p>
        </div>

        <MediaField label="Avatar" media={avatar} onChange={setAvatar} help="Optional — a client photo or headshot" />

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSave} disabled={saveState.isBusy} className={adminButtonPrimary}>
            {saveState.isBusy ? "Saving…" : "Save"}
          </button>
          <SaveStatusMessage status={saveState.status} error={saveState.error} />
        </div>
      </Section>

      <Section title="Moderation" description="Controls whether — and how prominently — this review shows on the homepage.">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-sm border border-accent px-2.5 py-1 text-caption text-accent">
            {review.published ? "published" : "draft"}
          </span>
          <span className="inline-flex rounded-sm border border-border px-2.5 py-1 text-caption text-text-secondary">
            {review.featured ? "featured" : "not featured"}
          </span>
        </div>
        <SaveStatusMessage status={actionState.status} error={actionState.error} savedLabel="Updated" />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleAction(review.published ? "unpublish" : "publish")}
            disabled={actionState.isBusy}
            className={adminButtonSecondary}
          >
            {review.published ? "Unpublish" : "Publish"}
          </button>
          <button
            type="button"
            onClick={() => handleAction(review.featured ? "unfeature" : "feature")}
            disabled={actionState.isBusy}
            className={adminButtonSecondary}
          >
            {review.featured ? "Unfeature" : "Feature"}
          </button>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <button type="button" onClick={handleDelete} disabled={actionState.isBusy} className={adminButtonDanger}>
          Delete review
        </button>
        <Link href="/admin/reviews" className={adminButtonSecondary}>
          Back
        </Link>
      </div>
    </div>
  );
}
