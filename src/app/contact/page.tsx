import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { ContactSection } from "@/components/site/ContactSection";
import { LeadForm } from "@/components/site/LeadForm";
import { getPublishedProjects } from "@/content/projects";
import { getContactContent, getLeadFormSettings, getSiteSettings } from "@/lib/cms/siteContentRepository";
import type { LeadContext } from "@/types/leads";

/**
 * /contact — the real, standalone Contact route. Previously "Contact" was
 * only an anchor section on the homepage while `nav`/the admin both
 * already linked to /contact — see docs/PORTFOLIO_CMS_ARCHITECTURE.md §0
 * finding 2. Reuses `ContactSection` exactly as the homepage does (same
 * persisted content, same form behavior — the mailto: flow is untouched),
 * plus passes the `directDetails` (email/phone/location) fields that were
 * already editable in /admin/contact but had no public destination until
 * now — see ContactSection.tsx's updated doc comment.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [contact, settings] = await Promise.all([getContactContent(), getSiteSettings()]);

  // Same override-layered-on-existing-derivation pattern as
  // work/[slug]/page.tsx's and /about's generateMetadata().
  // [Brand migration] Brand name now sourced from Site Settings — was a
  // hardcoded "— Joy" fallback.
  const seo = contact.seo;
  const title = seo?.metaTitle ?? `${contact.heading} — ${settings.brandName || "Joy Howlader"}`;
  const description = seo?.metaDescription ?? contact.description;
  const ogTitle = seo?.ogTitle ?? title;
  const ogDescription = seo?.ogDescription ?? description;

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    title: ogTitle,
    description: ogDescription,
    type: "website",
  };
  if (seo?.ogImage?.kind === "image") {
    openGraph.images = [{ url: seo.ogImage.src, alt: seo.ogImage.alt }];
  }

  return {
    title,
    description,
    alternates: { canonical: seo?.canonicalPath ?? "/contact" },
    openGraph,
    ...(seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

type SearchParams = Promise<{ project?: string; service?: string }>;

/**
 * [Phase L — Context-Aware Lead Forms] `?project=<slug>` (set by
 * `ProjectCTA`'s "Let's Work Together" button when rendered from a
 * project detail page — see work/[slug]/page.tsx) attaches that project's
 * id/title/category/URL to the lead automatically; the visitor never
 * re-enters which project they're asking about. `?service=<name>` is the
 * same idea for a named service. Neither param changes what
 * `ContactSection`'s existing mailto: quick-contact area shows — this is
 * a new, additional "Project Inquiry" section beneath it, not a
 * replacement.
 */
export default async function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  const [contact, leadForm, params] = await Promise.all([getContactContent(), getLeadFormSettings(), searchParams]);

  let context: LeadContext | undefined;
  if (params.project) {
    const projects = await getPublishedProjects();
    const project = projects.find((p) => p.slug === params.project);
    if (project) {
      context = {
        projectId: project.id,
        projectTitle: project.title,
        projectCategory: project.category,
        projectUrl: `/work/${project.slug}`,
        page: "/contact",
      };
    }
  } else if (params.service) {
    context = { serviceName: params.service, page: "/contact" };
  }

  return (
    <main>
      <ContactSection
        heading={contact.heading}
        description={contact.description}
        // [Phase 7 — placeholder hygiene] Same server-side filter as
        // layout.tsx's SiteFooter call — a disabled placeholder link never
        // reaches the client bundle's RSC payload.
        contactSocialLinks={contact.socialLinks.filter((link) => link.visible !== false)}
        contactProjectTypes={contact.projectTypes}
        contactResponseTimeLine={contact.responseTimeLine}
        directDetails={{ email: contact.email, phone: contact.phone, location: contact.location }}
      />

      <section className="border-t border-border py-12 tablet:py-16">
        <Container variant="wide">
          <p className="text-label">Project Inquiry</p>
          <h2 className="text-h2 mt-2 max-w-[24ch]">
            {context?.projectTitle ? `Interested in something like "${context.projectTitle}"?` : "Have a project in mind?"}
          </h2>
          <div className="mt-6 max-w-[560px]">
            <LeadForm fields={leadForm.fields} context={context} formName="Contact Page Inquiry" />
          </div>
        </Container>
      </section>
    </main>
  );
}
