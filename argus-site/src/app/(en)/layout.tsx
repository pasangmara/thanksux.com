import Shell from "@/components/shell";
import { banglaLite, body, display, mono } from "@/lib/fonts";

export { viewport } from "@/lib/metadata";

export default function EnglishLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Shell lang="en" fonts={[display, body, mono, banglaLite].map((f) => f.variable).join(" ")}>
      {children}
    </Shell>
  );
}
