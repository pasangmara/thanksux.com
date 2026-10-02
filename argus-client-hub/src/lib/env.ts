import "server-only";

/**
 * All environment access goes through here so the rules live in one place.
 * Nothing in this file is ever sent to the browser.
 */

export const env = {
  /** Postgres connection string (Supabase → Project Settings → Database → Connection string, "Transaction pooler"). Empty = demo mode. */
  databaseUrl: process.env.DATABASE_URL?.trim() || "",
  /** Public URL where the app is deployed, used to build client feedback links. */
  publicBaseUrl: (process.env.PUBLIC_BASE_URL?.trim() || "").replace(/\/+$/, ""),
  /** First-admin bootstrap: used only while the team table is empty. */
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase() || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  adminName: process.env.ADMIN_NAME?.trim() || "Joy Howlader",
  /** n8n: env values win over the values saved in Settings. */
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL?.trim() || "",
  n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET || "",
  /** Protects /api/cron/* endpoints. */
  cronSecret: process.env.CRON_SECRET || "",
  isProd: process.env.NODE_ENV === "production",
};

export const isDemoMode = () => !env.databaseUrl;
