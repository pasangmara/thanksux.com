"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, run, type ActionResult } from "@/lib/actions";
import { assertMember } from "@/lib/auth/session";
import { CLIENT_STATUSES, type Client } from "@/lib/domain/types";
import {
  createClient,
  deleteClient,
  getClient,
  logContact,
  markLinkSent,
  regenerateLink,
  saveNotes,
  setClientStatus,
  updateClient,
  type SendChannel,
} from "@/lib/services/clients";

function refresh(id?: string) {
  revalidatePath("/hub", "layout");
  if (id) revalidatePath(`/hub/clients/${id}`);
}

const parseClientForm = (fd: FormData) => ({
  name: fd.get("name"),
  company: fd.get("company"),
  whatsapp: fd.get("whatsapp"),
  email: fd.get("email"),
  services: fd.getAll("services"),
  package: fd.get("package"),
  status: fd.get("status"),
  start_date: fd.get("start_date"),
  end_date: fd.get("end_date"),
  preferred_language: fd.get("preferred_language") || "en",
});

export async function createClientAction(formData: FormData): Promise<ActionResult<Client>> {
  return run(async () => {
    const me = await assertMember();
    const client = await createClient(parseClientForm(formData), me);
    refresh();
    return ok(client, "Client added");
  });
}

export async function updateClientAction(id: string, formData: FormData): Promise<ActionResult<Client>> {
  return run(async () => {
    const me = await assertMember();
    const client = await updateClient(id, parseClientForm(formData), me);
    refresh(id);
    return ok(client, "Saved");
  });
}

export async function setStatusAction(id: string, status: string): Promise<ActionResult> {
  return run(async () => {
    const me = await assertMember();
    const s = z.enum(CLIENT_STATUSES).parse(status);
    await setClientStatus(id, s, me);
    refresh(id);
    return ok(undefined, "Status updated");
  });
}

export async function markLinkSentAction(id: string, channel: SendChannel): Promise<ActionResult> {
  return run(async () => {
    const me = await assertMember();
    await markLinkSent(id, z.enum(["whatsapp", "email", "copy"]).parse(channel), me);
    refresh(id);
    return ok(undefined);
  });
}

export async function regenerateLinkAction(id: string): Promise<ActionResult<Client>> {
  return run(async () => {
    const me = await assertMember();
    const client = await regenerateLink(id, me);
    refresh(id);
    return ok(client, "New link created");
  });
}

export async function logContactAction(id: string, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const me = await assertMember();
    await logContact(id, { kind: formData.get("kind"), note: formData.get("note") }, me);
    refresh(id);
    return ok(undefined, "Added to timeline");
  });
}

export async function saveNotesAction(id: string, notes: string): Promise<ActionResult> {
  return run(async () => {
    await assertMember();
    await saveNotes(id, String(notes ?? ""));
    return ok(undefined);
  });
}

export async function deleteClientAction(id: string, confirmName: string): Promise<ActionResult> {
  return run(async () => {
    await assertMember({ admin: true });
    const client = await getClient(id);
    if (!client) return fail("Client not found.");
    if (confirmName.trim() !== client.name) return fail("Type the client's name exactly to confirm.");
    await deleteClient(id);
    refresh();
    return ok(undefined, "Client deleted");
  });
}
