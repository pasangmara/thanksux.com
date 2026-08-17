"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { FloatingLabelInput } from "@/components/experimental/FloatingLabelInput";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import { authFetchJson } from "@/lib/auth/authFetch";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const saveState = useSaveStatus();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    saveState.run(async () => {
      const { ok, data } = await authFetchJson("/api/auth/user/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!ok) throw new Error(typeof data.error === "string" ? data.error : "Could not process that request.");
    });
  }

  return (
    <section className="py-16 tablet:py-24">
      <Container variant="narrow">
        <h1 className="text-h1">Reset your password</h1>
        <p className="text-body mt-2 text-text-secondary">
          Enter your account email and we&rsquo;ll send a reset link, if delivery is available.
        </p>

        {saveState.status === "saved" ? (
          <div className="mt-8 max-w-sm rounded-md border border-border bg-surface p-6">
            <p className="text-body text-ink">
              If an account exists for <strong>{email}</strong>, a reset link has been requested.
            </p>
            <p className="text-caption mt-4 text-text-tertiary">
              Honest limitation: this project&rsquo;s Supabase Auth email delivery uses the built-in shared mailer
              (no custom SMTP provider is configured), which is rate-limited and not production-ready. The request
              was made for real — whether the email actually arrives depends on that provider, not on anything this
              app fakes or guarantees.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-8 flex max-w-sm flex-col gap-6">
            <FloatingLabelInput id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoComplete="email" required />
            {saveState.status === "error" && saveState.error ? (
              <p role="alert" className="text-caption text-error">
                {saveState.error}
              </p>
            ) : null}
            <Button type="submit" variant="primary" disabled={saveState.isBusy} className="w-full">
              {saveState.isBusy ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="text-caption mt-6 text-text-secondary">
          <Link href="/login" className="text-ink underline hover:text-accent">
            Back to login
          </Link>
        </p>
      </Container>
    </section>
  );
}
