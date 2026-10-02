import "server-only";
import type { Client, Feedback, OutboxEvent } from "@/lib/domain/types";
import { daysBetween } from "@/lib/util";

export type AttentionKind = "followup" | "reminder" | "link_not_sent" | "sync";

export interface AttentionItem {
  kind: AttentionKind;
  clientId: string | null;
  feedbackId?: string;
  title: string;
  detail: string;
  since: string;
}

export interface Overview {
  kpi: {
    activeClients: number;
    onboarding: number;
    paused: number;
    feedbackTotal: number;
    feedbackLast30: number;
    avgRating: number | null;
    postsPending: number;
    postsPosted: number;
    awaiting: number; // links sent, no answer yet
  };
  distribution: number[]; // index 1..5
  attention: AttentionItem[];
  recent: Feedback[];
}

export function buildOverview(
  clients: Client[],
  feedback: Feedback[],
  failedEvents: OutboxEvent[],
  reminderDays: number,
): Overview {
  const byId = new Map(clients.map((c) => [c.id, c]));
  const avg = feedback.length ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : null;
  const distribution = [0, 0, 0, 0, 0, 0];
  for (const f of feedback) distribution[f.rating]++;

  const attention: AttentionItem[] = [];
  for (const f of feedback.filter((x) => x.follow_up === "open")) {
    const quote = f.do_better || f.did_well;
    attention.push({
      kind: "followup",
      clientId: f.client_id,
      feedbackId: f.id,
      title: `${f.client_name}${f.company ? ` · ${f.company}` : ""}`,
      detail: `Rated ${f.rating}★${quote ? ` · “${quote.length > 70 ? `${quote.slice(0, 70)}…` : quote}”` : ""}`,
      since: f.created_at,
    });
  }
  for (const c of clients.filter((x) => x.status === "completed" && x.link_status !== "submitted")) {
    const doneAt = c.completed_at ?? (c.end_date ? `${c.end_date}T00:00:00.000Z` : c.updated_at);
    const days = daysBetween(doneAt);
    if (days < reminderDays) continue;
    attention.push({
      kind: c.link_status === "not_sent" ? "link_not_sent" : "reminder",
      clientId: c.id,
      title: `${c.name}${c.company ? ` · ${c.company}` : ""}`,
      detail:
        c.link_status === "not_sent"
          ? `Completed ${days} days ago · feedback link not sent yet`
          : `Completed ${days} days ago · link ${c.link_status === "opened" ? "opened" : "sent"}, no feedback yet`,
      since: doneAt,
    });
  }
  if (failedEvents.length) {
    attention.push({
      kind: "sync",
      clientId: null,
      title: "n8n sync failed",
      detail: `${failedEvents.length} event${failedEvents.length > 1 ? "s" : ""} could not be sent · ${failedEvents[0].last_error ?? ""}`,
      since: failedEvents[0].created_at,
    });
  }
  const order: Record<AttentionKind, number> = { followup: 0, sync: 1, reminder: 2, link_not_sent: 3 };
  attention.sort((a, b) => order[a.kind] - order[b.kind] || a.since.localeCompare(b.since));

  return {
    kpi: {
      activeClients: clients.filter((c) => c.status === "active" || c.status === "onboarding").length,
      onboarding: clients.filter((c) => c.status === "onboarding").length,
      paused: clients.filter((c) => c.status === "paused").length,
      feedbackTotal: feedback.length,
      feedbackLast30: feedback.filter((f) => daysBetween(f.created_at) <= 30).length,
      avgRating: avg,
      postsPending: feedback.filter((f) => f.post_status === "pending").length,
      postsPosted: feedback.filter((f) => f.post_status === "posted").length,
      awaiting: clients.filter((c) => c.link_status === "sent" || c.link_status === "opened").length,
    },
    distribution,
    attention: attention.filter((a) => !a.clientId || byId.has(a.clientId)),
    recent: feedback.slice(0, 5),
  };
}
