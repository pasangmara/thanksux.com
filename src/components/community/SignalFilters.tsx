import Link from "next/link";
import { Container } from "@/components/ui";
import { THANKS_SIGNAL_CATEGORIES } from "@/types/thanksSignal";

const OPTIONS: string[] = ["All", ...THANKS_SIGNAL_CATEGORIES];

/**
 * [Phase 6F §10 — category filter + §9 search] Same plain-link filter
 * pattern as /work's CategoryFilter.tsx (real URL state, no JS required,
 * soft client-side transition on click) — reuses `THANKS_SIGNAL_CATEGORIES`
 * (src/types/thanksSignal.ts, Phase 6C), never a second category list.
 * Search is a plain GET form to the same route — PostgREST does the actual
 * matching (thanksSignalsRepository.ts's listPublicSignals()), nothing
 * client-side.
 */
export function SignalFilters({ activeCategory, search }: { activeCategory: string; search: string }) {
  function hrefFor(category: string) {
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (search) params.set("q", search);
    const qs = params.toString();
    return qs ? `/signals?${qs}` : "/signals";
  }

  return (
    <div className="border-b border-border py-4 tablet:py-6">
      <Container variant="wide">
        <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
          <nav aria-label="Filter signals by category">
            <ul className="flex flex-wrap gap-2">
              {OPTIONS.map((option) => {
                const isActive = option === activeCategory;
                return (
                  <li key={option}>
                    <Link
                      href={hrefFor(option)}
                      aria-current={isActive ? "page" : undefined}
                      className={`inline-flex h-[36px] items-center rounded-sm border px-2 transition-colors duration-150 ease-out focus-visible:shadow-focus focus-visible:outline-none ${
                        isActive ? "border-ink" : "border-border hover:border-ink"
                      }`}
                    >
                      <span className="text-label relative pb-1 text-ink">
                        {option}
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
          <form action="/signals" method="get" role="search" className="flex items-center gap-2">
            {activeCategory !== "All" ? <input type="hidden" name="category" value={activeCategory} /> : null}
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="Search signals…"
              aria-label="Search signals"
              className="h-[36px] w-full min-w-[200px] rounded-sm border border-border bg-surface px-2 text-body text-ink transition-colors duration-150 ease-out focus:border-ink focus:shadow-focus focus:outline-none tablet:w-64"
            />
          </form>
        </div>
      </Container>
    </div>
  );
}
