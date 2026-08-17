"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { adminButtonSmall, adminButtonSmallDanger, SaveStatusMessage, Spinner } from "./fields";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { IconAsset } from "@/lib/admin/types";

/**
 * [Icon/Logo CMS — Parts D–I] Admin control for a small brand asset field
 * (Logo, Brand Mark, Favicon, a per-social-link custom icon): Choose
 * existing / Upload new (SVG, PNG, or WEBP) / Clear — the same three-state
 * interaction `MediaField` already established for photos, kept visually
 * consistent, but talking to `/api/admin/icons` (accepts + sanitizes SVG)
 * instead of `/api/admin/images` (photos only, JPG/PNG/WEBP, no SVG — see
 * that route's own header comment for why the two are deliberately not the
 * same endpoint).
 *
 * Preview and every "choose existing" thumbnail render via a plain
 * `<img>`, never `next/image` — consistent with every other admin preview
 * in this file, and load-bearing here specifically: `next/image`'s
 * optimizer refuses SVG without `images.dangerouslyAllowSVG` (not set, on
 * purpose — see the icons route). The public-facing render path (SiteNav
 * logo, ContactSection/SiteFooter custom social icons) makes the same
 * choice for the same reason.
 */

const UPLOAD_ACCEPT = "image/svg+xml,image/png,image/webp,.svg";

async function uploadIcon(file: File): Promise<{ src: string }> {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/admin/icons", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Upload failed — please try again.");
  }
  return data.icon as { src: string };
}

function useIconLibrary() {
  const [icons, setIcons] = useState<{ src: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/icons")
      .then((r) => r.json())
      .then((data: { icons: { src: string }[] }) => {
        if (!cancelled) setIcons(data.icons ?? []);
      })
      .catch(() => {
        if (!cancelled) setIcons([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { icons, loading, refresh: () => setReloadToken((t) => t + 1) };
}

export function IconField({
  label,
  icon,
  onChange,
  help,
}: {
  label: string;
  icon: IconAsset | undefined;
  onChange: (icon: IconAsset | undefined) => void;
  help?: string;
}) {
  const { icons, loading, refresh } = useIconLibrary();
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadState = useSaveStatus();

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    uploadState.run(async () => {
      const uploaded = await uploadIcon(file);
      onChange({ src: uploaded.src, alt: icon?.alt ?? "" });
      refresh();
    });
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-caption font-medium text-ink">
          {label} <span className="ml-1 text-text-tertiary">(optional)</span>
        </p>
        {help ? <span className="text-caption text-text-tertiary">{help}</span> : null}
      </div>

      <div className="flex gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background-alt p-2">
          {icon?.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={icon.src} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-caption text-text-tertiary">None</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setPickerOpen((v) => !v)} className={adminButtonSmall}>
              {pickerOpen ? "Close picker" : "Choose existing"}
            </button>

            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={UPLOAD_ACCEPT}
              onChange={handleChange}
              disabled={uploadState.isBusy}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploadState.isBusy}
              onClick={() => inputRef.current?.click()}
              className={adminButtonSmall}
            >
              {uploadState.isBusy ? <Spinner /> : null}
              {uploadState.isBusy ? "Uploading…" : "Upload SVG/PNG/WEBP"}
            </button>

            {icon?.src ? (
              <button type="button" onClick={() => onChange(undefined)} className={adminButtonSmallDanger}>
                Clear
              </button>
            ) : null}
          </div>
          <SaveStatusMessage
            status={uploadState.status}
            error={uploadState.error}
            savingLabel="Uploading…"
            savedLabel="Uploaded"
          />
          {icon?.src ? (
            <input
              type="text"
              value={icon.alt}
              placeholder="Alt text — e.g. the brand name (required for accessibility)"
              onChange={(e) => onChange({ ...icon, alt: e.target.value })}
              className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-caption text-ink focus:border-accent focus:shadow-focus focus:outline-none"
            />
          ) : null}
        </div>
      </div>

      {pickerOpen ? (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-border bg-background-alt p-2">
          {loading ? (
            <p className="text-caption text-text-tertiary">Loading icons…</p>
          ) : icons.length === 0 ? (
            <p className="text-caption text-text-tertiary">
              No uploaded icons yet — use &ldquo;Upload SVG/PNG/WEBP&rdquo; instead.
            </p>
          ) : (
            <div className="grid grid-cols-6 gap-2 tablet:grid-cols-8">
              {icons.map((ic) => (
                <button
                  key={ic.src}
                  type="button"
                  onClick={() => {
                    onChange({ src: ic.src, alt: icon?.alt ?? "" });
                    setPickerOpen(false);
                  }}
                  className="flex aspect-square items-center justify-center overflow-hidden rounded-sm border border-border bg-surface p-1.5 transition-colors duration-150 ease-out hover:border-accent focus-visible:shadow-focus focus-visible:outline-none"
                  title={ic.src}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ic.src} alt="" className="max-h-full max-w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
