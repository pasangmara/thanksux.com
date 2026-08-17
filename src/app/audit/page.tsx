import type { Metadata } from "next";
import { Accent, Container } from "@/components/ui";
import { getSiteSettings } from "@/lib/cms/siteContentRepository";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { AuditForm } from "./AuditForm";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const brand = settings.brandName || "Joy Howlader";
  const title = `UX Audit — ${brand}`;
  const description = "Analyze a website or design and get practical UX, UI, accessibility and usability recommendations.";
  return {
    title,
    description,
    alternates: { canonical: "/audit" },
    openGraph: { title, description, type: "website" },
  };
}

export default function AuditPage() {
  return (
    <main className="relative overflow-hidden">
      <div className="atmosphere-audit pointer-events-none absolute inset-x-0 top-0 h-[720px]" aria-hidden="true" />
      <section className="relative py-16 tablet:py-24">
        <Container variant="narrow">
          <ScrollReveal variant="blur">
            <p className="text-caption text-text-tertiary">UX AUDIT</p>
            <h1 className="text-h1 mt-2">
              UX <Accent>Audit</Accent>
            </h1>
            <p className="text-body-lg mt-4 max-w-[60ch] text-text-secondary">
              Find the friction. Understand the problem. Know what to fix.
            </p>
            <p className="text-body mt-3 max-w-[65ch] text-text-secondary">
              Analyze a website or design and get practical UX, UI, accessibility and usability recommendations — every
              finding backed by evidence this tool actually observed, never a guess.
            </p>
          </ScrollReveal>
        </Container>
      </section>

      <Container variant="narrow" className="relative">
        <div className="pb-16 tablet:pb-24">
          <ScrollReveal variant="scale">
            <AuditForm />
          </ScrollReveal>
        </div>
      </Container>
    </main>
  );
}
