import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getStore } from "@/lib/data/store";
import type { PublicMember, SessionRow, TeamMember } from "@/lib/domain/types";
import { env } from "@/lib/env";
import { nowIso } from "@/lib/util";

export const SESSION_COOKIE = "argus_hub_session";
const SESSION_DAYS = 14;

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export function toPublicMember(m: TeamMember): PublicMember {
  return { id: m.id, email: m.email, name: m.name, role: m.role, created_at: m.created_at, last_login_at: m.last_login_at };
}

export async function startSession(member: TeamMember): Promise<void> {
  const store = await getStore();
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await store.insert<SessionRow>("sessions", {
    id: sha256(token),
    member_id: member.id,
    created_at: nowIso(),
    expires_at: expires.toISOString(),
  });
  await store.update<TeamMember>("team_members", member.id, { last_login_at: nowIso() });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const store = await getStore();
    await store.remove("sessions", sha256(token));
  }
  jar.delete(SESSION_COOKIE);
}

/** Cached per request: every server component/action can call it freely. */
export const getCurrentMember = cache(async (): Promise<PublicMember | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const store = await getStore();
  const session = await store.get<SessionRow>("sessions", sha256(token));
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await store.remove("sessions", session.id);
    return null;
  }
  const member = await store.get<TeamMember>("team_members", session.member_id);
  return member ? toPublicMember(member) : null;
});

/** For pages: redirects to login. */
export async function requireMember(opts: { admin?: boolean } = {}): Promise<PublicMember> {
  const m = await getCurrentMember();
  if (!m) redirect("/hub/login");
  if (opts.admin && m.role !== "admin") redirect("/hub");
  return m;
}

export class AuthError extends Error {}

/** For server actions: throws instead of redirecting (actions return errors to the UI). */
export async function assertMember(opts: { admin?: boolean } = {}): Promise<PublicMember> {
  const m = await getCurrentMember();
  if (!m) throw new AuthError("Please sign in again.");
  if (opts.admin && m.role !== "admin") throw new AuthError("Only an admin can do this.");
  return m;
}
