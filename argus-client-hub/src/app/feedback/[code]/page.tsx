import type { Metadata } from "next";
import { Backdrop } from "@/components/brand/Backdrop";
import { FeedbackExperience, type FormClient } from "@/components/form/FeedbackExperience";
import { servicesLabel } from "@/lib/domain/labels";
import { bnDigits } from "@/lib/i18n/form";
import { getClientByCode } from "@/lib/services/clients";
import { getSettings, publicBrand } from "@/lib/services/settings";
import { firstName, formatDate } from "@/lib/util";

export const metadata: Metadata = {
  title: "Your feedback",
  description: "Share 1 minute of feedback with ARGUS.",
  robots: { index: false, follow: false },
};

export default async function FeedbackPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const [client, settings] = await Promise.all([getClientByCode(code.toLowerCase()), getSettings()]);
  const brand = publicBrand(settings);

  const state = !client ? "invalid" : client.link_status === "submitted" ? "used" : "form";
  const doneDate = client?.end_date ?? client?.completed_at ?? null;
  const formClient: FormClient | null = client
    ? {
        firstName: firstName(client.name),
        name: client.name,
        company: client.company,
        serviceLabel: { en: servicesLabel(client.services, "en"), bn: servicesLabel(client.services, "bn") },
        projectName: client.package,
        completed: doneDate
          ? { en: formatDate(doneDate, { year: true }), bn: bnDigits(formatDate(doneDate, { year: true })) }
          : { en: null, bn: null },
      }
    : null;

  return (
    <>
      <Backdrop />
      <FeedbackExperience
        code={code.toLowerCase()}
        initialState={state}
        initialLang={client?.preferred_language ?? "en"}
        client={formClient}
        brand={brand}
      />
    </>
  );
}
