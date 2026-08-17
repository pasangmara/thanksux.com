import Link from "next/link";
import { Container } from "@/components/ui";
import { PROJECT_CATEGORIES } from "@/types/project";
import { getCategoryDisplayName } from "@/types/category-config";

const OPTIONS = ["All", ...PROJECT_CATEGORIES] as const;
export type CategoryFilterValue = (typeof OPTIONS)[number];

export function isCategoryFilterValue(value: string | undefined): value is CategoryFilterValue {
  return OPTIONS.includes(value as CategoryFilterValue);
}

/**
 * Category filter — Work page brief §02. Plain server-rendered links, not
 * client-side state: each option navigates to `/work` or `/work?category=X`,
 * which gives real URL state (shareable, back/forward works, no JS
 * required for the filter to function) for free via Next.js's normal
 * routing, and Next still does a soft client-side transition on click so
 * it doesn't feel like a hard page reload.
 *
 * Visual treatment follows DESIGN_SYSTEM.md §11's Filter Chip spec
 * (updated for the radius-sm "small UI element" rule from the visual-
 * refinement pass): transparent fill even when active — active/selected
 * is shown via a `color-accent` underline beneath the label, never a
 * filled background, so it doesn't compete with the button system.
 */
export function CategoryFilter({ active }: { active: CategoryFilterValue }) {
  return (
    <div className="border-b border-border py-4 tablet:py-6">
      <Container variant="wide">
        <nav aria-label="Filter projects by category">
          <ul className="flex flex-wrap gap-2">
            {OPTIONS.map((option) => {
              const isActive = option === active;
              const href = option === "All" ? "/work" : `/work?category=${encodeURIComponent(option)}`;
              // Internal `option` value stays the URL/aria-current key (so
              // every existing /work?category=… link keeps working
              // unchanged) — only the visible label resolves through the
              // canonical category config, closing the "UI/UX" vs.
              // "UI/UX Design" gap CMS Phase B §17 flagged. "All" isn't a
              // category, so it's excluded from that lookup.
              const displayLabel = option === "All" ? "All" : getCategoryDisplayName(option);
              return (
                <li key={option}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex h-[36px] items-center rounded-sm border px-2 transition-colors duration-150 ease-out focus-visible:shadow-focus focus-visible:outline-none ${
                      isActive ? "border-ink" : "border-border hover:border-ink"
                    }`}
                  >
                    <span className="text-label relative pb-1 text-ink">
                      {displayLabel}
                      <span
                        aria-hidden
                        className={`absolute inset-x-0 bottom-0 h-[2px] ${isActive ? "bg-accent" : "bg-transparent"}`}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>
    </div>
  );
}
