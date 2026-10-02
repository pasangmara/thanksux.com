import "server-only";
import { UserError } from "@/lib/errors";
import { z } from "zod";
import { generatePassword, hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/auth/password";
import { toPublicMember } from "@/lib/auth/session";
import { getStore } from "@/lib/data/store";
import type { PublicMember, TeamMember } from "@/lib/domain/types";
import { env } from "@/lib/env";
import { nowIso, uid } from "@/lib/util";

export async function listTeam(): Promise<PublicMember[]> {
  const store = await getStore();
  const rows = await store.list<TeamMember>("team_members", { orderBy: { column: "created_at", dir: "asc" } });
  return rows.map(toPublicMember);
}

// A fixed dummy hash so unknown emails take as long as known ones (no user enumeration by timing).
const DUMMY_HASH = hashPassword("argus-timing-dummy-password");

/**
 * Checks credentials. While the team table is empty and ADMIN_EMAIL /
 * ADMIN_PASSWORD are set, the first matching login creates that admin.
 */
export async function authenticate(emailRaw: string, password: string): Promise<TeamMember | null> {
  const email = emailRaw.trim().toLowerCase();
  const store = await getStore();
  const member = await store.findOne<TeamMember>("team_members", { email });
  if (member) return verifyPassword(password, member.password_hash) ? member : null;

  verifyPassword(password, DUMMY_HASH);
  const empty = (await store.count("team_members")) === 0;
  if (empty && env.adminEmail && env.adminPassword && email === env.adminEmail && password === env.adminPassword) {
    return store.insert<TeamMember>("team_members", {
      id: uid(),
      email,
      name: env.adminName,
      role: "admin",
      password_hash: hashPassword(password),
      created_at: nowIso(),
      last_login_at: null,
    });
  }
  return null;
}

export const memberInput = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  email: z.email("Enter a valid email").transform((v) => v.trim().toLowerCase()),
  role: z.enum(["admin", "staff"]),
});

/** Returns the generated password once so the admin can pass it on. */
export async function addMember(raw: unknown): Promise<{ member: PublicMember; password: string }> {
  const input = memberInput.parse(raw);
  const store = await getStore();
  if (await store.findOne<TeamMember>("team_members", { email: input.email })) {
    throw new z.ZodError([{ code: "custom", path: ["email"], message: "This email is already on the team", input: input.email }]);
  }
  const password = generatePassword();
  const member = await store.insert<TeamMember>("team_members", {
    id: uid(),
    ...input,
    password_hash: hashPassword(password),
    created_at: nowIso(),
    last_login_at: null,
  });
  return { member: toPublicMember(member), password };
}

export async function removeMember(id: string, actor: PublicMember) {
  if (id === actor.id) throw new UserError("You can't remove yourself.");
  const store = await getStore();
  const admins = (await store.list<TeamMember>("team_members", { where: { role: "admin" } })).filter((m) => m.id !== id);
  const target = await store.get<TeamMember>("team_members", id);
  if (target?.role === "admin" && admins.length === 0) throw new UserError("Keep at least one admin.");
  await store.removeWhere("sessions", { member_id: id });
  await store.remove("team_members", id);
}

export const passwordInput = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`).max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

export async function changePassword(memberId: string, raw: unknown) {
  const input = passwordInput.parse(raw);
  const store = await getStore();
  const member = await store.get<TeamMember>("team_members", memberId);
  if (!member || !verifyPassword(input.current, member.password_hash)) {
    throw new z.ZodError([{ code: "custom", path: ["current"], message: "Current password is wrong", input: "" }]);
  }
  await store.update<TeamMember>("team_members", memberId, { password_hash: hashPassword(input.next) });
}
