import { Button, Container } from "@/components/ui";

/**
 * 404 — implements DESIGN_SYSTEM.md §14's already-documented spec exactly
 * ("Dedicated 404 layout: text-h1 'Page not found,' text-body supporting
 * line, Primary button back to Work"). Found missing during the Work
 * page's QA pass — an invalid /work/[slug] was falling through to
 * Next.js's generic unstyled default instead, which nothing in this site
 * had built yet.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center py-16">
      <Container variant="wide">
        <div className="max-w-[48ch]">
          <p className="text-label">404</p>
          <h1 className="text-h1 mt-4">Page not found</h1>
          <p className="text-body-lg mt-4 text-text-secondary">
            The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
          </p>
          <div className="mt-6">
            <Button variant="primary" href="/work">
              Back to Work
            </Button>
          </div>
        </div>
      </Container>
    </main>
  );
}
