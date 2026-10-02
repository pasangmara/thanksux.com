import Image from "next/image";
import { cn } from "@/components/ui/cn";

export function Logo({ width = 112, className, priority }: { width?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/argus-logo.png"
      alt="ARGUS"
      width={width}
      height={Math.round(width / 3)}
      priority={priority}
      className={cn("h-auto select-none", className)}
    />
  );
}
