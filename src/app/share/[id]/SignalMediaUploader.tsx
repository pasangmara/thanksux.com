"use client";

import { useRef, useState } from "react";
import { authFetchJson } from "@/lib/auth/authFetch";

export interface SignalMediaItem {
  id: string;
  url: string;
  order: number;
  mimeType: string | null;
  fileSize: number | null;
  filename: string | null;
}

type ItemState = "uploading" | "uploaded" | "failed" | "removing";

interface LocalItem {
  /** React key — the server join-row id once known, a stable temp id while still uploading. */
  key: string;
  id: string | null;
  url: string;
  mimeType: string | null;
  fileSize: number | null;
  filename: string | null;
  state: ItemState;
  error?: string;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_ITEMS = 10; // mirrors MAX_MEDIA_PER_SIGNAL (thanksSignalMediaRepository.ts) — server-enforced either way.

function isImage(mimeType: string | null): boolean {
  return Boolean(mimeType && mimeType.startsWith("image/"));
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * [Signal media attachments Part A] Same Idle/Uploading/Uploaded/Failed/
 * Removing state machine as ContributionMediaUploader.tsx (Phase 6G),
 * extended to also accept PDFs — a PDF renders as a filename/type chip
 * instead of an image preview, everything else (upload, remove, error
 * handling) is identical. "Uploaded" is only ever set once the server has
 * confirmed the write (Storage + media_assets + join row) — a local blob:
 * preview renders during "uploading" but is never mislabeled as saved.
 */
export function SignalMediaUploader({
  signalId,
  initialMedia,
  editable,
}: {
  signalId: string;
  initialMedia: SignalMediaItem[];
  editable: boolean;
}) {
  const [items, setItems] = useState<LocalItem[]>(
    initialMedia.map((m) => ({
      key: m.id,
      id: m.id,
      url: m.url,
      mimeType: m.mimeType,
      fileSize: m.fileSize,
      filename: m.filename,
      state: "uploaded" as const,
    })),
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCount = items.filter((i) => i.state !== "failed").length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setGlobalError(null);

    // Multiple attachments where the schema safely supports it (Part A §1) —
    // thanks_signal_media has no per-file uniqueness constraint, so every
    // selected file is queued, each uploading/failing independently.
    for (const file of Array.from(files)) {
      if (activeCount + items.filter((i) => i.state === "uploading").length >= MAX_ITEMS) {
        setGlobalError(`You can attach up to ${MAX_ITEMS} files.`);
        break;
      }

      const tempKey = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
      setItems((prev) => [
        ...prev,
        { key: tempKey, id: null, url: previewUrl, mimeType: file.type, fileSize: file.size, filename: file.name, state: "uploading" },
      ]);

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await authFetchJson(`/api/community/signals/${signalId}/media`, { method: "POST", body: formData });
        if (!res.ok) throw new Error(typeof res.data.error === "string" ? res.data.error : "Upload failed.");
        const media = res.data.media as SignalMediaItem;
        setItems((prev) =>
          prev.map((it) =>
            it.key === tempKey
              ? { key: media.id, id: media.id, url: media.url, mimeType: media.mimeType, fileSize: media.fileSize, filename: media.filename, state: "uploaded" }
              : it,
          ),
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.key === tempKey ? { ...it, state: "failed", error: err instanceof Error ? err.message : "Upload failed." } : it,
          ),
        );
      }
    }
  }

  async function handleRemove(item: LocalItem) {
    if (!item.id) {
      // A failed/local-only item — nothing was ever persisted, just drop it.
      setItems((prev) => prev.filter((it) => it.key !== item.key));
      return;
    }
    setItems((prev) => prev.map((it) => (it.key === item.key ? { ...it, state: "removing" } : it)));
    try {
      const res = await authFetchJson(`/api/community/signals/${signalId}/media/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(typeof res.data.error === "string" ? res.data.error : "Could not remove attachment.");
      setItems((prev) => prev.filter((it) => it.key !== item.key));
    } catch (err) {
      setItems((prev) =>
        prev.map((it) =>
          it.key === item.key
            ? { ...it, state: "uploaded", error: err instanceof Error ? err.message : "Could not remove attachment." }
            : it,
        ),
      );
    }
  }

  if (!editable && items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-caption text-text-secondary">
        Attachments <span className="text-text-tertiary">(optional — JPG, PNG, WEBP up to 8MB, or PDF up to 15MB)</span>
      </p>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
          {items.map((item, index) => (
            <div key={item.key} className="overflow-hidden rounded-md border border-border bg-background-alt">
              <div className="relative aspect-[4/3] w-full">
                {isImage(item.mimeType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt={item.filename ? `Attached image: ${item.filename}` : `Uploaded image ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-surface px-2 text-center">
                    <span className="text-caption font-medium text-ink">PDF</span>
                    <span className="line-clamp-2 text-caption text-text-tertiary" title={item.filename ?? undefined}>
                      {item.filename || "document.pdf"}
                    </span>
                  </div>
                )}
                {item.state === "uploading" || item.state === "removing" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <span className="text-caption text-ink">{item.state === "uploading" ? "Uploading…" : "Removing…"}</span>
                  </div>
                ) : null}
                {item.state === "failed" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-error/10 px-2 text-center">
                    <span className="text-caption text-error">{item.error || "Failed"}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-1 border-t border-border bg-surface p-1.5">
                <span className="truncate text-caption text-text-tertiary" title={item.filename ?? undefined}>
                  {item.filename || ""}
                  {item.fileSize ? ` · ${formatSize(item.fileSize)}` : ""}
                </span>
                {editable ? (
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    disabled={item.state === "uploading" || item.state === "removing"}
                    className="shrink-0 text-caption text-error underline disabled:text-text-tertiary disabled:no-underline"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {item.error && item.state !== "failed" ? <p className="px-1.5 pb-1.5 text-caption text-error">{item.error}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {editable ? (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={activeCount >= MAX_ITEMS}
            className="inline-flex h-6 items-center justify-center rounded-md border border-ink px-3 text-body font-medium text-ink transition-colors duration-150 ease-out hover:border-accent hover:text-accent disabled:border-text-tertiary disabled:text-text-tertiary"
          >
            Add attachment
          </button>
          {globalError ? <p className="mt-2 text-caption text-error">{globalError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
