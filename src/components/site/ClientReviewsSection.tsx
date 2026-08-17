import Link from "next/link";
import { Container } from "@/components/ui";
import { listPublishedReviews } from "@/lib/cms/reviewsRepository";
import { ScrollReveal } from "./ScrollReveal";

const HOMEPAGE_REVIEW_LIMIT = 6;

function Stars({ rating }: { rating: number }) {
  return (
    <p aria-label={`${rating} out of 5 stars`} className="text-caption text-accent" aria-hidden={false}>
      {"★".repeat(rating)}
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </p>
  );
}

/**
 * [Phase 6G Part B §12/§13/§17] Homepage "Client Reviews" section — reads
 * published, admin-curated review records (reviewsRepository.ts's
 * listPublishedReviews(), service-role + `published = true` filter, same
 * pattern as every other homepage section that reads live CMS content).
 * No review content is hardcoded here; the section itself renders nothing
 * when there are zero published reviews (§14 — no fake testimonial, no
 * empty placeholder card), same "honest empty state" rule 6F's
 * ThanksUXSection already follows.
 *
 * The section heading/description are static strings, matching every
 * other fixed homepage section in this codebase (Services, Design
 * Process, ThanksUXSection, …) — none of them have a generic
 * CMS-editable heading today, so adding one just for this section would
 * be new infrastructure, not a reuse of something that already exists
 * (§17's own "if the existing architecture supports section headings"
 * conditional). What *is* genuinely CMS-controlled, per §13/§17, is which
 * reviews appear and in what order — that's real, live admin control via
 * /admin/reviews (publish/feature/reorder), not hardcoded here.
 */
export async function ClientReviewsSection() {
  const reviews = await listPublishedReviews(HOMEPAGE_REVIEW_LIMIT);
  if (reviews.length === 0) return null;

  return (
    <section className="border-t border-border py-16 tablet:py-24">
      <Container variant="wide">
        <ScrollReveal variant="blur">
          <p className="text-caption text-text-tertiary">CLIENT REVIEWS</p>
          <h2 className="text-h2 mt-2">What it&rsquo;s like to work together</h2>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 gap-[16px] tablet:grid-cols-2 desktop:grid-cols-3 tablet:gap-[20px]">
          {reviews.map((review, i) => (
            <ScrollReveal key={review.id} delayMs={(i % 3) * 50} variant="scale">
              <figure className="flex h-full flex-col justify-between gap-4 rounded-md border border-border bg-surface p-5">
                <div>
                  {review.rating ? <Stars rating={review.rating} /> : null}
                  <blockquote className="text-body mt-2 text-text-secondary">&ldquo;{review.reviewText}&rdquo;</blockquote>
                </div>

                <figcaption className="flex items-center gap-3">
                  {review.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.avatarUrl}
                      alt={review.avatarAlt || review.clientName}
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background-alt text-caption text-text-tertiary">
                      {review.clientName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-caption font-medium text-ink">{review.clientName}</p>
                    {review.clientRole || review.company ? (
                      <p className="text-caption text-text-tertiary">
                        {[review.clientRole, review.company].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                    {review.projectSlug ? (
                      <Link href={`/work/${review.projectSlug}`} className="text-caption text-ink underline hover:text-accent">
                        View Project
                      </Link>
                    ) : null}
                  </div>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
