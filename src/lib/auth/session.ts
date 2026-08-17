import { cookies } from "next/headers";
import { getUserById } from "./usersRepository";
import { getValidSession } from "./sessionsRepository";
import { SESSION_COOKIE_NAME } from "./constants";
import { toPublicUser, type PublicUser } from "@/types/auth";

/**
 * [Phase 1 — Authentication Foundation] The one function every Server
 * Component / Route Handler calls to find out who's making the request —
 * mirrors this project's existing "one shared function, not scattered
 * logic" convention (`trackEvent`, `deriveFollowUpState`). Reads the
 * session cookie, resolves it against `sessionsRepository`, then
 * `usersRepository` — returns `null` for any failure mode (no cookie,
 * expired/unknown session, deleted user) rather than throwing, so callers
 * can treat "not logged in" as a normal, expected state.
 */
export async function getCurrentUser(): Promise<PublicUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await getValidSession(sessionId);
  if (!session) return null;

  const user = await getUserById(session.userId);
  if (!user) return null;

  return toPublicUser(user);
}
