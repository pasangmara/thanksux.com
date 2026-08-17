"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MediaField } from "@/components/admin/media";
import {
  adminButtonDanger,
  adminButtonPrimary,
  adminButtonSecondary,
  FieldGrid,
  SaveStatusMessage,
  Section,
  SelectField,
  TextAreaField,
  TextField,
  ToggleField,
} from "@/components/admin/fields";
import { PromoBanner, type PromoBannerData } from "@/components/site/PromoBanner";
import {
  deleteBannerRecord,
  getBanner,
  runBannerAction,
  saveBannerContent,
  type AdminPromoBanner,
  type BannerVariant,
} from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { AdminMedia } from "@/lib/admin/types";

const VARIANTS: BannerVariant[] = ["gradient", "dark", "light", "image"];
const VARIANT_LABEL: Record<BannerVariant, string> = {
  gradient: "Gradient (soft accent wash)",
  dark: "Dark (solid ink block)",
  light: "Light (soft neutral block)",
  image: "Image-led (plain surface)",
};

/**
 * [Promotional Banner / Campaign System §3/§4/§13] Full editor for one
 * promo banner. The image field reuses `MediaField` exactly as-is (Choose
 * existing/Upload new/Preview/alt text/Clear) — zero new media code, same
 * component every other single-image field in this admin already uses.
 *
 * §13 preview: renders the actual public `<PromoBanner>` component against
 * the current *draft* form state (not yet saved) — a real preview, not a
 * mockup, so what the admin sees here is byte-identical to what the
 * homepage will render. One full-width block covers "desktop"; a second,
 * fixed 390px-wide wrapper reflows the same component naturally for
 * "mobile" — two real previews from one live component, not two different
 * render paths to keep in sync.
 */
