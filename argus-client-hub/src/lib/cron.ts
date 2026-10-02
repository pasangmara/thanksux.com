import "server-only";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/** Cron endpoints accept `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends exactly this). */
export function cronAuthorized(req: Request): boolean {
  if (!env.cronSecret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${env.cronSecret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}
