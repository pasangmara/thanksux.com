"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  adminButtonDanger,
  adminButtonSecondary,
  adminButtonSmall,
  adminButtonSmallDanger,
  SaveStatusMessage,
  Section,
  SelectField,
  Spinner,
  TextField,
} from "@/components/admin/fields";
import { deleteLead, getLead, updateLead } from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import {
  deriveFollowUpState,
  FOLLOW_UP_STATUSES,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  type FollowUpStatus,
  type Lead,
  type LeadPriority,
  type LeadStatus,
} from "@/types/leads";

const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  none: "No follow-up",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
};

function FollowUpBadge({ state }: { state: string }) {
  const tone =
    state === "Overdue"
      ? "border-error text-error"
      : state === "Due"
        ? "border-accent text-accent"
        : state === "Completed"
          ? "border-ink bg-ink text-white"
          : "border-border text-text-tertiary";
  return <span className={`inline-flex rounded-sm border px-2 py-0.5 text-caption ${tone}`}>{state}</span>;
}

/**
 * /admin/leads/[id] — full lead detail per Phase L §11/§12: contact info,
 * source/attribution, inquiry, project/service context, notes, activity
 * timeline, status/priority/follow-up/tags. Never exposed publicly — this
 * route lives under /admin, same isolation as every other admin page
 * (AdminShell's own banner, SiteNav/SiteFooter self-hiding, no public link
 * ever points here).
 */
