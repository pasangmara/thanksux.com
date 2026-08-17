import { NextResponse } from "next/server";
import {
  addLeadNote,
  deleteLeadRecord,
  followUpActivity,
  followUpStatusActivity,
  getLeadById,
  lastContactedActivity,
  meetingActivity,
  priorityActivity,
  statusActivity,
  tagActivity,
  updateLeadRecord,
} from "@/lib/cms/leadsRepository";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { requireAdmin } from "@/lib/auth/requireAuth";
import type { FollowUpStatus, LeadActivityEntry, LeadPriority, LeadStatus } from "@/types/leads";

/** [Phase L — CRM, extended for Follow-up System] Admin-only lead detail: read, update (status/priority/follow-up/tags/note/meeting), delete. [Phase 1] `requireAdmin()` on every handler = defense-in-depth alongside proxy.ts — CRM data must never be reachable without it. */

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ lead });
}

interface UpdateBody {
  status?: LeadStatus;
  priority?: LeadPriority;
  followUpDate?: string;
  followUpStatus?: FollowUpStatus;
  nextAction?: string;
  tags?: string[];
  note?: string;
  /** Records a "meeting_recorded" activity entry — distinct from a regular note, per Phase 3's activity vocabulary. */
  meetingNote?: string;
  /** When true, sets `lastContactedAt` to now and logs a "last_contacted_updated" activity. */
  markContacted?: boolean;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  const body = (await request.json()) as UpdateBody;
  const existing = await getLeadById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const activity: LeadActivityEntry[] = [];
  if (body.status && body.status !== existing.status) activity.push(statusActivity(existing.status, body.status));
  if (body.priority && body.priority !== existing.priority) {
    activity.push(priorityActivity(existing.priority, body.priority));
  }
  if (body.followUpDate && body.followUpDate !== existing.followUpDate) {
    activity.push(followUpActivity(body.followUpDate));
  }
  if (body.followUpStatus && body.followUpStatus !== existing.followUpStatus) {
    const entry = followUpStatusActivity(body.followUpStatus);
    if (entry) activity.push(entry);
  }
  if (body.tags) {
    const added = body.tags.filter((t) => !existing.tags.includes(t));
    const removed = existing.tags.filter((t) => !body.tags!.includes(t));
    for (const t of added) activity.push(tagActivity("tag_added", t));
    for (const t of removed) activity.push(tagActivity("tag_removed", t));
  }
  if (body.markContacted) activity.push(lastContactedActivity());
  if (body.meetingNote && body.meetingNote.trim()) activity.push(meetingActivity(body.meetingNote.trim()));

  const updated = await updateLeadRecord(
    id,
    {
      status: body.status ?? existing.status,
      priority: body.priority ?? existing.priority,
      followUpDate: body.followUpDate ?? existing.followUpDate,
      followUpStatus: body.followUpStatus ?? existing.followUpStatus,
      nextAction: body.nextAction ?? existing.nextAction,
      lastContactedAt: body.markContacted ? new Date().toISOString() : existing.lastContactedAt,
      tags: body.tags ?? existing.tags,
    },
    activity,
  );

  if (updated && body.status && body.status !== existing.status) {
    await dispatchNotification({ type: "lead_status_changed", lead: updated, detail: `${existing.status} → ${body.status}` });
  }

  if (body.note && body.note.trim()) {
    const withNote = await addLeadNote(id, body.note.trim());
    return NextResponse.json({ lead: withNote });
  }

  return NextResponse.json({ lead: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;
  await deleteLeadRecord(id);
  return NextResponse.json({ ok: true });
}
