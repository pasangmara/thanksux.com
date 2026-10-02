import "server-only";
import { UserError } from "@/lib/errors";
import { z } from "zod";
import { getStore } from "@/lib/data/store";
import { POST_STATUS_META, RECOMMEND_LABEL, servicesLabel } from "@/lib/domain/labels";
import { POST_STATUSES, type Client, type DisplayMode, type Feedback, type PostStatus, type PublicMember } from "@/lib/domain/types";
import { emit } from "@/lib/integrations/outbox";
import { firstName, nowIso, uid } from "@/lib/util";
import { logActivity } from "./activity";
import { baseUrl, fileUrl } from "./settings";

const score = z.coerce.number().int().min(1).max(5);
const optionalScore = z
  .union([z.literal(""), z.literal("0"), score])
  .transform((v) => (v === "" || v === "0" ? null : (v as number)))
  .nullable()
  .optional();
const longText = z
  .string()
  .trim()
  .max(1000, "Please keep it under 1000 characters")
  .transform((v) => v || null)
  .nullable()
  .optional();

export const feedbackInput = z.object({
  rating: score,
  communication: optionalScore,
  result: optionalScore,
  did_well: longText,
  do_better: longText,
  recommend: z
    .enum(["yes", "maybe", "no", ""])
    .transform((v) => v || null)
    .nullable()
    .optional(),
  public_permission: z.coerce.boolean().default(false),
  display_mode: z
    .enum(["name_company", "first_name", "anonymous", ""])
    .transform((v) => v || null)
    .nullable()
    .optional(),
  language: z.enum(["en", "bn"]).default("en"),
});
export type FeedbackInput = z.input<typeof feedbackInput>;

export function displayNameFor(client: Pick<Client, "name" | "company">, mode: DisplayMode | null): string | null {
  if (!mode) return null;
  if (mode === "anonymous") return "A client of ARGUS";
  if (mode === "first_name") return firstName(client.name);
  return client.company ? `${client.name}, ${client.company}` : client.name;
}

async function nextRef(): Promise<string> {
  const store = await getStore();
  const all = await store.list<Feedback>("feedback");
  const max = all.reduce((m, f) => Math.max(m, Number(f.ref.replace(/\D/g, "")) || 0), 0);
  return `FB-${String(max + 1).padStart(4, "0")}`;
}

export type SubmitOutcome = { kind: "high" | "low"; ref: string; displayName: string | null };

/** Saves a client's feedback. One submission per link: the link then shows "already received". */
export async function submitFeedback(client: Client, raw: unknown, photoFileId: string | null): Promise<SubmitOutcome> {
  const input = feedbackInput.parse(raw);
  const store = await getStore();
  const permission = input.public_permission;
  const mode: DisplayMode | null = permission ? (input.display_mode ?? "name_company") : null;
  const now = nowIso();

  let feedback: Feedback | null = null;
  for (let attempt = 0; attempt < 3 && !feedback; attempt++) {
    const row: Feedback = {
      id: uid(),
      ref: await nextRef(),
      client_id: client.id,
      feedback_code: client.feedback_code,
      created_at: now,
      client_name: client.name,
      company: client.company,
      services: client.services,
      rating: input.rating,
      communication: input.communication ?? null,
      result: input.result ?? null,
      did_well: input.did_well ?? null,
      do_better: input.do_better ?? null,
      recommend: input.recommend ?? null,
      public_permission: permission,
      display_mode: mode,
      display_name: displayNameFor(client, mode),
      photo_file_id: permission ? photoFileId : null,
      language: input.language,
      follow_up: input.rating <= 3 ? "open" : null,
      // Good feedback with permission goes straight to the "to post" queue.
      post_status: permission && input.rating >= 4 ? "pending" : "not_for_post",
      post_link: null,
      posted_at: null,
      updated_at: now,
    };
    try {
      feedback = await store.insert<Feedback>("feedback", row);
    } catch (err) {
      // Two submissions at the same moment can race for the same ref: retry with the next one.
      if (attempt === 2) throw err;
    }
  }
  if (!feedback) throw new Error("Could not save feedback");

  await store.update<Client>("clients", client.id, { link_status: "submitted", updated_at: now });
  await logActivity(
    client.id,
    "feedback_received",
    `Feedback received · ${feedback.rating}★${feedback.rating <= 3 ? " · urgent" : ""}`,
    "Client",
  );
  await emit("feedback.created", await eventData(feedback), { urgent: feedback.rating <= 3 });

  return { kind: feedback.rating >= 4 ? "high" : "low", ref: feedback.ref, displayName: feedback.display_name };
}

export async function listFeedback(): Promise<Feedback[]> {
  const store = await getStore();
  return store.list<Feedback>("feedback", { orderBy: { column: "created_at", dir: "desc" } });
}

export async function getFeedback(id: string): Promise<Feedback | null> {
  const store = await getStore();
  return store.get<Feedback>("feedback", id);
}

export const postInput = z
  .object({
    post_status: z.enum(POST_STATUSES),
    post_link: z
      .string()
      .trim()
      .max(500)
      .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), "Paste a full link that starts with https://")
      .transform((v) => v || null)
      .nullable()
      .optional(),
    follow_up: z.enum(["open", "done", "none"]).optional(),
  })
  .refine((v) => v.post_status !== "posted" || Boolean(v.post_link), {
    path: ["post_link"],
    message: "Add the post link to mark it as posted",
  });

