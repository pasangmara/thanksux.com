import type { SVGProps } from "react";

/**
 * Small hand-built icon set — monochrome, stroke-based, currentColor.
 * No icon library dependency added for a fixed set of ~8 marks; keeps
 * everything on-system (sharp corners, single line weight) rather than
 * inheriting a generic library's own visual style.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}

/** [Theme toggle] Sun mark — ThemeToggle.tsx's light-theme button. */
export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M3 12h2M19 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

/** [Theme toggle] Crescent moon mark — ThemeToggle.tsx's dark-theme button. */
export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z" />
    </svg>
  );
}

export function EmailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6h18v12H3z" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 18l-2 3 3.2-1.8A8 8 0 1 0 4 12a7.9 7.9 0 0 0 1.1 4.1z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.4 1-1v-1l-2-1-1 1a5 5 0 0 1-2.5-2.5l1-1-1-2H9z" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4h16v16H4z" />
      <path d="M8 10v6M8 7.5v.01M12 16v-3.5a1.8 1.8 0 0 1 3.6 0V16M12 12.5V16" />
    </svg>
  );
}

export function BehanceIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 7h6a2.5 2.5 0 0 1 0 5H3zM3 12h6.5a2.75 2.75 0 0 1 0 5.5H3z" />
      <path d="M15 10h5M14.5 15a3 3 0 0 0 5.7-1.2 3 3 0 0 0-.2-1.3c-.4-1.3-1.6-2.2-3-2.2-1.9 0-3.3 1.6-3.3 3.5s1.4 3.5 3.3 3.5c1.2 0 2.3-.7 2.8-1.7" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 21v-7h2.5l.5-3H15V9c0-.9.3-1.5 1.6-1.5H18V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.7 1.4-3.7 3.9V11H9.5v3H12v7" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="12" cy="12" r="4" />
      <path d="M16.8 7.2v.01" />
    </svg>
  );
}

export function DribbbleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M4.5 9.5c4 1.2 9 1.4 14 .3M6 18.5c2-4.5 5-8 12-9.5M9.5 4c3 3.5 4.5 8 4.5 15" />
    </svg>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5a8.5 8.5 0 0 0-2.7 16.56c.43.08.58-.19.58-.42v-1.6c-2.36.51-2.86-1.06-2.86-1.06-.39-.98-.94-1.24-.94-1.24-.77-.53.06-.52.06-.52.85.06 1.3.87 1.3.87.76 1.3 1.98.92 2.47.7.08-.55.3-.92.54-1.13-1.88-.21-3.86-.94-3.86-4.18 0-.92.33-1.68.87-2.27-.09-.21-.38-1.07.08-2.24 0 0 .71-.23 2.33.87a8.1 8.1 0 0 1 4.24 0c1.62-1.1 2.33-.87 2.33-.87.46 1.17.17 2.03.08 2.24.54.59.87 1.35.87 2.27 0 3.25-1.98 3.97-3.87 4.18.31.27.58.79.58 1.6v2.37c0 .23.15.5.59.42A8.5 8.5 0 0 0 12 3.5z" />
    </svg>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M10.5 9.5l4.5 2.5-4.5 2.5z" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 4.5l15 15M19.5 4.5l-15 15" />
    </svg>
  );
}

export function WebsiteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.4 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.4-3.6-8.5S9.6 5.8 12 3.5z" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function PersonPlaceholderIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
    </svg>
  );
}

export function ImagePlaceholderIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" />
      <circle cx="9" cy="10" r="1.25" />
      <path d="M3 16.5l5-5 4 4 3-3 6 6" />
    </svg>
  );
}

export const contactIcons = {
  email: EmailIcon,
  whatsapp: WhatsAppIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  instagram: InstagramIcon,
  behance: BehanceIcon,
  dribbble: DribbbleIcon,
  github: GitHubIcon,
  youtube: YouTubeIcon,
  x: XIcon,
  website: WebsiteIcon,
} as const;
