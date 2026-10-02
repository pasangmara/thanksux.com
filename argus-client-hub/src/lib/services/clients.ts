import "server-only";
import { UserError } from "@/lib/errors";
import { z } from "zod";
import { getStore } from "@/lib/data/store";
import { CLIENT_STATUS_META } from "@/lib/domain/labels";
import { CLIENT_STATUSES, SERVICES, type Client, type ClientStatus, type PublicMember } from "@/lib/domain/types";
import { emit } from "@/lib/integrations/outbox";
import { makeFeedbackCode, nowIso, uid } from "@/lib/util";
import { logActivity } from "./activity";
import { baseUrl } from "./settings";
import { feedbackUrl } from "./links";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();

const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .or(z.literal(""))
  .transform((v) => v || null)
  .nullable()
  .optional();

export const clientInput = z.object({
  name: z.string().trim().min(2, "Enter the client's name").max(120),
  company: optionalText(120),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .refine((v) => !v || v.replace(/\D/g, "").length >= 8, "Enter a valid phone number")
    .transform((v) => v || null)
    .nullable()
    .optional(),
  email: z
    .string()
    .trim()
    .max(160)
    .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email")
    .transform((v) => v?.toLowerCase() || null)
    .nullable()
    .optional(),
  services: z.array(z.enum(SERVICES)).min(1, "Pick at least one service"),
  package: optionalText(120),
  status: z.enum(CLIENT_STATUSES),
  start_date: dateStr,
  end_date: dateStr,
  preferred_language: z.enum(["en", "bn"]).default("en"),
});
export type ClientInput = z.input<typeof clientInput>;

export async function listClients(): Promise<Client[]> {
  const store = await getStore();
  return store.list<Client>("clients", { orderBy: { column: "created_at", dir: "desc" } });
}

export async function getClient(id: string): Promise<Client | null> {
  const store = await getStore();
  return store.get<Client>("clients", id);
}

export async function getClientByCode(code: string): Promise<Client | null> {
  if (!/^[a-z0-9-]{4,60}$/.test(code)) return null;
  const store = await getStore();
  return store.findOne<Client>("clients", { feedback_code: code });
}

async function uniqueCode(company: string | null, name: string): Promise<string> {
  const store = await getStore();
  for (let i = 0; i < 5; i++) {
    const code = makeFeedbackCode(company, name);
    if (!(await store.findOne<Client>("clients", { feedback_code: code }))) return code;
  }
  throw new Error("Could not create a unique feedback code");
}

export async function createClient(raw: unknown, actor: PublicMember): Promise<Client> {
  const input = clientInput.parse(raw);
  const store = await getStore();
  const now = nowIso();
  const client: Client = {
    id: uid(),
    name: input.name,
    company: input.company ?? null,
    whatsapp: input.whatsapp ?? null,
    email: input.email ?? null,
    services: input.services,
    package: input.package ?? null,
    status: input.status,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    completed_at: input.status === "completed" ? now : null,
    preferred_language: input.preferred_language,
    feedback_code: await uniqueCode(input.company ?? null, input.name),
    link_status: "not_sent",
    link_sent_at: null,
    link_opened_at: null,
    last_contact_at: null,
    notes: null,
    created_at: now,
    updated_at: now,
  };
  await store.insert<Client>("clients", client);
  await logActivity(client.id, "client_created", "Client added", actor.name);
  await emit("client.created", {
    client_id: client.id,
    client: client.name,
    company: client.company,
    services: client.services,
    status: client.status,
    feedback_link: feedbackUrl(await baseUrl(), client.feedback_code),
  });
  return client;
}

export async function updateClient(id: string, raw: unknown, actor: PublicMember): Promise<Client> {
  const input = clientInput.parse(raw);
  const store = await getStore();
  const current = await store.get<Client>("clients", id);
  if (!current) throw new UserError("Client not found");
  const statusChanged = current.status !== input.status;
  const updated = await store.update<Client>("clients", id, {
    name: input.name,
    company: input.company ?? null,
    whatsapp: input.whatsapp ?? null,
    email: input.email ?? null,
    services: input.services,
    package: input.package ?? null,
    status: input.status,
    start_date: input.start_date ?? null,
    end_date: input.end_date ?? null,
    preferred_language: input.preferred_language,
    completed_at: statusChanged && input.status === "completed" ? nowIso() : current.completed_at,
    updated_at: nowIso(),
  });
  await logActivity(id, "client_updated", "Details updated", actor.name);
  if (statusChanged) await logActivity(id, "status_changed", `Status → ${CLIENT_STATUS_META[input.status].label}`, actor.name);
  return updated!;
}