export async function updateFeedbackStatus(id: string, raw: unknown, actor: PublicMember): Promise<Feedback> {
  const input = postInput.parse(raw);
  const store = await getStore();
  const current = await store.get<Feedback>("feedback", id);
  if (!current) throw new UserError("Feedback not found");

  let post_status: PostStatus = input.post_status;
  if (!current.public_permission) post_status = "not_for_post"; // never post without permission
  const patch: Partial<Feedback> = {
    post_status,
    post_link: post_status === "not_for_post" ? null : (input.post_link ?? null),
    posted_at: post_status === "posted" ? (current.posted_at ?? nowIso()) : null,
    updated_at: nowIso(),
  };
  if (input.follow_up && current.follow_up !== null) {
    patch.follow_up = input.follow_up === "none" ? current.follow_up : input.follow_up;
  }
  const updated = (await store.update<Feedback>("feedback", id, patch))!;

  if (current.post_status !== updated.post_status || current.post_link !== updated.post_link) {
    await logActivity(current.client_id, "post_status_changed", `Post → ${POST_STATUS_META[updated.post_status].label}`, actor.name);
    await emit("post.status_changed", {
      feedback_id: updated.id,
      ref: updated.ref,
      client: updated.client_name,
      post_status: updated.post_status,
      post_status_label: POST_STATUS_META[updated.post_status].label,
      post_link: updated.post_link,
      sheet_row: sheetRow(updated, await baseUrl()),
    });
  }
  if (current.follow_up !== updated.follow_up) {
    await logActivity(
      current.client_id,
      updated.follow_up === "done" ? "followup_done" : "followup_reopened",
      updated.follow_up === "done" ? "Follow-up marked done" : "Follow-up reopened",
      actor.name,
    );
    await emit("followup.changed", { feedback_id: updated.id, ref: updated.ref, client: updated.client_name, follow_up: updated.follow_up });
  }
  return updated;
}

/** The 18 Google Sheet columns, in order. n8n can map this object 1:1 to a row. */
export const SHEET_COLUMNS = [
  "Feedback ID",
  "Date",
  "Client",
  "Company",
  "Service",
  "Rating",
  "Communication",
  "Result",
  "Did well",
  "Do better",
  "Recommend",
  "Public permission",
  "Display name",
  "Photo URL",
  "Follow-up",
  "Post status",
  "Post link",
  "Source",
] as const;

export function sheetRow(f: Feedback, base: string): Record<(typeof SHEET_COLUMNS)[number], string | number> {
  return {
    "Feedback ID": f.ref,
    // Bangladesh time, "YYYY-MM-DD HH:mm" (sorts correctly in Sheets).
    Date: new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date(f.created_at)),
    Client: f.client_name,
    Company: f.company ?? "",
    Service: servicesLabel(f.services),
    Rating: f.rating,
    Communication: f.communication ?? "",
    Result: f.result ?? "",
    "Did well": f.did_well ?? "",
    "Do better": f.do_better ?? "",
    Recommend: f.recommend ? RECOMMEND_LABEL[f.recommend] : "",
    "Public permission": f.public_permission ? "Yes" : "No",
    "Display name": f.display_name ?? "",
    "Photo URL": f.photo_file_id ? `${base}${fileUrl(f.photo_file_id)}` : "",
    "Follow-up": f.follow_up === "open" ? "Open" : f.follow_up === "done" ? "Done" : "",
    "Post status": POST_STATUS_META[f.post_status].label,
    "Post link": f.post_link ?? "",
    Source: `Personal link (${f.language.toUpperCase()})`,
  };
}

async function eventData(f: Feedback) {
  const base = await baseUrl();
  return {
    feedback_id: f.id,
    ref: f.ref,
    created_at: f.created_at,
    client_id: f.client_id,
    client: f.client_name,
    company: f.company,
    services: f.services,
    rating: f.rating,
    communication: f.communication,
    result: f.result,
    did_well: f.did_well,
    do_better: f.do_better,
    recommend: f.recommend,
    public_permission: f.public_permission,
    display_name: f.display_name,
    photo_url: f.photo_file_id ? `${base}${fileUrl(f.photo_file_id)}` : null,
    language: f.language,
    follow_up: f.follow_up,
    post_status: f.post_status,
    dashboard_url: `${base}/hub/feedback?id=${f.id}`,
    sheet_row: sheetRow(f, base),
  };
}

function csvCell(v: string | number): string {
  const s = String(v);
  // Neutralise spreadsheet formulas (CSV injection) and quote everything.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function feedbackCsv(): Promise<string> {
  const base = await baseUrl();
  const rows = await listFeedback();
  const lines = [SHEET_COLUMNS.map(csvCell).join(",")];
  for (const f of rows) {
    const r = sheetRow(f, base);
    lines.push(SHEET_COLUMNS.map((c) => csvCell(r[c])).join(","));
  }
  return "﻿" + lines.join("\r\n"); // BOM so Excel opens Bangla text correctly
}
