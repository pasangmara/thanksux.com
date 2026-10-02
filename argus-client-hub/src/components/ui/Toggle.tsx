"use client";

import { motion } from "motion/react";
import { cn } from "./cn";

export function Toggle({
  checked,
  onChange,
  label,
  name,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  name?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full p-[3px] transition-colors duration-200 disabled:opacity-40",
        checked ? "justify-end bg-mint" : "justify-start bg-line-strong",
      )}
    >
      {name && <input type="hidden" name={name} value={checked ? "on" : ""} />}
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 35 }}
        className={cn("size-[18px] rounded-full shadow", checked ? "bg-on-mint" : "bg-text-2")}
      />
    </button>
  );
}
