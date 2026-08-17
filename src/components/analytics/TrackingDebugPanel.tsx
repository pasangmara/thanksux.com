"use client";

import { useEffect, useState } from "react";
import { subscribeTrackedEvents, type TrackedEventDebugEntry } from "@/lib/analytics/track";

/**
 * [Phase L — Tracking Debug Mode] Dev-only. `process.env.NODE_ENV` is
 * statically replaced by Next's build at compile time — `next build` sets
 * it to `"production"`, so this entire branch (component body, imports
 * aside) is eliminated from the production client bundle by dead-code
 * elimination, not just hidden by a runtime check. Never rendered
 * publicly, per the explicit "not exposed publicly" requirement.
 *
 * Shows the last 20 tracked events (name, params, timestamp) as they fire
 * — `trackEvent()` already calls `console.debug` in dev too, this panel
 * is the same data in a persistent, glanceable form instead of scrolling
 * console history.
 */
export function TrackingDebugPanel() {
  const [events, setEvents] = useState<TrackedEventDebugEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return subscribeTrackedEvents((entry) => {
      setEvents((prev) => [entry, ...prev].slice(0, 20));
    });
  }, []);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    // [Back-to-Top fix] Moved to bottom-left — this dev-only debug toggle
    // used to sit at bottom-3 right-3 z-[70], the exact same corner as the
    // public Back-to-Top button (BackToTopButton.tsx), fully covering it
    // whenever both were mounted (any `next dev` session, since this panel
    // is dead-code-eliminated in production builds — see this file's own
    // header comment). This corner was never a spec'd requirement for an
    // internal debug overlay; the public feature keeps its required corner.
    <div className="fixed bottom-3 left-3 z-[70] font-mono text-[11px]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-border bg-ink px-3 py-1.5 text-on-ink shadow-lg"
      >
        📊 {events.length}
      </button>
      {open ? (
        <div className="mt-2 max-h-80 w-80 overflow-y-auto rounded-md border border-border bg-surface p-2 shadow-xl">
          {events.length === 0 ? (
            <p className="text-text-tertiary">No events tracked yet on this page.</p>
          ) : (
            events.map((e, i) => (
              <div key={i} className="mb-2 border-b border-border pb-2 last:border-b-0 last:pb-0">
                <p className="font-semibold text-ink">{e.name}</p>
                <p className="text-text-tertiary">{e.timestamp}</p>
                {Object.keys(e.params).length > 0 ? (
                  <pre className="mt-1 whitespace-pre-wrap break-all text-text-secondary">
                    {JSON.stringify(e.params, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
