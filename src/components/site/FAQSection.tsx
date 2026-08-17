"use client";

import { useState } from "react";
import { Container } from "@/components/ui";
import { TrackedCTA } from "@/components/analytics/TrackedCTA";
import { faqDescription, faqEyebrow, faqHeading, faqItems, type FaqItem } from "@/content/faq";
import { ScrollReveal } from "./ScrollReveal";

/**
 * One question row — collapsed by default, expands via a CSS grid-rows
 * 0fr->1fr transition (no JS height measurement, no animation library —
 * the same "CSS transitions only" posture as `.reveal`/`.lift-on-hover` in
 * src/styles/*.css). Same accessible-disclosure shape as `FindingCard.tsx`/
 * `AuditLimitations.tsx`'s existing `aria-expanded` + "+/−" glyph pattern —
 * `role="region"`/`aria-labelledby` on the panel and `aria-controls` on the
 * button are additive on top of that, not a different pattern.
 */
function FAQRow({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  const questionId = `faq-question-${item.id}`;
  const answerId = `faq-answer-${item.id}`;

  return (
    <div className="border-b border-border">
      <button
        type="button"
        id={questionId}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={answerId}
        className="group flex w-full items-center justify-between gap-4 py-4 text-left focus-visible:shadow-focus focus-visible:outline-none"
      >
        <span className="text-body font-medium text-ink transition-colors duration-150 ease-out group-hover:text-accent">
          {item.question}
        </span>
        <span
          className="shrink-0 text-body text-text-tertiary transition-colors duration-150 ease-out group-hover:text-accent"
          aria-hidden="true"
        >
          {open ? "−" : "+"}
        </span>
      </button>
      <div
        id={answerId}
        role="region"
        aria-labelledby={questionId}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p
            className={`text-body max-w-[58ch] pb-4 pr-8 text-text-secondary transition-opacity duration-300 ease-out ${open ? "opacity-100" : "opacity-0"}`}
          >
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * FAQ — removes the pre-contact hesitations a potential client has
 * ("what do I need to provide," "is an idea enough," "can you work from
 * what I already have") before they're asked to fill in the actual contact
 * form. Placed after the value/proof sections (Design Process, About,
 * Client Reviews, ThanksUX signals) and before HiringCTA/Contact — the
 * point in the page where a reader is convinced but not yet asking a
 * specific question, per DESIGN_SYSTEM.md's existing "info before ask"
 * ordering already used for the rest of the homepage.
 *
 * [CMS] Content is static (`src/content/faq.ts`), not wired into the admin
 * CMS — the existing repository pattern (siteContentRepository.ts) already
 * shows how this *would* be onboarded (add `faqs: HomepageCard[]` to
 * `HomepageContent`, seed it from this file once, add an editor section to
 * /admin/homepage) — but doing that also means a Supabase migration/admin
 * UI/write-path change, and DATA_BACKEND=supabase is live in this project,
 * so that's a real schema change, not a config toggle. Deferred rather than
 * built speculatively; `faq.ts`'s `{id, question, answer}` shape already
 * matches `HomepageCard`'s fields so that migration is additive later, not
 * a rewrite.
 *
 * Single-open accordion (opening one closes any other) — the same
 * `openId === id ? null : id` pattern `AuditLimitations.tsx` already uses,
 * not a new interaction model.
 */
export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  return (
    <section id="faq" className="py-12 tablet:py-16">
      <Container variant="wide">
        {/* [QA pass] One continuous rule across the full section width,
            matching SectionHeader's/ContactSection's sitewide "border-t
            opens the section" convention — previously duplicated as two
            separate border-t segments (one per column), which left a gap
            over the grid gutter instead of one clean line. */}
        <div className="border-t border-border pt-3">
          <div className="grid grid-cols-1 gap-12 desktop:grid-cols-12">
            <ScrollReveal className="desktop:col-span-5">
              <p className="text-label">{faqEyebrow}</p>
              <h2 className="text-h2 mt-2 max-w-[22ch]">{faqHeading}</h2>
              <p className="text-body-lg mt-3 max-w-[42ch] text-text-secondary">{faqDescription}</p>
              <div className="mt-6">
                <TrackedCTA variant="secondary" href="#contact" ctaType="secondary" location="faq_intro">
                  Let&rsquo;s Talk
                </TrackedCTA>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade" className="desktop:col-span-6 desktop:col-start-7">
              <div>
                {faqItems.map((item) => (
                  <FAQRow key={item.id} item={item} open={openId === item.id} onToggle={() => toggle(item.id)} />
                ))}
              </div>

              {/* Closing CTA — same #contact target/tracking as the intro
                  CTA above, just a second, later moment for a reader who
                  read through the whole list still unsure. Not a second
                  contact system — TrackedCTA -> #contact is the one
                  existing path. */}
              <div className="mt-12 border-t border-border pt-8">
                <p className="text-body font-medium text-ink">Still have a question?</p>
                <p className="text-body mt-1 text-text-secondary">Tell me what you&rsquo;re trying to build or improve.</p>
                <div className="mt-4">
                  <TrackedCTA variant="primary" href="#contact" ctaType="primary" location="faq_closing">
                    Let&rsquo;s Talk
                  </TrackedCTA>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
