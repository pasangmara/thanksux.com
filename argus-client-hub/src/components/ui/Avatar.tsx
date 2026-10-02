import { initials } from "@/lib/util-client";
import { cn } from "./cn";

export function Avatar({ name, size = 36, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.34) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-mint-soft font-semibold text-mint ring-1 ring-mint/15",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
