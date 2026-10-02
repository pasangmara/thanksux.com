import { Shell } from "@/components/hub/Shell";
import { requireMember } from "@/lib/auth/session";
import { getStore } from "@/lib/data/store";
import { isDemoMode } from "@/lib/env";
import { listFeedback } from "@/lib/services/feedback";
import { getSettings, n8nConfig } from "@/lib/services/settings";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const member = await requireMember();
  const store = await getStore();
  const [feedback, settings, pending, failed] = await Promise.all([
    listFeedback(),
    getSettings(),
    store.count("outbox", { status: "pending" }),
    store.count("outbox", { status: "failed" }),
  ]);
  const feedbackBadge = feedback.filter((f) => f.follow_up === "open" || f.post_status === "pending").length;
  return (
    <Shell
      info={{
        member,
        feedbackBadge,
        n8n: { connected: n8nConfig(settings).connected, waiting: pending + failed, failed },
        demo: isDemoMode(),
      }}
    >
      {children}
    </Shell>
  );
}
