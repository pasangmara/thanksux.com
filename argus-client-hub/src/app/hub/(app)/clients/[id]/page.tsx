import type { Metadata } from "next";
import { ArrowRight, Check, Link2, Mail, MessageCircle, MessageSquareText, Phone, Plus, RefreshCw, Send, Star, UserRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditClientButton } from "@/components/hub/ClientForm";
import { ContactLogForm, DeleteClientButton, FollowUpButton, NotesEditor, RegenerateLinkButton, StatusSelect } from "@/components/hub/ClientDetailParts";
import { LinkButtons } from "@/components/hub/LinkActions";
import { PageHeader } from "@/components/hub/PageHeader";
import { Card, CardTitle, EmptyState } from "@/components/hub/Section";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { StarRow } from "@/components/ui/Stars";
import { requireMember } from "@/lib/auth/session";
import { LINK_STATUS_META, POST_STATUS_META, servicesLabel } from "@/lib/domain/labels";
import type { ActivityType } from "@/lib/domain/types";
import { listActivity } from "@/lib/services/activity";
import { getClient } from "@/lib/services/clients";
import { listFeedback } from "@/lib/services/feedback";
import { feedbackUrl, inviteMessage, whatsappLink } from "@/lib/services/links";
import { baseUrl } from "@/lib/services/settings";
import { formatDate, timeAgo, waDigits } from "@/lib/util";

export const metadata: Metadata = { title: "Client" };

