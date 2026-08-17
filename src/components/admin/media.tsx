"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { adminButtonSmall, adminButtonSmallDanger, ReorderControls, SaveStatusMessage, Spinner } from "./fields";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import type { AdminMedia, AdminMediaSection } from "@/lib/admin/types";
import type { GalleryLayout, MediaAspect, MediaCategory, MediaFit } from "@/types/project";

/**
 * Admin media picker + gallery manager — Phase 2 prototype.
 *
 * Image selection is restricted to files that actually exist under
 * public/images/ (fetched from /api/admin/images, a read-only fs listing)
 * — the admin can never "invent" an image path. If a project has no
 * uploaded files yet, the only option is the honest placeholder state,
 * matching how the public site already handles missing imagery.
 *
 * [CMS Phase E] "Choose existing image" alone had no way to get a *new*
 * file onto disk from the browser — real upload support (`useImageUpload`
 * below, POST /api/admin/images) is additive alongside it, not a
 * replacement. A successful upload both (a) applies the result
 * immediately via the field's own `onChange`, so it's usable without any
 * picker interaction or page reload, and (b) shows up in "Choose existing
 * image" the next time that picker opens, via `refresh()`.
 */

const UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const UPLOAD_TYPE_ERROR = "Unsupported file type — upload a JPG, PNG, or WEBP image.";

async function uploadImage(file: File, projectSlug?: string): Promise<{ src: string; project: string }> {
  if (!file.type.startsWith("image/") || !UPLOAD_ACCEPT.includes(file.type)) {
    throw new Error(UPLOAD_TYPE_ERROR);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB) — the limit is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB.`,
    );
  }

  const body = new FormData();
  body.set("file", file);
  if (projectSlug) body.set("projectSlug", projectSlug);

  const res = await fetch("/api/admin/images", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Upload failed — please try again.");
  }
  return data.image as { src: string; project: string };
}

const MEDIA_CATEGORIES: MediaCategory[] = [
  "brand-mark",
  "ui-screen",
  "website",
  "poster",
  "editorial",
  "campaign",
  "social",
  "packaging",
  "typography",
];

const LAYOUTS: GalleryLayout[] = ["full", "half", "third"];
const ASPECTS: MediaAspect[] = ["landscape", "portrait", "square"];
const FITS: MediaFit[] = ["cover", "contain"];

/** Module-level, outside any component/hook body — a fresh key for a newly added gallery row. Not read during render, only used as a React `key`. */
let keyCounter = 0;
function genKey(): string {
  keyCounter += 1;
  return `item-${keyCounter}`;
}

const SECTION_LABELS: Record<AdminMediaSection, string> = {
  cover: "Cover",
  thumbnail: "Thumbnail",
  gallery: "Gallery (general)",
  wireframes: "Wireframes",
  finalDesign: "Final Design / UI",
  moodboard: "Moodboard",
  logo: "Logo",
  applications: "Applications",
  exploration: "Exploration",
  brandGuidelines: "Brand Guidelines",
};

function useImageLibrary(projectSlug?: string) {
  const [images, setImages] = useState<{ src: string; project: string }[]>([]);
  const [loading, setLoading] = useState(true);
  // Bumped after a successful upload to re-run the fetch below — see
  // `refresh()`. A plain counter rather than re-fetching directly from the
  // caller keeps the effect (and its cancellation handling) as the single
  // place that actually calls `fetch`.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/images")
      .then((r) => r.json())
      .then((data: { images: { src: string; project: string }[] }) => {
        if (!cancelled) setImages(data.images ?? []);
      })
      .catch(() => {
        if (!cancelled) setImages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const scoped = projectSlug ? images.filter((i) => i.project === projectSlug) : images;
  const refresh = () => setReloadToken((t) => t + 1);
  return { images, scoped, loading, refresh };
}

/**
 * [Media Library] Shows a thumbnail plus its real pixel dimensions, read
 * client-side from the loaded `<img>`'s `naturalWidth`/`naturalHeight` —
 * no new server endpoint or dependency (e.g. `sharp`) needed just to
 * answer "how big is this file," which `docs/IMAGE_PIPELINE_AUDIT.md`
 * flagged as a real gap (it's exactly what would have caught Gridmark's
 * undersized source photos immediately, before they shipped).
 */
function DimensionThumb({ src }: { src: string }) {
  const [dims, setDims] = useState<string | null>(null);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        onLoad={(e) => {
          const img = e.currentTarget;
          setDims(`${img.naturalWidth}×${img.naturalHeight}`);
        }}
      />
      {dims ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-ink/70 px-1 text-[10px] leading-4 text-white">
          {dims}
        </span>
      ) : null}
    </>
  );
}

/**
 * [Media Library] Shared existing-image grid — used by both `MediaField`
 * and `GalleryManager`'s pickers, which previously duplicated the same
 * grid markup independently. Adds a filename search (only shown once
 * there's enough images for it to matter) and per-thumbnail dimensions
 * once, rather than adding either feature twice.
 *
 * [Media Library — cross-project reuse] When `allImages` is provided
 * (i.e. this picker is project-scoped in the first place — the
 * unscoped/site-level pickers already show everything), a toggle lets the
 * admin browse every uploaded image, not just this project's own folder,
 * and reuse one from elsewhere. Off by default so the common case (pick
 * from this project) stays exactly as focused as before; each thumbnail
 * shows its source project's slug while browsing broadly, so it's always
 * clear where a reused image is actually coming from.
 */
function ImagePickerGrid({
  loading,
  images,
  allImages,
  emptyLabel,
  onSelect,
}: {
  loading: boolean;
  images: { src: string; project: string }[];
  /** All uploaded images across every project — only passed for a project-scoped picker, enabling the "show all projects" toggle. */
  allImages?: { src: string; project: string }[];
  emptyLabel: string;
  onSelect: (src: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const source = showAll && allImages ? allImages : images;
  const filtered = query.trim()
    ? source.filter((img) => img.src.toLowerCase().includes(query.trim().toLowerCase()))
    : source;

  return (
    <div className="mt-2 rounded-md border border-border bg-background-alt p-2">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {source.length > 3 ? (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by filename…"
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-caption text-ink focus:border-accent focus:outline-none"
          />
        ) : null}
        {allImages ? (
          <label className="flex shrink-0 items-center gap-1.5 text-caption text-text-tertiary">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            Show all projects
          </label>
        ) : null}
      </div>
      <div className="max-h-48 overflow-y-auto">
        {loading ? (
          <p className="text-caption text-text-tertiary">Loading images…</p>
        ) : filtered.length === 0 ? (
          <p className="text-caption text-text-tertiary">
            {source.length === 0 ? emptyLabel : "No images match that search."}
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2 tablet:grid-cols-6">
            {filtered.map((img) => (
              <button
                key={img.src}
                type="button"
                onClick={() => onSelect(img.src)}
                className="relative aspect-square overflow-hidden rounded-sm border border-border transition-colors duration-150 ease-out hover:border-accent focus-visible:shadow-focus focus-visible:outline-none"
                title={img.src}
              >
                <DimensionThumb src={img.src} />
                {showAll ? (
                  <span className="pointer-events-none absolute inset-x-0 top-0 truncate bg-ink/70 px-1 text-[10px] leading-4 text-white">
                    {img.project}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImagePreview({ media, className = "" }: { media: AdminMedia; className?: string }) {
  if (media.kind === "image") {
    // Plain <img>, not next/image — this is an internal admin tool, not
    // public-facing, so image optimization isn't a concern here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.src} alt={media.alt} className={`h-full w-full object-cover ${className}`} />;
  }
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-1 bg-background-alt ${className}`}>
      <span className="text-caption text-text-tertiary">No image yet</span>
      <span className="text-caption text-text-tertiary">({media.category})</span>
    </div>
  );
}

