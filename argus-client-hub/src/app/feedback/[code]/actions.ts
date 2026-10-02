"use server";

import { fail, ok, run, type ActionResult } from "@/lib/actions";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getClientByCode, markLinkOpened } from "@/lib/services/clients";
import { submitFeedback, type SubmitOutcome } from "@/lib/services/feedback";
import { isFile, saveImage, UploadError } from "@/lib/services/files";

/** Public, unauthenticated: the personal code is the only key. */
export async function submitFeedbackAction(code: string, formData: FormData): Promise<ActionResult<SubmitOutcome>> {
  return run(async () => {
    const ip = await clientIp();
    if (!rateLimit(`submit:ip:${ip}`, 10, 60 * 60_000) || !rateLimit(`submit:code:${code}`, 5, 60 * 60_000)) {
      return fail("Too many tries. Please wait a few minutes and try again.");
    }
    const client = await getClientByCode(code);
    if (!client) return fail("This link isn’t active.");
    if (client.link_status === "submitted") return fail("We already received your feedback. Thank you!");

    const permission = formData.get("public_permission") === "on" || formData.get("public_permission") === "true";
    let photoId: string | null = null;
    const photo = formData.get("photo");
    if (permission && isFile(photo)) {
      try {
        photoId = await saveImage(photo);
      } catch (err) {
        if (err instanceof UploadError) return fail(err.message, { photo: err.message });
        throw err;
      }
    }

    const outcome = await submitFeedback(
      client,
      {
        rating: formData.get("rating"),
        communication: formData.get("communication") ?? "",
        result: formData.get("result") ?? "",
        did_well: String(formData.get("did_well") ?? ""),
        do_better: String(formData.get("do_better") ?? ""),
        recommend: String(formData.get("recommend") ?? ""),
        public_permission: permission,
        display_mode: String(formData.get("display_mode") ?? ""),
        language: formData.get("language") === "bn" ? "bn" : "en",
      },
      photoId,
    );
    return ok(outcome);
  });
}

export async function markOpenedAction(code: string): Promise<void> {
  try {
    const ip = await clientIp();
    if (!rateLimit(`open:${ip}`, 30, 60 * 60_000)) return;
    await markLinkOpened(code);
  } catch (err) {
    console.error("[markOpened]", err);
  }
}
