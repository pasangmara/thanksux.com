"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminButtonPrimary,
  adminButtonSecondary,
  FieldGrid,
  SaveStatusMessage,
  Section,
  Spinner,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/fields";
import { HeroVisualsEditor } from "@/components/admin/HeroVisualsEditor";
import { HomepageCardsEditor } from "@/components/admin/HomepageCardsEditor";
import { SeoEditor } from "@/components/admin/SeoEditor";
import {
  discardHeroEdits,
  discardHomepageContentEdits,
  getHero,
  getHomepageContent,
  saveHero,
  saveHomepageContent,
} from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { HeroContent, HomepageContent } from "@/lib/admin/types";

/**
 * /admin/homepage — the real, dedicated Homepage editor. Supersedes
 * /admin/hero (removed) — same underlying `HeroContent` record
 * (data/hero.json via /api/admin/hero, `getHero()`/`saveHero()`), a
 * bigger, more clearly-divided editor rather than a second data source.
 *
 * [Phase D3.5] Eight sections, matching what actually exists on the
 * homepage today (verified section-by-section before writing this — see
 * docs/PROJECT_EDITOR_ARCHITECTURE.md §13). Hero Content/CTAs/Visuals/
 * Services/Design Process/SEO are all real, functional editors — Featured
 * Work stays informational: it's already correctly owned by Projects
 * (duplicating it here would be a second, competing source of truth for
 * the same data).
 *
 * [Homepage CMS — Services/Design Process] Sections 5–6 close the one
 * follow-up `docs/PROJECT_EDITOR_ARCHITECTURE.md §15b` explicitly deferred
 * out of the original pass. `hero` (data/hero.json) and `homepage`
 * (data/homepage.json) are two separate, independently-seeded records —
 * same "group by what's already separately admin-owned" reasoning as
 * keeping Hero its own file — but this page edits both together and one
 * Save/Discard pair commits both, since they're both "the homepage" from
 * an editing perspective and splitting them into two save buttons would
 * be a worse UX for no real benefit.
 */
