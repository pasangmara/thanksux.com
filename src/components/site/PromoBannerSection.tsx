import { listActiveBanners } from "@/lib/cms/bannersRepository";
import { PromoBanner } from "./PromoBanner";

/**
 * [Promotional Banner / Campaign System §5] Homepage call site — reads the
 * single top-priority enabled, in-schedule banner (server-only repository
 * read, live per request since the homepage is already `force-dynamic`)
 * and renders nothing when there isn't one, same "honest empty state" rule
 * ClientReviewsSection.tsx already follows for zero published reviews.
 */
export async function PromoBannerSection() {
  const [banner] = await listActiveBanners(1);
  if (!banner) return null;
  return <PromoBanner banner={banner} />;
}
