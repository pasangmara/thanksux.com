"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui";
import { CaseStudyGallery } from "@/components/site/CaseStudyGallery";
import { ProjectHero } from "@/components/site/ProjectHero";
import { ProjectOverview } from "@/components/site/ProjectOverview";
import { ProjectStory } from "@/components/site/ProjectStory";
import { getProject } from "@/lib/admin/store";
import type { AdminProject } from "@/lib/admin/types";
import type { Project } from "@/types/project";

/**
 * Admin preview — reuses the real public project-detail components
 * unmodified (ProjectHero, ProjectOverview, ProjectStory, CaseStudyGallery)
 * fed with the admin's current draft data, rather than duplicating the
 * public rendering logic. AdminProject is a structural superset of
 * Project (see src/lib/admin/types.ts), so it can be passed directly.
 *
 * This does not render ProjectNavigation or ProjectCTA — prev/next
 * navigation and the closing CTA are tied to the live publishedProjects
 * list, which is irrelevant for previewing an unsaved/unpublished draft.
 */
export default function ProjectPreviewPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<AdminProject | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Client-only fetch, deferred past hydration on purpose — see
    // src/app/admin/about/page.tsx for the same pattern.
    let cancelled = false;
    getProject(params.id).then((p) => {
      if (cancelled) return;
      if (!p) setNotFound(true);
      else setProject(p);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <div>
        <p className="text-body">No project with id &ldquo;{params.id}&rdquo; was found.</p>
        <Link href="/admin/projects" className="text-body text-accent underline">
          Back to projects
        </Link>
      </div>
    );
  }

  if (!project) return <p className="text-body text-text-secondary">Loading…</p>;

  const publicProject = project as unknown as Project;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-border bg-background-alt p-3">
        <p className="text-caption text-text-secondary">
          Preview of draft data for <strong>{project.title}</strong> — this frame is admin chrome;
          everything below renders through the exact same components the public{" "}
          <code>/work/{project.slug}</code> page uses.
          {!project.published ? " This project is not published, so its public route doesn't exist yet." : ""}
        </p>
        <div className="mt-2 flex gap-3">
          <Link href={`/admin/projects/${project.id}`} className="text-caption text-accent underline">
            ← Back to editor
          </Link>
          {project.published ? (
            <Link href={`/work/${project.slug}`} className="text-caption text-accent underline">
              View live page
            </Link>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background">
        <ProjectHero project={publicProject} />
        <ProjectOverview project={publicProject} />
        <ProjectStory project={publicProject} />

        {publicProject.gallery.length > 0 ? (
          <div className="border-t border-border py-8 tablet:py-10">
            <Container variant="wide">
              <p className="text-label">Gallery</p>
              <div className="mt-6">
                <CaseStudyGallery images={publicProject.gallery} />
              </div>
            </Container>
          </div>
        ) : null}
      </div>
    </div>
  );
}