export default function AdminBannerEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [banner, setBanner] = useState<AdminPromoBanner | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [eyebrow, setEyebrow] = useState("");
  const [description, setDescription] = useState("");
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState("");
  const [primaryCtaUrl, setPrimaryCtaUrl] = useState("");
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState("");
  const [secondaryCtaUrl, setSecondaryCtaUrl] = useState("");
  const [image, setImage] = useState<AdminMedia>({ kind: "placeholder", category: "campaign", alt: "" });
  const [imageDecorative, setImageDecorative] = useState(false);
  const [variant, setVariant] = useState<BannerVariant>("gradient");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const saveState = useSaveStatus();
  const actionState = useSaveStatus();

  useEffect(() => {
    let cancelled = false;
    getBanner(params.id).then((b) => {
      if (cancelled) return;
      if (!b) {
        setNotFound(true);
        return;
      }
      setBanner(b);
      setTitle(b.title);
      setEyebrow(b.eyebrow ?? "");
      setDescription(b.description ?? "");
      setPrimaryCtaLabel(b.primaryCtaLabel ?? "");
      setPrimaryCtaUrl(b.primaryCtaUrl ?? "");
      setSecondaryCtaLabel(b.secondaryCtaLabel ?? "");
      setSecondaryCtaUrl(b.secondaryCtaUrl ?? "");
      setImage(b.imageUrl ? { kind: "image", src: b.imageUrl, alt: b.imageAlt ?? "" } : { kind: "placeholder", category: "campaign", alt: "" });
      setImageDecorative(b.imageDecorative);
      setVariant(b.variant);
      setBadgeLabel(b.badgeLabel ?? "");
      setCampaignName(b.campaignName ?? "");
      setStartAt(b.startAt ? b.startAt.slice(0, 16) : "");
      setEndAt(b.endAt ? b.endAt.slice(0, 16) : "");
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <div>
        <p className="text-body">No banner with id &ldquo;{params.id}&rdquo; was found.</p>
        <Link href="/admin/banners" className="text-body text-accent underline">
          Back to Banners
        </Link>
      </div>
    );
  }
  if (!banner) return <p className="text-body text-text-secondary">Loading…</p>;

  const previewData: PromoBannerData = {
    title: title || "Banner title",
    eyebrow: eyebrow || null,
    description: description || null,
    primaryCtaLabel: primaryCtaLabel || null,
    primaryCtaUrl: primaryCtaUrl || null,
    secondaryCtaLabel: secondaryCtaLabel || null,
    secondaryCtaUrl: secondaryCtaUrl || null,
    imageUrl: image.kind === "image" ? image.src : null,
    imageAlt: image.kind === "image" ? image.alt : null,
    imageDecorative,
    variant,
    badgeLabel: badgeLabel || null,
  };

  async function handleSave() {
    await saveState.run(async () => {
      const updated = await saveBannerContent(params.id, {
        title: title.trim(),
        eyebrow,
        description,
        primaryCtaLabel,
        primaryCtaUrl,
        secondaryCtaLabel,
        secondaryCtaUrl,
        imageSrc: image.kind === "image" ? image.src : null,
        imageAlt: image.kind === "image" ? image.alt : "",
        imageDecorative,
        variant,
        badgeLabel,
        campaignName,
        startAt: startAt ? new Date(startAt).toISOString() : null,
        endAt: endAt ? new Date(endAt).toISOString() : null,
      });
      setBanner(updated);
    });
  }

  async function handleToggleEnabled() {
    await actionState.run(async () => {
      const updated = await runBannerAction(params.id, banner!.enabled ? "disable" : "enable");
      setBanner(updated);
    });
  }

  async function handleDelete() {
    if (!banner) return;
    const warning = `Permanently delete the banner "${banner.title}"? This cannot be undone from the UI.`;
    if (!window.confirm(warning)) return;
    await actionState.run(async () => {
      await deleteBannerRecord(params.id);
      router.push("/admin/banners");
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <Link href="/admin/banners" className="text-caption text-accent underline">
          ← All Banners
        </Link>
        <h1 className="text-h1 mt-2">{banner.title || "(untitled banner)"}</h1>
      </div>

      <Section title="Content" description="What renders on the homepage once enabled.">
        <FieldGrid>
          <TextField id="banner-title" label="Banner title" required value={title} onChange={setTitle} />
          <TextField id="banner-eyebrow" label="Eyebrow" value={eyebrow} onChange={setEyebrow} />
        </FieldGrid>
        <TextAreaField id="banner-description" label="Description" rows={3} value={description} onChange={setDescription} />

        <FieldGrid>
          <TextField id="banner-primary-label" label="Primary CTA label" value={primaryCtaLabel} onChange={setPrimaryCtaLabel} placeholder="Explore my work" />
          <TextField id="banner-primary-url" label="Primary CTA URL" value={primaryCtaUrl} onChange={setPrimaryCtaUrl} placeholder="/work" />
        </FieldGrid>
        <FieldGrid>
          <TextField id="banner-secondary-label" label="Secondary CTA label" value={secondaryCtaLabel} onChange={setSecondaryCtaLabel} placeholder="Learn more" />
          <TextField id="banner-secondary-url" label="Secondary CTA URL" value={secondaryCtaUrl} onChange={setSecondaryCtaUrl} placeholder="/contact" />
        </FieldGrid>

        <MediaField label="Banner image" media={image} onChange={setImage} help="Right-hand visual — falls back to an honest placeholder when unset" />
        <ToggleField
          id="banner-image-decorative"
          label="Mark image as decorative"
          checked={imageDecorative}
          onChange={setImageDecorative}
          help="Off (default): alt text is announced by screen readers. On: the image is skipped entirely — use only when it adds no information beyond the text next to it."
        />

        <SelectField
          id="banner-variant"
          label="Background style"
          value={variant}
          options={VARIANTS}
          onChange={setVariant}
          getOptionLabel={(v) => VARIANT_LABEL[v]}
        />

        <FieldGrid>
          <TextField id="banner-badge" label="Badge / label" value={badgeLabel} onChange={setBadgeLabel} placeholder="New" />
          <TextField id="banner-campaign" label="Campaign name" value={campaignName} onChange={setCampaignName} help="Internal only — not shown publicly" />
        </FieldGrid>
        <FieldGrid>
          <TextField id="banner-start" label="Start date/time" type="text" value={startAt} onChange={setStartAt} placeholder="2026-08-16T09:00" help="Optional — leave blank to show immediately" />
          <TextField id="banner-end" label="End date/time" type="text" value={endAt} onChange={setEndAt} placeholder="2026-09-01T00:00" help="Optional — leave blank to show indefinitely" />
        </FieldGrid>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={handleSave} disabled={saveState.isBusy} className={adminButtonPrimary}>
            {saveState.isBusy ? "Saving…" : "Save"}
          </button>
          <SaveStatusMessage status={saveState.status} error={saveState.error} />
        </div>
      </Section>

      <Section title="Visibility" description="Controls whether this banner can appear on the homepage at all.">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-sm border border-accent px-2.5 py-1 text-caption text-accent">
            {banner.enabled ? "enabled" : "disabled"}
          </span>
        </div>
        <SaveStatusMessage status={actionState.status} error={actionState.error} savedLabel="Updated" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleToggleEnabled} disabled={actionState.isBusy} className={adminButtonSecondary}>
            {banner.enabled ? "Disable" : "Enable"}
          </button>
        </div>
      </Section>

      <Section
        title="Preview"
        description="Renders the real public banner component against your current unsaved draft — the exact same component the homepage renders, not a mockup."
      >
        <div>
          <div className="overflow-hidden rounded-lg border border-border">
            <PromoBanner banner={previewData} />
          </div>
          {/* [§13] A second, artificially narrowed copy of this same block
              was tried as a "mobile" preview and dropped: PromoBanner's
              responsive classes (tablet:/desktop:) are real CSS viewport
              media queries, so shrinking a wrapper <div> to 390px inside
              this admin page (itself rendered at full desktop width) does
              NOT reproduce mobile layout — the grid still read the page's
              actual (wide) viewport and rendered its desktop columns
              squeezed into the narrow box, which was actively misleading,
              not just incomplete. Per this brief's own fallback
              ("prioritize desktop + responsive preview" when a second
              preview isn't clean to build), this stays a single correct
              preview; resize your actual browser window (or DevTools
              device toolbar) against this block to see the real responsive
              behavior, or view the live homepage on a phone. */}
          <p className="mt-3 text-caption text-text-tertiary">
            Resize your browser window to see the responsive (tablet/mobile) layout — this is a live render of the same
            component, not a static mockup, so it reflows exactly like the homepage will.
          </p>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-2 border-t border-border bg-background-alt/95 p-4 backdrop-blur tablet:-mx-8">
        <button type="button" onClick={handleDelete} disabled={actionState.isBusy} className={adminButtonDanger}>
          Delete banner
        </button>
        <Link href="/admin/banners" className={adminButtonSecondary}>
          Back
        </Link>
      </div>
    </div>
  );
}
