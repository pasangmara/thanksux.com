"use client";

import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { FloatingLabelInput } from "@/components/experimental/FloatingLabelInput";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { authFetchJson } from "@/lib/auth/authFetch";

function PasswordField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <FloatingLabelInput
        id="password"
        label="Password"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        autoComplete="current-password"
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-3 top-[34px] text-caption text-text-tertiary transition-colors duration-150 ease-out hover:text-ink"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

/**
 * [Phase 5B — security review] `from` is attacker-controllable (anyone can
 * link to /login?from=https://evil.example/phish) — without this check, a
 * successful login would redirect the visitor off-site. Only a same-origin
 * relative path is accepted: must start with a single `/`, never `//` or
 * `/\` (both are protocol-relative — the browser treats them as an
 * external host, not a path) and never contain a scheme.
 */
function safeRedirectTarget(raw: string | null): string {
  if (!raw) return "/profile";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/profile";
  if (raw.includes("://")) return "/profile";
  return raw;
}

/**
 * [Phase 5B — auth error states] Handles the two ways a Supabase email
 * link (signup confirmation, or a future magic link) can land here:
 * success (`#access_token=...` in the URL fragment — Supabase never puts
 * this in the query string, so useSearchParams can't see it) or failure
 * (`#error=...&error_description=...`, e.g. an expired/already-used
 * confirmation link). Without this, an expired confirmation link would
 * silently drop the visitor on a blank login form with zero explanation —
 * exactly the "no silent failures" requirement this exists to close.
 *
 * [react-hooks/set-state-in-effect] The URL fragment is read via
 * useSyncExternalStore, same convention as Animated.tsx's viewport/
 * reduced-motion reads (see that file's header comment) — the outcome is
 * then derived from the synced string during render, not set from inside
 * an effect. Deliberately doesn't clear the fragment afterward (no
 * `history.replaceState`): doing so would make the synced value change
 * out from under the derived outcome mid-session, flipping a still-visible
 * banner back to "none" on the next incidental render. The one-time token
 * left briefly visible in the address bar is a minor, accepted tradeoff,
 * not a lasting secret once exchanged for a session cookie.
 */
function subscribeHash(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}
function getHashSnapshot(): string {
  return window.location.hash;
}
function getHashServerSnapshot(): string {
  return "";
}

type EmailLinkOutcome = { kind: "none" } | { kind: "error"; message: string } | { kind: "confirmed" };

function parseEmailLinkOutcome(hash: string): EmailLinkOutcome {
  if (!hash) return { kind: "none" };
  const params = new URLSearchParams(hash.slice(1));
  const error = params.get("error_description") || params.get("error");
  if (error) return { kind: "error", message: decodeURIComponent(error).replace(/\+/g, " ") };
  if (params.has("access_token")) return { kind: "confirmed" };
  return { kind: "none" };
}

function useEmailLinkOutcome(): EmailLinkOutcome {
  const hash = useSyncExternalStore(subscribeHash, getHashSnapshot, getHashServerSnapshot);
  const outcome = parseEmailLinkOutcome(hash);

  useEffect(() => {
    // Side effect only, no setState: instantiating the browser client
    // processes the fragment (detectSessionInUrl, on by default) into a
    // real, cookie-backed session — the actual confirmation. Safe to call
    // more than once (idempotent from Supabase's side).
    if (outcome.kind === "confirmed") createSupabaseBrowserClient();
  }, [outcome.kind]);

  return outcome;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const saveState = useSaveStatus();
  const emailLinkOutcome = useEmailLinkOutcome();

  useEffect(() => {
    if (emailLinkOutcome.kind === "confirmed") {
      const t = setTimeout(() => router.push("/profile"), 1200);
      return () => clearTimeout(t);
    }
  }, [emailLinkOutcome, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    saveState.run(async () => {
      const { ok, data } = await authFetchJson("/api/auth/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!ok) throw new Error(typeof data.error === "string" ? data.error : "Could not sign in.");
      router.push(safeRedirectTarget(searchParams.get("from")));
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {emailLinkOutcome.kind === "error" ? (
        <p role="alert" className="rounded-md border border-error bg-error/5 p-3 text-caption text-error">
          {emailLinkOutcome.message} — request a new link and try again.
        </p>
      ) : null}
      {emailLinkOutcome.kind === "confirmed" ? (
        <p role="status" className="rounded-md border border-border bg-surface p-3 text-caption text-ink">
          ✓ Email confirmed — redirecting to your profile…
        </p>
      ) : null}

      <FloatingLabelInput
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        autoComplete="email"
        required
      />
      <PasswordField value={password} onChange={setPassword} error={fieldErrors.password} />

      {saveState.status === "error" && saveState.error ? (
        <p role="alert" className="text-caption text-error">
          {saveState.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        <Button type="submit" variant="primary" disabled={saveState.isBusy} className="w-full">
          {saveState.isBusy ? "Signing in…" : "Log in"}
        </Button>
        <div className="flex items-center justify-between text-caption">
          <Link href="/forgot-password" className="text-text-secondary underline hover:text-ink">
            Forgot password?
          </Link>
          <Link href="/signup" className="text-text-secondary underline hover:text-ink">
            Create an account
          </Link>
        </div>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <section className="py-16 tablet:py-24">
      <Container variant="narrow">
        <h1 className="text-h1">Log in</h1>
        <p className="text-body mt-2 text-text-secondary">Welcome back to Thanks UX.</p>
        <div className="mt-8 max-w-sm">
          <Suspense fallback={<p className="text-body text-text-secondary">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </Container>
    </section>
  );
}
