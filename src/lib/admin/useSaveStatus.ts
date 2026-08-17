"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * [CMS Phase D3] Shared async action state machine for every Save/Delete/
 * Discard action in the admin. Before this phase, every admin page called
 * `saveProject(project)`/`saveAbout(about)`/etc. and immediately assumed
 * success (`setSavedAt(Date.now())` right after, with no `await` failure
 * path) — a rejected fetch (e.g. the API route erroring) was silently
 * swallowed, and the UI would still claim "Saved." This hook makes that
 * failure mode structurally impossible: every caller goes through `run()`,
 * which only reaches the "saved" state if the action actually resolved.
 */

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useSaveStatus() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const run = useCallback(async (action: () => Promise<void>, successDurationMs = 2500) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus("saving");
    setError(null);
    try {
      await action();
      setStatus("saved");
      timeoutRef.current = setTimeout(() => {
        setStatus((s) => (s === "saved" ? "idle" : s));
      }, successDurationMs);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    }
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, run, reset, isBusy: status === "saving" };
}
