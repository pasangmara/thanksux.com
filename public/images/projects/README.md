# Project image assets

One folder per project, named to match that project's `slug` in
`src/content/real-projects.ts` exactly (`/work/[slug]` and this folder
name must be identical). See `_example-project/` for the full structure.

```
public/images/projects/
  <project-slug>/
    cover.jpg              -> Project.coverImage
    thumbnail.jpg          -> Project.thumbnail
    gallery/
      01.jpg                 -> Project.gallery[0]
      02.jpg                 -> Project.gallery[1]
    case-study/
      wireframes/
        01.jpg                -> Project.caseStudy.wireframes[0]
      logo/                   -> Project.caseStudy.logo[]
      moodboard/              -> Project.caseStudy.moodboard[]
      applications/           -> Project.caseStudy.applications[]
      final-design/           -> Project.caseStudy.finalDesign[]
      exploration/            -> Project.caseStudy.exploration[]
```

Only create the `case-study/` subfolders a given project actually uses —
a Graphic Design project might only need `exploration/` and
`final-design/`; a Branding project might only need `logo/`,
`moodboard/`, and `applications/`. Nothing reads a folder that isn't
referenced by a project's data.

Full image specifications (dimensions, aspect ratio, format, file-size
targets, naming, alt text) are in `docs/CONTENT_GUIDE.md`.

## Referencing an image in project data

```ts
coverImage: {
  kind: "image",
  src: "/images/projects/your-project-slug/cover.jpg",
  alt: "Specific description of what's actually shown",
}
```

The `src` path is relative to `public/`, starting with `/`. No import,
no build step — drop the file in the matching folder and reference its
path.
