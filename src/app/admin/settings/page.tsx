"use client";

import { useEffect, useState } from "react";
import {
  adminButtonPrimary,
  adminButtonSecondary,
  inputClass,
  SaveStatusMessage,
  Section,
  SelectField,
  Spinner,
  TextAreaField,
  TextField,
} from "@/components/admin/fields";
import { IconField } from "@/components/admin/IconField";
import { SocialLinksEditor } from "@/components/admin/SocialLinksEditor";
import { SeoEditor } from "@/components/admin/SeoEditor";
import { discardSettingsEdits, getSettings, saveSettings } from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { LogoDisplayMode, SiteSettings } from "@/lib/admin/types";

const DISPLAY_MODES: LogoDisplayMode[] = ["name-only", "logo-only", "logo-and-name"];
const DISPLAY_MODE_LABELS: Record<LogoDisplayMode, string> = {
  "name-only": "Name only (text wordmark — current default)",
  "logo-only": "Logo only",
  "logo-and-name": "Logo + name",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const saveState = useSaveStatus();

  useEffect(() => {
    // Client-only fetch, deferred past hydration on purpose — see
    // src/app/admin/about/page.tsx for the same pattern.
    getSettings().then(setSettings);
  }, []);

  if (!settings) return <p className="text-body text-text-secondary">Loading…</p>;

  function update(patch: Partial<SiteSettings>) {
    setSettings((s) => (s ? { ...s, ...patch } : s));
  }

  function updateNav(i: number, patch: Partial<SiteSettings["navLabels"][number]>) {
    setSettings((s) =>
      s ? { ...s, navLabels: s.navLabels.map((n, idx) => (idx === i ? { ...n, ...patch } : n)) } : s,
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <h1 className="text-h1">Site Settings</h1>
        <p className="text-body mt-2 text-text-secondary">
          Global copy sourced from site.ts today — nav labels, footer text, positioning, and SEO
          defaults used across the site.
        </p>
      </div>

      <Section title="Identity">
        <TextField
          id="siteTitle"
          label="Site Title"
          required
          value={settings.siteTitle}
          onChange={(v) => update({ siteTitle: v })}
          help="Used as the root <title> in layout.tsx"
        />
        <TextAreaField
          id="siteDescription"
          label="Site Description"
          rows={2}
          value={settings.siteDescription}
          onChange={(v) => update({ siteDescription: v })}
        />
        <TextField
          id="positioning"
          label="Positioning Statement"
          value={settings.positioning}
          onChange={(v) => update({ positioning: v })}
          help="Shown in the footer, under the site name"
        />
        <TextAreaField
          id="differentiator"
          label="Differentiator"
          rows={2}
          value={settings.differentiator}
          onChange={(v) => update({ differentiator: v })}
        />
      </Section>

      <Section
        title="Site Identity"
        description="The nav (top-left) and footer brand row — independent of the domain name and independent of About's Name field (which is the designer's own name, not necessarily the site's public brand)."
      >
        <TextField
          id="brandName"
          label="Brand Name"
          value={settings.brandName ?? ""}
          onChange={(v) => update({ brandName: v || undefined })}
          help='Leave blank to use About → Name ("Joy Howlader") — currently set to "Thanks UX," the product/site identity, distinct from the personal name'
        />
        <TextField
          id="siteUrl"
          label="Site URL"
          type="url"
          value={settings.siteUrl ?? ""}
          onChange={(v) => update({ siteUrl: v || undefined })}
          help='The real public domain, e.g. "https://joyportfolio.com" — used to resolve social-share (Open Graph) and canonical URLs correctly. Leave blank while developing locally.'
        />
        <TextField
          id="footerBrandName"
          label="Footer Brand Name"
          value={settings.footerBrandName ?? ""}
          onChange={(v) => update({ footerBrandName: v || undefined })}
          help="Optional — overrides Brand Name in the footer's brand row only. Leave blank to show the same name as the nav."
        />
        <IconField
          label="Logo"
          icon={settings.logo}
          onChange={(logo) => update({ logo })}
          help="SVG, PNG, or WEBP — shown per Display Mode below"
        />
        <IconField
          label="Mobile Logo"
          icon={settings.logoMobile}
          onChange={(logoMobile) => update({ logoMobile })}
          help="Optional — a more compact mark shown in the nav below 768px. Leave unset to use Logo at every size."
        />
        <SelectField
          id="logoDisplayMode"
          label="Display Mode"
          value={settings.logoDisplayMode}
          options={DISPLAY_MODES}
          onChange={(v) => update({ logoDisplayMode: v })}
          getOptionLabel={(v) => DISPLAY_MODE_LABELS[v]}
          help='"Logo only" / "Logo + name" have no visible effect until a Logo is set above'
        />
        <IconField
          label="Brand Mark"
          icon={settings.brandMark}
          onChange={(brandMark) => update({ brandMark })}
          help="Optional compact mark (e.g. a monogram) — reserved for future compact placements, not yet rendered publicly"
        />
        <IconField
          label="Favicon"
          icon={settings.favicon}
          onChange={(favicon) => update({ favicon })}
          help="Browser tab icon — leave unset to keep the site's default favicon"
        />
      </Section>

      <Section
        title="Admin Dashboard Brand Identity"
        description='Logo shown in the admin panel’s own sidebar/header — separate from the public site logo above. Leave unset to keep showing the "Thanks UX CMS" text label.'
      >
        <IconField
          label="Admin Dashboard Logo"
          icon={settings.adminLogo}
          onChange={(adminLogo) => update({ adminLogo })}
          help="SVG, PNG, or WEBP — shown at the top of the admin sidebar, in place of the text label"
        />
      </Section>

      <Section title="Navigation Labels" description="/, /work, /about, and /contact are all real routes — editing href here changes where the nav link points.">
        <div className="flex flex-col gap-2">
          {settings.navLabels.map((item, i) => (
            <div key={item.href} className="grid grid-cols-2 gap-2">
              <input
                value={item.label}
                onChange={(e) => updateNav(i, { label: e.target.value })}
                className={`${inputClass} py-1.5`}
              />
              <input
                value={item.href}
                onChange={(e) => updateNav(i, { href: e.target.value })}
                className={`${inputClass} py-1.5`}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Footer">
        <TextField
          id="footerText"
          label="Footer Copyright Text"
          value={settings.footerText}
          onChange={(v) => update({ footerText: v })}
        />
      </Section>

      <Section title="Social Links" description="Same source feeds /admin/contact — one list, used by both the footer and the contact section.">
        <SocialLinksEditor links={settings.socialLinks} onChange={(v) => update({ socialLinks: v })} />
      </Section>

      <SeoEditor
        seo={settings.seoDefaults}
        onChange={(patch) => update({ seoDefaults: { ...settings.seoDefaults, ...patch } })}
        description="Saved here, but not yet read anywhere — Site Settings has no dedicated public route of its own to attach this to. Per-page SEO already exists on Projects, About, Contact, and the Homepage."
      />

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <SaveStatusMessage status={saveState.status} error={saveState.error} />
        <button
          type="button"
          disabled={saveState.isBusy}
          onClick={async () => {
            saveState.reset();
            await discardSettingsEdits();
            setSettings(await getSettings());
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
              await saveSettings(settings);
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
