import { emailChannel } from "./channels/emailChannel";
import { webhookChannel } from "./channels/webhookChannel";
import type { NotificationChannel, NotificationEvent } from "./types";

/**
 * [Phase 5 — Notification Architecture] Lead Created -> Notification
 * Service -> Configured Channels, exactly the flow this phase's brief
 * describes. One dispatcher, every channel it knows about — adding a
 * future channel (Slack, WhatsApp) means adding one file implementing
 * `NotificationChannel` and one line here, never touching a call site.
 *
 * Every failure (a channel not configured, a channel's `send()` throwing
 * or returning `ok: false`) is swallowed here, logged only in
 * development — a notification channel being down must never break the
 * actual lead-creation/status-change flow that triggered it. Server-only:
 * imported exclusively from `leadsRepository.ts` and the admin leads API
 * route, never from client code.
 */

const CHANNELS: NotificationChannel[] = [webhookChannel, emailChannel];

export async function dispatchNotification(event: NotificationEvent): Promise<void> {
  for (const channel of CHANNELS) {
    if (!channel.isConfigured()) continue;
    try {
      const result = await channel.send(event);
      if (!result.ok && process.env.NODE_ENV === "development") {
        console.warn(`[notifications] ${channel.name} did not deliver: ${result.error}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[notifications] ${channel.name} threw`, err);
      }
    }
  }
}

/** For `/admin/marketing`'s status display — real configuration state, never a fabricated "Connected." */
export function notificationChannelStatus(): { name: string; configured: boolean }[] {
  return CHANNELS.map((c) => ({ name: c.name, configured: c.isConfigured() }));
}
