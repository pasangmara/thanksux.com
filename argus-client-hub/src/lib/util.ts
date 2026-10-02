import { randomBytes, randomUUID } from "node:crypto";

export const uid = () => randomUUID();
export const nowIso = () => new Date().toISOString();

/** Unambiguous alphabet (no 0/o/1/l/i) for codes people may read aloud. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function randomToken(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

/** e.g. "nexora-geo-7k2p9x": readable prefix + 6 random chars (31^6 ≈ 887M). */
export function makeFeedbackCode(company: string | null, name: string): string {
  const base = slugify(company || name) || "client";
  return `${base}-${randomToken(6)}`;
}

export * from "./util-client";
