import "server-only";
import { headers } from "next/headers";
import { DEFAULT_SETTINGS, withDefaults } from "@/lib/data/defaults";
import { getStore } from "@/lib/data/store";
import type { Settings } from "@/lib/domain/types";
import { env } from "@/lib/env";
import { nowIso } from "@/lib/util";

type SettingsRow = { id: string; data: Settings; updated_at: string };

export async function getSettings(): Promise<Settings> {
  const store = await getStore();
  const row = await store.get<SettingsRow>("settings", "main");
  return withDefaults(row?.data);
}

export async function saveSettings(update: (current: Settings) => Settings): Promise<Settings> {
  const store = await getStore();
  const row = await store.get<SettingsRow>("settings", "main");
  const next = update(withDefaults(row?.data));
  if (row) await store.update<SettingsRow>("settings", "main", { data: next, updated_at: nowIso() });
  else await store.insert<SettingsRow>("settings", { id: "main", data: next, updated_at: nowIso() });
  return next;
}

/** n8n connection after env overrides. env wins so secrets can stay out of the database. */
export function n8nConfig(s: Settings) {
  const url = env.n8nWebhookUrl || s.n8n.webhook_url;
  const secret = env.n8nWebhookSecret || s.n8n.secret;
  return {
    url,
    secret,
    connected: Boolean(url),
    fromEnv: { url: Boolean(env.n8nWebhookUrl), secret: Boolean(env.n8nWebhookSecret) },
  };
}

export const fileUrl = (id: string) => `/api/files/${id}`;

/** What the public form needs, without any secret. */
export function publicBrand(s: Settings) {
  return {
    founderName: s.brand.founder_name,
    founderRole: s.brand.founder_role,
    photoUrl: s.brand.founder_photo_file_id ? fileUrl(s.brand.founder_photo_file_id) : "/brand/founder-thank-you.webp",
    avatarUrl: s.brand.founder_avatar_file_id ? fileUrl(s.brand.founder_avatar_file_id) : "/brand/founder-avatar.webp",
    note: { en: s.brand.note_en, bn: s.brand.note_bn },
    thanks: { en: s.brand.thanks_en, bn: s.brand.thanks_bn },
    contact: s.contact,
    reviewLinks: s.review_links,
  };
}
export type PublicBrand = ReturnType<typeof publicBrand>;

/** Base URL for client links: PUBLIC_BASE_URL, else the current request's host. */
export async function baseUrl(): Promise<string> {
  if (env.publicBaseUrl) return env.publicBaseUrl;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export { DEFAULT_SETTINGS };
