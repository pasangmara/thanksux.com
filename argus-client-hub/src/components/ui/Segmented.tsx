"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "./cn";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  disabled,
  ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; activeClass?: string }[];
  disabled?: boolean;
  ariaLabel: string;
}) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex gap-1 rounded-xl border border-line bg-bg-2 p-1", disabled && "opacity-50")}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex-1 rounded-[9px] px-2 py-2 text-[13px] transition-colors disabled:cursor-not-allowed",
              active ? cn("font-semibold", o.activeClass ?? "text-text") : "text-text-2 hover:text-text",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[9px] border border-current/40 bg-current/10"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
