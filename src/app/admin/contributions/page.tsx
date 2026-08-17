"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { adminButtonSmall } from "@/components/admin/fields";
import { listContributions, type AdminContributionListItem } from "@/lib/admin/store";

/**
 * [Phase 6E] Same filter-tab pattern as /admin/signals (Phase 6D). "Published"
 * is a cross-table filter — a Contribution's own status has no `published`
 * value (see adminContributionsRepository.ts's header comment), so this tab
 * checks whether the linked DesignResponse is published, not the
 * Contribution's status column.
 */
const FILTERS: { label: string; status?: string; published?: boolean }[] = [
  { label: "All" },
  { label: "Submitted", status: "submitted" },
  { label: "Under Review", status: "under_review" },
  { label: "Approved", status: "approved" },
  { label: "Published", published: true },
  { label: "Rejected", status: "rejected" },
  { label: "Archived", status: "archived" },
];

export default function AdminContributionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeLabel = searchParams.get("filter") || "All";
  const active = FILTERS.find((f) => f.label === activeLabel) ?? FILTERS[0];

  const [contributions, setContributions] = useState<AdminContributionListItem[] | null>(null);
  const [loadedFilter, setLoadedFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listContributions({ status: active.status, published: active.published })
      .then((c) => {
        if (cancelled) return;
        setContributions(c);
        setLoadedFilter(active.label);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load Contributions.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.label]);

  const loading = loadedFilter !== active.label;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1">Contributions</h1>
        <p className="text-body mt-2 text-text-secondary">
          Design responses to community ThanksSignals — persisted in Supabase.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={() => router.push(f.label === "All" ? "/admin/contributions" : `/admin/contributions?filter=${encodeURIComponent(f.label)}`)}
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
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-tertiary">
              <th className="p-3">Contribution</th>
              <th className="p-3">Signal</th>
              <th className="p-3">Contributor</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Updated</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!contributions || loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-caption text-text-tertiary">
                  Loading…
                </td>
              </tr>
            ) : contributions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-caption text-text-tertiary">
                  No Contributions match this filter.
                </td>
              </tr>
            ) : (
              contributions.map((c) => (
                <tr key={c.id} className="border-b border-border text-body last:border-b-0">
                  <td className="p-3 text-ink">{c.title || "(untitled)"}</td>
                  <td className="p-3 text-caption text-text-secondary">{c.signalTitle}</td>
                  <td className="p-3 text-caption text-text-secondary">{c.contributorName}</td>
                  <td className="p-3 text-caption text-text-secondary">{c.contributionType || "—"}</td>
                  <td className="p-3">
                    <span className="inline-flex rounded-sm border border-accent px-2 py-0.5 text-caption text-accent">
                      {c.status}
                      {c.designResponseStatus === "published" ? " · published" : ""}
                    </span>
                  </td>
                  <td className="p-3 text-caption text-text-secondary">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-caption text-text-secondary">{new Date(c.updatedAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <Link href={`/admin/contributions/${c.id}`} className={adminButtonSmall}>
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
