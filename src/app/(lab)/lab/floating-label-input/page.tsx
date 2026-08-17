import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui";
import { FloatingLabelInput } from "@/components/experimental/FloatingLabelInput";
import { projectTypes } from "@/content/site";

/**
 * EXPERIMENTAL, DEV-ONLY test harness for FloatingLabelInput — see
 * docs/COMPONENT_NORMALIZATION.md §13. Not linked from SiteNav/SiteFooter
 * or src/content/site.ts's `nav`, and 404s outright in a production build
 * via the guard below, so it never ships. Not connected to ContactSection
 * or any real submission logic — every field here is inert.
 */

export const metadata: Metadata = {
  title: "Lab — Floating Label Input",
  robots: { index: false, follow: false },
};

const fieldChrome =
  "h-6 w-full rounded-md border border-border bg-surface px-3 text-body outline-none " +
  "transition-colors duration-150 ease-out motion-reduce:transition-none " +
  "focus:border-accent focus:shadow-focus";

export default function FloatingLabelInputLabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Container variant="narrow" as="section" className="py-12 tablet:py-16">
      <p className="text-label text-accent">Experimental — not in production</p>
      <h1 className="text-h1 mt-4">Floating Label Input</h1>
      <p className="text-body-lg mt-4 max-w-[60ch] text-text-secondary">
        Isolated test harness for the component normalized from{" "}
        <span className="text-caption">components/4.txt</span>, per
        docs/COMPONENT_NORMALIZATION.md. This route is excluded from production
        builds and isn&rsquo;t linked from site navigation.
      </p>

      <div className="mt-12 flex flex-col gap-12">
        <section>
          <h2 className="text-h3">Default — focus, typing, keyboard</h2>
          <p className="text-caption mt-2 text-text-secondary">
            Tab to the field. The label shifts from secondary to ink and the
            border shifts to accent + a focus ring — both are 150ms color
            transitions, not layout motion.
          </p>
          <div className="mt-4 max-w-md">
            <FloatingLabelInput
              id="lab-name-default"
              label="Name"
              placeholder="e.g. Alex Rivera"
              autoComplete="name"
            />
          </div>
        </section>

        <section>
          <h2 className="text-h3">Error state</h2>
          <div className="mt-4 max-w-md">
            <FloatingLabelInput
              id="lab-email-error"
              label="Email"
              type="email"
              defaultValue="not-an-email"
              autoComplete="email"
              error="Enter a valid email address."
            />
          </div>
        </section>

        <section>
          <h2 className="text-h3">Hint (no error)</h2>
          <div className="mt-4 max-w-md">
            <FloatingLabelInput
              id="lab-name-hint"
              label="Name"
              placeholder="e.g. Alex Rivera"
              autoComplete="name"
              hint="As you'd like it signed."
            />
          </div>
        </section>

        <section>
          <h2 className="text-h3">Disabled state</h2>
          <div className="mt-4 max-w-md">
            <FloatingLabelInput id="lab-name-disabled" label="Name" defaultValue="Joy" disabled />
          </div>
        </section>

        <section>
          <h2 className="text-h3">Required field marker</h2>
          <div className="mt-4 max-w-md">
            <FloatingLabelInput id="lab-email-required" label="Email" type="email" autoComplete="email" required />
          </div>
        </section>

        <section>
          <h2 className="text-h3">Realistic field group</h2>
          <p className="text-caption mt-2 text-text-secondary">
            Name and Email use the experimental component under test.
            Project type and Message are shown only for realistic context —
            same field chrome already used in ContactSection.tsx, not part
            of this experiment, and not connected to anything.
          </p>
          {/*
            Plain <div>, not <form> — this page is a Server Component and
            has no submission behavior to guard against (an onSubmit
            handler can't be passed as a prop from a Server Component;
            there's nothing here to submit anyway, it's a static states
            demo, not a working form).
          */}
          <div className="mt-4 flex max-w-md flex-col gap-6">
            <FloatingLabelInput id="lab-group-name" label="Name" autoComplete="name" required />
            <FloatingLabelInput
              id="lab-group-email"
              label="Email"
              type="email"
              autoComplete="email"
              required
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="lab-group-project-type" className="text-caption text-text-secondary">
                Project type
              </label>
              <select id="lab-group-project-type" className={fieldChrome} defaultValue="">
                <option value="" disabled>
                  Select one
                </option>
                {projectTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="lab-group-message" className="text-caption text-text-secondary">
                Message
              </label>
              <textarea
                id="lab-group-message"
                className={`${fieldChrome} min-h-[120px] resize-y py-2`}
              />
            </div>
          </div>
        </section>
      </div>
    </Container>
  );
}
