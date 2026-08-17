import { Suspense } from "react";
import { AboutSkills } from "@/components/site/AboutSkills";
import { CaseStudyPreview } from "@/components/site/CaseStudyPreview";
import { ClientReviewsSection } from "@/components/site/ClientReviewsSection";
import { ContactSection } from "@/components/site/ContactSection";
import { DesignProcess } from "@/components/site/DesignProcess";
import { DesignerIntro } from "@/components/site/DesignerIntro";
import { FAQSection } from "@/components/site/FAQSection";
import { FeaturedWork } from "@/components/site/FeaturedWork";
import { GraphicDesignShowcase } from "@/components/site/GraphicDesignShowcase";
import { Hero } from "@/components/site/Hero";
import { HiringCTA } from "@/components/site/HiringCTA";
import { HostingerPromo } from "@/components/site/HostingerPromo";
import { PromoBannerSection } from "@/components/site/PromoBannerSection";
import { Services } from "@/components/site/Services";
import { ThanksUXSection } from "@/components/site/ThanksUXSection";
import { UIUXShowcase } from "@/components/site/UIUXShowcase";
import { getContactContent } from "@/lib/cms/siteContentRepository";

// [CMS Phase D2] Several sections below (Hero, FeaturedWork, CaseStudyPreview,
// GraphicDesignShowcase, UIUXShowcase) now read the live persisted project
// store per request — force-dynamic so the homepage never serves a stale
// build-time snapshot after an admin save.
//
// [Temporary GitHub Pages deployment] CI patches this literal to
// "force-static" for the export build only — see .github/workflows/ci.yml's
// deploy job. Unset/normal builds: unchanged.
export const dynamic = "force-dynamic";

/**
 * [Perf — streaming] ContactSection needs its own async fetch (it's "use
 * client" and can't read the server-only repository itself — see its own
 * doc comment), which previously ran as a plain top-level `await` inside
 * `Home()` — meaning it blocked the *entire* page, including Hero, until
 * contact_content resolved. Moved into its own component so it can sit
 * behind a `<Suspense>` boundary below like every other non-hero section,
 * instead of gating everything above it.
 */
async function ContactSectionWithData() {
  const contact = await getContactContent();
  return (
    <ContactSection
      heading={contact.heading}
      description={contact.description}
      // [Phase 7 — placeholder hygiene] Same server-side filter as
      // layout.tsx's SiteFooter call.
      contactSocialLinks={contact.socialLinks.filter((link) => link.visible !== false)}
      contactProjectTypes={contact.projectTypes}
      contactResponseTimeLine={contact.responseTimeLine}
    />
  );
}

/**
 * [Perf] Measured (production build, PERF_DEBUG query log): 743ms total for
 * this page, against individual Supabase queries in the 124-429ms range —
 * meaning a real ~300ms was sequential "waterfall" cost from evaluating 13
 * independent async sections one after another with nothing letting them
 * stream concurrently. Hero and FeaturedWork stay eager (unwrapped) —
 * they're the above-the-fold/LCP content, and Next.js already runs their
 * own data fetches (each already parallelized internally, e.g. Hero's own
 * `Promise.all`) without needing a boundary. Every section below them is
 * genuinely below the fold, so each gets its own `<Suspense>` — fine-
 * grained, not one boundary around all of them, so a fast section (e.g.
 * Services, whose project data is already warm in the request-scoped
 * `cache()` from FeaturedWork) can paint the moment *it's* ready rather
 * than waiting on the slowest one. `fallback={null}` is intentional: every
 * one of these sections already renders nothing when its own CMS content
 * is empty (see each section's own "don't show an empty section" comment),
 * so an empty slot while streaming is the same visual contract they
 * already have, not a new one.
 */
export default function Home() {
  return (
    <main>
      <Hero />
      <HostingerPromo />
      <FeaturedWork />
      <Suspense fallback={null}>
        <PromoBannerSection />
      </Suspense>
      <Suspense fallback={null}>
        <DesignerIntro />
      </Suspense>
      <Suspense fallback={null}>
        <Services />
      </Suspense>
      <Suspense fallback={null}>
        <CaseStudyPreview />
      </Suspense>
      <Suspense fallback={null}>
        <GraphicDesignShowcase />
      </Suspense>
      <Suspense fallback={null}>
        <UIUXShowcase />
      </Suspense>
      <Suspense fallback={null}>
        <DesignProcess />
      </Suspense>
      <Suspense fallback={null}>
        <AboutSkills />
      </Suspense>
      <Suspense fallback={null}>
        <ClientReviewsSection />
      </Suspense>
      <Suspense fallback={null}>
        <ThanksUXSection />
      </Suspense>
      <FAQSection />
      <Suspense fallback={null}>
        <HiringCTA />
      </Suspense>
      <Suspense fallback={null}>
        <ContactSectionWithData />
      </Suspense>
    </main>
  );
}
