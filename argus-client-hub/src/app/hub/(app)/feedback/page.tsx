import type { Metadata } from "next";
import { Download, ExternalLink } from "lucide-react";
import { Suspense } from "react";
import { FeedbackView } from "@/components/hub/FeedbackView";
import { PageHeader } from "@/components/hub/PageHeader";
import { requireMember } from "@/lib/auth/session";
import { listClients } from "@/lib/services/clients";
import { listFeedback } from "@/lib/services/feedback";
import { getSettings } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Feedback" };

export default async function FeedbackPage() {
  await requireMember();
  const [feedback, clients, settings] = await Promise.all([listFeedback(), listClients(), getSettings()]);
  const open = feedback.filter((f) => f.follow_up === "open").length;
  const pending = feedback.filter((f) => f.post_status === "pending").length;
  const btn = "inline-flex h-9 items-center gap-2 rounded-[10px] border border-line-strong bg-surface-2 px-3.5 text-sm font-semibold text-text transition hover:border-muted/60";
  return (
    <>
      <PageHeader
        title="Feedback"
        subtitle={`${feedback.length} repl${feedback.length === 1 ? "y" : "ies"} · ${open} follow-up${open === 1 ? "" : "s"} open · ${pending} post${pending === 1 ? "" : "s"} pending · newest first`}
        actions={
          <>
            {/* Plain <a>: a file download, not a page navigation. */}
            <a href="/api/export/feedback" className={btn}>
              <Download className="size-4" /> Export CSV
            </a>
            {settings.sheet.url && (
              <a href={settings.sheet.url} target="_blank" rel="noopener noreferrer" className={btn}>
                <ExternalLink className="size-4" /> Open Google Sheet
              </a>
            )}
          </>
        }
      />
      <Suspense>
        <FeedbackView feedback={feedback} clients={clients.map((c) => ({ id: c.id, name: c.name }))} />
      </Suspense>
    </>
  );
}
