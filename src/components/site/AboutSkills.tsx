import { Chip, Container } from "@/components/ui";
import { getAboutContent } from "@/lib/cms/siteContentRepository";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

/** [CMS Phase D2] Reads the persisted, admin-editable About content directly — see DesignerIntro.tsx's identical pattern. */
export async function AboutSkills() {
  const about = await getAboutContent();

  return (
    <section id="skills" className="py-12 tablet:py-16">
      <Container variant="wide">
        <ScrollReveal>
          <SectionHeader title="About / Skills" />
        </ScrollReveal>
        <ScrollReveal variant="scale">
          <div className="mt-8 grid grid-cols-1 gap-8 tablet:grid-cols-3">
            {about.experienceSummary ? (
              <div>
                <p className="text-label">Experience</p>
                <p className="text-body mt-3 text-text-secondary">{about.experienceSummary}</p>
              </div>
            ) : null}
            <div>
              <p className="text-label">Design</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {about.skillsDesign.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label">Tools</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {about.skillsTools.map((item) => (
                  <Chip key={item}>{item}</Chip>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
