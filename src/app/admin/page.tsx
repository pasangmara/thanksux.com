"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSignalCounts, listProjects } from "@/lib/admin/store";
import type { AdminProject } from "@/lib/admin/types";
import { SignalLiveDot } from "@/components/admin/SignalLiveDot";

function StatCard({ label, value, liveDot }: { label: string; value: number; liveDot?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="flex items-center gap-1.5 text-label text-text-tertiary">
        {label}
        {liveDot !== undefined ? <SignalLiveDot active={liveDot} /> : null}
      </p>
      <p className="text-h2 mt-2 text-ink">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<AdminProject[] | null>(null);
  const [pendingSignals, setPendingSignals] = useState<number | null>(null);

  useEffect(() => {
    // Client-only fetch, deferred past hydration on purpose — see
    // src/app/admin/about/page.tsx for the same pattern.
    listProjects().then(setProjects);
    // [Phase 6D §13 — perf] Was `listSignals({ status: "submitted" })` read
    // down to `.length` — fetching every matching signal's full record
    // (title, description, media refs, etc.) just to count them. The
    // dedicated counts endpoint (`getSignalModerationCounts()`, the same
    // aggregate AdminShell's nav badge and /admin/signals' own summary bar
    // read) returns the same number as a handful of bytes instead of the
    // full row set, with no change to what's rendered here.
    getSignalCounts()
      .then((counts) => setPendingSignals(counts.new))
      .catch(() => setPendingSignals(null));
  }, []);

  if (!projects) return <p className="text-body text-text-secondary">Loading…</p>;

  const published = projects.filter((p) => p.published).length;
  const drafts = projects.filter((p) => !p.published).length;
  const featured = projects.filter((p) => p.featured).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h1">Dashboard</h1>
        <p className="text-body mt-2 text-text-secondary">
          Edits save to the real, server-persisted project store (<code>data/*.json</code>) —
          the public site reads the same store, so a save here reaches it on the next page
          load. Still no authentication (see the banner above) — see
          docs/CMS_IMPLEMENTATION_PLAN.md and docs/PORTFOLIO_CMS_ARCHITECTURE.md §12 for the
          full persistence architecture.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 tablet:grid-cols-4">
        <StatCard label="Total projects" value={projects.length} />
        <StatCard label="Published" value={published} />
        <StatCard label="Drafts" value={drafts} />
        <StatCard label="Featured" value={featured} />
        {pendingSignals !== null ? (
          <Link href="/admin/signals?filter=Submitted" className="block">
            <StatCard label="Pending ThanksSignals" value={pendingSignals} liveDot={pendingSignals > 0} />
          </Link>
        ) : null}
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-label text-text-tertiary">Quick links</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/admin/homepage" className="text-body text-accent underline">
            Edit Homepage
          </Link>
          <Link href="/admin/projects" className="text-body text-accent underline">
            Manage projects
          </Link>
          <Link href="/admin/about" className="text-body text-accent underline">
            Edit About content
          </Link>
          <Link href="/admin/contact" className="text-body text-accent underline">
            Edit Contact content
          </Link>
          <Link href="/admin/settings" className="text-body text-accent underline">
            Site settings
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-5">
        <p className="text-label text-text-tertiary">Recent projects</p>
        <ul className="mt-3 flex flex-col gap-2">
          {projects.slice(0, 5).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 text-body">
              <span>{p.title}</span>
              <Link href={`/admin/projects/${p.id}`} className="text-caption text-accent underline">
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
