import type { Lang } from "@/lib/i18n";
import { CONTENT } from "@/lib/content";
import ScrollFx from "./fx";
import { LangProvider } from "./lang";
import Nav from "./nav";
import "../app/globals.css";

// The <html> shell shared by the English and Bangla root layouts.
export default function Shell({ lang, fonts, children }: { lang: Lang; fonts: string; children: React.ReactNode }) {
  return (
    <html lang={lang} className={fonts}>
      <body>
        <LangProvider lang={lang}>
          <a className="skip" href="#services">
            {CONTENT[lang].ui.nav.skip}
          </a>
          <Nav />
          {children}
          <ScrollFx />
        </LangProvider>
      </body>
    </html>
  );
}
