"use server";

import { revalidatePath } from "next/cache";
import { ok, run, type ActionResult } from "@/lib/actions";
import { assertMember } from "@/lib/auth/session";
import type { Feedback } from "@/lib/domain/types";
import { updateFeedbackStatus } from "@/lib/services/feedback";

export async function updateFeedbackAction(
  id: string,
  input: { post_status: string; post_link: string; follow_up?: string },
): Promise<ActionResult<Feedback>> {
  return run(async () => {
    const me = await assertMember();
    const updated = await updateFeedbackStatus(id, input, me);
    revalidatePath("/hub", "layout");
    return ok(updated, "Saved");
  });
}
