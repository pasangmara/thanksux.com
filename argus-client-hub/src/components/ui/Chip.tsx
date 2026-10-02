"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "./cn";

export function Chip({
  selected,
  onClick,
  children,
  role = "checkbox",
  className,
  size = "md",
}: {
  selected: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  role?: "checkbox" | "radio" | "button";
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <motion.button
      type="button"
      role={role === "button" ? undefined : role}
      aria-checked={role === "button" ? undefined : selected}
      aria-pressed={role === "button" ? selected : undefined}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      layout
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition-colors duration-150",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
        selected
          ? "border-mint bg-mint-soft text-mint"
          : "border-line-strong text-text-2 hover:border-muted hover:text-text",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="inline-flex overflow-hidden"
          >
            <Check className="size-3.5" strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
      {children}
    </motion.button>
  );
}
