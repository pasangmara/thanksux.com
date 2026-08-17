"use client";

import { AnimationField } from "./AnimationField";
import { adminButtonSmall, ReorderControls, TextField, ToggleField } from "./fields";
import { MediaField } from "./media";
import type { HeroVisual } from "@/lib/admin/types";

/**
 * [Phase D3.5] Repeatable editor for the homepage Hero's visual tiles —
 * replaces what used to be an automatic "top 3 featured projects + 1
 * fixed typography tile" composition with genuinely admin-controlled
 * items. Deliberately mirrors GalleryManager/SocialLinksEditor/
 * CustomSectionsEditor's existing list-editor pattern (per-item card,
 * Move Up/Down, Remove, + Add at the bottom) rather than inventing a
 * fourth variant of the same interaction.
 *
 * Each item's image reuses `MediaField` as-is — "Choose existing image"
 * and "Upload new image" (with its own Uploading…/Uploaded/error
 * feedback) both come for free, zero new media code.
 */

let keyCounter = 0;
function genId(): string {
  keyCounter += 1;
  return `visual-${Date.now()}-${keyCounter}`;
}

function blankVisual(order: number): HeroVisual {
  return {
    id: genId(),
    image: { kind: "placeholder", category: "brand-mark", alt: "" },
    title: "",
    order,
    visible: true,
  };
}

export function HeroVisualsEditor({
  visuals,
  onChange,
}: {
  visuals: HeroVisual[];
  onChange: (visuals: HeroVisual[]) => void;
}) {
  const ordered = [...visuals].sort((a, b) => a.order - b.order);

  function update(id: string, patch: Partial<HeroVisual>) {
    onChange(visuals.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  function remove(id: string) {
    onChange(visuals.filter((v) => v.id !== id));
  }

  function add() {
    const nextOrder = ordered.length > 0 ? Math.max(...ordered.map((v) => v.order)) + 1 : 0;
    onChange([...visuals, blankVisual(nextOrder)]);
  }

  function move(id: string, direction: -1 | 1) {
    const index = ordered.findIndex((v) => v.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((v, i) => ({ ...v, order: i })));
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-caption text-text-tertiary">
        The Hero grid has 4 fixed positions (one tall tile, two square tiles, one wide tile) — only
        the first 4 visible items below are shown publicly, in this order. Extra items are saved,
        not deleted, in case a position opens up later.
      </p>

      {ordered.length === 0 ? (
        <p className="text-caption text-text-tertiary">No Hero visuals yet.</p>
      ) : (
        ordered.map((visual, i) => (
          <div key={visual.id} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-label text-text-tertiary">
                Visual {String(i + 1).padStart(2, "0")}
                {i >= 4 ? " — beyond the 4 visible positions" : ""}
              </p>
              <ReorderControls
                canMoveUp={i > 0}
                canMoveDown={i < ordered.length - 1}
                onMoveUp={() => move(visual.id, -1)}
                onMoveDown={() => move(visual.id, 1)}
                onRemove={() => remove(visual.id)}
                removeLabel="Remove Hero visual"
              />
            </div>

            <MediaField
              label="Image"
              media={visual.image}
              onChange={(m) => update(visual.id, { image: m })}
              help="Choose an existing image or upload a new one"
            />

            <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2">
              <TextField
                id={`hero-visual-${visual.id}-title`}
                label="Title"
                value={visual.title}
                onChange={(v) => update(visual.id, { title: v })}
                help="Shown as the tile's label while it's still a placeholder; also used for admin reference"
              />
              <TextField
                id={`hero-visual-${visual.id}-description`}
                label="Description"
                value={visual.description ?? ""}
                onChange={(v) => update(visual.id, { description: v || undefined })}
                help="Optional — admin reference only, not shown publicly"
              />
            </div>
            <TextField
              id={`hero-visual-${visual.id}-href`}
              label="Link"
              type="url"
              value={visual.href ?? ""}
              onChange={(v) => update(visual.id, { href: v || undefined })}
              help="Optional — makes this tile clickable"
            />

            <ToggleField
              id={`hero-visual-${visual.id}-visible`}
              label="Visible"
              checked={visual.visible}
              onChange={(v) => update(visual.id, { visible: v })}
              help="Off = kept here, not shown publicly"
            />

            <AnimationField
              label={`Animation — Visual ${i + 1}`}
              animation={visual.animation}
              onChange={(animation) => update(visual.id, { animation })}
            />
          </div>
        ))
      )}

      <button type="button" onClick={add} className={`w-fit ${adminButtonSmall}`}>
        + Add Hero Visual
      </button>
    </div>
  );
}
