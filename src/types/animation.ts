/**
 * [Phase J — CMS-controlled animation] Shared animation-configuration
 * schema, consumed by `src/components/site/Animated.tsx` (the one runtime
 * "engine" — see that file's header comment for why there's only one) and
 * attached to the three content types that already model repeatable,
 * admin-controlled visual items: `HeroVisual`, `HomepageCard`, and
 * `CustomSection` (see lib/admin/types.ts / types/project.ts). Every field
 * is optional — an item with no `animation` set renders with the same
 * sensible default `Animated.tsx` already applies today, so this is
 * additive, not a requirement to configure before anything works.
 */

export type AnimationPreset =
  | "none"
  | "fade-in"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale-in"
  | "blur-in"
  | "slide-in"
  | "reveal"
  | "float"
  | "stagger"
  | "parallax";

export const ANIMATION_PRESETS: AnimationPreset[] = [
  "none",
  "fade-in",
  "fade-up",
  "fade-down",
  "fade-left",
  "fade-right",
  "scale-in",
  "blur-in",
  "slide-in",
  "reveal",
  "float",
  "stagger",
  "parallax",
];

export const ANIMATION_PRESET_LABELS: Record<AnimationPreset, string> = {
  none: "None",
  "fade-in": "Fade In",
  "fade-up": "Fade Up",
  "fade-down": "Fade Down",
  "fade-left": "Fade Left",
  "fade-right": "Fade Right",
  "scale-in": "Scale In",
  "blur-in": "Blur In",
  "slide-in": "Slide In",
  reveal: "Reveal",
  float: "Float",
  stagger: "Stagger",
  parallax: "Parallax",
};

export type AnimationTrigger = "load" | "scroll";
export type AnimationEasing = "ease-out" | "ease-in-out" | "ease" | "linear";

export interface AnimationConfig {
  type: AnimationPreset;
  /** Milliseconds. Default 500 (matches the site's existing `.reveal`/entrance timing). */
  durationMs?: number;
  /** Milliseconds, added to any stagger-computed delay from an item's position in a list. Default 0. */
  delayMs?: number;
  easing?: AnimationEasing;
  /** Pixels of travel for the fade/slide-in presets, or parallax scroll-linked movement strength for `parallax`. Default 16 for fade/slide, 10 for parallax. */
  distance?: number;
  /** Milliseconds added per list index when this item renders as part of a list — e.g. Hero's 4 visual tiles, a Services/Process card row. Default 0 (no stagger). */
  staggerMs?: number;
  /** `"load"` plays immediately on mount (e.g. above-the-fold Hero content); `"scroll"` plays once the element enters the viewport (IntersectionObserver). Default `"scroll"`. */
  trigger?: AnimationTrigger;
  /** Play once and stay in its end state (default, `true`), or replay every time it re-enters the viewport. Ignored when `trigger` is `"load"`. */
  once?: boolean;
  /** Default `true`. Set `false` to skip this animation under the mobile breakpoint (<768px) — the entrance still renders, just without the motion, for cases where the movement doesn't read well on a small viewport. */
  mobileEnabled?: boolean;
}

/** The exact behavior every animated element already had before this field existed — a plain default export so "no `animation` set" and "`animation: DEFAULT_ANIMATION`" are indistinguishable. */
export const DEFAULT_ANIMATION: AnimationConfig = {
  type: "reveal",
  durationMs: 500,
  delayMs: 0,
  easing: "ease-out",
  distance: 16,
  staggerMs: 0,
  trigger: "scroll",
  once: true,
  mobileEnabled: true,
};
