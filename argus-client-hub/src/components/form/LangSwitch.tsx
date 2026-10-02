"use client";

import { motion } from "motion/react";
import type { Lang } from "@/lib/domain/types";
import { cn } from "@/components/ui/cn";

export function LangSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div role="radiogroup" aria-label="Language / ভাষা" className="flex items-center gap-0.5 rounded-full border-[1.5px] border-line-strong bg-bg/60 p-1 backdrop-blur">
      {(
        [
          ["en", "EN"],
          ["bn", "বাংলা"],
        ] as const
      ).map(([value, label]) => {
        const active = lang === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(value)}
            className={cn(
              "relative rounded-full px-3 py-1.5 text-[13px] transition-colors",
              value === "bn" && "font-bn",
              active ? "font-semibold text-text" : "text-muted hover:text-text-2",
            )}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-full bg-surface-2"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
