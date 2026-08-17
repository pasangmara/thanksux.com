import { readJsonFile, writeJsonFile } from "@/lib/cms/fileStore";
import { isSupabaseBackendEnabled } from "@/lib/cms/dataBackend";
import { supabaseInsert, supabaseSelect, supabaseUpdate } from "@/lib/supabase/rest";
import { hashPassword, verifyPassword } from "./passwords";
import type { User, UserRole } from "@/types/auth";

/**
 * [Phase 1 — Authentication Foundation; Phase A.2.3 — persistence migration]
 * Server-only user repository. Branches on the exact same
 * `isSupabaseBackendEnabled()` flag every other domain in this project
 * already uses — `DATA_BACKEND` unset (or anything but `"supabase"`) keeps
 * reading/writing `data/users.json` exactly as before; `data/users.json`
 * itself is left on disk, untouched, as that rollback path.
 *
 * The Supabase-backed rows live in `admin_users` (migration 0019) — a
 * table with RLS enabled and *zero* policies, so only the service-role
 * key used here can ever reach it; never the anon/publishable key, never
 * a Supabase Auth session. This is a completely separate identity system
 * from `profiles`/Supabase Auth (the community/contributor system) — no
 * row here is ever a Supabase Auth user, and vice versa.
 *
 * Every function signature and caller (`proxy.ts`, `session.ts`, the
 * login/logout/setup/signup routes) is unchanged — only what's inside
 * these bodies differs, the same migration story already used for every
 * other repository in this project.
 */

const USERS_FILE = "users.json";

interface AdminUserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToUser(row: AdminUserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    emailVerifiedAt: row.email_verified_at ?? undefined,
  };
}

function seedUsers(): User[] {
  return [];
}

async function readAllUsers(): Promise<User[]> {
  if (isSupabaseBackendEnabled()) {
    const rows = await supabaseSelect<AdminUserRow[]>("admin_users", "select=*");
    return rows.map(rowToUser);
  }
  return readJsonFile<User[]>(USERS_FILE, seedUsers);
}

async function writeAllUsers(users: User[]): Promise<void> {
  // Only ever called by createUser()/updateUserRole() below on the JSON
  // path — the Supabase path writes its own single-row insert/update
  // directly (see those functions), never a whole-table replace, so this
  // helper is JSON-only.
  await writeJsonFile(USERS_FILE, users);
}

function genId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function countUsers(): Promise<number> {
  return (await readAllUsers()).length;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const normalized = normalizeEmail(email);
  if (isSupabaseBackendEnabled()) {
    const rows = await supabaseSelect<AdminUserRow[]>("admin_users", `select=*&email=eq.${encodeURIComponent(normalized)}&limit=1`);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  }
  const all = await readAllUsers();
  return all.find((u) => u.email === normalized);
}

export async function getUserById(id: string): Promise<User | undefined> {
  if (isSupabaseBackendEnabled()) {
    const rows = await supabaseSelect<AdminUserRow[]>("admin_users", `select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    return rows[0] ? rowToUser(rows[0]) : undefined;
  }
  const all = await readAllUsers();
  return all.find((u) => u.id === id);
}

/**
 * Creates a real account with a real, caller-supplied password — never a
 * default/invented credential. Throws if the email is already taken
 * (case-insensitive) so the caller (the signup/setup route) can return a
 * clear error rather than silently overwriting an existing account.
 */
export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}): Promise<User> {
  const email = normalizeEmail(input.email);
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("An account with this email already exists.");
  }
  const now = new Date().toISOString();
  const user: User = {
    id: genId(),
    email,
    passwordHash: hashPassword(input.password),
    name: input.name.trim(),
    role: input.role,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseBackendEnabled()) {
    await supabaseInsert("admin_users", {
      id: user.id,
      email: user.email,
      password_hash: user.passwordHash,
      name: user.name,
      role: user.role,
      email_verified_at: null,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    });
    return user;
  }

  const all = await readAllUsers();
  all.push(user);
  await writeAllUsers(all);
  return user;
}

/** Real credential check — returns the user only if the password actually verifies, never on email match alone. */
export async function verifyCredentials(email: string, password: string): Promise<User | undefined> {
  const user = await getUserByEmail(email);
  if (!user) return undefined;
  return verifyPassword(password, user.passwordHash) ? user : undefined;
}

export async function updateUserRole(id: string, role: UserRole): Promise<User | undefined> {
  const updatedAt = new Date().toISOString();

  if (isSupabaseBackendEnabled()) {
    const rows = await supabaseUpdate<AdminUserRow[]>("admin_users", `id=eq.${encodeURIComponent(id)}`, {
      role,
      updated_at: updatedAt,
    });
    return rows[0] ? rowToUser(rows[0]) : undefined;
  }

  const all = await readAllUsers();
  const index = all.findIndex((u) => u.id === id);
  if (index === -1) return undefined;
  all[index] = { ...all[index], role, updatedAt };
  await writeAllUsers(all);
  return all[index];
}
