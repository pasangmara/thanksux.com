"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Container } from "@/components/ui";
import { FloatingLabelInput } from "@/components/experimental/FloatingLabelInput";
import { useSaveStatus } from "@/lib/admin/useSaveStatus";
import { createSupabaseBrowserClient } from "@/lib/supabase/browserClient";

type LinkState = "checking" | "valid" | "invalid";

/**
 * [Phase 5 → 5B hardened] Landing page for the link in the password-reset
 * email (forgot-password's `redirectTo`). Supabase's browser client
 * detects the recovery token in the URL fragment automatically and
 * establishes a temporary session scoped to this one action —
 * `updateUser({ password })` is the real, server-side password change.
 *
 * [Phase 5B] Originally this page showed the form unconditionally and only
 * found out a link was invalid/expired when the update itself failed on
 * submit — not a silent failure, but not immediate feedback either. Now
 * checked on mount: an expired/already-used link (Supabase appends
 * `#error=...&error_description=...`) or the absence of any recovery
 * session at all is reported right away, before the visitor fills in a
 * password just to hit a wall.
 *
 * [react-hooks/set-state-in-effect] The hash's error signal is read
 * synchronously via useSyncExternalStore + derived during render (same
 * convention as login/page.tsx and Animated.tsx) — no setState for that
 * part. The session-validity check genuinely is async (a real network
 * round-trip to Supabase), so setState there stays inside the effect but
 * inside the `.then()` callback specifically, which is the documented,
 * allowed shape of this rule ("calling setState in a callback function
 * when external state changes"), not the synchronous-in-effect-body
 * pattern the rule actually flags.
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

function hashErrorMessage(hash: string): string | undefined {
  if (!hash) return undefined;
  const params = new URLSearchParams(hash.slice(1));
  const error = params.get("error_description") || params.get("error");
  return error ? decodeURIComponent(error).replace(/\+/g, " ") : undefined;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const hash = useSyncExternalStore(subscribeHash, getHashSnapshot, getHashServerSnapshot);
  const hashError = hashErrorMessage(hash);

  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const saveState = useSaveStatus();

  useEffect(() => {
    if (hashError) return; // Already known-invalid — no need to ask Supabase.
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setSessionChecked(true);
    });
  }, [hashError]);

  const linkState: LinkState = hashError ? "invalid" : !sessionChecked ? "checking" : hasSession ? "valid" : "invalid";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords don't match.");
    setError(undefined);

    saveState.run(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      router.push("/profile");
    });
  }

  return (
    <section className="py-16 tablet:py-24">
      <Container variant="narrow">
        <h1 className="text-h1">Choose a new password</h1>

        {linkState === "checking" ? <p className="mt-8 text-body text-text-secondary">Checking your link…</p> : null}

        {linkState === "invalid" ? (
          <div className="mt-8 max-w-sm rounded-md border border-error bg-error/5 p-4">
            <p className="text-body text-error">{hashError || "This password reset link is invalid or has expired."}</p>
            <p className="text-caption mt-3">
              <Link href="/forgot-password" className="text-ink underline hover:text-accent">
                Request a new reset link
              </Link>
            </p>
          </div>
        ) : null}

        {linkState === "valid" ? (
          <form onSubmit={handleSubmit} noValidate className="mt-8 flex max-w-sm flex-col gap-6">
            <FloatingLabelInput id="password" label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
            <FloatingLabelInput id="confirmPassword" label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={error} autoComplete="new-password" required />
            {saveState.status === "error" && saveState.error ? (
              <p role="alert" className="text-caption text-error">
                {saveState.error}
              </p>
            ) : null}
            <Button type="submit" variant="primary" disabled={saveState.isBusy} className="w-full">
              {saveState.isBusy ? "Saving…" : "Set new password"}
            </Button>
          </form>
        ) : null}
      </Container>
    </section>
  );
}
