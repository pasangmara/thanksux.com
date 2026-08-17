"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminButtonSmall, adminButtonSmallDanger, ReorderControls, SaveStatusMessage, Spinner } from "@/components/admin/fields";
import { createBannerRecord, deleteBannerRecord, listBanners, runBannerAction, type AdminPromoBanner } from "@/lib/admin/store";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";

function StatusBadge({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={`inline-flex rounded-sm border px-2 py-0.5 text-caption ${
        on ? "border-ink bg-ink text-on-ink" : "border-border text-text-tertiary"
      }`}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

function Thumb({ banner }: { banner: AdminPromoBanner }) {
  if (banner.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={banner.imageUrl} alt={banner.imageAlt ?? ""} className="h-12 w-16 rounded-sm border border-border object-cover" />;
  }
  return (
    <div className="flex h-12 w-16 items-center justify-center rounded-sm border border-border bg-background-alt text-caption text-text-tertiary">
      —
    </div>
  );
}

/**
 * [Promotional Banner / Campaign System §3] `/admin/banners` — mirrors
 * /admin/reviews' list-page shape exactly (table + row actions + create
 * form), with Enable/Disable in place of Reviews' Publish/Feature and the
 * same `ReorderControls` every other reorderable list in this admin uses.
 */
export default function AdminBannersListPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<AdminPromoBanner[] | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const createState = useSaveStatus();
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  function refresh(): Promise<void> {
    return listBanners().then(setBanners);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAction(banner: AdminPromoBanner, action: Parameters<typeof runBannerAction>[1]) {
    if (busyRowId) return;
    setBusyRowId(banner.id);
    setRowError(null);
    try {
      await runBannerAction(banner.id, action);
      await refresh();
    } catch (err) {
      setRowError({ id: banner.id, message: err instanceof Error ? err.message : "Could not update this banner." });
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleDelete(banner: AdminPromoBanner) {
    if (busyRowId) return;
    const warning = `Permanently delete the banner "${banner.title}"? This removes it from the homepage as well as this list. This cannot be undone from the UI.`;
    if (!window.confirm(warning)) return;
    setBusyRowId(banner.id);
    setRowError(null);
    try {
      await deleteBannerRecord(banner.id);
      await refresh();
    } catch (err) {
      setRowError({ id: banner.id, message: err instanceof Error ? err.message : "Could not delete this banner." });
    } finally {
      setBusyRowId(null);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim() || createState.isBusy) return;
    await createState.run(async () => {
      const banner = await createBannerRecord(newTitle.trim());
      setNewTitle("");
      await refresh();
      router.push(`/admin/banners/${banner.id}`);
    });
  }

  if (!banners) return <p className="text-body text-text-secondary">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h1">Banners</h1>
          <p className="text-body mt-2 text-text-secondary">
            {banners.length} banner{banners.length === 1 ? "" : "s"} — persisted server-side in Supabase. Only the
            top-ordered enabled banner (within its schedule window, if set) renders on the homepage.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              disabled={createState.isBusy}
              placeholder="Banner title"
              className="rounded-md border border-border bg-surface px-3 py-2 text-body text-ink focus:border-accent focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              disabled={!newTitle.trim() || createState.isBusy}
              onClick={handleCreate}
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-ink px-4 py-2 text-body text-on-ink transition-[background-color,transform] duration-150 ease-out hover:bg-ink-hover active:translate-y-[1px] disabled:pointer-events-none disabled:opacity-60 focus-visible:shadow-focus focus-visible:outline-none"
            >
              {createState.isBusy ? <Spinner className="text-on-ink" /> : null}
              {createState.isBusy ? "Creating…" : "+ New banner"}
            </button>
          </div>
          <SaveStatusMessage status={createState.status} error={createState.error} savedLabel="Created" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border text-caption text-text-tertiary">
              <th className="p-3">Banner</th>
              <th className="p-3">Variant</th>
              <th className="p-3">CTA</th>
              <th className="p-3">Enabled</th>
              <th className="p-3">Order</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-caption text-text-tertiary">
                  No banners yet — add one above.
                </td>
              </tr>
            ) : (
              banners.map((banner, i) => (
                <tr key={banner.id} className="border-b border-border text-body last:border-b-0 align-top">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Thumb banner={banner} />
                      <div>
                        <p className="text-body text-ink">{banner.title || "(untitled banner)"}</p>
                        <p className="text-caption text-text-tertiary">{banner.eyebrow || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-caption capitalize text-text-secondary">{banner.variant}</td>
                  <td className="p-3 text-caption text-text-secondary">{banner.primaryCtaLabel || "—"}</td>
                  <td className="p-3">
                    <StatusBadge on={banner.enabled} onLabel="Enabled" offLabel="Disabled" />
                  </td>
                  <td className="p-3">
                    <ReorderControls
                      canMoveUp={i > 0}
                      canMoveDown={i < banners.length - 1}
                      onMoveUp={() => handleAction(banner, "moveUp")}
                      onMoveDown={() => handleAction(banner, "moveDown")}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/banners/${banner.id}`} className={adminButtonSmall}>
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyRowId === banner.id}
                        onClick={() => handleAction(banner, banner.enabled ? "disable" : "enable")}
                        className={adminButtonSmall}
                      >
                        {busyRowId === banner.id ? <Spinner /> : null}
                        {banner.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        disabled={busyRowId === banner.id}
                        onClick={() => handleDelete(banner)}
                        className={adminButtonSmallDanger}
                      >
                        {busyRowId === banner.id ? <Spinner className="text-error" /> : null}
                        Delete
                      </button>
                    </div>
                    {rowError?.id === banner.id ? <p className="mt-1 text-caption text-error">{rowError.message}</p> : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
