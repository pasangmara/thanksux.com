import Shell from "@/components/shell";
import { body, display, mono } from "@/lib/fonts";
import { bangla, banglaDisplay } from "@/lib/fonts-bn";

export { viewport } from "@/lib/metadata";

export default function BanglaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Shell lang="bn" fonts={[display, body, mono, bangla, banglaDisplay].map((f) => f.variable).join(" ")}>
      {children}
    </Shell>
  );
}
