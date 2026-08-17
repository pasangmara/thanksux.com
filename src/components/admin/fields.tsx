"use client";

import { type ReactNode, useState } from "react";
import type { SaveStatus } from "@/lib/admin/useSaveStatus";

/**
 * Admin form primitives — Phase 2 prototype. Deliberately separate from
 * src/components/ui (the public design system's Button/Container/Chip) —
 * this is an internal tool, not a public-facing surface, so it borrows
 * existing design tokens (colors, radius, spacing) for visual consistency
 * without being bound by the public component API surface.
 */

export function Label({
  htmlFor,
  label,
  required,
  help,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  help?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-caption font-medium text-ink">
        {label}
        {required ? <span className="ml-1 text-error">*</span> : <span className="ml-1 text-text-tertiary">(optional)</span>}
      </label>
      {help ? <span className="text-caption text-text-tertiary">{help}</span> : null}
    </div>
  );
}

/**
 * [CMS Phase D3] Every state token below already existed in the design
 * system (border/accent/error/ink colors, radius scale, 150ms ease-out
 * transitions, `shadow-focus`) — this pass only makes sure every
 * interactive admin element actually uses the states it already has
 * tokens for (hover/active/focus-visible/disabled), not just default+hover.
 */
export const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-body text-ink transition-colors duration-150 ease-out " +
  "hover:border-text-tertiary focus:border-accent focus:shadow-focus focus:outline-none " +
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-background-alt disabled:text-text-tertiary disabled:hover:border-border";

/** Applied to `inputClass` (or its own border) when a field has a validation error — pairs with an inline message rendered by the field itself. */
export const inputErrorClass = "border-error focus:border-error";

// [Mature Button Design System §24] `active:translate-y-[1px]` (a 1px
// physical press), not a scale — matches the public button system's press
// behavior exactly, "no decorative animation" either way. Semantic colors
// (bg-ink primary, border-error danger) are untouched — only the shared
// interaction/transition mechanics moved.
const buttonState =
  "transition-[color,background-color,border-color,transform] duration-150 ease-out active:translate-y-[1px] " +
  "focus-visible:shadow-focus focus-visible:outline-none " +
  "disabled:pointer-events-none disabled:opacity-40";

/** Filled dark button — primary admin action (Save). */
export const adminButtonPrimary = `inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-body text-white hover:bg-ink-hover ${buttonState}`;
/** Bordered neutral button — secondary admin action (Cancel, Discard, Preview, Choose image). */
export const adminButtonSecondary = `inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-body text-ink hover:border-ink ${buttonState}`;
/** Bordered destructive button — Delete/Remove. */
export const adminButtonDanger = `inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-body text-error hover:border-error ${buttonState}`;
/** Small bordered button — repeatable-list add/remove, gallery item controls. */
export const adminButtonSmall = `inline-flex items-center justify-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-caption text-ink hover:border-ink ${buttonState}`;
/** Small bordered destructive button — remove-row controls. */
export const adminButtonSmallDanger = `inline-flex items-center justify-center gap-1.5 rounded-sm border border-border px-2 py-1 text-caption text-error hover:border-error ${buttonState}`;

/**
 * [Admin UI/interaction fix] Fixed 32×32px icon-only action button — Move
 * up/down, Remove, and any other icon-only admin control. Every ad-hoc
 * reorder-cluster button before this (SocialLinksEditor, HeroVisualsEditor,
 * HomepageCardsEditor, GalleryManager, the Custom Sections editor) sized
 * itself off its own text/icon content via `adminButtonSmall`, so when one
 * of those clusters landed inside a narrow flex/grid sibling (SocialLinksEditor's
 * 1-of-5 grid column next to a flex-1 <select>, specifically), the buttons
 * had no fixed footprint to reason about and visibly overflowed their card.
 * `h-8 w-8 shrink-0` gives every icon button the same real, predictable
 * size regardless of where it's placed, so a parent's `flex-wrap`/`gap`
 * always has an exact box to lay out — never text-content-dependent width.
 */
const iconButtonBase =
  `inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-border ${buttonState}`;
export const adminIconButton = `${iconButtonBase} text-ink hover:border-ink hover:bg-background-alt`;
export const adminIconButtonDanger = `${iconButtonBase} text-error hover:border-error hover:bg-error/5`;

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

