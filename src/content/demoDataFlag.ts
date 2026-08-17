/**
 * [CMS Phase D2] Standalone, zero-dependency — deliberately kept out of
 * `src/content/projects.ts`, which now transitively imports the
 * server-only project repository (Node's `fs`, via
 * `src/lib/cms/projectsRepository.ts`). `ProjectHero.tsx` needs this flag
 * but is also rendered from `/admin/projects/[id]/preview` — a "use
 * client" page — which means it gets bundled for the browser. Importing
 * `usingDemoData` from `content/projects.ts` there would pull the entire
 * `fs`-dependent module graph into the client bundle and fail the build
 * ("Module not found: Can't resolve 'fs'"). This one-line module has no
 * such dependency, so it's safe to import from either a server or client
 * bundle. `content/projects.ts` re-exports this same value for its own
 * (server-only-safe) consumers.
 */
export const usingDemoData = false;
