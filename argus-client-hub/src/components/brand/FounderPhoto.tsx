"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/components/ui/cn";

/** Round founder photo (Figma: FB / Founder photo · Circle). */
export function FounderAvatar({ src, size = 52, className }: { src: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden rounded-full ring-[1.5px] ring-mint ring-offset-2 ring-offset-bg", className)}
      style={{ width: size, height: size }}
    >
      <Image src={src} alt="" fill sizes={`${size * 2}px`} className="object-cover" unoptimized={src.startsWith("/api/")} />
    </span>
  );
}

/**
 * Large founder card for the thank-you page (Figma: FB / Founder photo · Portrait).
 * Subtle 3D tilt follows the pointer on desktop.
 */
export function FounderCard({
  src,
  name,
  role,
  tag,
  className,
}: {
  src: string;
  name: string;
  role: string;
  tag: string;
  className?: string;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [5, -5]), { stiffness: 180, damping: 20 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 180, damping: 20 });

  return (
    <motion.figure
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={cn(
        "relative aspect-[8/7] w-full overflow-hidden rounded-[22px] border border-mint/35 bg-surface shadow-[0_30px_80px_-30px_rgba(43,242,161,0.35)]",
        className,
      )}
    >
      <Image
        src={src}
        alt={`${name}, ${role}`}
        fill
        priority
        sizes="(min-width: 1024px) 460px, 100vw"
        className="object-cover object-[60%_30%]"
        unoptimized={src.startsWith("/api/")}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg/95" />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
        <div>
          <p className="font-display text-lg font-medium text-text">{name}</p>
          <p className="text-[13px] text-mint">{role}</p>
        </div>
        <Image src="/brand/argus-symbol-256.png" alt="" width={34} height={36} className="opacity-95" />
      </figcaption>
      <span className="label-mono absolute top-4 left-4 rounded-full border border-mint/50 bg-bg/70 px-2.5 py-1 text-mint backdrop-blur">
        {tag}
      </span>
    </motion.figure>
  );
}
