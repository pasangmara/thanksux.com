"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/user/logout", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not log out — please try again.");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error — check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleLogout}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-caption text-ink transition-colors duration-150 ease-out hover:border-ink active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:shadow-focus focus-visible:outline-none"
      >
        {busy ? "Logging out…" : "Log out"}
      </button>
      {error ? (
        <p role="alert" className="text-caption text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
