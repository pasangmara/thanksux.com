import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

/**
 * Button — [Mature Button Design System] rewritten from the earlier
 * "premium glossy" pass on explicit instruction: the previous recipe
 * (gradient fill, glow shadow, `-translate-y-2px` hover lift, 0.98 active
 * scale) read as decorative/toy-like rather than a real product control.
 * This pass is deliberately restrained — flat accent fill, a small shadow
 * that only strengthens slightly on hover, a 1px physical press on
 * active, nothing that moves on hover except the icon. See
 * src/styles/buttons.css for the actual recipe and src/styles/tokens.css
 * for why the primary fill went back to `--color-accent` (not
 * `--color-ink`) this time — a single, deliberate color decision, not a
 * regression of the earlier "orange used too often" reasoning: that
 * concern was about hover *color flashing orange unpredictably*, which a
 * flat, always-accent primary button doesn't do (it's accent at rest too,
 * so there's no flash — same color throughout, only luminance shifts).
 *
 * Three variants only (Primary / Secondary / Text link) — unchanged from
 * the earlier v2 audit's resolved decision that no component needs more.
 */

type ButtonVariant = "primary" | "secondary" | "text-link";

type BaseProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

// Sizing: height 48px (h-6 at the 8px spacing base) — already within the
// spec's 44–48px desktop range. Horizontal padding 18px (mid-range of the
// spec's 16–22px). radius-button (12px, tokens.css) — a real "UI control"
// radius, distinct from the 16px content-card radius. Label: text-body,
// weight 500. All actual color/shadow/press behavior lives in the
// `.btn-solid-*` classes (src/styles/buttons.css) — this file only sets
// shape/spacing/typography, identical between variants.
const base =
  "inline-flex h-6 items-center justify-center gap-2 rounded-button px-[18px] text-body font-medium " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none " +
  "focus-visible:shadow-focus focus-visible:outline-none";

const variants: Record<ButtonVariant, string> = {
  primary: "btn-solid-primary border",
  secondary: "btn-solid-secondary border text-ink hover:text-accent",
  "text-link":
    "border-none bg-transparent text-ink underline underline-offset-4 transition-colors duration-150 ease-out hover:text-accent",
};

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${className}`.trim();

  if ("href" in props && props.href !== undefined) {
    const { href, ...rest } = props as ButtonAsLink;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
