"use client";

import { AnimatePresence, motion } from "motion/react";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Pill } from "@/components/ui/Pill";
import { StarRow } from "@/components/ui/Stars";
import { CLIENT_STATUS_META, LINK_STATUS_META, servicesLabel } from "@/lib/domain/labels";
import { CLIENT_STATUSES, type Client, type ClientStatus } from "@/lib/domain/types";
import { formatDate, timeAgo } from "@/lib/util-client";
import { EmptyState } from "./Section";
import { LinkIconButtons } from "./LinkActions";

export interface ClientRow extends Client {
  lastRating: number | null;
  lastFeedbackAt: string | null;
}

export function ClientsTable({ clients, baseUrl }: { clients: ClientRow[]; baseUrl: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(params.get("q") ?? "");
  const status = (params.get("status") as ClientStatus | null) ?? null;

  const setStatus = (s: ClientStatus | null) => {
    const sp = new URLSearchParams(params);
    if (s) sp.set("status", s);
    else sp.delete("status");
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: clients.length };
    for (const s of CLIENT_STATUSES) c[s] = clients.filter((x) => x.status === s).length;
    return c;
  }, [clients]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return clients.filter(
      (c) =>
        (!status || c.status === status) &&
        (!term || [c.name, c.company, c.email, c.whatsapp, c.package].some((v) => v?.toLowerCase().includes(term))),
    );
  }, [clients, q, status]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="relative w-full sm:w-[300px]">
          <span className="sr-only">Search clients</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, phone" className="field h-10 pl-9 text-sm" />
        </label>
        <div className="flex flex-wrap gap-2">
          <Chip role="radio" size="sm" selected={!status} onClick={() => setStatus(null)}>
            All · {counts.all}
          </Chip>
          {CLIENT_STATUSES.map((s) => (
            <Chip key={s} role="radio" size="sm" selected={status === s} onClick={() => setStatus(status === s ? null : s)}>
              {CLIENT_STATUS_META[s].label} · {counts[s]}
            </Chip>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead>
              <tr className="border-b border-line bg-bg-2">
                {["Client", "Service", "Status", "Last feedback", "Last contact", "Feedback link"].map((h, i) => (
                  <th key={h} scope="col" className={`label-mono px-4 py-3 font-medium text-muted ${i === 5 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 12) * 0.03 } }}
                    exit={{ opacity: 0 }}
                    className="group border-b border-line last:border-0 hover:bg-surface-2/50"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/hub/clients/${c.id}`} className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-text group-hover:underline">{c.name}</span>
                          <span className="block truncate text-[13px] text-muted">{c.company ?? "—"}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-2">{servicesLabel(c.services)}</td>
                    <td className="px-4 py-3">
                      <Pill tone={CLIENT_STATUS_META[c.status].tone}>{CLIENT_STATUS_META[c.status].label}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      {c.lastRating ? (
                        <span className="flex items-center gap-2">
                          <StarRow value={c.lastRating} size={13} />
                          <span className="text-[12px] text-muted">{formatDate(c.lastFeedbackAt)}</span>
                        </span>
                      ) : c.link_status === "not_sent" ? (
                        <span className="text-[13px] text-info">{c.status === "completed" ? "Link not sent" : "—"}</span>
                      ) : (
                        <span className={`text-[13px] ${c.link_status === "opened" ? "text-warning" : "text-muted"}`}>
                          {LINK_STATUS_META[c.link_status].label} · waiting
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-text-2">{timeAgo(c.last_contact_at)}</td>
                    <td className="px-4 py-3">
                      <LinkIconButtons client={c} baseUrl={baseUrl} />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <EmptyState
            icon={<Users className="size-6" />}
            title={clients.length ? "No clients match" : "No clients yet"}
            body={clients.length ? "Try another search or status." : "Add your first client to create their personal feedback link."}
          />
        )}
      </div>
      <p className="text-[13px] text-muted">Tip: WhatsApp opens with a ready message and the client’s personal link. Sending it marks the link as sent.</p>
    </div>
  );
}
