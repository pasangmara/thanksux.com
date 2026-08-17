"use client";

import { useEffect, useState } from "react";
import {
  adminButtonPrimary,
  adminButtonSecondary,
  FieldGrid,
  SaveStatusMessage,
  Section,
  Spinner,
  TagListField,
  TextAreaField,
  TextField,
} from "@/components/admin/fields";
import { MediaField } from "@/components/admin/media";
import { SeoEditor } from "@/components/admin/SeoEditor";
import { discardAboutEdits, getAbout, saveAbout } from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { AboutContent } from "@/lib/admin/types";

/**
 * /admin/about — About content editor.
 *
 * [CMS Phase D3] This content now renders in two places: the homepage's
 * "Designer Introduction" (#about) / "About / Skills" (#skills) sections,
 * and the standalone /about route (src/app/about/page.tsx) — both read the
 * same persisted content via `getAboutContent()`, so a Save here updates
 * both on the next load.
 */
export default function AdminAboutPage() {
  const [about, setAbout] = useState<AboutContent | null>(null);
  const saveState = useSaveStatus();

  useEffect(() => {
    // Client-only fetch (rather than a lazy useState initializer) avoids a
    // server/client hydration mismatch, and this data can only be fetched
    // from the browser anyway.
    getAbout().then(setAbout);
  }, []);

  if (!about) return <p className="text-body text-text-secondary">Loading…</p>;

  function update(patch: Partial<AboutContent>) {
    setAbout((a) => (a ? { ...a, ...patch } : a));
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h1 className="text-h1">About</h1>
        <p className="text-body mt-2 text-text-secondary">
          Renders via the homepage&rsquo;s Designer Introduction (#about) and About/Skills
          (#skills) sections, and the standalone{" "}
          <a href="/about" className="text-accent underline">
            /about
          </a>{" "}
          page.
        </p>
      </div>

      <Section title="Basic Information">
        <FieldGrid>
          <TextField id="name" label="Name" required value={about.name} onChange={(v) => update({ name: v })} />
          <TextField id="title" label="Title" required value={about.title} onChange={(v) => update({ title: v })} />
        </FieldGrid>
        <TagListField id="roles" label="Roles" required values={about.roles} onChange={(v) => update({ roles: v })} />
        <TextField
          id="location"
          label="Location"
          value={about.location ?? ""}
          onChange={(v) => update({ location: v || undefined })}
        />
      </Section>

      <Section title="Bio">
        <TextAreaField id="bio" label="Short Bio" required value={about.bio} onChange={(v) => update({ bio: v })} />
        <TextAreaField
          id="designPhilosophy"
          label="Design Philosophy"
          required
          help="The longer 'how I work' paragraph shown in Designer Introduction"
          value={about.designPhilosophy}
          onChange={(v) => update({ designPhilosophy: v })}
        />
        <TagListField
          id="aboutFacts"
          label="About Facts"
          required
          help="Short, specific credibility facts — shown as a bulleted list"
          values={about.aboutFacts}
          onChange={(v) => update({ aboutFacts: v })}
        />
      </Section>

      <Section title="Profile Image">
        <MediaField
          label="Profile Photo"
          media={about.photo ?? { kind: "placeholder", category: "brand-mark", alt: "" }}
          onChange={(m) => update({ photo: m })}
          help="Renders on the homepage and /about — falls back to an honest 'Photo pending' placeholder until a real photo is set"
        />
      </Section>

      <Section title="Skills, Experience & Tools">
        <TextField
          id="experienceSummary"
          label="Experience Summary"
          value={about.experienceSummary ?? ""}
          onChange={(v) => update({ experienceSummary: v || undefined })}
          help="Years of experience / credibility line — leave blank to hide the column"
        />
        <FieldGrid>
          <TagListField
            id="skillsDesign"
            label="Design Skills"
            values={about.skillsDesign}
            onChange={(v) => update({ skillsDesign: v })}
          />
          <TagListField
            id="skillsTools"
            label="Tools"
            values={about.skillsTools}
            onChange={(v) => update({ skillsTools: v })}
          />
        </FieldGrid>
        <TextField
          id="resumeUrl"
          label="Resume / CV URL"
          type="url"
          value={about.resumeUrl ?? ""}
          onChange={(v) => update({ resumeUrl: v || undefined })}
          help="Not yet rendered on the public site — no download link exists there today"
        />
      </Section>

      <p className="text-caption text-text-tertiary">
        Social/contact links aren&rsquo;t edited here — they&rsquo;re one shared list, managed at{" "}
        <a href="/admin/contact" className="text-accent underline">
          /admin/contact
        </a>{" "}
        or{" "}
        <a href="/admin/settings" className="text-accent underline">
          /admin/settings
        </a>
        , so the footer and contact section never drift out of sync with each other.
      </p>

      <SeoEditor seo={about.seo} onChange={(patch) => update({ seo: { ...about.seo, ...patch } })} />

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <SaveStatusMessage status={saveState.status} error={saveState.error} />
        <button
          type="button"
          disabled={saveState.isBusy}
          onClick={async () => {
            saveState.reset();
            await discardAboutEdits();
            setAbout(await getAbout());
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
              await saveAbout(about);
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
