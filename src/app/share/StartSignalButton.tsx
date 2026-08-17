"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { authFetchJson } from "@/lib/auth/authFetch";

export function StartSignalButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await authFetchJson("/api/community/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", description: "" }),
      });
      if (!ok) throw new Error(typeof data.error === "string" ? data.error : "Could not start a new signal.");
      const signal = data.signal as { id: string };
      router.push(`/share/${signal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="primary" onClick={handleStart} disabled={busy} className="w-fit">
        {busy ? "Starting…" : "Share a problem"}
      </Button>
      {error ? (
        <p role="alert" className="text-caption text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
