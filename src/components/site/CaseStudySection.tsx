import type { ReactNode } from "react";
import { Chip, Container } from "@/components/ui";
import { TrackedCTA } from "@/components/analytics/TrackedCTA";
import type { CoverMedia, CustomSection, MetricEntry } from "@/types/project";
import { ASPECT } from "@/content/media";
import { Animated } from "./Animated";
import { CaseStudyGallery } from "./CaseStudyGallery";
import { PortfolioMedia } from "./PortfolioMedia";
import { ScrollReveal, type ScrollRevealVariant } from "./ScrollReveal";

/**
 * Case-study stage renderer — project detail brief §03/§05. Implements
 * DESIGN_SYSTEM.md §7's already-documented "Case-Study Section Card"
 * typography (text-label eyebrow + text-h3 title + text-body description)
 * as a single-column narrative rhythm rather than the spec's two-column
 * alternating layout: a detail page can have up to ~10 stages, and most
 * of them are text-only (no paired image to alternate against), so a
 * consistent stacked rhythm — the same one already used by Design
 * Process/Services on the homepage — reads more like a professional case
 * study than an unpaired image would.
 *
 * [Numbering removed] Each stage previously opened with a zero-padded
 * position number ("01", "02"...) — reverted on explicit instruction, same
 * as SectionHeader/HomepageCardBody. The eyebrow now repeats the stage's
 * own label (e.g. "OVERVIEW" / "Overview"), never a counter.
 *
 * Three stage kinds, matching what CaseStudy fields actually are: prose,
 * a list (goals, research methods), or a gallery.
 */
function StageHeading({ label }: { label: string }) {
  return (
    <>
      <p className="text-label">{label}</p>
      <h3 className="text-h3 mt-2">{label}</h3>
    </>
  );
}

function StageWrapper({ children, variant = "up" }: { children: ReactNode; variant?: ScrollRevealVariant }) {
  return (
    <div className="border-t border-border py-8 tablet:py-10">
      <Container variant="wide">
        <ScrollReveal variant={variant}>{children}</ScrollReveal>
      </Container>
    </div>
  );
}

