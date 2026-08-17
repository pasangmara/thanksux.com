import type { NotificationChannel, NotificationEvent, NotificationResult } from "../types";

/**
 * [Phase 6 — Email notification] Architecture only — deliberately NOT a
 * working send path. Actually sending email needs a real provider client
 * (SMTP via `nodemailer`, or an API-based provider's SDK) — a genuine new
 * dependency, which the explicit brief for this phase says not to add
 * "merely to make future integrations possible." `isConfigured()` still
 * reflects real env var presence (so `/admin/marketing`'s status display
 * is honest — "Configured" here means "the address to notify is set,"
 * not "email actually sends"), but `send()` always returns a clear,
 * truthful failure rather than silently pretending to succeed. Wiring a
 * real provider later is a self-contained change: implement `send()`,
 * add the one dependency, done — nothing else in this file changes.
 *
 * `NOTIFY_EMAIL_TO` — server-only env var, the internal address that
 * should receive lead/follow-up notifications once a real provider is
 * wired. Never exposed to the client.
 */
export const emailChannel: NotificationChannel = {
  name: "email",

  isConfigured(): boolean {
    return Boolean(process.env.NOTIFY_EMAIL_TO?.trim());
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by the NotificationChannel interface; unused until a real provider is wired (see this file's header comment)
  async send(_event: NotificationEvent): Promise<NotificationResult> {
    return {
      ok: false,
      error:
        "Email channel is configured (NOTIFY_EMAIL_TO is set) but sending is not implemented — no SMTP/email provider is wired up yet.",
    };
  },
};
