/**
 * Section header — docs/DESIGN_SYSTEM.md v2 §4 structural grid motif +
 * §10 reference index ("Section header: text-label eyebrow + text-h2
 * title"). [Numbering removed] Previously prefixed the eyebrow with a
 * zero-padded position number ("01 — Services") — reverted on explicit
 * instruction: the numbering read as a decorative dashboard-style counter
 * rather than genuine content, and every section here is already
 * identifiable by its title alone. The eyebrow is now just the title in
 * `text-label`'s small-caps treatment, no separate number ever
 * reintroduced.
 *
 * The rule line uses `border-border` (the cool-neutral token), not
 * `border-ink` — visual-refinement brief §08: "avoid excessive hard
 * black/navy lines... maintain structure without feeling rigid." The
 * structure stays (every section still opens with a rule + eyebrow), just
 * quieter.
 */
export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="border-t border-border pt-3">
      <p className="text-label">{title}</p>
      <h2 className="text-h2 mt-2">{title}</h2>
      {description ? (
        <p className="text-body-lg mt-3 max-w-[60ch] text-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
