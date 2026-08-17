import type { Project } from "@/types/project";
import { ProjectCard } from "./ProjectCard";
import { ScrollReveal } from "./ScrollReveal";

/**
 * Shared project grid — DESIGN_SYSTEM.md §7 responsive rule reused for
 * every project listing on the homepage (Featured Work, category
 * showcases): 3-col desktop / 2-col tablet / 1-col mobile. Gap uses the
 * documented grid gutters (16/20/24px) literally, matching src/styles/layout.css.
 *
 * [Motion continuation] Each card staggers in on its own 0/50/100/150ms
 * step (capped, then repeating per row so a long grid doesn't accumulate
 * an ever-growing delay) via `ScrollReveal`'s `delayMs` — the grid's own
 * order (already CMS-driven via `featured`/`order`) is the only input,
 * nothing here hardcodes which project appears where.
 */
export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-[16px] tablet:grid-cols-2 tablet:gap-[20px] desktop:grid-cols-3 desktop:gap-[24px]">
      {projects.map((project, i) => (
        <ScrollReveal key={project.slug} delayMs={(i % 3) * 50}>
          <ProjectCard project={project} />
        </ScrollReveal>
      ))}
    </div>
  );
}
