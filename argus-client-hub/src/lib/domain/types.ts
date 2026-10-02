/**
 * Domain types. Column names are snake_case and identical in Postgres
 * (db/migrations) and in the demo JSON store, so rows move between
 * layers without mapping.
 */

export const SERVICES = ["brand", "website", "ai_automation", "ads", "content"] as const;
export type Service = (typeof SERVICES)[number];

export const CLIENT_STATUSES = ["onboarding", "active", "completed", "paused"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

/** Lifecycle of a client's personal feedback link. */
export const LINK_STATUSES = ["not_sent", "sent", "opened", "submitted"] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export const POST_STATUSES = ["not_for_post", "pending", "posted"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export type FollowUp = "open" | "done" | null;
export type Recommend = "yes" | "maybe" | "no";
export type DisplayMode = "name_company" | "first_name" | "anonymous";
export type Lang = "en" | "bn";
export type Role = "admin" | "staff";

export interface Client {
  id: string;
  name: string;
  company: string | null;
  whatsapp: string | null;
  email: string | null;
  services: Service[];
  package: string | null;
  status: ClientStatus;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  completed_at: string | null; // ISO, set when status becomes "completed"
  preferred_language: Lang;
  feedback_code: string;
  link_status: LinkStatus;
  link_sent_at: string | null;
  link_opened_at: string | null;
  last_contact_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  ref: string; // FB-0001
  client_id: string;
  feedback_code: string;
  created_at: string;
  // snapshot of the client at submit time (stays correct if the client is edited later)
  client_name: string;
  company: string | null;
  services: Service[];
  rating: number; // 1–5, required
  communication: number | null;
  result: number | null;
  did_well: string | null;
  do_better: string | null;
  recommend: Recommend | null;
  public_permission: boolean;
  display_mode: DisplayMode | null;
  display_name: string | null;
  photo_file_id: string | null;
  language: Lang;
  follow_up: FollowUp;
  post_status: PostStatus;
  post_link: string | null;
  posted_at: string | null;
  updated_at: string;
}

export type ActivityType =
  | "client_created"
  | "client_updated"
  | "status_changed"
  | "link_sent"
  | "link_opened"
  | "link_regenerated"
  | "feedback_received"
  | "followup_done"
  | "followup_reopened"
  | "post_status_changed"
  | "contact_logged";

export interface Activity {
  id: string;
  client_id: string;
  type: ActivityType;
  text: string;
  actor: string | null; // team member name, or "Client"
  created_at: string;
}

export const EVENT_NAMES = [
  "feedback.created",
  "post.status_changed",
  "followup.changed",
  "client.created",
  "client.link_sent",
  "reminder.due",
  "test.ping",
] as const;
export type EventName = (typeof EVENT_NAMES)[number];

/** pending = waiting for n8n (not connected yet, or not tried yet). */
export type OutboxStatus = "pending" | "sent" | "failed" | "skipped";

export interface OutboxEvent {
  id: string;
  event: EventName;
  payload: Record<string, unknown>;
  status: OutboxStatus;
  attempts: number;
  last_error: string | null;
  next_attempt_at: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  created_at: string;
  last_login_at: string | null;
}

export interface SessionRow {
  id: string; // sha256(token), never the raw token
  member_id: string;
  created_at: string;
  expires_at: string;
}

export interface StoredFile {
  id: string;
  name: string;
  mime: string;
  size: number;
  created_at: string;
  data: Buffer;
}

export interface Settings {
  brand: {
    founder_name: string;
    founder_role: string;
    founder_photo_file_id: string | null; // null = /brand/founder-thank-you.webp
    founder_avatar_file_id: string | null; // null = /brand/founder-avatar.webp
    note_en: string;
    note_bn: string;
    thanks_en: string;
    thanks_bn: string;
  };
  contact: {
    whatsapp: string; // shown to clients on the 1–3★ and invalid-link pages
    email: string;
  };
  review_links: {
    facebook: string;
    google: string; // empty = hide the button
  };
  notify: {
    whatsapp: string;
    email: string;
    new_feedback: boolean;
    low_rating: boolean;
    daily_reminder: boolean;
    post_status: boolean;
  };
  sheet: { url: string };
  n8n: {
    webhook_url: string; // can also come from N8N_WEBHOOK_URL (env wins)
    secret: string; // can also come from N8N_WEBHOOK_SECRET (env wins)
    events: Record<EventName, boolean>;
  };
  reminders: {
    days_after_completion: number;
  };
}

export type PublicMember = Pick<TeamMember, "id" | "email" | "name" | "role" | "created_at" | "last_login_at">;
