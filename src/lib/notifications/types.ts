import type { Lead } from "@/types/leads";

/**
 * [Phase 5 — Notification Architecture] The event vocabulary a
 * notification channel can react to. Deliberately small and tied to real
 * trigger points this codebase already has (lead creation, an admin
 * changing a lead's status) — no "follow_up_due" firing mechanism exists
 * because there's no scheduler/cron in this project, and building a fake
 * one just to check a box would be exactly the kind of faked
 * functionality this phase was told not to produce. The event name stays
 * documented here so a real scheduler (a future Next.js cron route, a
 * separate worker, etc.) has a defined shape to fire into later.
 */
export type NotificationEventType = "lead_created" | "lead_status_changed" | "follow_up_due";

export interface NotificationEvent {
  type: NotificationEventType;
  lead: Lead;
  detail?: string;
}

export interface NotificationResult {
  ok: boolean;
  error?: string;
}

/**
 * One channel = one delivery mechanism. `isConfigured()` must be cheap
 * and synchronous (env var presence checks only) — the dispatcher
 * (`dispatch.ts`) uses it to silently skip any channel with nothing
 * configured, which is what "safely support NOT CONFIGURED without
 * throwing errors" actually means structurally, not just a try/catch.
 */
export interface NotificationChannel {
  name: string;
  isConfigured(): boolean;
  send(event: NotificationEvent): Promise<NotificationResult>;
}
