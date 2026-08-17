"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminButtonSmall } from "@/components/admin/fields";
import { getSignalCounts, listSignals, type AdminSignalListItem, type SignalModerationCounts } from "@/lib/admin/store";

/**
 * [Phase 6C — read-only listing; Phase 6D — filters + link into the new
 * review/moderation detail page] Filter tabs use the exact underlying
 * `thanks_signals.status`/`visibility` values (see
 * adminThanksSignalsRepository.ts's header comment for why: the schema
 * has no `under_review`/`approved`/`published`/`rejected` status values).
 * "Published" filters by `visibility = 'public'` specifically, since
 * publication is architecturally independent of status. "Rejected" is
 * intentionally not offered as its own tab — a rejected signal and an
 * archived one are the same underlying `archived` status, there being no
 * separate `rejected` value in the schema's CHECK constraint.
 */
const FILTERS: { label: string; status?: string; visibility?: string }[] = [
  { label: "All" },
  { label: "Draft", status: "draft" },
  { label: "Submitted", status: "submitted" },
  { label: "Under review", status: "reviewed" },
  { label: "Approved", status: "open" },
  { label: "Published", visibility: "public" },
  { label: "Archived", status: "archived" },
];

/** [Signals dashboard §C] One database-backed count per moderation bucket, filter-tab labels reused verbatim so clicking a summary chip lands on the exact matching filter. */
const SUMMARY_ITEMS: { key: keyof SignalModerationCounts; label: string; filterLabel: string; tone: "attention" | "neutral" | "positive" }[] = [
  { key: "new", label: "NEW", filterLabel: "Submitted", tone: "attention" },
  { key: "underReview", label: "REVIEWING", filterLabel: "Under review", tone: "neutral" },
  { key: "approved", label: "APPROVED", filterLabel: "Approved", tone: "neutral" },
  { key: "published", label: "PUBLISHED", filterLabel: "Published", tone: "positive" },
  { key: "archived", label: "REJECTED/ARCHIVED", filterLabel: "Archived", tone: "neutral" },
];

function SummaryBar({ counts }: { counts: SignalModerationCounts | null }) {
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      {SUMMARY_ITEMS.map((item) => {
        const value = counts ? counts[item.key] : null;
        const hasAttention = item.tone === "attention" && Boolean(value);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => router.push(`/admin/signals?filter=${encodeURIComponent(item.filterLabel)}`)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-caption transition-colors duration-150 ease-out ${
              hasAttention ? "border-accent bg-accent/10 text-accent" : "border-border text-text-secondary hover:border-ink"
            }`}
          >
            <span className={`text-body font-medium ${hasAttention ? "text-accent" : "text-ink"}`}>{value ?? "—"}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  draft: "border-border text-text-tertiary",
  submitted: "border-accent bg-accent/10 text-accent",
  reviewed: "border-ink text-ink",
  open: "border-ink text-ink",
  in_progress: "border-ink text-ink",
  resolved: "border-ink text-ink",
  archived: "border-border text-text-tertiary",
};

function StatusBadge({ status, visibility }: { status: string; visibility: string }) {
  const tone = visibility === "public" ? "border-ink bg-ink text-white" : (STATUS_TONE[status] ?? "border-border text-text-secondary");
  return <span className={`inline-flex rounded-sm border px-2 py-0.5 text-caption ${tone}`}>{visibility === "public" ? "published" : status}</span>;
}

export default function AdminSignalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLabel = searchParams.get("filter") || "All";
  const active = FILTERS.find((f) => f.label === activeLabel) ?? FILTERS[0];

  const [signals, setSignals] = useState<AdminSignalListItem[] | null>(null);
  const [counts, setCounts] = useState<SignalModerationCounts | null>(null);
  // Which filter the currently-held `signals` data corresponds to — lets
  // the table show "Loading…" while a new filter's fetch is in flight
  // without ever calling setState synchronously at the top of the effect
  // body (only inside the async .then()/.catch() callbacks below).
  const [loadedFilter, setLoadedFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSignals({ status: active.status, visibility: active.visibility })
      .then((s) => {
        if (cancelled) return;
        setSignals(s);
        setLoadedFilter(active.label);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load ThanksSignals.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.label]);

  useEffect(() => {
    let cancelled = false;
    getSignalCounts()
      .then((c) => {
        if (!cancelled) setCounts(c);
      })
      .catch(() => {
        // Non-fatal — the summary bar just shows "—" per chip; the filterable table below still works.
      });
    return () => {
      cancelled = true;
    };
  }, [active.label]);

  const loading = loadedFilter !== active.label;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1">ThanksSignals</h1>
        <p className="text-body mt-2 text-text-secondary">
          Review and moderate community submissions — persisted in Supabase.
        </p>
      </div>

      <SummaryBar counts={counts} />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => router.push(f.label === "All" ? "/admin/signals" : `/admin/signals?filter=${encodeURIComponent(f.label)}`)}
            className={
              f.label === activeLabel
                ? "inline-flex items-center rounded-sm bg-ink px-3 py-1.5 text-caption text-white"
                : "inline-flex items-center rounded-sm border border-border px-3 py-1.5 text-caption text-ink hover:border-ink"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-body text-error">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-tertiary">
              <th className="p-3">Title</th>
              <th className="p-3">Category</th>
              <th className="p-3">Author</th>
              <th className="p-3">Status</th>
              <th className="p-3">Visibility</th>
              <th className="p-3">Created</th>
              <th className="p-3">Updated</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!signals || loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-caption text-text-tertiary">
                  Loading…
                </td>
              </tr>
            ) : signals.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-caption text-text-tertiary">
                  No ThanksSignals match this filter.
                </td>
              </tr>
            ) : (
              signals.map((s) => (
                <tr key={s.id} className="border-b border-border text-body last:border-b-0">
                  <td className="p-3 text-ink">
                    <span className="inline-flex items-center gap-1.5">
                      {s.title || "(untitled)"}
                      {s.mediaCount > 0 ? (
                        <span
                          className="inline-flex shrink-0 items-center rounded-sm border border-border px-1 text-caption text-text-tertiary"
                          title={`${s.mediaCount} attachment${s.mediaCount === 1 ? "" : "s"}`}
                        >
                          📎 {s.mediaCount}
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="p-3 text-caption text-text-secondary">{s.category || "—"}</td>
                  <td className="p-3 text-caption text-text-secondary">{s.authorName}</td>
                  <td className="p-3">
                    <StatusBadge status={s.status} visibility={s.visibility} />
                  </td>
                  <td className="p-3 text-caption text-text-secondary">{s.visibility}</td>
                  <td className="p-3 text-caption text-text-secondary">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-caption text-text-secondary">{new Date(s.updatedAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Link href={`/admin/signals/${s.id}`} className={adminButtonSmall}>
                      Review
                    </Link>
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
