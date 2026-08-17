"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_ANIMATION, type AnimationConfig } from "@/types/animation";

/**
 * [Phase J — CMS-controlled animation] The one reusable animation runner
 * every admin-configurable animated element on this site goes through —
 * not a new animation system per component. Deliberately built on the
 * exact same primitives the site's existing motion already uses
 * (`ScrollReveal`'s IntersectionObserver-once pattern, `HeroEntrance`'s
 * "hidden state -> visible state" CSS transition, `HeroParallax`'s
 * scroll-linked transform) rather than introducing a second animation
 * library or a keyframe-per-preset explosion. Most presets are one shared
 * mechanism (initial transform/opacity/filter -> `transition` to the
 * resting state, entirely driven by inline styles computed from
 * `AnimationConfig`); only `float` (a continuous loop) needs a real CSS
 * `@keyframes` (`src/styles/motion.css`'s `.animated-float`), and
 * `parallax` is deliberately NOT handled here at all — Hero.tsx's tiles
 * already have a real, working scroll-linked parallax mechanism
 * (`HeroParallax.tsx`, `data-parallax-depth`); duplicating a second
 * parallax engine here would be exactly the "don't duplicate animation
 * logic" this phase was told to avoid. A `parallax`-typed config is
 * respected by feeding its `distance` into that existing mechanism at the
 * call site instead (see Hero.tsx).
 *
 * `prefers-reduced-motion: reduce` is checked via `matchMedia` and,
 * combined with `config.type === "none"`, renders children with no
 * animation wrapper styling at all — the same "purely decorative motion
 * is fully disabled, not slowed" rule `motion.css`'s `.reveal` already
 * documents.
 */

const MOBILE_BREAKPOINT = 768;

/**
 * [react-hooks/set-state-in-effect] Both browser-only reads below
 * (reduced-motion preference, viewport width) go through
 * `useSyncExternalStore` rather than `useState` + a `useEffect` that
 * calls `setState` on mount — that pattern trips this project's lint
 * config (a real catch, not a false positive: setting state synchronously
 * inside an effect body causes an extra render pass). `useSyncExternalStore`
 * is the React-idiomatic tool for exactly this "value only knowable on the
 * client, subscribe to it" case, and its `getServerSnapshot` argument
 * gives a correct, mismatch-free SSR fallback for free — no window/document
 * access before hydration, same discipline `HeroParallax.tsx` already
 * follows by keeping this class of check out of state entirely.
 */
function subscribeReducedMotion(callback: () => void): () => void {
  const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}
function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function getReducedMotionServerSnapshot(): boolean {
  return false;
}

function subscribeViewport(callback: () => void): () => void {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}
function getIsMobileSnapshot(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}
function getIsMobileServerSnapshot(): boolean {
  return false;
}

function initialTransform(config: AnimationConfig): string {
  const d = config.distance ?? DEFAULT_ANIMATION.distance!;
  switch (config.type) {
    case "fade-up":
    case "reveal":
    case "stagger":
      return `translateY(${d}px)`;
    case "fade-down":
      return `translateY(-${d}px)`;
    case "fade-left":
    case "slide-in":
      return `translateX(${d}px)`;
    case "fade-right":
      return `translateX(-${d}px)`;
    case "scale-in":
      return "scale(0.92)";
    default:
      return "none";
  }
}

function initialFilter(config: AnimationConfig): string {
  return config.type === "blur-in" ? "blur(8px)" : "none";
}

export function Animated({
  config = DEFAULT_ANIMATION,
  index = 0,
  className = "",
  style,
  children,
}: {
  /** Falls back to `DEFAULT_ANIMATION` (the site's pre-existing reveal behavior) when unset — every existing call site that doesn't pass one keeps working unchanged. */
  config?: AnimationConfig;
  /** This item's position within a list — multiplied by `config.staggerMs` for real parallel/staggered multi-element animation (see Hero's 4 visual tiles, a Services/Process card row). */
  index?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const isMobileViewport = useSyncExternalStore(subscribeViewport, getIsMobileSnapshot, getIsMobileServerSnapshot);
  const mobileSkip = config.mobileEnabled === false && isMobileViewport;

  const isContinuous = config.type === "float" || config.type === "parallax";
  const isInert = config.type === "none";

  useEffect(() => {
    if (isInert || isContinuous) return;
    if (config.trigger === "load") {
      // Deferred one frame so the hidden state actually paints first —
      // otherwise the browser could coalesce both style states into one
      // frame and the transition would never visibly play.
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (config.once !== false) observer.disconnect();
        } else if (config.once === false) {
          setVisible(false);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isInert, isContinuous, config.trigger, config.once]);

  if (isInert || reducedMotion || mobileSkip) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  const totalDelay = (config.delayMs ?? 0) + (config.staggerMs ?? 0) * index;

  if (config.type === "float") {
    return (
      <div ref={ref} className={`animated-float ${className}`} style={{ animationDelay: `${totalDelay}ms`, ...style }}>
        {children}
      </div>
    );
  }

  // parallax: no local animation state — the call site (Hero.tsx) reads
  // `config.distance` directly into its own existing parallax mechanism.
  if (config.type === "parallax") {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  const duration = config.durationMs ?? DEFAULT_ANIMATION.durationMs!;
  const easing = config.easing ?? DEFAULT_ANIMATION.easing!;

  const computedStyle: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "none" : initialTransform(config),
    filter: visible ? "none" : initialFilter(config),
    transition: `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}, filter ${duration}ms ${easing}`,
    transitionDelay: `${totalDelay}ms`,
    ...style,
  };

  return (
    <div ref={ref} className={className} style={computedStyle}>
      {children}
    </div>
  );
}
