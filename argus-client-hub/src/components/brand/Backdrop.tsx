import Image from "next/image";

/**
 * Premium brand backdrop behind the public form (Figma: FB / Backdrop):
 * mint glow top-right, deep-green glow bottom-left, fading dot grid,
 * a large ARGUS symbol watermark and a mint hairline. Purely decorative.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-bg">
      <div className="absolute -top-[260px] -right-[180px] size-[620px] rounded-full bg-mint/[0.13] blur-[150px] md:-top-[420px] md:size-[900px] md:blur-[220px]" />
      <div className="absolute -bottom-[220px] -left-[240px] size-[520px] rounded-full bg-deep/40 blur-[140px] md:size-[800px]" />
      <div
        className="absolute inset-x-0 top-0 h-[420px] opacity-60 md:h-[560px]"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1.4px)",
          backgroundSize: "26px 26px",
          maskImage: "linear-gradient(to bottom, black 10%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 10%, transparent 100%)",
        }}
      />
      <div className="absolute -right-[120px] -bottom-[80px] w-[440px] opacity-[0.06] md:-right-[60px] md:-bottom-[140px] md:w-[760px]">
        <Image src="/brand/argus-symbol.png" alt="" width={760} height={810} className="h-auto w-full" />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-mint/60 to-transparent" />
      <svg className="absolute top-[110px] right-0 hidden w-[420px] text-mint/30 md:block" viewBox="0 0 420 180" fill="none">
        <path d="M420 10 H240 L180 70 H0" stroke="currentColor" />
        <path d="M420 110 H300 L250 160 H120" stroke="currentColor" />
        <circle cx="0" cy="70" r="3.5" fill="#2bf2a1" />
        <circle cx="120" cy="160" r="3.5" fill="#2bf2a1" />
      </svg>
    </div>
  );
}