export function CaseStudyTextSection({
  label,
  text,
  secondaryLabel,
  secondaryList,
}: {
  label: string;
  text: string;
  /** e.g. "Methods" — a short tag list rendered beneath the paragraph (Research Methods under Research). */
  secondaryLabel?: string;
  secondaryList?: string[];
}) {
  return (
    <StageWrapper>
      <StageHeading label={label} />
      <p className="text-body-lg mt-3 max-w-[70ch] text-text-secondary">{text}</p>
      {secondaryList && secondaryList.length > 0 ? (
        <div className="mt-4 max-w-[70ch]">
          {secondaryLabel ? <p className="text-caption">{secondaryLabel}</p> : null}
          <div className="mt-2 flex flex-wrap gap-2">
            {secondaryList.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </div>
        </div>
      ) : null}
    </StageWrapper>
  );
}

export function CaseStudyListSection({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <StageWrapper>
      <StageHeading label={label} />
      <ul className="mt-3 flex max-w-[70ch] flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="text-body-lg flex gap-3 text-text-secondary">
            <span aria-hidden className="mt-[0.7em] h-px w-4 shrink-0 bg-ink" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </StageWrapper>
  );
}

export function CaseStudyGallerySection({
  label,
  images,
}: {
  label: string;
  images: CoverMedia[];
}) {
  if (images.length === 0) return null;

  return (
    <StageWrapper variant="scale">
      <StageHeading label={label} />
      <div className="mt-6">
        <CaseStudyGallery images={images} />
      </div>
    </StageWrapper>
  );
}

/**
 * [CMS Phase D3 follow-up] Renders a `type: "url"` case-study field (e.g.
 * `prototype`) as an actual clickable link — the one meaningful public
 * destination a URL has. Previously these fields were folded into
 * `CaseStudyTextSection`, which rendered the raw URL as inert `<p>` text.
 * Reuses the existing `Button` "text-link" variant rather than a bespoke
 * anchor style, matching every other outbound link on the site.
 */
export function CaseStudyLinkSection({
  label,
  url,
}: {
  label: string;
  url: string;
}) {
  if (!url) return null;
  // [Phase L] Every current "Figma"-flavored URL field's label literally
  // contains the word — see category-config.ts's `figmaPrototypeUrl`/
  // `prototype` entries — so this is an accurate, real signal rather than
  // a guess, and it's the one place every case-study URL field renders as
  // a link, so it's the correct single spot to distinguish the two events.
  const eventName = label.toLowerCase().includes("figma") ? "click_figma" : "click_external_link";

  return (
    <StageWrapper>
      <StageHeading label={label} />
      <div className="mt-3">
        <TrackedCTA
          href={url}
          variant="text-link"
          target="_blank"
          rel="noreferrer"
          ctaType={eventName === "click_figma" ? "figma" : "external"}
          location="case_study"
          eventName={eventName}
          eventParams={{ cta_location: label }}
        >
          Visit link ↗
        </TrackedCTA>
      </div>
    </StageWrapper>
  );
}

/**
 * [CMS Phase D3] Real, admin-entered metrics only — see
 * `CaseStudy.metrics`'s doc comment in src/types/project.ts. Renders as a
 * simple label/value grid, the same visual pattern `ProjectOverview`
 * already uses for Client/Year/Role/etc., rather than inventing a new
 * "stat tile" treatment. Never rendered with fabricated data — this
 * component only ever receives whatever real values an admin actually
 * typed in; an empty `metrics` array means the stage doesn't render at
 * all (see `hasContent()` in ProjectStory.tsx).
 */
export function CaseStudyMetricsSection({
  label,
  metrics,
}: {
  label: string;
  metrics: MetricEntry[];
}) {
  if (metrics.length === 0) return null;

  return (
    <StageWrapper variant="fade">
      <StageHeading label={label} />
      <div className="mt-6 grid grid-cols-2 gap-6 tablet:grid-cols-4">
        {metrics.map((metric, i) => (
          <div key={`${metric.label}-${i}`}>
            <p className="text-caption">{metric.label}</p>
            <p className="text-body mt-1">{metric.value}</p>
          </div>
        ))}
      </div>
    </StageWrapper>
  );
}

/**
 * [CMS Phase D3] Custom category's flexible sections — see `CustomSection`
 * in src/types/project.ts. Each section can freely combine a title,
 * description, body text, one image, a gallery, and a repeatable item
 * list; only the pieces actually present render, reusing the same
 * paragraph/gallery/list treatments every other stage already uses.
 */
export function CaseStudyCustomSectionsSection({
  label,
  sections,
}: {
  label: string;
  sections: CustomSection[];
}) {
  const visibleSections = sections.filter((s) => s.visible !== false);
  if (visibleSections.length === 0) return null;
  const ordered = [...visibleSections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <StageWrapper>
      <StageHeading label={label} />
      <div className="mt-6 flex flex-col gap-10">
        {ordered.map((section, i) => (
          <Animated key={section.id} config={section.animation} index={i}>
            {section.label ? <p className="text-h3">{section.label}</p> : null}
            {section.description ? (
              <p className="text-body mt-2 max-w-[70ch] text-text-secondary">{section.description}</p>
            ) : null}
            {section.text ? (
              <p className="text-body-lg mt-3 max-w-[70ch] text-text-secondary">{section.text}</p>
            ) : null}
            {section.image ? (
              <div className="mt-4 max-w-[600px]">
                <PortfolioMedia media={section.image} aspectRatio={ASPECT.card} radius="md" />
              </div>
            ) : null}
            {section.images && section.images.length > 0 ? (
              <div className="mt-4">
                <CaseStudyGallery images={section.images} />
              </div>
            ) : null}
            {section.items && section.items.length > 0 ? (
              <ul className="mt-4 flex max-w-[70ch] flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item.id} className="text-body text-text-secondary">
                    <span className="text-ink">{item.label}</span>
                    {item.text ? <span> — {item.text}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </Animated>
        ))}
      </div>
    </StageWrapper>
  );
}

/**
 * Outcome Summary Block — DESIGN_SYSTEM.md §7's already-documented
 * pattern ("color-background-alt full-bleed band, text-h2 outcome
 * statement"), reused here for the story's closing outcome rather than
 * rendering it as just another numbered stage — it's the one moment on
 * the page meant to carry more visual weight than the rest of the
 * narrative, same treatment as HiringCTA already uses on the homepage.
 */
export function OutcomeBlock({ outcome }: { outcome: string }) {
  return (
    <div className="bg-background-alt py-12 tablet:py-16">
      <Container variant="wide">
        <ScrollReveal variant="scale">
          <p className="text-label">Outcome</p>
          <p className="text-h2 mt-3 max-w-[48ch]">{outcome}</p>
        </ScrollReveal>
      </Container>
    </div>
  );
}
