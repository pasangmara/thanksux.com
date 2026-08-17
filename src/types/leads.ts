/**
 * [Phase L — CRM Foundation] The lead/CRM data model. A `Lead` is created
 * once, server-side, from a real `LeadForm` submission
 * (`POST /api/leads`) — nothing here is ever fabricated; every
 * attribution/context field is either what the visitor's browser actually
 * captured (UTM params, gclid, referrer) or left `undefined`, never a
 * guessed/invented value.
 */

export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Negotiation"
  | "Won"
  | "Lost"
  | "Archived";

export const LEAD_STATUSES: LeadStatus[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Negotiation",
  "Won",
  "Lost",
  "Archived",
];

export type LeadPriority = "Low" | "Medium" | "High";
export const LEAD_PRIORITIES: LeadPriority[] = ["Low", "Medium", "High"];

/**
 * [Follow-up system] `followUpStatus` is the admin's explicit intent
 * ("Scheduled"/"Completed"/"Cancelled"/unset = "No follow-up"); "Due" and
 * "Overdue" are never stored — they're derived at render time from
 * `followUpStatus === "Scheduled"` plus whether `followUpDate` has passed
 * (see `deriveFollowUpState` below), so the two can never drift out of
 * sync with each other or with "what time is it right now."
 */
export type FollowUpStatus = "none" | "scheduled" | "completed" | "cancelled";
export const FOLLOW_UP_STATUSES: FollowUpStatus[] = ["none", "scheduled", "completed", "cancelled"];

export type FollowUpState = "No follow-up" | "Scheduled" | "Due" | "Overdue" | "Completed" | "Cancelled";

/** Pure function — the one place "is this follow-up due/overdue" is computed, so the CRM list and the lead detail page can never disagree. */
export function deriveFollowUpState(status: FollowUpStatus, followUpDate?: string, now: Date = new Date()): FollowUpState {
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status !== "scheduled" || !followUpDate) return "No follow-up";
  const due = new Date(followUpDate);
  if (Number.isNaN(due.getTime())) return "Scheduled";
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (due < startOfToday) return "Overdue";
  if (due.toDateString() === now.toDateString()) return "Due";
  return "Scheduled";
}

/**
 * One touch's attribution snapshot — captured client-side by
 * `src/lib/analytics/attribution.ts` from the visitor's actual URL/
 * referrer at that moment. `firstTouch` is written once and never
 * overwritten for the life of the visitor's stored attribution; `latestTouch`
 * is overwritten on every session that arrives with new UTM/click-id params.
 */
export interface LeadAttribution {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  landingPage?: string;
  referrer?: string;
  capturedAt?: string;
}

/** What the visitor was looking at when they submitted — attached automatically, never manually re-entered. */
export interface LeadContext {
  projectId?: string;
  projectTitle?: string;
  projectCategory?: string;
  projectUrl?: string;
  serviceName?: string;
  page?: string;
}

export interface LeadNote {
  id: string;
  text: string;
  createdAt: string;
}

export type LeadActivityType =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "note_added"
  | "follow_up_scheduled"
  | "follow_up_completed"
  | "follow_up_cancelled"
  | "meeting_recorded"
  | "last_contacted_updated"
  | "tag_added"
  | "tag_removed";

export interface LeadActivityEntry {
  id: string;
  type: LeadActivityType;
  detail?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  formName?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  service?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  preferredContactMethod?: string;
  message?: string;
  firstTouch?: LeadAttribution;
  latestTouch?: LeadAttribution;
  context?: LeadContext;
  status: LeadStatus;
  priority: LeadPriority;
  followUpDate?: string;
  /** [Follow-up system] Defaults to "none" — see `FollowUpStatus`'s doc comment for why "Due"/"Overdue" are derived, not stored here. */
  followUpStatus: FollowUpStatus;
  /** [Follow-up system] When this lead was last actually contacted — distinct from `updatedAt` (any field edit) or `createdAt` (form submission); set explicitly via the "Mark contacted" action. */
  lastContactedAt?: string;
  /** [Follow-up system] Free-text — "what to do next" at a glance, e.g. "Send proposal", "Call to confirm scope." */
  nextAction?: string;
  tags: string[];
  notes: LeadNote[];
  activity: LeadActivityEntry[];
  createdAt: string;
  updatedAt: string;
}

/** Shape the public `POST /api/leads` route accepts — a strict subset of `Lead`, everything else (id, status, priority, activity, timestamps) is server-assigned so a client can never forge CRM-internal state. */
export interface LeadSubmission {
  formName?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  service?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  preferredContactMethod?: string;
  message?: string;
  firstTouch?: LeadAttribution;
  latestTouch?: LeadAttribution;
  context?: LeadContext;
}