/**
 * [CMS Phase E] Shared upload control — used by both `MediaField` (Cover/
 * Thumbnail/single-image fields) and `GalleryManager` (gallery-section
 * images), so there is exactly one upload code path, not one per surface.
 * Routed through the same `useSaveStatus` state machine every Save/Delete
 * action already uses, so "Uploading…"/error feedback here looks and
 * behaves identically to the rest of the admin, not a bespoke variant.
 */
function UploadButton({
  projectSlug,
  onUploaded,
  label = "Upload new image",
}: {
  projectSlug?: string;
  onUploaded: (image: { src: string; project: string }) => void;
  label?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadState = useSaveStatus();

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset immediately so re-selecting the exact same file (e.g. after a
    // failed upload) still fires a change event next time.
    e.target.value = "";
    if (!file) return;
    uploadState.run(async () => {
      const image = await uploadImage(file, projectSlug);
      onUploaded(image);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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
        {uploadState.isBusy ? "Uploading…" : label}
      </button>
      <SaveStatusMessage
        status={uploadState.status}
        error={uploadState.error}
        savingLabel="Uploading…"
        savedLabel="Uploaded"
      />
    </div>
  );
}

export function MediaField({
  label,
  media,
  onChange,
  projectSlug,
  help,
  required,
}: {
  label: string;
  media: AdminMedia;
  onChange: (m: AdminMedia) => void;
  projectSlug?: string;
  help?: string;
  required?: boolean;
}) {
  const { images, scoped, loading, refresh } = useImageLibrary(projectSlug);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-caption font-medium text-ink">
          {label}
          {required ? <span className="ml-1 text-error">*</span> : <span className="ml-1 text-text-tertiary">(optional)</span>}
        </p>
        {help ? <span className="text-caption text-text-tertiary">{help}</span> : null}
      </div>

      <div className="flex gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md border border-border">
          <ImagePreview media={media} />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setPickerOpen((v) => !v)} className={adminButtonSmall}>
              {pickerOpen ? "Close picker" : "Choose existing image"}
            </button>
            {media.kind === "image" ? (
              <button
                type="button"
                onClick={() => onChange({ kind: "placeholder", category: "brand-mark", alt: media.alt })}
                className={adminButtonSmallDanger}
              >
                Clear
              </button>
            ) : null}
          </div>

          <UploadButton
            projectSlug={projectSlug}
            onUploaded={(image) => {
              onChange({ kind: "image", src: image.src, alt: media.kind === "image" ? media.alt : "" });
              refresh();
            }}
          />

          <input
            type="text"
            value={media.alt}
            placeholder="Alt text — describe what's actually shown (required)"
            onChange={(e) => onChange({ ...media, alt: e.target.value })}
            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-caption text-ink focus:border-accent focus:shadow-focus focus:outline-none"
          />

          {media.kind === "placeholder" ? (
            <select
              value={media.category}
              onChange={(e) => onChange({ ...media, category: e.target.value as MediaCategory })}
              className="w-fit rounded-md border border-border bg-surface px-2 py-1 text-caption text-ink"
            >
              {MEDIA_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  Placeholder category: {c}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={media.fit ?? ""}
              onChange={(e) => onChange({ ...media, fit: (e.target.value || undefined) as MediaFit | undefined })}
              className="w-fit rounded-md border border-border bg-surface px-2 py-1 text-caption text-ink"
            >
              <option value="">Fit: Auto-detect (recommended)</option>
              {FITS.map((f) => (
                <option key={f} value={f}>
                  Fit: {f}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {pickerOpen ? (
        <ImagePickerGrid
          loading={loading}
          images={scoped}
          allImages={projectSlug ? images : undefined}
          emptyLabel={`No existing images found under public/images/projects/${projectSlug ? `${projectSlug}/` : ""} yet — use "Upload new image" instead.`}
          onSelect={(src) => {
            onChange({ kind: "image", src, alt: media.kind === "image" ? media.alt : "" });
            setPickerOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

export interface FlatGalleryItem {
  key: string;
  section: AdminMediaSection;
  media: AdminMedia;
}

const GALLERY_SECTIONS: AdminMediaSection[] = [
  "gallery",
  "wireframes",
  "finalDesign",
  "moodboard",
  "logo",
  "applications",
  "exploration",
  "brandGuidelines",
];

export function GalleryManager({
  items,
  onChange,
  projectSlug,
  sections = GALLERY_SECTIONS,
}: {
  items: FlatGalleryItem[];
  onChange: (items: FlatGalleryItem[]) => void;
  projectSlug?: string;
  /**
   * [CMS Phase C] Which sections appear in the "add to section"/per-item
   * "Section" dropdowns — defaults to every section (unchanged behavior).
   * The dynamic project editor passes the current category's actual
   * gallery-type fields here, so the picker only offers sections relevant
   * to the selected category. `items` itself is never filtered by this —
   * an image already saved under a section outside this list (e.g. left
   * over from a previous category) still renders and stays editable, so
   * switching category can never make existing gallery data disappear.
   */
  sections?: AdminMediaSection[];
}) {
  const { images, scoped, loading, refresh } = useImageLibrary(projectSlug);
  const [addingSectionChoice, setAddingSectionChoice] = useState<AdminMediaSection>(sections[0] ?? "gallery");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Derived, not effect-driven: if `sections` changes (e.g. the admin
  // switches category) and the previously-chosen section is no longer in
  // the scoped list, fall back to the first available one for this render
  // without a setState-in-effect round trip.
  const addingSection = sections.includes(addingSectionChoice) ? addingSectionChoice : sections[0] ?? "gallery";

  function update(key: string, patch: Partial<AdminMedia>) {
    // Spreading a Partial<> over a discriminated union loses the `kind`
    // narrowing at the type level even though every caller here only ever
    // patches shared fields (alt/caption/layout/order), never `kind`.
    onChange(
      items.map((it) => (it.key === key ? { ...it, media: { ...it.media, ...patch } as AdminMedia } : it)),
    );
  }

  function updateSection(key: string, section: AdminMediaSection) {
    onChange(items.map((it) => (it.key === key ? { ...it, section } : it)));
  }

  function remove(key: string) {
    onChange(items.filter((it) => it.key !== key));
  }

  function move(key: string, direction: -1 | 1) {
    const index = items.findIndex((it) => it.key === key);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((it, i) => ({ ...it, media: { ...it.media, order: i } })));
  }

  function add(src: string) {
    const key = genKey();
    onChange([
      ...items,
      {
        key,
        section: addingSection,
        media: { kind: "image", src, alt: "", layout: "half", order: items.length },
      },
    ]);
    setPickerOpen(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-background-alt p-3">
        <select
          value={addingSection}
          onChange={(e) => setAddingSectionChoice(e.target.value as AdminMediaSection)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-caption text-ink"
        >
          {sections.map((s) => (
            <option key={s} value={s}>
              {SECTION_LABELS[s]}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setPickerOpen((v) => !v)} className={adminButtonSmall}>
          {pickerOpen ? "Close picker" : "+ Add image to this section"}
        </button>
        <UploadButton
          projectSlug={projectSlug}
          label="Upload new image"
          onUploaded={(image) => {
            add(image.src);
            refresh();
          }}
        />
        <span className="text-caption text-text-tertiary">{items.length} image{items.length === 1 ? "" : "s"} total</span>
      </div>

      {pickerOpen ? (
        <ImagePickerGrid
          loading={loading}
          images={scoped}
          allImages={projectSlug ? images : undefined}
          emptyLabel={`No existing images found under public/images/projects/${projectSlug ? `${projectSlug}/` : ""} yet — use "Upload new image" instead.`}
          onSelect={add}
        />
      ) : null}

      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-caption text-text-tertiary">No gallery images yet.</p>
        ) : (
          items.map((item, i) => (
            <div key={item.key} className="flex gap-3 rounded-md border border-border bg-surface p-3">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-sm border border-border">
                <ImagePreview media={item.media} />
              </div>

              <div className="grid flex-1 grid-cols-1 gap-2 tablet:grid-cols-2">
                <input
                  type="text"
                  value={item.media.alt}
                  placeholder="Alt text (required)"
                  onChange={(e) => update(item.key, { alt: e.target.value })}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-caption text-ink focus:border-accent focus:outline-none"
                />
                <input
                  type="text"
                  value={item.media.kind === "image" ? (item.media.caption ?? "") : ""}
                  disabled={item.media.kind !== "image"}
                  placeholder="Caption (optional — shown publicly under the image)"
                  onChange={(e) => update(item.key, { caption: e.target.value })}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-caption text-ink focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                  type="text"
                  value={item.media.kind === "image" ? (item.media.description ?? "") : ""}
                  disabled={item.media.kind !== "image"}
                  placeholder="Description (optional, longer-form than caption)"
                  onChange={(e) => update(item.key, { description: e.target.value })}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-caption text-ink focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
                <select
                  value={item.section}
                  onChange={(e) => updateSection(item.key, e.target.value as AdminMediaSection)}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-caption text-ink"
                >
                  {/* Always includes the item's current section even if it falls outside the category-scoped `sections` prop, so reassigning never hides where an item already lives (e.g. a Logo image left over after switching away from Branding). */}
                  {Array.from(new Set([...sections, item.section])).map((s) => (
                    <option key={s} value={s}>
                      Section: {SECTION_LABELS[s]}
                    </option>
                  ))}
                </select>
                <select
                  value={item.media.layout ?? "half"}
                  onChange={(e) => update(item.key, { layout: e.target.value as GalleryLayout })}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-caption text-ink"
                >
                  {LAYOUTS.map((l) => (
                    <option key={l} value={l}>
                      Width: {l}
                    </option>
                  ))}
                </select>
                <select
                  value={item.media.kind === "image" ? (item.media.aspect ?? "") : ""}
                  onChange={(e) =>
                    update(item.key, { aspect: (e.target.value || undefined) as MediaAspect | undefined })
                  }
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-caption text-ink"
                >
                  <option value="">Shape: default for this width</option>
                  {ASPECTS.map((a) => (
                    <option key={a} value={a}>
                      Shape: {a}
                    </option>
                  ))}
                </select>
                <select
                  value={item.media.kind === "image" ? (item.media.fit ?? "") : ""}
                  onChange={(e) => update(item.key, { fit: (e.target.value || undefined) as MediaFit | undefined })}
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-caption text-ink"
                >
                  <option value="">Fit: Auto-detect (recommended)</option>
                  {FITS.map((f) => (
                    <option key={f} value={f}>
                      Fit: {f}
                    </option>
                  ))}
                </select>
              </div>

              <ReorderControls
                className="shrink-0 flex-col"
                canMoveUp={i > 0}
                canMoveDown={i < items.length - 1}
                onMoveUp={() => move(item.key, -1)}
                onMoveDown={() => move(item.key, 1)}
                onRemove={() => remove(item.key)}
                removeLabel="Remove image"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
