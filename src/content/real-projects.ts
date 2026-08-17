import type { Project } from "@/types/project";

/**
 * REAL portfolio projects.
 *
 * Empty until real work is added — this file is not imported anywhere
 * yet. See docs/CONTENT_GUIDE.md for the full workflow (what to write,
 * what images to prepare, where they go) and src/content/README.md for
 * the exact one-line switch that makes the site use this file instead of
 * src/content/demo-projects.ts.
 *
 * Do NOT invent content to fill this in. An empty array here is correct
 * and expected until real project details, images, and outcomes exist —
 * that's the whole point of keeping this file separate from the demo set.
 *
 * Copy the commented template below for each new project. It has every
 * field from src/types/project.ts, in the same order, so nothing gets
 * missed. Delete whichever optional caseStudy fields don't apply — see
 * docs/CONTENT_GUIDE.md's per-category checklist for which ones actually
 * matter for a Graphic Design vs. Branding vs. UI/UX project.
 */

export const realProjects: Project[] = [
  {
    id: "gridmark",
    title: "Gridmark",
    slug: "gridmark",
    category: "Branding",
    projectType: "Brand Identity",
    year: 2026,
    client: "Nazmul Anwar Jewel",
    role: "Brand Designer",
    shortDescription:
      "A grid-driven identity for designers and digital marketers, built around structure, spacing, visual direction, and purposeful marketing.",

    coverImage: {
      kind: "image",
      src: "/images/projects/gridmark/cover.jpg",
      alt: "Gridmark logo presentation showing the primary grid-inspired brand mark, wordmark, and color variations on white, black, and blue backgrounds",
    },
    gallery: [
      {
        kind: "image",
        src: "/images/projects/gridmark/gallery/01.jpg",
        alt: "Gridmark logo presentation showing the primary grid-inspired brand mark, wordmark, and color variations on white, black, and blue backgrounds",
        layout: "half",
      },
      {
        kind: "image",
        src: "/images/projects/gridmark/gallery/02.jpg",
        alt: "Gridmark logo construction diagram showing the grid framework, rounded-square proportions, and central mark geometry",
        layout: "half",
      },
      {
        kind: "image",
        src: "/images/projects/gridmark/gallery/03.jpg",
        alt: "Gridmark branded notebook application using the identity system",
        layout: "half",
      },
      {
        kind: "image",
        src: "/images/projects/gridmark/gallery/04.jpg",
        alt: "Gridmark stationery application showing business card and envelope design",
        layout: "half",
      },
      {
        kind: "image",
        src: "/images/projects/gridmark/gallery/05.jpg",
        alt: "Gridmark branded mug application using the identity system",
        layout: "third",
      },
      {
        kind: "image",
        src: "/images/projects/gridmark/gallery/06.jpg",
        alt: "Gridmark letterhead application showing a company introduction document with the brand's color accents",
        layout: "third",
      },
      {
        kind: "image",
        src: "/images/projects/gridmark/gallery/07.jpg",
        alt: "Gridmark brand identity presentation showing stationery, notebook, calendar, apparel, and other branded applications",
        layout: "full",
      },
    ],

    featured: false,
    published: true,
    tags: ["Branding", "Identity", "Logo System"],
    tools: [],
    services: ["Brand Identity & Systems"],
    order: 1,

    caseStudy: {
      overview:
        "Gridmark is a brand identity created for a digital marketing agency focused on helping brands organize ideas, design communication, and build more purposeful digital experiences. The identity translates familiar design principles—grid, spacing, alignment, and visual hierarchy—into a simple and recognizable brand system.",
      outcome:
        "The project concluded with a complete brand identity delivery, including the core logo system, visual language, color and typography direction, and a range of branded applications designed to carry the identity consistently across touchpoints.",

      constraint:
        "The identity needed to communicate the structured thinking behind design and digital marketing while remaining simple, memorable, and flexible enough to work across different brand applications.",

      designDirection:
        "Structure — The Grid: A familiar visual language for designers and marketers, representing alignment, spacing, organization, and a structured approach to communication. Direction — The Mark: The small central target-like point represents focus—a clear destination behind every design, campaign, or marketing decision. Recognition — The Rhythm: Repeated rounded-rectangle forms create a consistent visual rhythm that strengthens recall and makes the identity recognizable across different applications.",

      concept:
        "The Gridmark logo combines a familiar design grid with a focused central mark. The grid communicates structure and visual order, while the inner point introduces the idea of direction and marketing focus. The rounded-square frame is repeated throughout the identity to create a recognizable visual rhythm and a distinctive brand signature.",

      typography:
        "Poppins was selected for its geometric construction, clean proportions, and contemporary character, supporting the brand's connection to digital design and marketing.",

      colorSystem:
        "Primary — Blue. Secondary — Ash. Blue establishes the brand's digital, focused, and energetic character, while Ash provides a neutral visual foundation for balance and clarity across applications.",

      reflection:
        "Gridmark was developed around a simple principle: good marketing needs direction, and good design needs structure. By turning the familiar grid into the foundation of the identity and pairing it with a focused central mark, the brand creates a visual language that feels relevant to both designers and marketers.",
    },
  },
  // {
  //   id: "your-project-slug",
  //   title: "Project Title",
  //   slug: "your-project-slug",
  //   category: "UI/UX", // "Graphic Design" | "Branding" | "UI/UX" | "Web Design" | "UX Research" | "Editorial" | "Campaign"
  //   projectType: "Mobile App", // free text — e.g. "Mobile App", "Brand Identity", "Poster Series"
  //   year: 2026,
  //   client: "Client name, or omit this line if unpublished/personal work",
  //   role: "Your role on the project",
  //   shortDescription: "One sentence — this is what shows on every project card.",
  //   description: "A slightly longer paragraph for the project detail page's hero. Optional — falls back to shortDescription if omitted.",
  //
  //   // Real photo: { kind: "image", src: "/images/projects/your-project-slug/cover.jpg", alt: "Specific, real description of what's shown" }
  //   coverImage: { kind: "placeholder", category: "ui-screen", alt: "Temporary placeholder — replace with a real cover image" },
  //   // Optional — falls back to coverImage on project cards if omitted.
  //   thumbnail: { kind: "placeholder", category: "ui-screen", alt: "Temporary placeholder — replace with a real thumbnail" },
  //   // General project gallery. Each image can set layout: "full" | "half" | "third" (defaults to "half").
  //   gallery: [],
  //
  //   featured: false,
  //   featuredOrder: undefined, // only set this if featured: true — lower number = shown first
  //   published: false, // keep false while you're still writing this project up; flip to true when it's ready to go live
  //   tags: ["Tag One", "Tag Two"],
  //   tools: ["Figma"],
  //   services: ["Product & UI/UX Design"], // match an entry from src/content/site.ts's `services` list
  //   projectUrl: undefined, // live URL if the project shipped publicly, otherwise omit
  //   order: 100, // controls position in listings — pick a number higher than your existing projects' `order` values
  //
  //   caseStudy: {
  //     // Required for every project:
  //     overview: "One or two sentences framing the core problem and fix — this is what the Case Study Preview and previews pull from.",
  //     outcome: "An honest outcome statement. Never fabricate a metric you don't actually have — a process-based outcome ('shipped, client adopted it') is fine.",
  //
  //     // Everything below is optional — delete whatever doesn't apply.
  //     // See docs/CONTENT_GUIDE.md for which fields matter per category.
  //     problem: undefined,
  //     context: undefined,
  //     constraint: undefined,
  //     goals: undefined,
  //     research: undefined,
  //     researchMethods: undefined,
  //     insights: undefined,
  //     userJourney: undefined,
  //     informationArchitecture: undefined,
  //     wireframes: undefined,
  //     designDirection: undefined,
  //     designSystem: undefined,
  //     finalDesign: undefined,
  //     testing: undefined,
  //     reflection: undefined,
  //     moodboard: undefined,
  //     concept: undefined,
  //     typography: undefined,
  //     colorSystem: undefined,
  //     logo: undefined,
  //     applications: undefined,
  //     exploration: undefined,
  //   },
  // },
];
