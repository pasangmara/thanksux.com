/**
 * [Phase 6C — ThanksSignal submission system] Client-facing shape for the
 * `thanks_signals` table (Phase 6A/6B). Deliberately its own category list,
 * not a reuse of `PROJECT_CATEGORIES` (src/types/project.ts) — that list
 * classifies finished portfolio *deliverables* ("Web Design", "Print
 * Design"); this one classifies the *design discipline* a community
 * problem belongs to, and the two lists were never the same set (compare:
 * "Product", "Motion", "Service Design", "Design System" appear only
 * here). Free text at the database level either way (no CHECK enum on
 * `thanks_signals.category`), so adding a discipline later never needs a
 * migration — this array is only the UI's offered set.
 */

export type ThanksSignalCategory =
  | "UI/UX"
  | "UX Research"
  | "Product"
  | "Graphic Design"
  | "Branding"
  | "Motion"
  | "Service Design"
  | "Design System"
  | "Other";

export const THANKS_SIGNAL_CATEGORIES: ThanksSignalCategory[] = [
  "UI/UX",
  "UX Research",
  "Product",
  "Graphic Design",
  "Branding",
  "Motion",
  "Service Design",
  "Design System",
  "Other",
];

/** Full lifecycle per docs/THANKS_UX_COMMUNITY_ARCHITECTURE.md §7 — this phase only ever produces 'draft' and 'submitted'; everything from 'reviewed' onward is set exclusively by admin/moderator logic (Phase 6D+), never reachable from this phase's own UI or API routes. */
export type ThanksSignalStatus = "draft" | "submitted" | "reviewed" | "open" | "in_progress" | "resolved" | "archived";

export type ThanksSignalVisibility = "private" | "public";

export interface ThanksSignal {
  id: string;
  authorId: string;
  title: string;
  description: string;
  category: string | null;
  context: string | null;
  audience: string | null;
  status: ThanksSignalStatus;
  visibility: ThanksSignalVisibility;
  createdAt: string;
  updatedAt: string;
}

/** Fields a client may set when creating or editing a draft — deliberately excludes id/authorId/status/visibility/createdAt/updatedAt, every one of which is server-derived or moderator-only. */
export interface ThanksSignalDraftInput {
  title: string;
  description: string;
  category?: string;
  context?: string;
  audience?: string;
}
