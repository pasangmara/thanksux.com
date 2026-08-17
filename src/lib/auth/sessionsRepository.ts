import { randomBytes } from "node:crypto";
import { readJsonFile, writeJsonFile } from "@/lib/cms/fileStore";
import { isSupabaseBackendEnabled } from "@/lib/cms/dataBackend";
import { supabaseDelete, supabaseInsert, supabaseSelect } from "@/lib/supabase/rest";
import type { Session } from "@/types/auth";

/**
 * [Phase 1 — Authentication Foundation; Phase A.2.3 — persistence migration]
 * Server-side session store. Same `isSupabaseBackendEnabled()` branch as
 * `usersRepository.ts` — a session's security still comes entirely from
 * the token's unguessability (32 random bytes via `crypto.randomBytes`),
 * unchanged; only where the row lives differs. `data/sessions.json` is
 * left on disk, untouched, as the JSON rollback path.
 *
 * The Supabase-backed rows live in `admin_sessions` (migration 0019) —
 * RLS enabled, zero policies, service-role-only, same security posture as
 * `admin_users`. `proxy.ts` (Node.js runtime by default in Next 16, per
 * its own header comment) imports `getUserById`/`getValidSession` from
 * these two repositories directly and is completely unaware this switch
 * happened — same transparent-to-callers migration story as every other
 * repository in this project.
 */

const SESSIONS_FILE = "sessions.json";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AdminSessionRow {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

function rowToSession(row: AdminSessionRow): Session {
  return { id: row.id, userId: row.user_id, createdAt: row.created_at, expiresAt: row.expires_at };
}

function seedSessions(): Session[] {
  return [];
}

async function readAllSessions(): Promise<Session[]> {
  return readJsonFile<Session[]>(SESSIONS_FILE, seedSessions);
}

async function writeAllSessions(sessions: Session[]): Promise<void> {
  await writeJsonFile(SESSIONS_FILE, sessions);
}

function isExpired(session: Session, now: number): boolean {
  return new Date(session.expiresAt).getTime() <= now;
}

export async function createSession(userId: string): Promise<Session> {
  const now = Date.now();
  const session: Session = {
    id: randomBytes(32).toString("hex"),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };

  if (isSupabaseBackendEnabled()) {
    // Opportunistic pruning on every create, same as the JSON path below —
    // a real delete, not just an in-memory filter, since Supabase is the
    // actual store now.
    await supabaseDelete("admin_sessions", `expires_at=lt.${new Date(now).toISOString()}`).catch(() => {
      // Best-effort — a failed prune never blocks issuing the new session.
    });
    await supabaseInsert("admin_sessions", {
      id: session.id,
      user_id: session.userId,
      created_at: session.createdAt,
      expires_at: session.expiresAt,
    });
    return session;
  }

  const all = await readAllSessions();
  // Prune expired sessions opportunistically on every write, not just reads.
  const alive = all.filter((s) => !isExpired(s, now));
  alive.push(session);
  await writeAllSessions(alive);
  return session;
}

export async function getValidSession(id: string): Promise<Session | undefined> {
  const now = Date.now();

  if (isSupabaseBackendEnabled()) {
    const rows = await supabaseSelect<AdminSessionRow[]>("admin_sessions", `select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    const row = rows[0];
    if (!row) return undefined;
    const session = rowToSession(row);
    return isExpired(session, now) ? undefined : session;
  }

  const all = await readAllSessions();
  const session = all.find((s) => s.id === id);
  if (!session || isExpired(session, now)) return undefined;
  return session;
}

export async function deleteSession(id: string): Promise<void> {
  if (isSupabaseBackendEnabled()) {
    await supabaseDelete("admin_sessions", `id=eq.${encodeURIComponent(id)}`);
    return;
  }
  const all = await readAllSessions();
  await writeAllSessions(all.filter((s) => s.id !== id));
}

/** Invalidates every session for a user — e.g. on a future "log out everywhere" or password-change action. Not called anywhere yet in Phase 1, kept ready. */
export async function deleteSessionsForUser(userId: string): Promise<void> {
  if (isSupabaseBackendEnabled()) {
    await supabaseDelete("admin_sessions", `user_id=eq.${encodeURIComponent(userId)}`);
    return;
  }
  const all = await readAllSessions();
  await writeAllSessions(all.filter((s) => s.userId !== userId));
}
