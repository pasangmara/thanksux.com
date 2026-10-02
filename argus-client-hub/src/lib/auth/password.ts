import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * scrypt (Node built-in, memory-hard). Format: scrypt:<salt-hex>:<hash-hex>.
 * Same format as the thanksux.com root app, so accounts could be shared later.
 */
const KEYLEN = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(plain, salt, KEYLEN).toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [algo, salt, hashHex] = stored.split(":");
  if (algo !== "scrypt" || !salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(plain, salt, KEYLEN);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const MIN_PASSWORD_LENGTH = 10;

export function generatePassword(): string {
  // 16 chars from a URL-safe alphabet, easy to paste into WhatsApp.
  return randomBytes(12).toString("base64url");
}
