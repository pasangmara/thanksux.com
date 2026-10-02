import type { Metadata } from "next";
import { ArrowRight, CircleCheckBig, MessageSquareText, RefreshCcw, TriangleAlert, Plus } from "lucide-react";
import Link from "next/link";
import { AddClientButton } from "@/components/hub/ClientForm";
import { Kpi, RatingBars, StaggerItem, StaggerList } from "@/components/hub/Kpi";
import { LinkIconButtons } from "@/components/hub/LinkActions";
import { PageHeader } from "@/components/hub/PageHeader";
import { Card, CardTitle, EmptyState } from "@/components/hub/Section";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { StarRow } from "@/components/ui/Stars";
import { requireMember } from "@/lib/auth/session";
import type { Tone } from "@/lib/domain/labels";
import { getStore } from "@/lib/data/store";
import type { OutboxEvent } from "@/lib/domain/types";
import { listClients } from "@/lib/services/clients";
import { listFeedback } from "@/lib/services/feedback";
import { buildOverview, type AttentionKind } from "@/lib/services/insights";
import { baseUrl, getSettings } from "@/lib/services/settings";
import { firstName, formatDate, greeting, timeAgo, todayLong } from "@/lib/util";

export const metadata: Metadata = { title: "Overview" };

const KIND: Record<AttentionKind, { tone: Tone; label: string }> = {
  followup: { tone: "error", label: "Follow-up open" },
  sync: { tone: "error", label: "Sync error" },
  reminder: { tone: "warning", label: "Reminder due" },
  link_not_sent: { tone: "info", label: "Link not sent" },
};

export default async function OverviewPage() {
  const me = await requireMember();
  const store = await getStore();
  const [clients, feedback, settings, failed, base] = await Promise.all([
    listClients(),
    listFeedback(),
    getSettings(),
    store.list<OutboxEvent>("outbox", { where: { status: "failed" }, orderBy: { column: "created_at", dir: "desc" } }),
    baseUrl(),
  ]);
  const o = buildOverview(clients, feedback, failed, settings.reminders.days_after_completion);
  const byId = new Map(clients.map((c) => [c.id, c]));

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName(me.name)}`}
        subtitle={`${todayLong()} · here’s how your clients feel`}
        actions={<AddClientButton baseUrl={base} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi index={0} label="Active clients" value={o.kpi.activeClients} note={`${o.kpi.onboarding} onboarding · ${o.kpi.paused} paused`} />
        <Kpi index={1} label="Feedback received" value={o.kpi.feedbackTotal} note={`${o.kpi.awaiting} waiting for a reply`} />
        <Kpi index={2} label="Average rating" value={o.kpi.avgRating} decimals={1} suffix=" ★" note={o.kpi.feedbackTotal ? `From ${o.kpi.feedbackTotal} replies` : "No replies yet"} />
        <Kpi index={3} label="Posts pending" value={o.kpi.postsPending} note={`${o.kpi.postsPosted} posted so far`} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px] [&>*]:min-w-0">
        <Card>
          <CardTitle aside={o.attention.length ? <Pill tone="error" dot={false}>{o.attention.length}</Pill> : null}>Needs attention</CardTitle>
          {o.attention.length === 0 ? (
            <EmptyState
              icon={<CircleCheckBig className="size-6" />}
              title="All clear"
              body="No open follow-ups, and every finished project has its feedback link."
            />
          ) : (
            <StaggerList className="flex flex-col">
              {o.attention.map((a) => {
                const c = a.clientId ? byId.get(a.clientId) : null;
                return (
                  <StaggerItem key={`${a.kind}-${a.feedbackId ?? a.clientId ?? "sync"}`} className="flex flex-wrap items-center gap-3.5 border-t border-line py-3.5 sm:flex-nowrap">
                    {c ? (
                      <Avatar name={c.name} />
                    ) : (
                      <span className="grid size-9 place-items-center rounded-full bg-error-soft text-error">
                        <TriangleAlert className="size-4" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {c ? (
                          <Link href={`/hub/clients/${c.id}`} className="font-medium text-text hover:underline">
                            {a.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-text">{a.title}</span>
                        )}
                        <Pill tone={KIND[a.kind].tone}>{KIND[a.kind].label}</Pill>
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-muted">{a.detail}</p>
                    </div>
                    <div className="ml-auto">
                      {a.kind === "followup" && (
                        <Link href={`/hub/feedback?id=${a.feedbackId}`} className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line-strong bg-surface-2 px-3.5 text-sm font-semibold text-text transition hover:border-muted/60">
                          Open <ArrowRight className="size-4" />
                        </Link>
                      )}
                      {(a.kind === "reminder" || a.kind === "link_not_sent") && c && <LinkIconButtons client={c} baseUrl={base} />}
                      {a.kind === "sync" && (
                        <Link href="/hub/settings#integrations" className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line-strong bg-surface-2 px-3.5 text-sm font-semibold text-text">
                          <RefreshCcw className="size-4" /> Fix
                        </Link>
                      )}
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerList>
          )}
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardTitle aside={<Link href="/hub/feedback" className="text-[13px] font-medium text-mint hover:underline">View all</Link>}>
              Recent feedback
            </CardTitle>
            {o.recent.length === 0 ? (
              <EmptyState
                icon={<MessageSquareText className="size-6" />}
                title="No feedback yet"
                body="Send a client their personal link. Answers show up here the moment they’re sent."
              />
            ) : (
              <StaggerList className="flex flex-col">
                {o.recent.map((f) => (
                  <StaggerItem key={f.id} className="border-t border-line">
                    <Link href={`/hub/feedback?id=${f.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-surface-2/60">
                      <Avatar name={f.client_name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-text">{f.company ?? f.client_name}</span>
                          <StarRow value={f.rating} size={12} />
                        </div>
                        <p className="truncate text-[13px] text-muted">{f.did_well || f.do_better ? `“${f.did_well || f.do_better}”` : "No comment"}</p>
                      </div>
                      <span className="shrink-0 text-[12px] text-muted" title={formatDate(f.created_at, { year: true, time: true })}>
                        {timeAgo(f.created_at)}
                      </span>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </Card>
          <Card>
            <CardTitle>Rating mix</CardTitle>
            <RatingBars distribution={o.distribution} total={o.kpi.feedbackTotal} />
          </Card>
        </div>
      </div>

      {clients.length === 0 && (
        <Card>
          <EmptyState
            icon={<Plus className="size-6" />}
            title="Add your first client"
            body="Each client gets a personal feedback link. Send it on WhatsApp in one click when the project is done."
            action={<AddClientButton baseUrl={base} />}
          />
        </Card>
      )}
    </>
  );
}
