import type { ReactNode } from "react";
import { Button } from "@/components/ui";

const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

function isSafeExternalUrl(url: string): boolean {
  try {
    return SAFE_PROTOCOLS.has(new URL(url).protocol);
  } catch {
    return false;
  }
}

/**
 * [Phase 6F §7/§16 — safe outbound links] A plain external link, never an
 * embed — this project has no Figma-embedding architecture to reuse, and
 * the brief is explicit not to build one. Renders nothing for a
 * missing/malformed/unsafe URL (e.g. `javascript:`) rather than throwing —
 * every caller passes admin/contributor-entered free text with no format
 * guarantee, same defensive posture as the rest of this phase's "only
 * render when content exists" rule.
 */
export function ExternalLinkButton({
  href,
  children,
  variant = "secondary",
}: {
  href: string | null | undefined;
  children: ReactNode;
  variant?: "primary" | "secondary" | "text-link";
}) {
  if (!href || !isSafeExternalUrl(href)) return null;
  return (
    <Button href={href} variant={variant} target="_blank" rel="noopener noreferrer">
      {children}
    </Button>
  );
}
