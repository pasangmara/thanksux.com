import "server-only";
import { z } from "zod";
import { AuthError } from "@/lib/auth/session";
import { UserError } from "@/lib/errors";

import type { ActionResult } from "./actions-types";

export type { ActionResult };

export const ok = <T>(data: T, message?: string): ActionResult<T> => ({ ok: true, data, message });
export const fail = (error: string, fieldErrors?: Record<string, string>): ActionResult<never> => ({
  ok: false,
  error,
  fieldErrors,
});

export function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Wraps an action body: auth errors and unexpected errors become friendly results. */
export async function run<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AuthError || err instanceof UserError) return fail(err.message);
    if (err instanceof z.ZodError) return fail("Please check the highlighted fields.", zodFieldErrors(err));
    // Next's redirect()/notFound() work by throwing; let them through.
    if (err && typeof err === "object" && "digest" in err) throw err;
    console.error("[action]", err);
    return fail("Something went wrong. Please try again.");
  }
}
