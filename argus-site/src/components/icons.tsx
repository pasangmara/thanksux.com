type P = { size?: number; className?: string };

const svg = (size: number, className: string | undefined, children: React.ReactNode, fill = false) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill ? "currentColor" : "none"}
    stroke={fill ? "none" : "currentColor"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const IconWhatsApp = ({ size = 20, className }: P) =>
  svg(
    size,
    className,
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />,
    true,
  );

export const IconArrow = ({ size = 18, className }: P) => svg(size, className, <path d="M5 12h14M13 6l6 6-6 6" />);
export const IconDown = ({ size = 18, className }: P) => svg(size, className, <path d="M12 5v14M6 13l6 6 6-6" />);
export const IconCheck = ({ size = 18, className }: P) => svg(size, className, <path d="M20 6 9 17l-5-5" />);
export const IconX = ({ size = 18, className }: P) => svg(size, className, <path d="M18 6 6 18M6 6l12 12" />);
export const IconChat = ({ size = 18, className }: P) =>
  svg(size, className, <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />);
export const IconEye = ({ size = 18, className }: P) =>
  svg(size, className, <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>);
export const IconGlobe = ({ size = 18, className }: P) =>
  svg(size, className, <><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></>);
export const IconCard = ({ size = 18, className }: P) =>
  svg(size, className, <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>);
export const IconShield = ({ size = 18, className }: P) =>
  svg(size, className, <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />);
export const IconPlus = ({ size = 18, className }: P) => svg(size, className, <path d="M12 5v14M5 12h14" />);
export const IconMenu = ({ size = 22, className }: P) => svg(size, className, <path d="M4 7h16M4 12h16M4 17h16" />);
export const IconSheet = ({ size = 18, className }: P) =>
  svg(size, className, <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></>);
export const IconBox = ({ size = 18, className }: P) =>
  svg(size, className, <><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5M12 13v8" /></>);

export const IconFacebook = ({ size = 18, className }: P) =>
  svg(
    size,
    className,
    <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z" />,
    true,
  );
export const IconLinkedIn = ({ size = 18, className }: P) =>
  svg(
    size,
    className,
    <path d="M6.9 8.8H3.8V20h3.1V8.8ZM5.3 3.8a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM20.2 13.6c0-3-1.6-4.9-4.2-4.9-1.4 0-2.4.8-2.8 1.5V8.8h-3V20h3.1v-5.9c0-1.5.6-2.6 1.9-2.6 1.3 0 1.9 1 1.9 2.6V20h3.1v-6.4Z" />,
    true,
  );
