import type { Metadata } from "next";
import { Suspense } from "react";
import { AddClientButton } from "@/components/hub/ClientForm";
import { ClientsTable, type ClientRow } from "@/components/hub/ClientsTable";
import { PageHeader } from "@/components/hub/PageHeader";
import { requireMember } from "@/lib/auth/session";
import { listClients } from "@/lib/services/clients";
import { listFeedback } from "@/lib/services/feedback";
import { baseUrl } from "@/lib/services/settings";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  await requireMember();
  const [clients, feedback, base] = await Promise.all([listClients(), listFeedback(), baseUrl()]);
  const latest = new Map<string, { rating: number; at: string }>();
  for (const f of feedback) if (!latest.has(f.client_id)) latest.set(f.client_id, { rating: f.rating, at: f.created_at });
  const rows: ClientRow[] = clients.map((c) => ({
    ...c,
    lastRating: latest.get(c.id)?.rating ?? null,
    lastFeedbackAt: latest.get(c.id)?.at ?? null,
  }));
  return (
    <>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length === 1 ? "" : "s"} · each has a personal feedback link`}
        actions={<AddClientButton baseUrl={base} />}
      />
      <Suspense>
        <ClientsTable clients={rows} baseUrl={base} />
      </Suspense>
    </>
  );
}
