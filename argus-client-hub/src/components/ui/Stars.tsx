"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useRef, useState } from "react";
import { cn } from "./cn";

const STAR_PATH =
  "M12 2.6c.4 0 .7.2.9.6l2.3 4.8 5.2.7c.8.1 1.1 1.1.5 1.7l-3.8 3.7.9 5.2c.1.8-.7 1.4-1.4 1L12 17.8l-4.7 2.5c-.7.4-1.5-.2-1.4-1l.9-5.2L3 10.4c-.6-.6-.3-1.6.5-1.7l5.2-.7L11 3.2c.2-.4.6-.6 1-.6Z";

function Star({ filled, size, glow }: { filled: boolean; size: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="overflow-visible">
      <path
        d={STAR_PATH}
        className={cn(
          "transition-[fill,stroke] duration-200",
          filled ? "fill-mint stroke-mint" : "fill-transparent stroke-line-strong",
        )}
        strokeWidth={1.6}
        strokeLinejoin="round"
        style={glow && filled ? { filter: "drop-shadow(0 0 8px rgba(43,242,161,0.55))" } : undefined}
      />
    </svg>
  );
}

/** Read-only stars for tables and cards. */
export function StarRow({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[3px]", className)} aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} filled={i <= Math.round(value)} size={size} />
      ))}
    </span>
  );
}

/**
 * Accessible rating input (radiogroup): click, tap, hover preview, and
 * arrow keys. Each pick plays a small spring + burst.
 */
export function RatingInput({
  value,
  onChange,
  size = 40,
  gap = 10,
  labels,
  name,
  ariaLabel,
  invalid,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  gap?: number;
  labels?: readonly string[];
  name: string;
  ariaLabel: string;
  invalid?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const [burst, setBurst] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const shown = hover || value;

  const pick = (v: number) => {
    onChange(v);
    setBurst((b) => b + 1);
  };

  const onKey = (e: React.KeyboardEvent) => {
    let next = value;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(5, (value || 0) + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(1, (value || 1) - 1);
    else if (e.key === "Home") next = 1;
    else if (e.key === "End") next = 5;
    else return;
    e.preventDefault();
    pick(next);
    refs.current[next - 1]?.focus();
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className="flex items-center"
        style={{ gap }}
        onMouseLeave={() => setHover(0)}
        onKeyDown={onKey}
      >
        <input type="hidden" name={name} value={value || ""} />
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= shown;
          return (
            <motion.button
              key={i}
              ref={(el) => {
                refs.current[i - 1] = el;
              }}
              type="button"
              role="radio"
              aria-checked={value === i}
              aria-label={labels?.[i] ? `${i} – ${labels[i]}` : `${i}`}
              tabIndex={value ? (value === i ? 0 : -1) : i === 1 ? 0 : -1}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(0)}
              onClick={() => pick(i)}
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.88 }}
              animate={value === i && burst ? { scale: [1, 1.28, 1] } : { scale: 1 }}
              // Keyframe arrays need a tween (springs only animate between two values).
              transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
              className="relative grid place-items-center rounded-full outline-offset-4"
              style={{ width: size, height: size }}
            >
              <Star filled={filled} size={size} glow={filled && value > 0} />
              <AnimatePresence>
                {value === i && burst > 0 && (
                  <motion.span
                    key={`${id}-${burst}`}
                    aria-hidden
                    initial={{ opacity: 0.6, scale: 0.4 }}
                    animate={{ opacity: 0, scale: 1.9 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-0 rounded-full border-2 border-mint"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
      {labels && (
        <div className="h-5 text-[13px]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.span
              key={shown}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className={shown ? "font-medium text-mint" : "text-muted"}
            >
              {shown ? labels[shown] : `${labels[1]} → ${labels[5]}`}
            </motion.span>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