/**
 * [Admin UI/interaction fix] The one shared "reorder a repeatable list
 * item" control — Move up / Move down / Remove, fixed-size icon buttons,
 * always in its own `flex-wrap` row so it can never be forced to overflow
 * by a narrow parent. Used by every repeatable-list editor in the admin
 * (Social Links, Hero Visuals, Homepage Cards, Gallery items, Custom
 * Sections) instead of each reimplementing the same three buttons.
 */
export function ReorderControls({
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown,
  removeLabel = "Remove",
  className = "",
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  /** Omit for lists with no delete concept (e.g. a fixed field set that's only reordered/toggled, never removed) — the Remove button simply doesn't render. */
  onRemove?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  removeLabel?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <button type="button" aria-label="Move up" title="Move up" disabled={!canMoveUp} onClick={onMoveUp} className={adminIconButton}>
        <ArrowUpIcon />
      </button>
      <button type="button" aria-label="Move down" title="Move down" disabled={!canMoveDown} onClick={onMoveDown} className={adminIconButton}>
        <ArrowDownIcon />
      </button>
      {onRemove ? (
        <button type="button" aria-label={removeLabel} title={removeLabel} onClick={onRemove} className={adminIconButtonDanger}>
          <TrashIcon />
        </button>
      ) : null}
    </div>
  );
}

/** Small inline loading spinner — respects prefers-reduced-motion (slows rather than removing, since a stopped spinner would misrepresent "still working" as "done/stuck") — see src/styles/motion.css. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`spinner h-4 w-4 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * [CMS Phase D3] Inline status text paired with `useSaveStatus()` — shown
 * next to (not inside) the action button it describes, so the button
 * itself can stay a fixed size while this appears/disappears. `role="status"`
 * + `aria-live="polite"` means a screen reader announces the outcome
 * without the user needing to have focus on this exact element.
 */
export function SaveStatusMessage({
  status,
  error,
  savingLabel = "Saving…",
  savedLabel = "Saved",
}: {
  status: SaveStatus;
  error: string | null;
  savingLabel?: string;
  savedLabel?: string;
}) {
  if (status === "idle") return null;
  return (
    <p role="status" aria-live="polite" className="text-caption flex items-center gap-1.5">
      {status === "saving" ? (
        <>
          <Spinner className="text-text-secondary" />
          <span className="text-text-secondary">{savingLabel}</span>
        </>
      ) : status === "saved" ? (
        <span className="text-ink">✓ {savedLabel}</span>
      ) : (
        <span className="text-error">{error ?? "Something went wrong — please try again."}</span>
      )}
    </p>
  );
}

/** Rendered under a field when `error` is set — same visual language as the validation summary block already used on the project editor. */
function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="mt-1 text-caption text-error">
      {error}
    </p>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  required,
  help,
  placeholder,
  type = "text",
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  help?: string;
  placeholder?: string;
  type?: "text" | "url" | "email" | "date";
  /** [CMS Phase D3] Inline validation message — renders a red border + message below the field. Absent/undefined means valid (or not yet validated). */
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} label={label} required={required} help={help} />
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${error ? inputErrorClass : ""}`}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  required,
  help,
  error,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
  help?: string;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} label={label} required={required} help={help} />
      <input
        id={id}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} ${error ? inputErrorClass : ""}`}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  required,
  help,
  rows = 4,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  help?: string;
  rows?: number;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={id} label={label} required={required} help={help} />
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${inputClass} resize-y ${error ? inputErrorClass : ""}`}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

/**
 * [CMS Phase D1] "Rich text" for the CATEGORY_CONFIG `richtext` field type
 * — deliberately still a plain string under the hood, same as
 * `TextAreaField`. No editor library was added (per instruction: don't
 * install a large dependency for this), and just as importantly, no
 * markdown/HTML syntax is inserted either — nothing on the public site
 * (`CaseStudySection.tsx`) parses formatting syntax today, so writing
 * `**bold**` into a field would render those literal asterisks on the
 * live page, which is worse than plain text. What this actually adds over
 * `TextAreaField`: a bigger, longer-form editing area and a live
 * word/paragraph count, so long-form case-study writing has a little more
 * structure-awareness without changing the stored format or risking
 * broken public output.
 */
export function RichTextField({
  id,
  label,
  value,
  onChange,
  required,
  help,
  rows = 8,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  help?: string;
  rows?: number;
}) {
  const trimmed = value.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0;

  return (
    <div>
      <Label htmlFor={id} label={label} required={required} help={help} />
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder="Separate paragraphs with a blank line."
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} resize-y leading-relaxed`}
      />
      <p className="mt-1 text-caption text-text-tertiary">
        {words} word{words === 1 ? "" : "s"} · {paragraphs} paragraph{paragraphs === 1 ? "" : "s"}
      </p>
    </div>
  );
}

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RGB_COLOR_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/;

