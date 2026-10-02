"use server";

import { revalidatePath } from "next/cache";
import { ok, run, type ActionResult } from "@/lib/actions";
import { assertMember } from "@/lib/auth/session";
import type { PublicMember } from "@/lib/domain/types";
import { addMember, removeMember } from "@/lib/services/team";

export async function addMemberAction(formData: FormData): Promise<ActionResult<{ member: PublicMember; password: string }>> {
  return run(async () => {
    await assertMember({ admin: true });
    const res = await addMember({ name: formData.get("name"), email: formData.get("email"), role: formData.get("role") });
    revalidatePath("/hub/settings");
    return ok(res, "Member added");
  });
}

export async function removeMemberAction(id: string): Promise<ActionResult> {
  return run(async () => {
    const me = await assertMember({ admin: true });
    await removeMember(id, me);
    revalidatePath("/hub/settings");
    return ok(undefined, "Member removed");
  });
}
