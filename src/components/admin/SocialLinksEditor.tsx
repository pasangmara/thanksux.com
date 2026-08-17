"use client";

import { adminButtonSmall, ReorderControls, ToggleField } from "./fields";
import { IconField } from "./IconField";
import type { AdminSocialLink } from "@/lib/admin/types";
import type { SocialIcon } from "@/content/personal";

const ICONS: SocialIcon[] = [
  "email",
  "whatsapp",
  "facebook",
  "linkedin",
  "instagram",
  "behance",
  "dribbble",
  "github",
  "youtube",
  "x",
  "website",
];
const PRIORITIES: AdminSocialLink["priority"][] = ["primary", "secondary", "passive"];

/**
 * Shared repeatable editor for Social Link entries — used by both
 * /admin/contact and /admin/settings, since both surfaces read from the
 * same socialLinks source today (see docs/PORTFOLIO_CMS_ARCHITECTURE.md
 * §9).
 *
 * [Social/Account Manager] Move Up/Down give explicit reorder control
 * (previously array position was the only ordering mechanism, with no way
 * to change it short of deleting and re-adding) — same pattern already
 * used by HeroVisualsEditor/HomepageCardsEditor. The Enabled toggle lets
 * an admin temporarily hide a channel without losing its saved
 * label/URL/icon, matching every other "visible" field in this CMS.
 */
export function SocialLinksEditor({
  links,
  onChange,
}: {
  links: AdminSocialLink[];
  onChange: (links: AdminSocialLink[]) => void;
}) {
  function update(i: number, patch: Partial<AdminSocialLink>) {
    onChange(links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function remove(i: number) {
    onChange(links.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([
      ...links,
      { label: "New channel", value: "", href: "", icon: "email", priority: "passive", visible: true },
    ]);
  }
  function move(i: number, direction: -1 | 1) {
    const target = i + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {links.map((link, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-md border border-border bg-background p-3">
          {/* Main editable fields — its own row/grid, never sharing a
              track with the controls below, so neither can squeeze the
              other regardless of viewport width. */}
          <div className="grid grid-cols-1 gap-2 tablet:grid-cols-4">
            <input
              value={link.label}
              placeholder="Label"
              onChange={(e) => update(i, { label: e.target.value })}
              className="min-w-0 rounded-md border border-border bg-surface px-2 py-1.5 text-caption text-ink"
            />
            <input
              value={link.value}
              placeholder="Display value"
              onChange={(e) => update(i, { value: e.target.value })}
              className="min-w-0 rounded-md border border-border bg-surface px-2 py-1.5 text-caption text-ink"
            />
            <input
              value={link.href}
              placeholder="href / mailto: / URL"
              onChange={(e) => update(i, { href: e.target.value })}
              className="min-w-0 rounded-md border border-border bg-surface px-2 py-1.5 text-caption text-ink"
            />
            <select
              value={link.icon}
              onChange={(e) => update(i, { icon: e.target.value as SocialIcon })}
              className="min-w-0 rounded-md border border-border bg-surface px-2 py-1.5 text-caption text-ink"
            >
              {ICONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>

          {/* Secondary controls — always its own full-width row, so the
              reorder/delete cluster can never be forced into a cramped
              shared column (the original bug: these three buttons sat in
              1/5 of the grid above, next to a flex-1 select, and visibly
              overflowed the card). flex-wrap means at any width the
              priority select and the button cluster simply wrap onto their
              own line rather than overflow. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              value={link.priority}
              onChange={(e) => update(i, { priority: e.target.value as AdminSocialLink["priority"] })}
              className="min-w-0 rounded-md border border-border bg-surface px-2 py-1.5 text-caption text-ink"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ReorderControls
              canMoveUp={i > 0}
              canMoveDown={i < links.length - 1}
              onMoveUp={() => move(i, -1)}
              onMoveDown={() => move(i, 1)}
              onRemove={() => remove(i)}
              removeLabel="Remove social link"
            />
          </div>

          <ToggleField
            id={`social-${i}-visible`}
            label="Enabled"
            checked={link.visible !== false}
            onChange={(v) => update(i, { visible: v })}
            help="Off = kept here, not shown publicly"
          />

          <IconField
            label="Custom icon"
            icon={link.customIcon}
            onChange={(customIcon) => update(i, { customIcon })}
            help={`Overrides the built-in "${link.icon}" glyph above for this channel only — clear to go back to it`}
          />
        </div>
      ))}
      <button type="button" onClick={add} className={`w-fit ${adminButtonSmall}`}>
        + Add social link
      </button>
    </div>
  );
}
