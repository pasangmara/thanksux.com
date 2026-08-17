"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { FloatingLabelInput } from "@/components/experimental/FloatingLabelInput";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import { authFetchJson } from "@/lib/auth/authFetch";

type Errors = Partial<Record<"name" | "email" | "password" | "confirmPassword", string>>;

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const saveState = useSaveStatus();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Password must be at least 8 characters.";
    if (confirmPassword !== password) next.confirmPassword = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    saveState.run(async () => {
      const { ok, data } = await authFetchJson("/api/auth/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      if (!ok) throw new Error(typeof data.error === "string" ? data.error : "Could not create your account.");
      setNeedsEmailConfirmation(Boolean(data.needsEmailConfirmation));
    });
  }

  if (saveState.status === "saved" && needsEmailConfirmation) {
    return (
      <section className="py-16 tablet:py-24">
        <Container variant="narrow">
          <div className="max-w-sm rounded-md border border-border bg-surface p-6">
            <h1 className="text-h2">Check your email</h1>
            <p className="text-body mt-3 text-text-secondary">
              We&rsquo;ve sent a confirmation link to <strong className="text-ink">{email}</strong>. Follow it to
              activate your account before logging in.
            </p>
            <p className="text-caption mt-4 text-text-tertiary">
              Didn&rsquo;t get it? This project&rsquo;s email delivery isn&rsquo;t fully configured yet — if nothing
              arrives after a few minutes, that&rsquo;s a known limitation, not something wrong on your end.
            </p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="py-16 tablet:py-24">
      <Container variant="narrow">
        <h1 className="text-h1">Create an account</h1>
        <p className="text-body mt-2 text-text-secondary">Join Thanks UX.</p>
        <form onSubmit={handleSubmit} noValidate className="mt-8 flex max-w-sm flex-col gap-6">
          <FloatingLabelInput id="name" label="Name" type="text" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} required />
          <FloatingLabelInput id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} autoComplete="email" required />
          <FloatingLabelInput
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint={!errors.password ? "At least 8 characters" : undefined}
            autoComplete="new-password"
            required
          />
          <FloatingLabelInput
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />

          {saveState.status === "error" && saveState.error ? (
            <p role="alert" className="text-caption text-error">
              {saveState.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3">
            <Button type="submit" variant="primary" disabled={saveState.isBusy} className="w-full">
              {saveState.isBusy ? "Creating account…" : "Sign up"}
            </Button>
            <p className="text-caption text-text-secondary">
              Already have an account?{" "}
              <Link href="/login" className="text-ink underline hover:text-accent">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </Container>
    </section>
  );
}
