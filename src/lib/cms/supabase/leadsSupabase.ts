import { supabaseDelete, supabaseInsert, supabaseSelect, supabaseUpdate } from "@/lib/supabase/rest";
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
 * [Phase 4B — write path] CRM read + write together, switched in the same
 * commit — unlike every other domain in this phase, leads had NO prior
 * Supabase read path (Phase 4A deliberately excluded it: switching only
 * reads while public POST /api/leads kept writing to JSON would have made
 * every new inbound lead invisible in the admin CRM). Doing both
 * directions at once here means that risk never exists for this domain —
 * reads and writes move together, never split.
 */

interface LeadRow {
  id: string;
  form_name: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  service: string | null;
  project_type: string | null;
  budget: string | null;
  timeline: string | null;
  preferred_contact_method: string | null;
  message: string | null;
  first_touch: unknown;
  latest_touch: unknown;
  context: unknown;
  status: LeadStatus;
  priority: LeadPriority;
  follow_up_date: string | null;
  follow_up_status: FollowUpStatus;
  last_contacted_at: string | null;
  next_action: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}
interface NoteRow {
  id: string;
  lead_id: string;
  text: string;
  created_at: string;
}
interface ActivityRow {
  id: string;
  lead_id: string;
  type: LeadActivityType;
  detail: string | null;
  created_at: string;
}

function rowToLead(row: LeadRow, notes: NoteRow[], activity: ActivityRow[]): Lead {
  return {
    id: row.id,
    formName: row.form_name ?? undefined,
    name: row.name ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    service: row.service ?? undefined,
    projectType: row.project_type ?? undefined,
    budget: row.budget ?? undefined,
    timeline: row.timeline ?? undefined,
    preferredContactMethod: row.preferred_contact_method ?? undefined,
    message: row.message ?? undefined,
    firstTouch: (row.first_touch as Lead["firstTouch"]) ?? undefined,
    latestTouch: (row.latest_touch as Lead["latestTouch"]) ?? undefined,
    context: (row.context as Lead["context"]) ?? undefined,
    status: row.status,
    priority: row.priority,
    followUpDate: row.follow_up_date ?? undefined,
    followUpStatus: row.follow_up_status,
    lastContactedAt: row.last_contacted_at ?? undefined,
    nextAction: row.next_action ?? undefined,
    tags: row.tags ?? [],
    notes: notes
      .filter((n) => n.lead_id === row.id)
      .map((n) => ({ id: n.id, text: n.text, createdAt: n.created_at })),
    activity: activity
      .filter((a) => a.lead_id === row.id)
      .map((a) => ({ id: a.id, type: a.type, detail: a.detail ?? undefined, createdAt: a.created_at })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAllLeadsFromSupabase(): Promise<Lead[]> {
  const [rows, notes, activity] = await Promise.all([
    supabaseSelect<LeadRow[]>("leads", "select=*&order=created_at.desc"),
    supabaseSelect<NoteRow[]>("lead_notes", "select=*&order=created_at.asc"),
    supabaseSelect<ActivityRow[]>("lead_activity", "select=*&order=created_at.asc"),
  ]);
  return rows.map((r) => rowToLead(r, notes, activity));
}

export async function getLeadByIdFromSupabase(id: string): Promise<Lead | undefined> {
  const [rows, notes, activity] = await Promise.all([
    supabaseSelect<LeadRow[]>("leads", `select=*&id=eq.${id}&limit=1`),
    supabaseSelect<NoteRow[]>("lead_notes", `select=*&lead_id=eq.${id}&order=created_at.asc`),
    supabaseSelect<ActivityRow[]>("lead_activity", `select=*&lead_id=eq.${id}&order=created_at.asc`),
  ]);
  if (!rows[0]) return undefined;
  return rowToLead(rows[0], notes, activity);
}

export async function createLeadInSupabase(submission: LeadSubmission, initialActivity: LeadActivityEntry): Promise<Lead> {
  const [row] = await supabaseInsert<LeadRow[]>("leads", {
    form_name: submission.formName ?? null,
    name: submission.name ?? null,
    email: submission.email ?? null,
    phone: submission.phone ?? null,
    company: submission.company ?? null,
    service: submission.service ?? null,
    project_type: submission.projectType ?? null,
    budget: submission.budget ?? null,
    timeline: submission.timeline ?? null,
    preferred_contact_method: submission.preferredContactMethod ?? null,
    message: submission.message ?? null,
    first_touch: submission.firstTouch ?? null,
    latest_touch: submission.latestTouch ?? null,
    context: submission.context ?? null,
    status: "New",
    priority: "Medium",
    follow_up_status: "none",
    tags: [],
  });
  const [activityRow] = await supabaseInsert<ActivityRow[]>("lead_activity", {
    lead_id: row.id,
    type: initialActivity.type,
    detail: initialActivity.detail ?? null,
  });
  return rowToLead(row, [], [activityRow]);
}

export async function updateLeadInSupabase(
  id: string,
  patch: Partial<
    Pick<Lead, "status" | "priority" | "followUpDate" | "followUpStatus" | "lastContactedAt" | "nextAction" | "tags">
  >,
  newActivity: LeadActivityEntry[],
): Promise<Lead | undefined> {
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.priority !== undefined) dbPatch.priority = patch.priority;
  if (patch.followUpDate !== undefined) dbPatch.follow_up_date = patch.followUpDate;
  if (patch.followUpStatus !== undefined) dbPatch.follow_up_status = patch.followUpStatus;
  if (patch.lastContactedAt !== undefined) dbPatch.last_contacted_at = patch.lastContactedAt;
  if (patch.nextAction !== undefined) dbPatch.next_action = patch.nextAction;
  if (patch.tags !== undefined) dbPatch.tags = patch.tags;

  const [row] = await supabaseUpdate<LeadRow[]>("leads", `id=eq.${id}`, dbPatch);
  if (!row) return undefined;
  if (newActivity.length > 0) {
    await supabaseInsert(
      "lead_activity",
      newActivity.map((a) => ({ lead_id: id, type: a.type, detail: a.detail ?? null })),
    );
  }
  return getLeadByIdFromSupabase(id);
}

export async function addLeadNoteInSupabase(id: string, text: string): Promise<Lead | undefined> {
  const exists = await supabaseSelect<{ id: string }[]>("leads", `select=id&id=eq.${id}&limit=1`);
  if (!exists[0]) return undefined;
  await supabaseInsert("lead_notes", { lead_id: id, text });
  await supabaseInsert("lead_activity", { lead_id: id, type: "note_added" });
  await supabaseUpdate("leads", `id=eq.${id}`, { updated_at: new Date().toISOString() });
  return getLeadByIdFromSupabase(id);
}

export async function deleteLeadFromSupabase(id: string): Promise<void> {
  // ON DELETE CASCADE removes lead_notes/lead_activity automatically (same schema pattern as projects).
  await supabaseDelete("leads", `id=eq.${id}`);
}
