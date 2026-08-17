/**
 * Centralized personal/contact information — single source of truth for
 * name, title, bio, and every social/contact channel. Consumed by the
 * nav wordmark, footer, hero eyebrow, Designer Introduction, Contact
 * section, and page metadata, so there's exactly one place to update
 * when any of this changes.
 *
 * Nothing here is invented. Fields grounded in an approved doc say so;
 * everything else is an explicit `[bracketed]` placeholder or a
 * clearly-fake handle, never a guessed specific — see
 * docs/IMPLEMENTATION_PLAN.md §11 and docs/HOMEPAGE_SPEC.md §3 for why
 * that distinction matters on this project specifically.
 */

export type SocialIcon =
  | "email"
  | "whatsapp"
  | "facebook"
  | "linkedin"
  | "instagram"
  | "behance"
  | "dribbble"
  /** [Social/Account Manager] GitHub/YouTube/X — icons.tsx's GitHubIcon/YouTubeIcon/XIcon. */
  | "github"
  | "youtube"
  | "x"
  /** [CMS Phase D1] Generic glyph for a personal site, portfolio elsewhere, or any channel without its own icon above — see icons.tsx's WebsiteIcon. */
  | "website";

export interface SocialLink {
  label: string;
  value: string;
  href: string;
  icon: SocialIcon;
  priority: "primary" | "secondary" | "passive";
  /**
   * [Icon CMS] Optional admin-uploaded SVG/PNG/WEBP icon that overrides the
   * built-in `icon` glyph for this one channel — see
   * src/components/admin/IconField.tsx / src/app/api/admin/icons/route.ts.
   * `icon` itself is left set (never cleared) so removing the custom icon
   * always falls back to a real, coherent glyph rather than nothing.
   */
  customIcon?: { src: string; alt: string };
  /** [Social/Account Manager] Off = kept in the admin, not shown publicly — same "visible" convention as HeroVisual/HomepageCard. Unset means visible, so every link saved before this field existed keeps rendering unchanged. */
  visible?: boolean;
}

export const personal = {
  // [Brand migration — Thanks UX] Full name, not just the first name this
  // constant held before — `data/about.json`'s live `name` field was
  // corrected to match (this constant only re-seeds it if that file is
  // ever deleted/reset, so both need to agree). The site's product/brand
  // identity is "Thanks UX" (Site Settings' `brandName`/`footerBrandName`,
  // data/settings.json) — this constant is specifically the person, not
  // the product; the two are deliberately distinct fields, per
  // `SiteSettings.brandName`'s own doc comment in lib/admin/types.ts.
  name: "Joy Howlader",

  // [Real owner profile sync] Matches the real owner's CV-stated
  // positioning exactly — was previously a 3-discipline set that included
  // "UX Research" as its own named badge; the CV's own profile paragraph
  // (see `bio` below) names only these two as the professional identity,
  // so this no longer claims a third specialty the CV doesn't state. Not
  // a removal of any platform feature — ThanksSignal/Contribution
  // category taxonomies (src/types/thanksSignal.ts, contribution.ts) are
  // a separate, unrelated list and still include UX Research as a
  // community-content category; this is specifically Joy's own personal
  // role badges.
  roles: ["UI/UX Design", "Graphic Design"] as const,

  // Single-string form of `roles`, for contexts that need one line (page
  // metadata, a resume header) rather than a list. CV's own stated title.
  title: "UI/UX and Graphic Designer",

  // [Real owner profile sync] The CV's own "Profile" paragraph, verbatim —
  // not shortened, since about.bio renders at `text-body-lg` with room for
  // a full paragraph (see about/page.tsx).
  bio: "UI/UX and Graphic Designer with 4+ years of experience in online marketplaces and agency environments. Specialized in dashboard and SaaS UI design, responsive website design, branding, and print materials. Proven ability to manage projects end-to-end — from requirement gathering and wireframing through UI design, prototyping, and developer handoff. Currently expanding expertise in workflow automation using n8n.",

  // [Phase 7 — real brand/content configuration] Matches the real value
  // already entered in Contact CMS (`contact_content.location`) — not
  // guessed, synced from data the site owner already provided elsewhere.
  location: "Dhaka, Bangladesh",
} as const;

// PROJECT_SPEC.md §4.5 / §10 — direct contact stack, in priority order,
// extended with the channels this content-architecture pass asked for
// (Facebook, Instagram, Dribbble). Fiverr was in the original spec but
// isn't part of this pass's requested channel list, so it's dropped
// rather than carried as unused inventory — easy to re-add if needed.
//
// [Real owner profile sync] Email, WhatsApp, LinkedIn, Behance, and now
// Facebook are the real owner-provided values, matching the live
// `social_links` table exactly — this seed constant only ever re-applies
// if that Supabase record is wiped/reset, and it must not silently
// reintroduce a disabled fake link (or lose a real one) when that
// happens. Instagram and Dribbble still have no confirmed real handle, so
// both remain exactly as Phase 7 left them (disabled, old placeholder
// text kept only as an editable stub in the admin, never rendered).
export const socialLinks: SocialLink[] = [
  { label: "Email", value: "neonemiami@gmail.com", href: "mailto:neonemiami@gmail.com", icon: "email", priority: "primary" },
  { label: "WhatsApp", value: "+8801303364567", href: "https://wa.me/8801303364567", icon: "whatsapp", priority: "secondary" },
  { label: "Facebook", value: "facebook.com/joy.howlader.2024", href: "https://www.facebook.com/joy.howlader.2024/", icon: "facebook", priority: "passive" },
  { label: "LinkedIn", value: "linkedin.com/in/joy-howlader", href: "https://www.linkedin.com/in/joy-howlader-386089241/", icon: "linkedin", priority: "passive" },
  { label: "Instagram", value: "Instagram profile", href: "https://instagram.com/joyuidesigns", icon: "instagram", priority: "passive", visible: false },
  { label: "Behance", value: "behance.net/neonemiami", href: "https://www.behance.net/neonemiami", icon: "behance", priority: "passive" },
  { label: "Dribbble", value: "Dribbble profile", href: "https://dribbble.com/joyuidesigns", icon: "dribbble", priority: "passive", visible: false },
];
