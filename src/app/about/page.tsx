import type { Metadata } from "next";
import { Button, Chip, Container } from "@/components/ui";
import { AboutSkills } from "@/components/site/AboutSkills";
import { DesignerIntro } from "@/components/site/DesignerIntro";
import { PortfolioMedia } from "@/components/site/PortfolioMedia";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { Services } from "@/components/site/Services";
import { ASPECT } from "@/content/media";
import { getAboutContent } from "@/lib/cms/siteContentRepository";

/**
 * /about — the real, standalone About route. Previously "About"/"Contact"
 * were only anchor sections on the homepage while `nav`/the admin both
 * already linked to /about — see docs/PORTFOLIO_CMS_ARCHITECTURE.md §0
 * finding 2. This route reads the same persisted, admin-editable About
 * content the homepage's DesignerIntro/AboutSkills sections already read
 * (`getAboutContent()`), so a Save in /admin/about shows up here on the
 * next request exactly like it already does on the homepage.
 *
 * Reuses DesignerIntro/AboutSkills/Services as-is rather than duplicating
 * their markup — the only page-specific addition is the hero (name/roles/
 * bio) and the closing Work/Contact CTA, neither of which exists anywhere
 * else. `about.bio` specifically has never had a public destination before
 * this route (flagged as an unconsumed field in
 * docs/PORTFOLIO_CMS_ARCHITECTURE.md §13) — rendered here, and nowhere
 * else, so it doesn't end up duplicated on the homepage.
 *
 * [Temporary GitHub Pages deployment] CI patches this literal to
 * "force-static" for the export build only — see
 * .github/workflows/ci.yml's deploy job. Unset/normal builds: unchanged.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutContent();

  // Same override-layered-on-existing-derivation pattern as
  // work/[slug]/page.tsx's generateMetadata() — see that file for the
  // precedent this follows.
  const seo = about.seo;
  const title = seo?.metaTitle ?? `About — ${about.name}`;
  const description = seo?.metaDescription ?? about.bio;
  const ogTitle = seo?.ogTitle ?? title;
  const ogDescription = seo?.ogDescription ?? description;

  const openGraph: NonNullable<Metadata["openGraph"]> = {
    title: ogTitle,
    description: ogDescription,
    type: "profile",
  };
  if (seo?.ogImage?.kind === "image") {
    openGraph.images = [{ url: seo.ogImage.src, alt: seo.ogImage.alt }];
  } else if (about.photo?.kind === "image") {
    openGraph.images = [{ url: about.photo.src, alt: about.photo.alt }];
  }

  return {
    title,
    description,
    alternates: { canonical: seo?.canonicalPath ?? "/about" },
    openGraph,
    ...(seo?.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function AboutPage() {
  const about = await getAboutContent();

  return (
    <main>
      <section className="border-b border-border py-12 tablet:py-16">
        <Container variant="wide">
          <div className="grid grid-cols-1 items-center gap-10 desktop:grid-cols-12 desktop:gap-8">
            <ScrollReveal variant="left" className="desktop:order-1 desktop:col-span-7">
              <p className="text-label">About</p>
              <h1 className="text-h1 mt-4 max-w-[24ch]">{about.name}</h1>
              {about.roles.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {about.roles.map((role) => (
                    <Chip key={role}>{role}</Chip>
                  ))}
                </div>
              ) : null}
              {about.bio ? (
                <p className="text-body-lg mt-4 max-w-[60ch] text-text-secondary">{about.bio}</p>
              ) : null}
              <div className="mt-6">
                <Button variant="text-link" href="/contact">
                  Get in touch
                </Button>
              </div>
            </ScrollReveal>

            {/* [Visual Refinement Pass II — section 31] Editorial profile-image
                frame: a decorative, asymmetric-cornered gradient shape offset
                behind a clean glass-framed photo — not a generic circular
                avatar. Reuses `about.photo` (the same CMS field DesignerIntro
                already reads, admin-editable at /admin/about) rather than a
                second image field; an unset photo falls through to
                PortfolioMedia's existing honest placeholder, same as every
                other image slot on the site. */}
            <ScrollReveal variant="right" className="desktop:order-2 desktop:col-span-5">
              <div className="relative mx-auto max-w-[360px] desktop:mx-0">
                <div
                  className="atmosphere-hero pointer-events-none absolute -inset-3 opacity-90 tablet:-inset-4"
                  style={{ borderRadius: "24px 8px 24px 8px" }}
                  aria-hidden="true"
                />
                <div className="glass-surface relative rounded-lg p-2">
                  <PortfolioMedia
                    media={about.photo ?? { kind: "placeholder", category: "brand-mark", alt: `${about.name} — profile photo` }}
                    aspectRatio={ASPECT.portrait}
                    radius="lg"
                    priority
                    sizes="(min-width: 1200px) 360px, 60vw"
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* showCta={false}: this page IS "more about me" — the homepage's
          link back to itself would be a no-op here. */}
      <DesignerIntro showCta={false} />
      <Services />
      <AboutSkills />

      <section className="border-t border-border py-12 tablet:py-16">
        <Container variant="wide">
          <ScrollReveal>
            <div className="flex flex-col items-start gap-6 desktop:flex-row desktop:items-center desktop:justify-between">
              <p className="text-h2 max-w-[24ch]">Like what you see?</p>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" href="/work">
                  View My Work
                </Button>
                <Button variant="text-link" href="/contact">
                  Get in Touch
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </main>
  );
}
