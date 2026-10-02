import { cronAuthorized } from "@/lib/cron";
import { emit, deliverDue } from "@/lib/integrations/outbox";
import { listClients } from "@/lib/services/clients";
import { baseUrl, getSettings } from "@/lib/services/settings";
import { feedbackUrl } from "@/lib/services/links";
import { daysBetween } from "@/lib/util";

/**
 * Daily 10:00 job: emits `reminder.due` for every completed client whose
 * feedback hasn't arrived N days after completion (Settings → reminders).
 * n8n decides what to do with it (WhatsApp the team, or the client).
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 });
  const settings = await getSettings();
  if (!settings.notify.daily_reminder) return Response.json({ reminders: 0, skipped: "Daily reminder is off in Settings" });
  const base = await baseUrl();
  const due = (await listClients()).filter((c) => {
    if (c.status !== "completed" || c.link_status === "submitted") return false;
    const doneAt = c.completed_at ?? (c.end_date ? `${c.end_date}T00:00:00.000Z` : null);
    return doneAt ? daysBetween(doneAt) >= settings.reminders.days_after_completion : false;
  });
  for (const c of due) {
    await emit("reminder.due", {
      client_id: c.id,
      client: c.name,
      company: c.company,
      whatsapp: c.whatsapp,
      email: c.email,
      link_status: c.link_status,
      days_since_completion: daysBetween(c.completed_at ?? `${c.end_date}T00:00:00.000Z`),
      feedback_link: feedbackUrl(base, c.feedback_code),
      dashboard_url: `${base}/hub/clients/${c.id}`,
    });
  }
  const outbox = await deliverDue();
  return Response.json({ reminders: due.length, outbox });
}