export function isValidColorValue(value: string): boolean {
  return value === "" || HEX_COLOR_RE.test(value) || RGB_COLOR_RE.test(value);
}

/**
 * [CMS Phase D1] For the CATEGORY_CONFIG `color` field type — unused by
 * any current field (see docs/CMS_CONTENT_MODEL.md §14: today's color
 * choices are captured as prose in `colorSystem`, e.g. Gridmark's
 * "Primary — Blue. Secondary — Ash.", which this component intentionally
 * doesn't touch). Built for forward-compatibility so a future structured
 * color-token field has a real input rather than a silent no-op: a native
 * `<input type="color">` swatch (only meaningfully wired up for valid hex
 * values — the color input element itself can't represent rgb()/alpha)
 * paired with a validated text field accepting hex or rgb()/rgba().
 */
export function ColorField({
  id,
  label,
  value,
  onChange,
  required,
  help,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  help?: string;
}) {
  const valid = isValidColorValue(value);
  const swatchValue = HEX_COLOR_RE.test(value) ? value : "#000000";

  return (
    <div>
      <Label htmlFor={id} label={label} required={required} help={help ?? "Hex (#3366ff) or rgb()/rgba()"} />
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} swatch`}
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-surface p-0.5"
        />
        <input
          id={id}
          type="text"
          value={value}
          placeholder="#3366ff or rgb(51, 102, 255)"
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} ${valid ? "" : "border-error"}`}
        />
      </div>
      {!valid ? <p className="mt-1 text-caption text-error">Enter a hex color (#3366ff) or rgb()/rgba() value.</p> : null}
    </div>
  );
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  required,
  help,
  getOptionLabel,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  required?: boolean;
  help?: string;
  /** Renders a human-readable label per option, distinct from its stored value — e.g. the category select shows "UI/UX Design" for the internal value "UI/UX". Defaults to the raw value. */
  getOptionLabel?: (opt: T) => string;
}) {
  return (
    <div>
      <Label htmlFor={id} label={label} required={required} help={help} />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={inputClass}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {getOptionLabel ? getOptionLabel(opt) : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleField({
  id,
  label,
  checked,
  onChange,
  help,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  help?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface px-3 py-2.5">
      <div>
        <p className="text-body text-ink">{label}</p>
        {help ? <p className="text-caption mt-0.5 text-text-tertiary">{help}</p> : null}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150 ease-out active:scale-[0.98] focus-visible:shadow-focus focus-visible:outline-none ${
          checked ? "border-ink bg-ink" : "border-border bg-background-alt"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-surface transition-transform duration-150 ease-out ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function TagListField({
  id,
  label,
  values,
  onChange,
  required,
  help,
  placeholder = "Type a value and press Enter",
}: {
  id: string;
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  required?: boolean;
  help?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  }

  return (
    <div>
      <Label htmlFor={id} label={label} required={required} help={help} />
      <div className="flex flex-wrap gap-2 rounded-md border border-border bg-surface p-2">
        {values.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="flex items-center gap-1.5 rounded-sm border border-border bg-background-alt px-2 py-1 text-caption text-ink"
          >
            {v}
            <button
              type="button"
              aria-label={`Remove ${v}`}
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="text-text-tertiary hover:text-accent"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          placeholder={values.length === 0 ? placeholder : ""}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={commit}
          className="min-w-[140px] flex-1 bg-transparent px-1 py-1 text-body text-ink focus:outline-none"
        />
      </div>
    </div>
  );
}

export function MultiCheckField({
  label,
  options,
  values,
  onChange,
  help,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
  help?: string;
}) {
  return (
    <div>
      <Label htmlFor={label} label={label} help={help} />
      <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
        {options.map((opt) => {
          const checked = values.includes(opt);
          return (
            <label key={opt} className="flex items-center gap-2 text-body text-ink">
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(checked ? values.filter((v) => v !== opt) : [...values, opt])
                }
              />
              {opt}
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 tablet:p-6">
      <p className="text-label text-text-tertiary">{title}</p>
      {description ? <p className="text-caption mt-1 text-text-secondary">{description}</p> : null}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2">{children}</div>;
}
