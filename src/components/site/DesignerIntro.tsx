import { Button, Container } from "@/components/ui";
import { PersonPlaceholderIcon } from "@/components/icons";
import { ASPECT } from "@/content/media";
import { getAboutContent } from "@/lib/cms/siteContentRepository";
import { PortfolioMedia } from "./PortfolioMedia";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

/**
 * Designer Introduction — the "About Snapshot" section from PROJECT_SPEC.md
 * §4.1 / Blueprint §05, under the section name this build's brief uses.
 *
 * [CMS bugfix] The photo frame now actually reads `about.photo` — it
 * previously rendered a hardcoded "Photo pending" placeholder
 * unconditionally, regardless of whether a real photo had been
 * uploaded/selected and saved in /admin/about. Persistence was never the
 * problem (`saveAbout()` → data/about.json already worked); this
 * component simply never consumed the field. When `about.photo` is a real
 * `"image"`, it renders through `PortfolioMedia` — the same component
 * every other image on the site renders through — inside the exact same
 * bordered/rounded/portrait-aspect frame the placeholder already used
 * (`radius="lg"` + `border-border` + `bg-background-alt` match
 * `PortfolioMedia`'s own wrapper styling exactly, so swapping doesn't
 * change the frame's appearance). When no real photo is set, the original
 * placeholder markup — same icon, same "Photo pending" copy, same
 * frame — renders completely unchanged.
 *
 * [CMS Phase D2] Reads the persisted, admin-editable About content
 * directly (a Server Component, so it can call the repository itself —
 * no prop-threading needed, unlike the "use client" Nav/Footer/Contact).
 *
 * [CMS Phase D3] `showCta` (default `true`, unchanged homepage behavior)
 * lets the real /about route reuse this component without a "More about
 * me" link pointing back at the page it's already on.
 */
export async function DesignerIntro({ showCta = true }: { showCta?: boolean } = {}) {
  const about = await getAboutContent();
  const hasRealPhoto = Boolean(about.photo && about.photo.kind === "image");

  return (
    <section id="about" className="py-12 tablet:py-16">
      <Container variant="wide">
        <ScrollReveal>
          <SectionHeader title="Designer Introduction" />
        </ScrollReveal>
        <ScrollReveal variant="left">
          <div className="mt-8 grid grid-cols-1 gap-8 desktop:grid-cols-12 desktop:gap-6">
            <div className="desktop:col-span-4">
              {hasRealPhoto && about.photo ? (
                <PortfolioMedia media={about.photo} aspectRatio={ASPECT.portrait} radius="lg" />
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-background-alt"
                  style={{ aspectRatio: ASPECT.portrait }}
                >
                  <PersonPlaceholderIcon className="h-6 w-6 text-text-tertiary" />
                  <p className="text-label text-text-tertiary">Photo pending</p>
                </div>
              )}
            </div>
            <div className="desktop:col-span-7 desktop:col-start-6">
              <p className="text-h3">Hi, I&rsquo;m {about.name}.</p>
              <p className="text-body-lg mt-3 max-w-[60ch] text-text-secondary">
                {about.designPhilosophy}
              </p>
              <ul className="mt-6 space-y-3">
                {about.aboutFacts.map((fact) => (
                  <li key={fact} className="text-body flex gap-3 text-text-secondary">
                    <span aria-hidden className="mt-[0.6em] h-px w-4 shrink-0 bg-ink" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
              {showCta ? (
                <div className="mt-6">
                  <Button variant="text-link" href="/about">
                    More about me
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