export default function AdminHomepagePage() {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [homepage, setHomepage] = useState<HomepageContent | null>(null);
  const saveState = useSaveStatus();

  useEffect(() => {
    // Client-only fetch, deferred past hydration on purpose — see
    // src/app/admin/about/page.tsx for the same pattern.
    getHero().then(setHero);
    getHomepageContent().then(setHomepage);
  }, []);

  if (!hero || !homepage) return <p className="text-body text-text-secondary">Loading…</p>;

  function update(patch: Partial<HeroContent>) {
    setHero((h) => (h ? { ...h, ...patch } : h));
  }

  function updateHomepage(patch: Partial<HomepageContent>) {
    setHomepage((h) => (h ? { ...h, ...patch } : h));
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h1 className="text-h1">Homepage</h1>
        <p className="text-body mt-2 text-text-secondary">
          Everything the homepage Hero shows — content, both CTAs, and every visual tile — is
          controlled here. Distinct from{" "}
          <Link href="/admin/settings" className="text-accent underline">
            Site Settings
          </Link>
          , which is global (Site Title, Site Description, Positioning Statement, Differentiator),
          not page-specific.
        </p>
      </div>

      <Section
        title="1. Hero Content"
        description="Eyebrow defaults to your Name + Roles from /admin/about — only set it here if the homepage should say something different."
      >
        <TextField
          id="eyebrow"
          label="Eyebrow"
          value={hero.eyebrow ?? ""}
          onChange={(v) => update({ eyebrow: v || undefined })}
          help="Optional — leave blank to use Name — Roles from About"
        />
        <TextAreaField
          id="headline"
          label="Headline"
          required
          value={hero.headline}
          onChange={(v) => update({ headline: v })}
          help="The large headline text at the top of the homepage"
        />
        <TextAreaField
          id="description"
          label="Description"
          required
          value={hero.description}
          onChange={(v) => update({ description: v })}
          help="The supporting paragraph under the headline"
        />
      </Section>

      <Section title="2. Hero CTAs">
        <p className="text-label text-text-tertiary">Primary — the filled button</p>
        <FieldGrid>
          <TextField
            id="primaryCtaLabel"
            label="Label"
            required
            value={hero.primaryCtaLabel}
            onChange={(v) => update({ primaryCtaLabel: v })}
          />
          <TextField
            id="primaryCtaUrl"
            label="URL"
            required
            value={hero.primaryCtaUrl}
            onChange={(v) => update({ primaryCtaUrl: v })}
            help="A page path (/work), an in-page anchor (#featured-work), or a full URL"
          />
        </FieldGrid>
        <FieldGrid>
          <ToggleField
            id="primaryCtaVisible"
            label="Visible"
            checked={hero.primaryCtaVisible}
            onChange={(v) => update({ primaryCtaVisible: v })}
            help="Off = hidden, without deleting the label/URL above"
          />
          <ToggleField
            id="primaryCtaOpenInNewTab"
            label="Open in new tab"
            checked={hero.primaryCtaOpenInNewTab ?? false}
            onChange={(v) => update({ primaryCtaOpenInNewTab: v })}
          />
        </FieldGrid>

        <p className="text-label mt-2 text-text-tertiary">Secondary — the text-link button</p>
        <FieldGrid>
          <TextField
            id="secondaryCtaLabel"
            label="Label"
            required
            value={hero.secondaryCtaLabel}
            onChange={(v) => update({ secondaryCtaLabel: v })}
          />
          <TextField
            id="secondaryCtaUrl"
            label="URL"
            required
            value={hero.secondaryCtaUrl}
            onChange={(v) => update({ secondaryCtaUrl: v })}
            help="Also used by the homepage's “Start a project” hiring CTA button"
          />
        </FieldGrid>
        <FieldGrid>
          <ToggleField
            id="secondaryCtaVisible"
            label="Visible"
            checked={hero.secondaryCtaVisible}
            onChange={(v) => update({ secondaryCtaVisible: v })}
            help="Off = hidden, without deleting the label/URL above"
          />
          <ToggleField
            id="secondaryCtaOpenInNewTab"
            label="Open in new tab"
            checked={hero.secondaryCtaOpenInNewTab ?? false}
            onChange={(v) => update({ secondaryCtaOpenInNewTab: v })}
          />
        </FieldGrid>
      </Section>

      <Section
        title="3. Hero Visuals"
        description="The 4-tile image grid beside the headline on desktop. Each tile is now a real, admin-controlled item — none of them are hardcoded anymore."
      >
        <HeroVisualsEditor visuals={hero.visuals} onChange={(visuals) => update({ visuals })} />
      </Section>

      <Section title="4. Featured Work">
        <p className="text-caption text-text-tertiary">
          The Featured Work grid below the Hero (and which projects are eligible for a Hero Visual
          slot if you choose to use a project&rsquo;s cover image there) is controlled per-project —
          mark a project &ldquo;Featured&rdquo; and set its order at{" "}
          <Link href="/admin/projects" className="text-accent underline">
            /admin/projects
          </Link>
          . Not duplicated here, so there&rsquo;s only one place that decides which projects are
          featured.
        </p>
      </Section>

      <Section
        title="5. Services"
        description="The 3-card row below the showcases. Add, remove, reorder, hide, and set an optional icon or link per card."
      >
        <HomepageCardsEditor
          idPrefix="service"
          itemLabel="Service"
          cards={homepage.services}
          onChange={(services) => updateHomepage({ services })}
          showUrl
        />
      </Section>

      <Section
        title="6. Design Process"
        description="The 4-step row near the bottom of the homepage. Step numbers reflect each card's order below, same as Services."
      >
        <HomepageCardsEditor
          idPrefix="process"
          itemLabel="Step"
          cards={homepage.process}
          onChange={(process) => updateHomepage({ process })}
        />
      </Section>

      <Section title="7. Other Homepage Sections">
        <p className="text-caption text-text-tertiary">
          Everything else on the homepage (About/Skills, Case Study Preview, category showcases,
          Contact) is already controlled from its own existing editor (About, Projects, Contact) —
          not duplicated here, so there&rsquo;s only one place that owns each piece of content.
        </p>
      </Section>

      <SeoEditor
        title="8. Homepage SEO"
        seo={hero.seo}
        onChange={(patch) => update({ seo: { ...hero.seo, ...patch } })}
      />

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <SaveStatusMessage status={saveState.status} error={saveState.error} />
        <button
          type="button"
          disabled={saveState.isBusy}
          onClick={async () => {
            saveState.reset();
            await Promise.all([discardHeroEdits(), discardHomepageContentEdits()]);
            const [freshHero, freshHomepage] = await Promise.all([getHero(), getHomepageContent()]);
            setHero(freshHero);
            setHomepage(freshHomepage);
          }}
          className={adminButtonSecondary}
        >
          Discard unsaved edits
        </button>
        <button
          type="button"
          disabled={saveState.isBusy}
          onClick={() =>
            saveState.run(async () => {
              await Promise.all([saveHero(hero), saveHomepageContent(homepage)]);
            })
          }
          className={adminButtonPrimary}
        >
          {saveState.isBusy ? <Spinner className="text-white" /> : null}
          {saveState.isBusy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
