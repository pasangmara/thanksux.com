import type { PublicUser } from "@/types/auth";

/**
 * [Phase 1 — Authentication Foundation, prepared for Phase 5/6] Not
 * called anywhere yet — no user-owned content exists today (Projects,
 * Leads, and every CMS record are still exclusively admin-owned). Kept
 * here, tested in isolation, so Phase 5/6's `Problem`/`Contribution`
 * records (per the approved Thanks UX data model) have a single, correct
 * ownership rule to import from day one rather than each inventing its
 * own inline check.
 */
export function isOwnerOrAdmin(user: PublicUser | null, ownerId: string | undefined): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return Boolean(ownerId) && user.id === ownerId;
}