export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [newTag, setNewTag] = useState("");
  const [meetingNote, setMeetingNote] = useState("");
  const saveState = useSaveStatus();
  const deleteState = useSaveStatus();

  useEffect(() => {
    let cancelled = false;
    getLead(params.id).then((l) => {
      if (cancelled) return;
      if (!l) {
        setNotFound(true);
        return;
      }
      setLead(l);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <div>
        <p className="text-body">No lead with id &ldquo;{params.id}&rdquo; was found.</p>
        <Link href="/admin/leads" className="text-body text-accent underline">
          Back to leads
        </Link>
      </div>
    );
  }
  if (!lead) return <p className="text-body text-text-secondary">Loading…</p>;

  async function applyPatch(patch: Parameters<typeof updateLead>[1]) {
    await saveState.run(async () => {
      const updated = await updateLead(lead!.id, patch);
      setLead(updated);
    });
  }

  async function handleDelete() {
    if (!lead) return;
    if (!window.confirm(`Permanently delete this lead (${lead.name || lead.email || lead.id})? This cannot be undone.`)) {
      return;
    }
    await deleteState.run(async () => {
      await deleteLead(lead.id);
      router.push("/admin/leads");
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/leads" className="text-caption text-accent underline">
            ← All leads
          </Link>
          <h1 className="text-h1 mt-2">{lead.name || lead.email || lead.phone || "Unnamed lead"}</h1>
          <p className="text-caption mt-1 text-text-tertiary">
            id: {lead.id} · created {new Date(lead.createdAt).toLocaleString()}
          </p>
        </div>
        <button type="button" onClick={handleDelete} disabled={deleteState.isBusy} className={adminButtonDanger}>
          {deleteState.isBusy ? <Spinner className="text-error" /> : null}
          {deleteState.isBusy ? "Deleting…" : "Delete"}
        </button>
      </div>

      <SaveStatusMessage status={saveState.status} error={saveState.error} />
      {deleteState.status === "error" ? <SaveStatusMessage status={deleteState.status} error={deleteState.error} /> : null}

      <Section title="Status & Priority">
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-3">
          <SelectField
            id="status"
            label="Status"
            value={lead.status}
            options={LEAD_STATUSES}
            onChange={(status: LeadStatus) => applyPatch({ status })}
          />
          <SelectField
            id="priority"
            label="Priority"
            value={lead.priority}
            options={LEAD_PRIORITIES}
            onChange={(priority: LeadPriority) => applyPatch({ priority })}
          />
          <TextField
            id="followUpDate"
            label="Follow-up Date"
            type="date"
            value={lead.followUpDate ?? ""}
            onChange={(v) => applyPatch({ followUpDate: v, followUpStatus: v ? "scheduled" : lead.followUpStatus })}
          />
        </div>
      </Section>

      <Section
        title="Follow-up"
        description="Due/Overdue are computed from today's date and the follow-up date above — not something you set directly."
      >
        <div className="flex flex-wrap items-center gap-3">
          <FollowUpBadge state={deriveFollowUpState(lead.followUpStatus, lead.followUpDate)} />
          <SelectField
            id="followUpStatus"
            label="Follow-up Status"
            value={lead.followUpStatus}
            options={FOLLOW_UP_STATUSES}
            getOptionLabel={(s) => FOLLOW_UP_LABELS[s]}
            onChange={(followUpStatus: FollowUpStatus) => applyPatch({ followUpStatus })}
          />
        </div>
        <TextField
          id="nextAction"
          label="Next Action"
          value={lead.nextAction ?? ""}
          onChange={(v) => applyPatch({ nextAction: v })}
          placeholder='e.g. "Send proposal", "Call to confirm scope"'
        />
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-caption text-text-tertiary">
            Last contacted: {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleString() : "Never"}
          </p>
          <button
            type="button"
            onClick={() => applyPatch({ markContacted: true })}
            disabled={saveState.isBusy}
            className={adminButtonSmall}
          >
            Mark contacted now
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={meetingNote}
            onChange={(e) => setMeetingNote(e.target.value)}
            placeholder="Record a meeting (e.g. &quot;Discovery call, 30min, discussed scope&quot;)"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-caption text-ink focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={async () => {
              if (!meetingNote.trim()) return;
              await applyPatch({ meetingNote: meetingNote.trim() });
              setMeetingNote("");
            }}
            className={adminButtonSmall}
          >
            Record meeting
          </button>
        </div>
      </Section>

      <Section title="Contact Information">
        <div className="grid grid-cols-1 gap-2 tablet:grid-cols-2">
          <p className="text-body"><span className="text-text-tertiary">Name:</span> {lead.name ?? "—"}</p>
          <p className="text-body"><span className="text-text-tertiary">Email:</span> {lead.email ?? "—"}</p>
          <p className="text-body"><span className="text-text-tertiary">Phone:</span> {lead.phone ?? "—"}</p>
          <p className="text-body"><span className="text-text-tertiary">Company:</span> {lead.company ?? "—"}</p>
          <p className="text-body"><span className="text-text-tertiary">Preferred contact:</span> {lead.preferredContactMethod ?? "—"}</p>
        </div>
      </Section>

      <Section title="Inquiry">
        <div className="grid grid-cols-1 gap-2 tablet:grid-cols-2">
          <p className="text-body"><span className="text-text-tertiary">Service:</span> {lead.service ?? "—"}</p>
          <p className="text-body"><span className="text-text-tertiary">Project type:</span> {lead.projectType ?? "—"}</p>
          <p className="text-body"><span className="text-text-tertiary">Budget:</span> {lead.budget ?? "—"}</p>
          <p className="text-body"><span className="text-text-tertiary">Timeline:</span> {lead.timeline ?? "—"}</p>
        </div>
        {lead.message ? (
          <div>
            <p className="text-caption text-text-tertiary">Message</p>
            <p className="text-body mt-1 whitespace-pre-wrap">{lead.message}</p>
          </div>
        ) : null}
      </Section>

      <Section title="Project / Service Context">
        {lead.context ? (
          <div className="grid grid-cols-1 gap-2 tablet:grid-cols-2">
            {lead.context.projectTitle ? <p className="text-body"><span className="text-text-tertiary">Project:</span> {lead.context.projectTitle}</p> : null}
            {lead.context.projectCategory ? <p className="text-body"><span className="text-text-tertiary">Category:</span> {lead.context.projectCategory}</p> : null}
            {lead.context.projectUrl ? (
              <p className="text-body">
                <span className="text-text-tertiary">Project URL:</span>{" "}
                <a href={lead.context.projectUrl} className="text-accent underline">{lead.context.projectUrl}</a>
              </p>
            ) : null}
            {lead.context.serviceName ? <p className="text-body"><span className="text-text-tertiary">Service:</span> {lead.context.serviceName}</p> : null}
            {lead.context.page ? <p className="text-body"><span className="text-text-tertiary">Page:</span> {lead.context.page}</p> : null}
          </div>
        ) : (
          <p className="text-caption text-text-tertiary">General inquiry — no specific project/service context.</p>
        )}
      </Section>

      <Section title="Attribution">
        <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">
          {(["firstTouch", "latestTouch"] as const).map((key) => {
            const touch = lead[key];
            return (
              <div key={key}>
                <p className="text-label">{key === "firstTouch" ? "First Touch" : "Latest Touch"}</p>
                {touch ? (
                  <div className="mt-1 flex flex-col gap-0.5 text-caption text-text-secondary">
                    <span>Source: {touch.source ?? "—"}</span>
                    <span>Medium: {touch.medium ?? "—"}</span>
                    <span>Campaign: {touch.campaign ?? "—"}</span>
                    <span>Term: {touch.term ?? "—"}</span>
                    <span>Content: {touch.content ?? "—"}</span>
                    <span>gclid: {touch.gclid ?? "—"}</span>
                    <span>Landing page: {touch.landingPage ?? "—"}</span>
                    <span>Referrer: {touch.referrer ?? "—"}</span>
                    <span>Captured: {touch.capturedAt ? new Date(touch.capturedAt).toLocaleString() : "—"}</span>
                  </div>
                ) : (
                  <p className="mt-1 text-caption text-text-tertiary">Not captured for this lead.</p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Tags">
        <div className="flex flex-wrap gap-2">
          {lead.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-caption">
              {tag}
              <button
                type="button"
                aria-label={`Remove tag ${tag}`}
                onClick={() => applyPatch({ tags: lead.tags.filter((t) => t !== tag) })}
                className="text-text-tertiary hover:text-error"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-caption text-ink focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!newTag.trim()) return;
              applyPatch({ tags: [...lead.tags, newTag.trim()] });
              setNewTag("");
            }}
            className={adminButtonSmall}
          >
            Add
          </button>
        </div>
      </Section>

      <Section title="Notes">
        <div className="flex flex-col gap-2">
          {lead.notes.length === 0 ? (
            <p className="text-caption text-text-tertiary">No notes yet.</p>
          ) : (
            lead.notes.map((note) => (
              <div key={note.id} className="rounded-md border border-border bg-surface p-3">
                <p className="text-body">{note.text}</p>
                <p className="mt-1 text-caption text-text-tertiary">{new Date(note.createdAt).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-caption text-ink focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={async () => {
              if (!noteText.trim()) return;
              await applyPatch({ note: noteText.trim() });
              setNoteText("");
            }}
            className={adminButtonSmall}
          >
            Add note
          </button>
        </div>
      </Section>

      <Section title="Activity Timeline">
        <ul className="flex flex-col gap-2">
          {[...lead.activity].reverse().map((entry) => (
            <li key={entry.id} className="flex items-baseline gap-3 border-t border-border pt-2 first:border-t-0 first:pt-0">
              <span className="text-caption text-text-tertiary">{new Date(entry.createdAt).toLocaleString()}</span>
              <span className="text-body">
                {entry.type.replace(/_/g, " ")}
                {entry.detail ? ` — ${entry.detail}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <button
          type="button"
          onClick={() => applyPatch({ status: "Archived" })}
          disabled={saveState.isBusy || lead.status === "Archived"}
          className={adminButtonSmallDanger}
        >
          Archive
        </button>
        <button type="button" onClick={() => router.push("/admin/leads")} className={adminButtonSecondary}>
          Back
        </button>
      </div>
    </div>
  );
}
