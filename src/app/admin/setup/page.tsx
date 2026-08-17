"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  adminButtonPrimary,
  SaveStatusMessage,
  Spinner,
  TextField,
} from "@/components/admin/fields";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";

/**
 * /admin/setup — creates the first, real admin account. No invented
 * credential anywhere: this form is the only way an admin account is
 * ever created with a seeded/default password, and it requires a real
 * person to type a real email/name/password. Permanently unavailable
 * once any account exists (`GET /api/auth/setup`) — this page reflects
 * that by showing "already configured" instead of the form, rather than
 * silently failing on submit.
 */
export default function AdminSetupPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const saveState = useSaveStatus();

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then((data: { available: boolean }) => setAvailable(data.available))
      .catch(() => setAvailable(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveState.run(async () => {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Setup failed.");
      router.push("/admin");
      router.refresh();
    });
  }

  if (available === null) return <p className="text-body text-text-secondary">Loading…</p>;

  if (!available) {
    return (
      <div className="mx-auto flex max-w-[420px] flex-col gap-4 py-12">
        <h1 className="text-h1">Setup already completed</h1>
        <p className="text-body text-text-secondary">
          An admin account already exists. Go to{" "}
          <a href="/admin/login" className="text-accent underline">
            /admin/login
          </a>{" "}
          to sign in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[420px] flex-col gap-6 py-12">
      <div>
        <h1 className="text-h1">Create Admin Account</h1>
        <p className="text-body mt-2 text-text-secondary">
          This is the first account on this site — it will be the admin. This form only works once.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField id="name" label="Name" required value={name} onChange={setName} />
        <TextField id="email" label="Email" type="email" required value={email} onChange={setEmail} />
        <div>
          <label htmlFor="password" className="mb-1.5 block text-caption font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink focus:border-accent focus:shadow-focus focus:outline-none"
          />
          <p className="mt-1 text-caption text-text-tertiary">At least 8 characters.</p>
        </div>

        <SaveStatusMessage status={saveState.status} error={saveState.error} />

        <button type="submit" disabled={saveState.isBusy} className={adminButtonPrimary}>
          {saveState.isBusy ? <Spinner className="text-white" /> : null}
          {saveState.isBusy ? "Creating…" : "Create Admin Account"}
        </button>
      </form>
    </div>
  );
}
