"use client";

import { useRef, useState } from "react";
import { authFetchJson } from "@/lib/auth/authFetch";

export interface MediaItem {
  id: string;
  url: string;
  order: number;
}

type ItemState = "uploading" | "uploaded" | "failed" | "removing";

interface LocalItem {
  /** React key — the server join-row id once known, a stable temp id while still uploading. */
  key: string;
  id: string | null;
  url: string;
  state: ItemState;
  error?: string;
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";
const MAX_ITEMS = 10; // mirrors MAX_MEDIA_PER_RESPONSE (designResponseMediaRepository.ts) — server-enforced either way.

/**
 * [Phase 6G Part A §2 — upload UX] Idle/Uploading/Uploaded/Failed/Removing,
 * exactly the five states the brief calls for. "Uploaded" is only ever set
 * after the POST actually succeeds (server-confirmed Storage + media_assets
 * + join-row write) — a local blob: preview renders during "uploading" but
 * is never mislabeled as saved.
 */
export function ContributionMediaUploader({
  contributionId,
  initialMedia,
  editable,
}: {
  contributionId: string;
  initialMedia: MediaItem[];
  editable: boolean;
}) {
  const [items, setItems] = useState<LocalItem[]>(
    initialMedia.map((m) => ({ key: m.id, id: m.id, url: m.url, state: "uploaded" as const })),
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCount = items.filter((i) => i.state !== "failed").length;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setGlobalError(null);

    if (activeCount >= MAX_ITEMS) {
      setGlobalError(`You can attach up to ${MAX_ITEMS} images.`);
      return;
    }

    const tempKey = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const previewUrl = URL.createObjectURL(file);
    setItems((prev) => [...prev, { key: tempKey, id: null, url: previewUrl, state: "uploading" }]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await authFetchJson(`/api/community/contributions/${contributionId}/media`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(typeof res.data.error === "string" ? res.data.error : "Upload failed.");
      const media = res.data.media as MediaItem;
      setItems((prev) =>
        prev.map((it) => (it.key === tempKey ? { key: media.id, id: media.id, url: media.url, state: "uploaded" } : it)),
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((it) =>
          it.key === tempKey ? { ...it, state: "failed", error: err instanceof Error ? err.message : "Upload failed." } : it,
        ),
      );
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
      const res = await authFetchJson(`/api/community/contributions/${contributionId}/media/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(typeof res.data.error === "string" ? res.data.error : "Could not remove image.");
      setItems((prev) => prev.filter((it) => it.key !== item.key));
    } catch (err) {
      setItems((prev) =>
        prev.map((it) =>
          it.key === item.key
            ? { ...it, state: "uploaded", error: err instanceof Error ? err.message : "Could not remove image." }
            : it,
        ),
      );
    }
  }

  function persistOrder(next: LocalItem[]) {
    const order = next.filter((it): it is LocalItem & { id: string } => Boolean(it.id)).map((it) => it.id);
    authFetchJson(`/api/community/contributions/${contributionId}/media`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    }).catch(() => {
      // Best-effort — a failed reorder save leaves the previous saved
      // order in place server-side; the next successful reorder reconciles it.
    });
  }

  function move(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      persistOrder(next);
      return next;
    });
  }

  if (!editable && items.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-caption text-text-secondary">
        Images <span className="text-text-tertiary">(optional — JPG, PNG, or WEBP, up to 8MB each)</span>
      </p>

      {items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 tablet:grid-cols-3">
          {items.map((item, index) => (
            <div key={item.key} className="overflow-hidden rounded-md border border-border bg-background-alt">
              <div className="relative aspect-[4/3] w-full">
                {/* Local blob: previews and Storage URLs both render fine as
                    a plain <img> — next/image's remote-host allowlist
                    doesn't cover blob: URLs, and this is a transient
                    editing surface, not the public gallery (which does use
                    PortfolioMedia/next-image — see /responses/[id]). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={`Uploaded image ${index + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {item.state === "uploading" || item.state === "removing" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                    <span className="text-caption text-ink">{item.state === "uploading" ? "Uploading…" : "Removing…"}</span>
                  </div>
                ) : null}
                {item.state === "failed" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-error/10">
                    <span className="text-caption text-error">Failed</span>
                  </div>
                ) : null}
              </div>

              {editable ? (
                <div className="flex items-center justify-between gap-1 border-t border-border bg-surface p-1.5">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0 || item.state !== "uploaded"}
                      aria-label="Move image earlier"
                      className="flex h-6 w-6 items-center justify-center rounded-sm text-caption text-ink disabled:text-text-tertiary hover:enabled:bg-background-alt"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1 || item.state !== "uploaded"}
                      aria-label="Move image later"
                      className="flex h-6 w-6 items-center justify-center rounded-sm text-caption text-ink disabled:text-text-tertiary hover:enabled:bg-background-alt"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    disabled={item.state === "uploading" || item.state === "removing"}
                    className="text-caption text-error underline disabled:text-text-tertiary disabled:no-underline"
                  >
                    Remove
                  </button>
                </div>
              ) : null}
              {item.error ? <p className="px-1.5 pb-1.5 text-caption text-error">{item.error}</p> : null}
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
            Add image
          </button>
          {globalError ? <p className="mt-2 text-caption text-error">{globalError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
