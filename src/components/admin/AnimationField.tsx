"use client";

import { useState } from "react";
import { adminButtonSmall, NumberField, SelectField, ToggleField } from "./fields";
import { Animated } from "@/components/site/Animated";
import {
  ANIMATION_PRESETS,
  ANIMATION_PRESET_LABELS,
  DEFAULT_ANIMATION,
  type AnimationConfig,
  type AnimationEasing,
  type AnimationTrigger,
} from "@/types/animation";

/**
 * [Phase J — CMS-controlled animation] Shared admin control for one
 * `AnimationConfig` — used identically by `HeroVisualsEditor`,
 * `HomepageCardsEditor`, and `ProjectFieldRenderer`'s custom-sections
 * editor, so there's exactly one animation-configuration UI, not one per
 * surface. `undefined` (unset) is a real, valid state — it means "use the
 * site's existing default motion," not "broken" — the field only writes a
 * concrete `AnimationConfig` back once an admin actually changes
 * something away from that default.
 *
 * The Preview button replays the animation through the exact same
 * `Animated` runtime component the public site uses (remounted via a key
 * bump) — a real functional preview, not a separate mocked-up one that
 * could drift from what actually ships.
 */

const EASINGS: AnimationEasing[] = ["ease-out", "ease-in-out", "ease", "linear"];
const TRIGGERS: AnimationTrigger[] = ["scroll", "load"];

export function AnimationField({
  label = "Animation",
  animation,
  onChange,
}: {
  label?: string;
  animation: AnimationConfig | undefined;
  onChange: (animation: AnimationConfig | undefined) => void;
}) {
  const value: AnimationConfig = { ...DEFAULT_ANIMATION, ...animation };
  const [previewKey, setPreviewKey] = useState(0);

  function update(patch: Partial<AnimationConfig>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="rounded-md border border-border bg-background-alt p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-caption font-medium text-ink">
          {label} <span className="ml-1 text-text-tertiary">(optional — unset uses the site default)</span>
        </p>
        {animation ? (
          <button type="button" onClick={() => onChange(undefined)} className={adminButtonSmall}>
            Reset to default
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
        <SelectField
          id={`${label}-preset`}
          label="Preset"
          value={value.type}
          options={ANIMATION_PRESETS}
          getOptionLabel={(p) => ANIMATION_PRESET_LABELS[p]}
          onChange={(type) => update({ type })}
        />
        {value.type !== "none" ? (
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className={`w-full ${adminButtonSmall}`}
            >
              ▶ Preview
            </button>
          </div>
        ) : null}
      </div>

      {value.type !== "none" ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 tablet:grid-cols-4">
            <NumberField id={`${label}-duration`} label="Duration (ms)" value={value.durationMs ?? 500} onChange={(v) => update({ durationMs: v })} />
            <NumberField id={`${label}-delay`} label="Delay (ms)" value={value.delayMs ?? 0} onChange={(v) => update({ delayMs: v })} />
            <NumberField id={`${label}-distance`} label="Distance (px)" value={value.distance ?? 16} onChange={(v) => update({ distance: v })} />
            <NumberField id={`${label}-stagger`} label="Stagger (ms)" value={value.staggerMs ?? 0} onChange={(v) => update({ staggerMs: v })} help="Added × this item's list position" />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 tablet:grid-cols-2">
            <SelectField
              id={`${label}-easing`}
              label="Easing"
              value={value.easing ?? "ease-out"}
              options={EASINGS}
              onChange={(easing) => update({ easing })}
            />
            <SelectField
              id={`${label}-trigger`}
              label="Trigger"
              value={value.trigger ?? "scroll"}
              options={TRIGGERS}
              getOptionLabel={(t) => (t === "load" ? "On load" : "On scroll into view")}
              onChange={(trigger) => update({ trigger })}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 tablet:grid-cols-2">
            <ToggleField
              id={`${label}-once`}
              label="Once"
              checked={value.once !== false}
              onChange={(once) => update({ once })}
              help="Off = replays every time it re-enters view"
            />
            <ToggleField
              id={`${label}-mobile`}
              label="Enabled on mobile"
              checked={value.mobileEnabled !== false}
              onChange={(mobileEnabled) => update({ mobileEnabled })}
              help="Off = no motion below 768px, content still shows"
            />
          </div>

          {value.type === "parallax" ? (
            <p className="mt-2 text-caption text-text-tertiary">
              Parallax is a scroll-linked effect, not a one-shot entrance — no live preview here. It only
              takes effect on Hero visual tiles, where scrolling drives real movement.
            </p>
          ) : (
            <div className="mt-3 flex h-16 items-center justify-center rounded-md border border-dashed border-border bg-surface">
              <Animated key={previewKey} config={value}>
                <span className="rounded-sm bg-ink px-4 py-2 text-caption text-white">Preview</span>
              </Animated>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
