"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  adminButtonPrimary,
  SaveStatusMessage,
  Spinner,
  TextField,
} from "@/components/admin/fields";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";

/**
 * /admin/login — the one page `proxy.ts` always allows through
 * unauthenticated (see that file). Reuses the exact same form-field/
 * save-status primitives (`TextField`, `useSaveStatus`, `SaveStatusMessage`)
 * every other admin page already uses — no new visual language introduced
 * for auth specifically.
 *
 * Wrapped in `Suspense` because `useSearchParams()` requires it in the App
 * Router (reading the "from" redirect-back param) — a Next.js requirement,
 * not a design choice.
 */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="text-body text-text-secondary">Loading…</p>}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [setupAvailable, setSetupAvailable] = useState(false);
  const saveState = useSaveStatus();

  useEffect(() => {
    fetch("/api/auth/setup")
      .then((r) => r.json())
      .then((data: { available: boolean }) => setSetupAvailable(data.available))
      .catch(() => setSetupAvailable(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveState.run(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Login failed.");
      router.push(searchParams.get("from") || "/admin");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex max-w-[420px] flex-col gap-6 py-12">
      <div>
        <h1 className="text-h1">Admin Login</h1>
        <p className="text-body mt-2 text-text-secondary">Sign in to manage the site.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField id="email" label="Email" type="email" required value={email} onChange={setEmail} />
        <div>
          <label htmlFor="password" className="mb-1.5 block text-caption font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink focus:border-accent focus:shadow-focus focus:outline-none"
          />
        </div>

        <SaveStatusMessage status={saveState.status} error={saveState.error} />

        <button type="submit" disabled={saveState.isBusy} className={adminButtonPrimary}>
          {saveState.isBusy ? <Spinner className="text-white" /> : null}
          {saveState.isBusy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {setupAvailable ? (
        <p className="text-caption text-text-tertiary">
          No admin account exists yet.{" "}
          <Link href="/admin/setup" className="text-accent underline">
            Set up the first admin account
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
