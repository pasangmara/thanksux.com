import { Container } from "@/components/ui";
import type { Project } from "@/types/project";

/**
 * Project Overview — brief §02: a scannable Client/Year/Role/Services/
 * Tools grid, distinct from the hero's inline meta line (which is just
 * category · type · year for quick orientation). Only fields with real
 * data render — Client is optional in the schema, and a project with no
 * `services`/`tools` entries simply shows fewer columns.
 */
export function ProjectOverview({ project }: { project: Project }) {
  const items: { label: string; value: string }[] = [
    project.client ? { label: "Client", value: project.client } : null,
    { label: "Year", value: String(project.year) },
    { label: "Role", value: project.role },
    project.services.length > 0 ? { label: "Services", value: project.services.join(", ") } : null,
    project.tools.length > 0 ? { label: "Tools", value: project.tools.join(", ") } : null,
    project.tags.length > 0 ? { label: "Tags", value: project.tags.join(", ") } : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-border py-8 tablet:py-10">
      <Container variant="wide">
        <div className="grid grid-cols-2 gap-6 tablet:grid-cols-5">
          {items.map((item) => (
            <div key={item.label}>
              <p className="text-caption">{item.label}</p>
              <p className="text-body mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
