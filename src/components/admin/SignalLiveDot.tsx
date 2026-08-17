/**
 * [Signal media attachments Part F/G/J/K] The one, single visual language
 * for "a Signal needs moderator attention" across the admin UI — reused by
 * AdminShell's sidebar nav and the dashboard's "Pending ThanksSignals"
 * card, never a second competing indicator. Deliberately NOT a numeric
 * badge (explicit requirement): always the same small green dot, either
 * softly pulsing (`active`) or static/dim (`!active`) — never a count.
 *
 * "New" here is exactly `SignalModerationCounts.new` (status = 'submitted',
 * visibility = 'private') — the one bucket that means "nobody has looked
 * at this yet," per adminThanksSignalsRepository.ts's own definition.
 * Signals already marked under review, approved, published, or archived
 * never make this active — they've already been handled or intentionally
 * deferred, not merely "not yet public."
 */
export function SignalLiveDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block h-[8px] w-[8px] shrink-0 rounded-full bg-live ${active ? "signal-live-dot-active opacity-100" : "opacity-35"}`}
      role="status"
      aria-label={active ? "New signal awaiting review" : "No new signals"}
      title={active ? "New signal awaiting review" : "No new signals"}
    />
  );
}
