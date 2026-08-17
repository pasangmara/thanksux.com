import type { HomepageCard } from "@/lib/admin/types";

/**
 * [Icon system] Shared card body for Services and Design Process —
 * identical rendering logic (optional icon + title + description),
 * previously duplicated between the two components. Reads
 * `iconSize`/`iconPosition` (set via `/admin/homepage`'s per-card Icon
 * Size/Position controls); both are real, consumed values — `"inline"` is
 * the exact previous fixed layout (icon beside the title), `"top"` is a
 * genuinely different one (larger icon, its own row above the title).
 *
 * [Numbering removed] Each card previously showed a zero-padded position
 * number ("01", "02"...) above its title — reverted on explicit
 * instruction: card position is already obvious from the grid layout, and
 * the number added no real information. Distinguish cards through title +
 * description + optional icon only, never a counter.
 */
const ICON_SIZE_CLASS: Record<NonNullable<HomepageCard["iconSize"]>, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function HomepageCardBody({ card }: { card: HomepageCard }) {
  const iconClass = ICON_SIZE_CLASS[card.iconSize ?? "sm"];
  const icon = card.icon?.src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={card.icon.src} alt="" className={`${iconClass} object-contain`} />
  ) : null;

  if (card.iconPosition === "top" && icon) {
    return (
      <>
        {icon}
        <p className="text-h3 mt-3">{card.title}</p>
        <p className="text-body mt-2 text-text-secondary">{card.description}</p>
      </>
    );
  }

  return (
    <>
      {icon}
      <p className={`text-h3 ${icon ? "mt-2" : ""}`}>{card.title}</p>
      <p className="text-body mt-2 text-text-secondary">{card.description}</p>
    </>
  );
}
