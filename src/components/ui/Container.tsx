import type { ElementType, HTMLAttributes, ReactNode } from "react";

/**
 * Container — docs/DESIGN_SYSTEM.md v2 §4.
 * Wraps the .container-narrow / .container-wide / .container-full classes
 * defined in src/styles/layout.css. No new width values are introduced
 * here — this component only selects between the three documented ones.
 */

type ContainerVariant = "narrow" | "wide" | "full";

type ContainerProps = {
  variant?: ContainerVariant;
  as?: ElementType;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>;

const variantClass: Record<ContainerVariant, string> = {
  narrow: "container-narrow",
  wide: "container-wide",
  full: "container-full",
};

export function Container({
  variant = "wide",
  as: Tag = "div",
  children,
  className = "",
  ...props
}: ContainerProps) {
  return (
    <Tag className={`${variantClass[variant]} ${className}`.trim()} {...props}>
      {children}
    </Tag>
  );
}
