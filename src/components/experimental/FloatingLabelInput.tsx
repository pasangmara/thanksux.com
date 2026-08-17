import type { InputHTMLAttributes } from "react";

/**
 * EXPERIMENTAL — not wired into production. See docs/COMPONENT_NORMALIZATION.md.
 *
 * Normalized from components/4.txt (21st.dev floating-label Input),
 * classified ADAPT in docs/21ST_COMPONENT_AUDIT.md. The only part of the
 * source component worth keeping was the controlled `label`/`value`
 * prop shape — everything else was dropped, not adapted:
 *  - the spring-eased, letter-by-letter stagger animation (§13's
 *    "Explicitly prohibited: bounce/spring easing")
 *  - the label disappearing on focus/fill (violates §9: "Label: text-caption,
 *    always visible above the field" — the label here is a real
 *    `<label htmlFor>`, permanently visible, exactly as the design system
 *    requires)
 *  - the underline-only field and the zinc/dark-mode palette (§9 v3 moved
 *    inputs to a bordered box specifically because "an underline has no
 *    visible corner to round"; this site has no dark mode)
 *
 * Field chrome intentionally matches ContactSection.tsx's existing inline
 * field styling exactly (radius-md border, color-surface, color-border,
 * focus -> color-accent + shadow-focus, 48px height) — normalizing this
 * component did not invent a new visual treatment, it reproduced the one
 * already in production.
 *
 * The one motion kept is a 150ms color transition (border on focus, and the
 * label going from color-text-secondary to color-ink while any descendant
 * of the wrapper has focus, via `group-focus-within`) — both are on the
 * approved motion vocabulary (DESIGN_SYSTEM.md §13: "Form field focus:
 * Border-color transition, 150ms, ease-out"; the label recolor is the same
 * technique applied to text) and both fall back to an instant, transition-
 * less change under `prefers-reduced-motion: reduce` via `motion-reduce:`.
 */
export type FloatingLabelInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className"
> & {
  id: string;
  label: string;
  /** Shown below the field in `color-error`; also drives the error border and `aria-invalid`. */
  error?: string;
  /** Shown below the field when there's no error — quiet helper text. */
  hint?: string;
};

export function FloatingLabelInput({
  id,
  label,
  error,
  hint,
  type = "text",
  disabled,
  required,
  ...props
}: FloatingLabelInputProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="group flex flex-col gap-1">
      <label
        htmlFor={id}
        className={`text-caption transition-colors duration-150 ease-out motion-reduce:transition-none ${
          disabled ? "text-text-tertiary" : "text-text-secondary group-focus-within:text-ink"
        }`}
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="text-accent">
            {" "}
            *
          </span>
        ) : null}
      </label>

      <input
        id={id}
        type={type}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-6 w-full rounded-md border bg-surface px-3 text-body outline-none transition-colors duration-150 ease-out motion-reduce:transition-none focus:shadow-focus disabled:cursor-not-allowed disabled:border-border disabled:bg-background-alt disabled:text-text-tertiary ${
          error ? "border-error focus:border-error" : "border-border focus:border-accent"
        }`}
        {...props}
      />

      {error ? (
        <p id={`${id}-error`} className="text-caption text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
