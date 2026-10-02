import "server-only";
import { getStore } from "@/lib/data/store";
import type { Activity, ActivityType } from "@/lib/domain/types";
import { nowIso, uid } from "@/lib/util";

export async function logActivity(clientId: string, type: ActivityType, text: string, actor: string | null) {
  const store = await getStore();
  await store.insert<Activity>("activity", { id: uid(), client_id: clientId, type, text, actor, created_at: nowIso() });
}

export async function listActivity(clientId: string, limit = 50): Promise<Activity[]> {
  const store = await getStore();
  return store.list<Activity>("activity", {
    where: { client_id: clientId },
    orderBy: { column: "created_at", dir: "desc" },
    limit,
  });
}
