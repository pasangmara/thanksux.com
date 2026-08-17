/**
 * ["I can solve this" real notification flow] Client-facing shape for the
 * `notifications` table (migration 0021). `type` is free text at the
 * database level (no CHECK enum) — kept general on purpose so a future
 * notification kind never needs a migration, only a new value here.
 */
export type NotificationType = "contribution_offer";

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string | null;
  referenceType: string | null;
  referenceId: string | null;
  readAt: string | null;
  createdAt: string;
}
