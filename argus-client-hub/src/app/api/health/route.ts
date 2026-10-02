import { getStore } from "@/lib/data/store";

export const dynamic = "force-dynamic";

/** Uptime check: confirms the app can reach its database. */
export async function GET() {
  try {
    const store = await getStore();
    await store.count("settings");
    return Response.json({ ok: true, store: store.kind });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
