"use client";

import { AnimationField } from "./AnimationField";
import { adminButtonSmall, FieldGrid, ReorderControls, SelectField, TextAreaField, TextField, ToggleField } from "./fields";
import { IconField } from "./IconField";
import type { HomepageCard } from "@/lib/admin/types";

const ICON_SIZES: NonNullable<HomepageCard["iconSize"]>[] = ["sm", "md", "lg"];
const ICON_SIZE_LABELS: Record<NonNullable<HomepageCard["iconSize"]>, string> = {
  sm: "Small",
  md: "Medium",
  lg: "Large",
};
const ICON_POSITIONS: NonNullable<HomepageCard["iconPosition"]>[] = ["inline", "top"];
const ICON_POSITION_LABELS: Record<NonNullable<HomepageCard["iconPosition"]>, string> = {
  inline: "Inline (beside the number)",
  top: "Top (above the title)",
};

/**
 * [Homepage CMS — Services/Design Process] Repeatable editor for a
 * `HomepageCard[]` list — one component shared by both the Services and
 * Design Process editors in `/admin/homepage` (`showUrl` is the only
 * behavioral difference between the two, since Services optionally links
 * out and Design Process steps don't). Mirrors HeroVisualsEditor's
 * existing list-editor pattern (per-item card, Move Up/Down, Remove, +
 * Add at the bottom) exactly — no new interaction invented.
 *
 * `icon` reuses `IconField` as-is (Choose existing/Upload SVG-PNG-WEBP/
 * Clear) — zero new media code, same component `/admin/settings` already
 * uses for Logo/Brand Mark/Favicon.
 */

let keyCounter = 0;
function genId(prefix: string): string {
  keyCounter += 1;
  return `${prefix}-${Date.now()}-${keyCounter}`;
}

function blankCard(idPrefix: string, order: number): HomepageCard {
  return {
    id: genId(idPrefix),
    title: "",
    description: "",
    order,
    visible: true,
  };
}

export function HomepageCardsEditor({
  idPrefix,
  itemLabel,
  cards,
  onChange,
  showUrl = false,
}: {
  idPrefix: string;
  itemLabel: string;
  cards: HomepageCard[];
  onChange: (cards: HomepageCard[]) => void;
  showUrl?: boolean;
}) {
  const ordered = [...cards].sort((a, b) => a.order - b.order);

  function update(id: string, patch: Partial<HomepageCard>) {
    onChange(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function remove(id: string) {
    onChange(cards.filter((c) => c.id !== id));
  }

  function add() {
    const nextOrder = ordered.length > 0 ? Math.max(...ordered.map((c) => c.order)) + 1 : 0;
    onChange([...cards, blankCard(idPrefix, nextOrder)]);
  }

  function move(id: string, direction: -1 | 1) {
    const index = ordered.findIndex((c) => c.id === id);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((c, i) => ({ ...c, order: i })));
  }

  return (
    <div className="flex flex-col gap-4">
      {ordered.length === 0 ? (
        <p className="text-caption text-text-tertiary">No {itemLabel.toLowerCase()}s yet.</p>
      ) : (
        ordered.map((card, i) => (
          <div key={card.id} className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-label text-text-tertiary">
                {itemLabel} {String(i + 1).padStart(2, "0")}
              </p>
              <ReorderControls
                canMoveUp={i > 0}
                canMoveDown={i < ordered.length - 1}
                onMoveUp={() => move(card.id, -1)}
                onMoveDown={() => move(card.id, 1)}
                onRemove={() => remove(card.id)}
                removeLabel={`Remove ${itemLabel.toLowerCase()}`}
              />
            </div>

            <TextField
              id={`${idPrefix}-${card.id}-title`}
              label="Title"
              required
              value={card.title}
              onChange={(v) => update(card.id, { title: v })}
            />
            <TextAreaField
              id={`${idPrefix}-${card.id}-description`}
              label="Description"
              rows={2}
              required
              value={card.description}
              onChange={(v) => update(card.id, { description: v })}
            />
            <IconField
              label="Icon"
              icon={card.icon}
              onChange={(icon) => update(card.id, { icon })}
              help="Optional — card renders without one if unset"
            />
            {card.icon?.src ? (
              <FieldGrid>
                <SelectField
                  id={`${idPrefix}-${card.id}-icon-size`}
                  label="Icon Size"
                  value={card.iconSize ?? "sm"}
                  options={ICON_SIZES}
                  getOptionLabel={(s) => ICON_SIZE_LABELS[s]}
                  onChange={(iconSize) => update(card.id, { iconSize })}
                />
                <SelectField
                  id={`${idPrefix}-${card.id}-icon-position`}
                  label="Icon Position"
                  value={card.iconPosition ?? "inline"}
                  options={ICON_POSITIONS}
                  getOptionLabel={(p) => ICON_POSITION_LABELS[p]}
                  onChange={(iconPosition) => update(card.id, { iconPosition })}
                />
              </FieldGrid>
            ) : null}
            {showUrl ? (
              <TextField
                id={`${idPrefix}-${card.id}-url`}
                label="URL"
                type="url"
                value={card.url ?? ""}
                onChange={(v) => update(card.id, { url: v || undefined })}
                help="Optional — makes this card a link"
              />
            ) : null}

            <ToggleField
              id={`${idPrefix}-${card.id}-visible`}
              label="Visible"
              checked={card.visible}
              onChange={(v) => update(card.id, { visible: v })}
              help="Off = kept here, not shown publicly"
            />

            <AnimationField
              label={`Animation — ${itemLabel} ${i + 1}`}
              animation={card.animation}
              onChange={(animation) => update(card.id, { animation })}
            />
          </div>
        ))
      )}

      <button type="button" onClick={add} className={`w-fit ${adminButtonSmall}`}>
        + Add {itemLabel}
      </button>
    </div>
  );
}
