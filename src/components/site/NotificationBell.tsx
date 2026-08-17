"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BellIcon } from "@/components/icons";
import type { AppNotification } from "@/types/notification";

/**
 * ["I can solve this" real notification flow — Part G/H] The one, single
 * in-app notification surface — a small bell in the header, a real
 * database-backed unread count (never a fake timer/localStorage value).
 * Only mounted for a signed-in visitor (see SiteNav.tsx's `isSignedIn`
 * gate) — an anonymous visitor has no notifications to see and no session
 * to fetch them with.
 */
function referenceHref(n: AppNotification): string {
  if (n.referenceType === "thanks_signal" && n.referenceId) return `/share/${n.referenceId}`;
  return "/dashboard";
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/community/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { notifications?: AppNotification[]; unreadCount?: number } | null) => {
        if (cancelled || !data) return;
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {
        // Non-fatal — the bell just shows no items rather than blocking the header.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function handleOpenNotification(n: AppNotification) {
    setOpen(false);
    if (!n.readAt) {
      setNotifications((prev) => prev.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it)));
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch(`/api/community/notifications/${n.id}/read`, { method: "POST" }).catch(() => {
        // Best-effort — a failed mark-read leaves the notification showing
        // unread server-side; the next real open reconciles it.
      });
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-6 w-6 items-center justify-center text-ink transition-colors duration-150 ease-out hover:text-accent"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-medium leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="glass-surface absolute right-0 top-full z-50 mt-2 w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-md">
          <p className="border-b border-border px-3 py-2 text-caption font-medium text-ink">Notifications</p>
          {notifications.length === 0 ? (
            <p className="px-3 py-4 text-caption text-text-secondary">Nothing yet.</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-border last:border-b-0">
                  <Link
                    href={referenceHref(n)}
                    onClick={() => handleOpenNotification(n)}
                    className={`block px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-background-alt ${!n.readAt ? "bg-accent/5" : ""}`}
                  >
                    <span className="flex items-start gap-2">
                      {!n.readAt ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" /> : <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />}
                      <span className="min-w-0 flex-1">
                        <span className="block text-caption font-medium text-ink">{n.title}</span>
                        {n.message ? <span className="mt-0.5 block truncate text-caption text-text-secondary">{n.message}</span> : null}
                        <span className="mt-0.5 block text-caption text-text-tertiary">{relativeTime(n.createdAt)}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
