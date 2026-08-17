import { readJsonFile, writeJsonFile } from "./fileStore";
import { isSupabaseBackendEnabled } from "./dataBackend";
import {
  addLeadNoteInSupabase,
  createLeadInSupabase,
  deleteLeadFromSupabase,
  getLeadByIdFromSupabase,
  listAllLeadsFromSupabase,
  updateLeadInSupabase,
} from "./supabase/leadsSupabase";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import type {
  FollowUpStatus,
  Lead,
  LeadActivityEntry,
  LeadActivityType,
  LeadPriority,
  LeadStatus,
  LeadSubmission,
} from "@/types/leads";

/**
 * [Phase L — CRM Foundation] Server-only lead repository — same
 * `data/*.json` file-store pattern every other repository in this
 * project already uses (`projectsRepository.ts`, `siteContentRepository.ts`),
 * not a new persistence mechanism. `data/leads.json` is the live source
 * for both `POST /api/leads` (public, creates) and `/api/admin/leads/**`
 * (admin-only, reads/updates/deletes).
 */

const LEADS_FILE = "leads.json";

function seedLeads(): Lead[] {
  return [];
}

async function readAllLeads(): Promise<Lead[]> {
  return readJsonFile<Lead[]>(LEADS_FILE, seedLeads);
}

async function writeAllLeads(leads: Lead[]): Promise<void> {
  await writeJsonFile(LEADS_FILE, leads);
}

function genId(): string {
  return `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function activityEntry(type: LeadActivityType, detail?: string): LeadActivityEntry {
  return { id: genId(), type, detail, createdAt: new Date().toISOString() };
}

// [Phase 4B — write path] Read AND write switched together in the same
// commit, deliberately — see dataBackend.ts's header comment for why every
// domain in this phase moves both directions at once (a real, live bug
// from splitting them briefly in Phase 4A is documented there).
export async function listAllLeads(): Promise<Lead[]> {
  if (isSupabaseBackendEnabled()) return listAllLeadsFromSupabase();
  const all = await readAllLeads();
  return [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getLeadById(id: string): Promise<Lead | undefined> {
  if (isSupabaseBackendEnabled()) return getLeadByIdFromSupabase(id);
  const all = await readAllLeads();
  return all.find((l) => l.id === id);
}

/** Creates a lead from a public form submission — every CRM-internal field (status/priority/activity/timestamps) is server-assigned, never trusted from the client. */
export async function createLeadRecord(submission: LeadSubmission): Promise<Lead> {
  const initialActivity = activityEntry("created", submission.formName ? `via "${submission.formName}"` : undefined);

  let lead: Lead;
  if (isSupabaseBackendEnabled()) {
    lead = await createLeadInSupabase(submission, initialActivity);
  } else {
    const all = await readAllLeads();
    const now = new Date().toISOString();
    lead = {
      id: genId(),
      ...submission,
      status: "New",
      priority: "Medium",
      followUpStatus: "none",
      tags: [],
      notes: [],
      activity: [initialActivity],
      createdAt: now,
      updatedAt: now,
    };
    all.push(lead);
    await writeAllLeads(all);
  }
  // Fire-and-await, but never let a notification failure affect the lead
  // creation result — dispatchNotification() already swallows per-channel
  // errors internally (see that file's header comment).
  await dispatchNotification({ type: "lead_created", lead });
  return lead;
}

/**
 * Admin-side update — accepts a patch plus an optional list of activity
 * entries to append (status/priority changes, notes, tags) so the caller
 * (the API route) can describe exactly what happened rather than this
 * function guessing from a before/after diff.
 */
export async function updateLeadRecord(
  id: string,
  patch: Partial<
    Pick<Lead, "status" | "priority" | "followUpDate" | "followUpStatus" | "lastContactedAt" | "nextAction" | "tags">
  >,
  newActivity: LeadActivityEntry[] = [],
): Promise<Lead | undefined> {
  if (isSupabaseBackendEnabled()) return updateLeadInSupabase(id, patch, newActivity);

  const all = await readAllLeads();
  const index = all.findIndex((l) => l.id === id);
  if (index === -1) return undefined;
  const existing = all[index];
  const updated: Lead = {
    ...existing,
    ...patch,
    activity: [...existing.activity, ...newActivity],
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  await writeAllLeads(all);
  return updated;
}

export async function addLeadNote(id: string, text: string): Promise<Lead | undefined> {
  if (isSupabaseBackendEnabled()) return addLeadNoteInSupabase(id, text);

  const all = await readAllLeads();
  const index = all.findIndex((l) => l.id === id);
  if (index === -1) return undefined;
  const note = { id: genId(), text, createdAt: new Date().toISOString() };
  const updated: Lead = {
    ...all[index],
    notes: [...all[index].notes, note],
    activity: [...all[index].activity, activityEntry("note_added")],
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  await writeAllLeads(all);
  return updated;
}

export async function deleteLeadRecord(id: string): Promise<void> {
  if (isSupabaseBackendEnabled()) {
    await deleteLeadFromSupabase(id);
    return;
  }
  const all = await readAllLeads();
  await writeAllLeads(all.filter((l) => l.id !== id));
}

export function statusActivity(from: LeadStatus, to: LeadStatus): LeadActivityEntry {
  return activityEntry("status_changed", `${from} → ${to}`);
}
export function priorityActivity(from: LeadPriority, to: LeadPriority): LeadActivityEntry {
  return activityEntry("priority_changed", `${from} → ${to}`);
}
export function followUpActivity(date: string): LeadActivityEntry {
  return activityEntry("follow_up_scheduled", date);
}
export function tagActivity(type: "tag_added" | "tag_removed", tag: string): LeadActivityEntry {
  return activityEntry(type, tag);
}
/** [Follow-up system] One activity entry per follow-up-status transition — "Scheduled"→"Completed"/"Cancelled" are the only two an admin explicitly triggers; "Due"/"Overdue" are derived display states, never a transition of their own (see `deriveFollowUpState`). */
export function followUpStatusActivity(status: FollowUpStatus): LeadActivityEntry | null {
  if (status === "completed") return activityEntry("follow_up_completed");
  if (status === "cancelled") return activityEntry("follow_up_cancelled");
  return null;
}
export function meetingActivity(detail: string): LeadActivityEntry {
  return activityEntry("meeting_recorded", detail);
}
export function lastContactedActivity(): LeadActivityEntry {
  return activityEntry("last_contacted_updated");
}
