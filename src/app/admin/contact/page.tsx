"use client";

import { useEffect, useState } from "react";
import {
  adminButtonPrimary,
  adminButtonSecondary,
  SaveStatusMessage,
  Section,
  Spinner,
  TagListField,
  TextAreaField,
  TextField,
} from "@/components/admin/fields";
import { SocialLinksEditor } from "@/components/admin/SocialLinksEditor";
import { SeoEditor } from "@/components/admin/SeoEditor";
import { discardContactEdits, getContact, saveContact } from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { ContactContent } from "@/lib/admin/types";

/**
 * /admin/contact — Contact content editor.
 *
 * [CMS Phase D3] This content now renders in two places: the homepage's
 * ContactSection (#contact anchor) and the standalone /contact route
 * (src/app/contact/page.tsx) — both read the same persisted content via
 * `getContactContent()`. Email/Phone/Location below now render publicly
 * too, on /contact only (see ContactSection.tsx's `directDetails` prop) —
 * the mailto: form's recipient still comes from the "Email" entry in
 * Social / Contact Methods, unchanged.
 */
export default function AdminContactPage() {
  const [contact, setContact] = useState<ContactContent | null>(null);
  const saveState = useSaveStatus();

  useEffect(() => {
    // Client-only fetch, deferred past hydration on purpose — see
    // src/app/admin/about/page.tsx for the same pattern.
    getContact().then(setContact);
  }, []);

  if (!contact) return <p className="text-body text-text-secondary">Loading…</p>;

  function update(patch: Partial<ContactContent>) {
    setContact((c) => (c ? { ...c, ...patch } : c));
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h1 className="text-h1">Contact</h1>
        <p className="text-body mt-2 text-text-secondary">
          Renders via the homepage&rsquo;s Contact section (#contact) and the standalone{" "}
          <a href="/contact" className="text-accent underline">
            /contact
          </a>{" "}
          page.
        </p>
      </div>

      <Section title="Section Copy">
        <TextField id="heading" label="Heading" required value={contact.heading} onChange={(v) => update({ heading: v })} />
        <TextAreaField
          id="description"
          label="Description"
          rows={2}
          value={contact.description}
          onChange={(v) => update({ description: v })}
        />
      </Section>

      <Section
        title="Direct Details"
        description="Shown on the /contact page only (not the homepage section). The mailto: form's recipient still derives from the Email entry in Social / Contact Methods below, unchanged."
      >
        <TextField
          id="email"
          label="Email"
          type="email"
          value={contact.email ?? ""}
          onChange={(v) => update({ email: v || undefined })}
        />
        <TextField id="phone" label="Phone" value={contact.phone ?? ""} onChange={(v) => update({ phone: v || undefined })} />
        <TextField
          id="location"
          label="Location"
          value={contact.location ?? ""}
          onChange={(v) => update({ location: v || undefined })}
        />
        <TextField
          id="availability"
          label="Availability"
          help="Response-time line — maps to site.ts's responseTimeLine"
          value={contact.responseTimeLine ?? ""}
          onChange={(v) => update({ responseTimeLine: v || undefined })}
        />
      </Section>

      <Section title="Social / Contact Methods" description="Same source socialLinks feeds the site footer too.">
        <SocialLinksEditor links={contact.socialLinks} onChange={(v) => update({ socialLinks: v })} />
      </Section>

      <Section title="Form Settings">
        <TagListField
          id="projectTypes"
          label="Project Type Options"
          help="Populates the contact form's dropdown"
          values={contact.projectTypes}
          onChange={(v) => update({ projectTypes: v })}
        />
        <TextAreaField
          id="successMessage"
          label="Success Message"
          rows={2}
          value={contact.successMessage ?? ""}
          onChange={(v) => update({ successMessage: v || undefined })}
        />
      </Section>

      <SeoEditor seo={contact.seo} onChange={(patch) => update({ seo: { ...contact.seo, ...patch } })} />

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <SaveStatusMessage status={saveState.status} error={saveState.error} />
        <button
          type="button"
          disabled={saveState.isBusy}
          onClick={async () => {
            saveState.reset();
            await discardContactEdits();
            setContact(await getContact());
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
              await saveContact(contact);
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
