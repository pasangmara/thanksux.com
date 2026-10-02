"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { fail, ok, run, type ActionResult } from "@/lib/actions";
import { assertMember } from "@/lib/auth/session";
import { EVENT_NAMES } from "@/lib/domain/types";
import { deliver, deliverDue, enqueue } from "@/lib/integrations/outbox";
import { isFile, saveImage, UploadError } from "@/lib/services/files";
import { getSettings, n8nConfig, saveSettings } from "@/lib/services/settings";
import { changePassword } from "@/lib/services/team";
import { getStore } from "@/lib/data/store";
import type { OutboxEvent } from "@/lib/domain/types";

const url = z
  .string()
  .trim()
  .max(500)
  .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), "Use a full link that starts with https://");
const bool = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

function done(message = "Saved") {
  revalidatePath("/hub", "layout");
  return ok(undefined, message);
}

export async function saveIntegrationsAction(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertMember({ admin: true });
    const input = z
      .object({ webhook_url: url, sheet_url: url, secret: z.string().max(200).optional() })
      .parse({
        webhook_url: formData.get("webhook_url") ?? "",
        sheet_url: formData.get("sheet_url") ?? "",
        secret: formData.get("secret") ?? undefined,
      });
    const events = Object.fromEntries(EVENT_NAMES.map((e) => [e, formData.get(`event:${e}`) === "on"])) as Record<
      (typeof EVENT_NAMES)[number],
      boolean
    >;
    events["test.ping"] = true;
    await saveSettings((s) => ({
      ...s,
      sheet: { url: input.sheet_url },
      // An empty secret field means "keep the current one" (it's never sent back to the browser).
      n8n: { webhook_url: input.webhook_url, secret: input.secret ? input.secret : s.n8n.secret, events },
    }));
    return done("Integration settings saved");
  });
}

export async function generateSecretAction(): Promise<ActionResult<string>> {
  return run(async () => {
    await assertMember({ admin: true });
    const secret = randomBytes(24).toString("base64url");
    await saveSettings((s) => ({ ...s, n8n: { ...s.n8n, secret } }));
    revalidatePath("/hub/settings");
    // Shown once so it can be pasted into n8n.
    return ok(secret, "New secret created. Copy it into n8n now.");
  });
}

export async function sendTestEventAction(): Promise<ActionResult<{ status: string; error: string | null }>> {
  return run(async () => {
    const me = await assertMember({ admin: true });
    const settings = await getSettings();
    if (!n8nConfig(settings).connected) return fail("Add the n8n webhook URL first.");
    const row = await enqueue("test.ping", { message: "Hello from ARGUS Client Hub", by: me.name });
    const res = await deliver(row, settings);
    revalidatePath("/hub", "layout");
    return res.status === "sent"
      ? ok({ status: res.status, error: null }, "n8n received the test event")
      : fail(`n8n did not accept it: ${res.last_error ?? "unknown error"}`);
  });
}

export async function sendPendingAction(): Promise<ActionResult<{ sent: number; failed: number }>> {
  return run(async () => {
    await assertMember({ admin: true });
    const res = await deliverDue({ force: true });
    if (!res.connected) return fail("n8n is not connected yet. Events will wait until it is.");
    revalidatePath("/hub", "layout");
    return ok({ sent: res.sent, failed: res.failed }, `${res.sent} sent${res.failed ? `, ${res.failed} failed` : ""}`);
  });
}

export async function retryEventAction(id: string): Promise<ActionResult> {
  return run(async () => {
    await assertMember({ admin: true });
    const store = await getStore();
    const row = await store.get<OutboxEvent>("outbox", id);
    if (!row) return fail("Event not found.");
    const res = await deliver({ ...row, status: row.status === "sent" ? "pending" : row.status });
    revalidatePath("/hub", "layout");
    return res.status === "sent" ? ok(undefined, "Sent") : fail(res.last_error ?? "Still failing");
  });
}

export async function saveNotificationsAction(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertMember({ admin: true });
    const input = z
      .object({
        whatsapp: z.string().trim().max(30),
        email: z
          .string()
          .trim()
          .max(160)
          .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email"),
        new_feedback: bool,
        low_rating: bool,
        daily_reminder: bool,
        post_status: bool,
        days_after_completion: z.coerce.number().int().min(1).max(30),
      })
      .parse({
        whatsapp: formData.get("whatsapp") ?? "",
        email: formData.get("email") ?? "",
        new_feedback: formData.get("new_feedback"),
        low_rating: formData.get("low_rating"),
        daily_reminder: formData.get("daily_reminder"),
        post_status: formData.get("post_status"),
        days_after_completion: formData.get("days_after_completion") ?? 3,
      });
    const { days_after_completion, ...notify } = input;
    await saveSettings((s) => ({ ...s, notify, reminders: { days_after_completion } }));
    return done("Notifications saved");
  });
}

export async function saveReviewLinksAction(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertMember({ admin: true });
    const input = z
      .object({ facebook: url, google: url })
      .parse({ facebook: formData.get("facebook") ?? "", google: formData.get("google") ?? "" });
    await saveSettings((s) => ({ ...s, review_links: input }));
    return done("Review links saved");
  });
}

export async function saveContactAction(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertMember({ admin: true });
    const input = z
      .object({
        whatsapp: z.string().trim().min(8, "Enter a WhatsApp number").max(30),
        email: z.email("Enter a valid email"),
      })
      .parse({ whatsapp: formData.get("whatsapp") ?? "", email: formData.get("email") ?? "" });
    await saveSettings((s) => ({ ...s, contact: input }));
    return done("Contact saved");
  });
}

export async function saveBrandingAction(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertMember({ admin: true });
    const text = (max: number) => z.string().trim().min(2, "Write a short message").max(max);
    const input = z
      .object({
        founder_name: z.string().trim().min(2).max(60),
        founder_role: z.string().trim().min(2).max(60),
        note_en: text(220),
        note_bn: text(220),
        thanks_en: text(300),
        thanks_bn: text(300),
      })
      .parse(Object.fromEntries(["founder_name", "founder_role", "note_en", "note_bn", "thanks_en", "thanks_bn"].map((k) => [k, formData.get(k) ?? ""])));

    let photoId: string | undefined;
    let avatarId: string | undefined;
    try {
      const photo = formData.get("photo");
      const avatar = formData.get("avatar");
      if (isFile(photo)) photoId = await saveImage(photo);
      if (isFile(avatar)) avatarId = await saveImage(avatar);
    } catch (err) {
      if (err instanceof UploadError) return fail(err.message);
      throw err;
    }
    const reset = formData.get("reset_photos") === "true";
    await saveSettings((s) => ({
      ...s,
      brand: {
        ...s.brand,
        ...input,
        founder_photo_file_id: reset ? null : (photoId ?? s.brand.founder_photo_file_id),
        founder_avatar_file_id: reset ? null : (avatarId ?? s.brand.founder_avatar_file_id),
      },
    }));
    return done("Form branding saved. The live form uses it right away.");
  });
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const me = await assertMember();
    await changePassword(me.id, {
      current: formData.get("current") ?? "",
      next: formData.get("next") ?? "",
      confirm: formData.get("confirm") ?? "",
    });
    return ok(undefined, "Password changed");
  });
}