export async function setClientStatus(id: string, status: ClientStatus, actor: PublicMember): Promise<Client> {
  const store = await getStore();
  const current = await store.get<Client>("clients", id);
  if (!current) throw new UserError("Client not found");
  if (current.status === status) return current;
  const updated = await store.update<Client>("clients", id, {
    status,
    completed_at: status === "completed" ? nowIso() : current.completed_at,
    updated_at: nowIso(),
  });
  await logActivity(id, "status_changed", `Status → ${CLIENT_STATUS_META[status].label}`, actor.name);
  return updated!;
}

export type SendChannel = "whatsapp" | "email" | "copy";

export async function markLinkSent(id: string, channel: SendChannel, actor: PublicMember): Promise<Client> {
  const store = await getStore();
  const current = await store.get<Client>("clients", id);
  if (!current) throw new UserError("Client not found");
  const now = nowIso();
  const patch: Partial<Client> = { link_sent_at: now, last_contact_at: channel === "copy" ? current.last_contact_at : now, updated_at: now };
  if (current.link_status === "not_sent") patch.link_status = "sent";
  const updated = await store.update<Client>("clients", id, patch);
  const how = channel === "whatsapp" ? "on WhatsApp" : channel === "email" ? "by email" : "(link copied)";
  await logActivity(id, "link_sent", `Feedback link sent ${how}`, actor.name);
  await emit("client.link_sent", {
    client_id: id,
    client: current.name,
    company: current.company,
    channel,
    feedback_link: feedbackUrl(await baseUrl(), current.feedback_code),
  });
  return updated!;
}

/** New code for a new project. The old link stops working. */
export async function regenerateLink(id: string, actor: PublicMember): Promise<Client> {
  const store = await getStore();
  const current = await store.get<Client>("clients", id);
  if (!current) throw new UserError("Client not found");
  const updated = await store.update<Client>("clients", id, {
    feedback_code: await uniqueCode(current.company, current.name),
    link_status: "not_sent",
    link_sent_at: null,
    link_opened_at: null,
    updated_at: nowIso(),
  });
  await logActivity(id, "link_regenerated", "New feedback link created (old link turned off)", actor.name);
  return updated!;
}

/** Called by the public page once per visit; only the first open is recorded. */
export async function markLinkOpened(code: string): Promise<void> {
  const client = await getClientByCode(code);
  if (!client || client.link_opened_at || client.link_status === "submitted") return;
  const store = await getStore();
  await store.update<Client>("clients", client.id, {
    link_opened_at: nowIso(),
    link_status: "opened",
  });
  await logActivity(client.id, "link_opened", "Client opened the feedback link", "Client");
}

export const contactInput = z.object({
  kind: z.enum(["call", "whatsapp", "email", "meeting"]),
  note: z.string().trim().min(2, "Write a short note").max(500),
});

export async function logContact(id: string, raw: unknown, actor: PublicMember) {
  const { kind, note } = contactInput.parse(raw);
  const store = await getStore();
  const label = { call: "Call", whatsapp: "WhatsApp", email: "Email", meeting: "Meeting" }[kind];
  await store.update<Client>("clients", id, { last_contact_at: nowIso(), updated_at: nowIso() });
  await logActivity(id, "contact_logged", `${label}: ${note}`, actor.name);
}

export async function saveNotes(id: string, notes: string) {
  const store = await getStore();
  await store.update<Client>("clients", id, { notes: notes.slice(0, 4000) || null, updated_at: nowIso() });
}

export async function deleteClient(id: string) {
  const store = await getStore();
  // activity and feedback rows are removed by FK cascade in Postgres; demo mode cleans up by hand.
  if (store.kind === "demo") {
    await store.removeWhere("activity", { client_id: id });
    await store.removeWhere("feedback", { client_id: id });
  }
  await store.remove("clients", id);
}
