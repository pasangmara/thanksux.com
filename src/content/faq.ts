/**
 * Homepage FAQ — answers the hesitations a potential client has before
 * reaching out (what to provide, whether an idea is enough, whether an
 * existing product/brand can be worked from, how revisions/delivery work).
 * No pricing, timelines, guarantees, or client counts are stated — none of
 * that is confirmed anywhere else in this project, so none of it is
 * invented here either; anywhere the real answer is "it depends on scope,"
 * the copy says so directly instead of guessing a number.
 *
 * Static for now, not wired into the admin CMS — see FAQSection.tsx's own
 * doc comment for why. Shaped as a plain `{id, question, answer}[]` (the
 * same three fields a `HomepageCard`-style CMS record would need) so a
 * future pass can move this into `HomepageContent` (siteContentRepository.ts)
 * without a rewrite — only `order`/`visible` would need adding, matching
 * `HomepageCard`'s existing shape exactly.
 */

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqEyebrow = "FAQ";

export const faqHeading = "Questions clients usually have before starting a project.";

export const faqDescription =
  "Straightforward answers, so reaching out doesn't require a finished brief first.";

export const faqItems: FaqItem[] = [
  {
    id: "what-to-provide",
    question: "What do I need to provide to start a project?",
    answer:
      "A short description of what you're building, what problem you're trying to solve, your target users, any existing materials, and your main goals are enough to start. You don't need to have everything figured out before reaching out.",
  },
  {
    id: "just-an-idea",
    question: "I only have an idea. Can we still work together?",
    answer:
      "Yes. The first conversation can help clarify the problem, users, scope, and the right design/research approach before any screens are created.",
  },
  {
    id: "existing-website",
    question: "Can you work with an existing website or product?",
    answer:
      "Yes. An existing website or product can be reviewed, audited, and improved based on usability, structure, content, interaction, and visual design needs.",
  },
  {
    id: "only-ui",
    question: "Do you only design UI?",
    answer:
      "No. The workflow can include UX research, information architecture, user flows, UX strategy, interface design, and design refinement — depending on the project.",
  },
  {
    id: "audit-website",
    question: "Can you audit my existing website?",
    answer:
      "Yes. The UX Audit can identify usability and structural issues, explain the evidence behind each finding, and provide practical recommendations for improvement.",
  },
  {
    id: "how-it-begins",
    question: "How does a project usually begin?",
    answer:
      "It starts with understanding the problem, users, goals, existing product or materials, and project scope. From there, the appropriate research and design process is defined.",
  },
  {
    id: "no-brief",
    question: "What if I don't have a complete brief?",
    answer:
      "That's okay. A simple explanation of what you're trying to build, what's currently difficult, and what outcome you want is enough to start the conversation.",
  },
  {
    id: "existing-brand",
    question: "Can you work from an existing design system or brand?",
    answer:
      "Yes. Existing brand guidelines, components, typography, colors, and design systems can be incorporated where appropriate.",
  },
  {
    id: "revisions",
    question: "How do revisions work?",
    answer:
      "Feedback is incorporated throughout the agreed design process. Revision needs depend on the project's scope and workflow.",
  },
  {
    id: "startups",
    question: "Do you work with startups and smaller projects?",
    answer:
      "Yes. The scope and process can be adapted around the actual problem and project requirements, rather than assuming every project needs the same workflow.",
  },
  {
    id: "after-lets-talk",
    question: "What happens after I click Let's Talk?",
    answer:
      "You'll be able to share your project details and contact information. The next step is understanding the project and determining whether ThanksUX is the right fit.",
  },
  {
    id: "not-sure-what-service",
    question: "I'm not sure what service I need. Can I still contact you?",
    answer:
      "Absolutely. Explain the problem you're facing — the right starting point may be UX research, an audit, strategy, UI/UX design, or a combination of these.",
  },
];
