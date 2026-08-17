import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * [Phase 1 — Authentication Foundation] Password hashing via Node's
 * built-in `crypto.scrypt` — a real, OWASP-recommended memory-hard KDF,
 * not a hand-rolled scheme, and not a new dependency: this project has
 * maintained a deliberate zero-new-runtime-dependency policy throughout
 * every prior phase (COMPONENT_NORMALIZATION.md §11), and Node's standard
 * library already provides a secure option here — bcrypt/argon2 packages
 * are the more common choice but not a requirement scrypt fails to meet.
 *
 * Format: `scrypt:<salt-hex>:<hash-hex>` — self-describing so a future
 * algorithm change (e.g. moving to argon2 alongside a real database) can
 * detect and support old hashes during a transition, never silently
 * break existing accounts.
 */

const SCRYPT_KEYLEN = 64;
const SALT_BYTES = 16;

export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = scryptSync(plain, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hashHex] = parts;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(plain, salt, SCRYPT_KEYLEN);
  if (actual.length !== expected.length) return false;
  // Timing-safe compare — a plain `===`/Buffer.equals() here would leak
  // how many leading bytes matched via response-time differences.
  return timingSafeEqual(actual, expected);
}

/** Minimal, real validation — not a full policy engine. Rejects the empty/trivial case without pretending to enforce a security policy this phase doesn't own. */
export function isPasswordAcceptable(plain: string): boolean {
  return typeof plain === "string" && plain.length >= 8;
}