const ACTIVITY_ICON: Record<ActivityType, { icon: typeof Plus; tone: string }> = {
  client_created: { icon: Plus, tone: "text-text-2" },
  client_updated: { icon: UserRound, tone: "text-text-2" },
  status_changed: { icon: Check, tone: "text-text-2" },
  link_sent: { icon: Send, tone: "text-text-2" },
  link_opened: { icon: Link2, tone: "text-warning" },
  link_regenerated: { icon: RefreshCw, tone: "text-text-2" },
  feedback_received: { icon: Star, tone: "text-mint" },
  followup_done: { icon: Check, tone: "text-mint" },
  followup_reopened: { icon: MessageSquareText, tone: "text-error" },
  post_status_changed: { icon: MessageSquareText, tone: "text-mint" },
  contact_logged: { icon: Phone, tone: "text-mint" },
};

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMember();
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const [allFeedback, activity, base] = await Promise.all([listFeedback(), listActivity(id), baseUrl()]);
  const feedback = allFeedback.filter((f) => f.client_id === id);
  const url = feedbackUrl(base, client.feedback_code);
  const wa = whatsappLink(client.whatsapp, inviteMessage(client, url));
  const doneDate = client.end_date ?? client.completed_at;

  const contact = (
    <>
      {client.whatsapp && waDigits(client.whatsapp) && (
        <a href={`https://wa.me/${waDigits(client.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line-strong bg-surface-2 px-3.5 text-sm font-semibold text-text transition hover:border-muted/60">
          <MessageCircle className="size-4 text-mint" /> WhatsApp
        </a>
      )}
      {client.email && (
        <a href={`mailto:${client.email}`} className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line-strong bg-surface-2 px-3.5 text-sm font-semibold text-text transition hover:border-muted/60">
          <Mail className="size-4" /> Email
        </a>
      )}
      {client.whatsapp && (
        <a href={`tel:${client.whatsapp.replace(/[^\d+]/g, "")}`} className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line-strong bg-surface-2 px-3.5 text-sm font-semibold text-text transition hover:border-muted/60">
          <Phone className="size-4" /> Call
        </a>
      )}
      <EditClientButton client={client} baseUrl={base} />
    </>
  );

  return (
    <>
      <PageHeader
        before={
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted">
            <Link href="/hub/clients" className="hover:text-text">
              Clients
            </Link>
            <span>/</span>
            <span className="text-text-2">{client.name}</span>
          </nav>
        }
        title={
          <span className="flex items-center gap-3">
            <Avatar name={client.name} size={44} />
            {client.name}
          </span>
        }
        after={<StatusSelect id={client.id} status={client.status} />}
        subtitle={[client.company, servicesLabel(client.services), doneDate ? `Completed ${formatDate(doneDate, { year: true })}` : null].filter(Boolean).join(" · ")}
        actions={contact}
      />

      <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card>
            <p className="label-mono mb-3 text-muted">Details</p>
            <dl className="grid grid-cols-[100px_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-[13.5px]">
              {(
                [
                  ["WhatsApp", client.whatsapp],
                  ["Email", client.email],
                  ["Service", servicesLabel(client.services)],
                  ["Package", client.package],
                  ["Project", client.start_date || client.end_date ? `${formatDate(client.start_date, { year: true })} – ${client.end_date ? formatDate(client.end_date, { year: true }) : "ongoing"}` : null],
                  ["Form language", client.preferred_language === "bn" ? "বাংলা first" : "English first"],
                  ["Added", formatDate(client.created_at, { year: true })],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="truncate font-medium text-text">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="label-mono text-muted">Feedback link</p>
              <Pill tone={LINK_STATUS_META[client.link_status].tone}>{LINK_STATUS_META[client.link_status].label}</Pill>
            </div>
            <p className="field mb-3 truncate font-mono text-[12.5px] text-text-2 select-all">{url}</p>
            {client.link_status !== "submitted" ? (
              <LinkButtons client={client} baseUrl={base} />
            ) : (
              <p className="text-[13px] text-text-2">Feedback received. For a new project, create a new link.</p>
            )}
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
              <p className="text-[12px] text-muted">
                {client.link_sent_at ? `Sent ${timeAgo(client.link_sent_at)}` : "Not sent yet"}
                {client.link_opened_at ? ` · opened ${timeAgo(client.link_opened_at)}` : ""}
              </p>
              <RegenerateLinkButton id={client.id} />
            </div>
            {!wa && client.link_status !== "submitted" && <p className="mt-2 text-[12px] text-muted">Add a WhatsApp number to send the link in one click.</p>}
          </Card>

          <Card className="flex flex-1 flex-col">
            <p className="label-mono mb-3 text-muted">Private notes</p>
            <NotesEditor id={client.id} initial={client.notes ?? ""} />
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardTitle>Feedback history</CardTitle>
            {feedback.length === 0 ? (
              <EmptyState icon={<MessageSquareText className="size-6" />} title="No feedback yet" body="Send the personal link when the project is done. The answer appears here instantly." />
            ) : (
              <div className="flex flex-col gap-3">
                {feedback.map((f) => (
                  <article key={f.id} className="rounded-2xl border border-line bg-bg-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StarRow value={f.rating} size={18} />
                      <span className="flex-1" />
                      {f.follow_up && <Pill tone={f.follow_up === "open" ? "error" : "neutral"}>Follow-up {f.follow_up}</Pill>}
                      <Pill tone={POST_STATUS_META[f.post_status].tone}>{POST_STATUS_META[f.post_status].label}</Pill>
                      <span className="text-[12px] text-muted">{formatDate(f.created_at, { year: true })}</span>
                    </div>
                    {f.did_well && (
                      <p className="mt-3 text-[13.5px] text-text-2">
                        <span className="text-muted">Did well: </span>“{f.did_well}”
                      </p>
                    )}
                    {f.do_better && (
                      <p className="mt-1.5 text-[13.5px] text-text-2">
                        <span className="text-muted">Do better: </span>“{f.do_better}”
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {f.follow_up && <FollowUpButton feedback={f} />}
                      <Link href={`/hub/feedback?id=${f.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-semibold text-text-2 hover:bg-surface-2 hover:text-text">
                        Open in Feedback <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <Card className="flex-1">
            <CardTitle>Timeline</CardTitle>
            <ContactLogForm id={client.id} />
            <ol className="relative mt-5 flex flex-col">
              {activity.map((a, i) => {
                const meta = ACTIVITY_ICON[a.type] ?? ACTIVITY_ICON.client_updated;
                const Icon = meta.icon;
                return (
                  <li key={a.id} className="relative flex items-start gap-3 pb-4">
                    {i < activity.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" aria-hidden />}
                    <span className={`relative grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 ${meta.tone}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-[13.5px] text-text">{a.text}</p>
                      <p className="text-[12px] text-muted">
                        {a.actor ?? "System"} · {formatDate(a.created_at, { time: true })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>

      {me.role === "admin" && (
        <div className="flex justify-end">
          <DeleteClientButton id={client.id} name={client.name} />
        </div>
      )}
    </>
  );
}
