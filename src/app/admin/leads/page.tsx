"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listLeads } from "@/lib/admin/store";
import { deriveFollowUpState, LEAD_STATUSES, type Lead } from "@/types/leads";

/**
 * /admin/leads — CRM list + dashboard stats, per Phase L §10/§13.
 * Every number here is computed directly from `data/leads.json` at
 * render time — zero/empty states when there's no data yet, never a
 * fabricated figure.
 */

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <p className="text-caption text-text-tertiary">{label}</p>
      <p className="text-h2 mt-1">{value}</p>
    </div>
  );
}

function topN(counts: Record<string, number>, n = 5): [string, number][] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

const STATUS_FILTERS = ["All", ...LEAD_STATUSES] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  useEffect(() => {
    listLeads().then(setLeads);
  }, []);

  if (!leads) return <p className="text-body text-text-secondary">Loading…</p>;

  const filteredLeads = statusFilter === "All" ? leads : leads.filter((l) => l.status === statusFilter);

  const total = leads.length;
  const newCount = leads.filter((l) => l.status === "New").length;
  const qualified = leads.filter((l) => l.status === "Qualified").length;
  const won = leads.filter((l) => l.status === "Won").length;
  const lost = leads.filter((l) => l.status === "Lost").length;
  const conversionRate = total > 0 ? `${((won / total) * 100).toFixed(1)}%` : "—";
  const overdue = leads.filter((l) => deriveFollowUpState(l.followUpStatus, l.followUpDate) === "Overdue").length;
  const dueToday = leads.filter((l) => deriveFollowUpState(l.followUpStatus, l.followUpDate) === "Due").length;

  const bySource: Record<string, number> = {};
  const byService: Record<string, number> = {};
  const byProject: Record<string, number> = {};
  const byCampaign: Record<string, number> = {};
  for (const l of leads) {
    const source = l.firstTouch?.source ?? "Direct / Unknown";
    bySource[source] = (bySource[source] ?? 0) + 1;
    if (l.service) byService[l.service] = (byService[l.service] ?? 0) + 1;
    if (l.context?.projectTitle) byProject[l.context.projectTitle] = (byProject[l.context.projectTitle] ?? 0) + 1;
    if (l.firstTouch?.campaign) byCampaign[l.firstTouch.campaign] = (byCampaign[l.firstTouch.campaign] ?? 0) + 1;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-h1">Leads / CRM</h1>
        <p className="text-body mt-2 text-text-secondary">
          {total} lead{total === 1 ? "" : "s"} — persisted server-side in data/leads.json.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 tablet:grid-cols-4 desktop:grid-cols-8">
        <StatCard label="Total" value={total} />
        <StatCard label="New" value={newCount} />
        <StatCard label="Qualified" value={qualified} />
        <StatCard label="Won" value={won} />
        <StatCard label="Lost" value={lost} />
        <StatCard label="Win rate" value={conversionRate} />
        <StatCard label="Due today" value={dueToday} />
        <StatCard label="Overdue" value={overdue} />
      </div>

      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 desktop:grid-cols-4">
        {[
          ["By source", bySource],
          ["By service", byService],
          ["By project", byProject],
          ["By campaign", byCampaign],
        ].map(([title, counts]) => (
          <div key={title as string} className="rounded-md border border-border bg-surface p-3">
            <p className="text-caption font-medium text-ink">{title as string}</p>
            {Object.keys(counts as Record<string, number>).length === 0 ? (
              <p className="mt-1 text-caption text-text-tertiary">No data yet.</p>
            ) : (
              <ul className="mt-1 flex flex-col gap-1">
                {topN(counts as Record<string, number>).map(([k, v]) => (
                  <li key={k} className="flex justify-between text-caption text-text-secondary">
                    <span className="truncate">{k}</span>
                    <span className="shrink-0 text-ink">{v}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={
              s === statusFilter
                ? "inline-flex items-center rounded-sm bg-ink px-3 py-1.5 text-caption text-white"
                : "inline-flex items-center rounded-sm border border-border px-3 py-1.5 text-caption text-ink hover:border-ink"
            }
          >
            {s}
            {s !== "All" ? ` (${leads.filter((l) => l.status === s).length})` : ` (${total})`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-tertiary">
              <th className="p-3">Name</th>
              <th className="p-3">Email / Phone</th>
              <th className="p-3">Company</th>
              <th className="p-3">Service</th>
              <th className="p-3">Source</th>
              <th className="p-3">Campaign</th>
              <th className="p-3">Status</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Follow-up</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-caption text-text-tertiary">
                  {leads.length === 0
                    ? "No leads yet — they'll appear here as soon as someone submits the lead form."
                    : `No ${statusFilter} leads.`}
                </td>
              </tr>
            ) : (
              filteredLeads.map((l) => (
                <tr key={l.id} className="border-b border-border text-body last:border-b-0">
                  <td className="p-3">
                    <Link href={`/admin/leads/${l.id}`} className="text-accent underline">
                      {l.name || "(no name)"}
                    </Link>
                  </td>
                  <td className="p-3 text-caption text-text-secondary">{l.email ?? l.phone ?? "—"}</td>
                  <td className="p-3 text-caption text-text-secondary">{l.company ?? "—"}</td>
                  <td className="p-3 text-caption text-text-secondary">{l.service ?? "—"}</td>
                  <td className="p-3 text-caption text-text-secondary">{l.firstTouch?.source ?? "Direct"}</td>
                  <td className="p-3 text-caption text-text-secondary">{l.firstTouch?.campaign ?? "—"}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-sm border px-2 py-0.5 text-caption ${
                        l.status === "Won"
                          ? "border-ink bg-ink text-white"
                          : l.status === "Lost" || l.status === "Archived"
                            ? "border-border text-text-tertiary"
                            : "border-accent text-accent"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="p-3 text-caption text-text-secondary">{l.priority}</td>
                  <td className="p-3">
                    {(() => {
                      const state = deriveFollowUpState(l.followUpStatus, l.followUpDate);
                      const tone =
                        state === "Overdue"
                          ? "border-error text-error"
                          : state === "Due"
                            ? "border-accent text-accent"
                            : "border-border text-text-tertiary";
                      return <span className={`inline-flex rounded-sm border px-2 py-0.5 text-caption ${tone}`}>{state}</span>;
                    })()}
                  </td>
                  <td className="p-3 text-caption text-text-secondary">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-caption text-text-tertiary">Statuses: {LEAD_STATUSES.join(" → ")}</p>
    </div>
  );
}
