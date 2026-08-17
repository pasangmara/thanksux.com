/**
 * [Phase 1 — Authentication Foundation] User identity, role, and session
 * shapes. JSON-backed today (`lib/auth/usersRepository.ts`,
 * `data/users.json` — same `fileStore.ts` pattern every other repository
 * in this project already uses), designed so a future swap to a real
 * database only changes what's inside those repository functions, never
 * these types or any call site — the same migration discipline already
 * used for Projects/Leads/Settings.
 *
 * Four roles, per the approved architecture: "visitor" (no account, not
 * stored — anyone without a session) isn't a `UserRole` value at all;
 * every actual account is one of the three below. Not every authenticated
 * user is an admin — "user" is the default for anyone who signs up.
 */
export type UserRole = "user" | "creator" | "admin";

export interface User {
  id: string;
  email: string; // stored lowercased, unique
  passwordHash: string; // "scrypt:<salt-hex>:<hash-hex>" — see lib/auth/passwords.ts
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  /** Unset until real email sending exists — never enforced as a login gate (see lib/notifications/channels/emailChannel.ts's same honesty pattern). */
  emailVerifiedAt?: string;
}

/** The subset of `User` ever sent to the client — never `passwordHash`. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };
}

export interface Session {
  id: string; // the opaque token stored in the session cookie — cryptographically random, not signed/decodable, so its own unguessability is the security property (see lib/auth/sessionsRepository.ts)
  userId: string;
  createdAt: string;
  expiresAt: string;
}
