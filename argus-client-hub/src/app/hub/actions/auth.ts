"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { fail, type ActionResult } from "@/lib/actions";
import { endSession, startSession } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { authenticate } from "@/lib/services/team";

const loginInput = z.object({
  email: z.string().trim().min(3).max(160),
  password: z.string().min(1).max(200),
  next: z.string().optional(),
});

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Enter your email and password.");
  const { email, password, next } = parsed.data;
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 10, 15 * 60_000) || !rateLimit(`login:${email.toLowerCase()}`, 8, 15 * 60_000)) {
    return fail("Too many attempts. Please wait 15 minutes.");
  }
  const member = await authenticate(email, password);
  if (!member) return fail("Email or password is wrong.");
  await startSession(member);
  // Only allow internal dashboard paths as the post-login destination.
  redirect(next && /^\/hub(\/[\w\-/?=&%.]*)?$/.test(next) ? next : "/hub");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/hub/login");
}
