"use client";

import { useState } from "react";
import { SOCIAL, WA_NUMBER } from "@/lib/data";
import { HOME, digits } from "@/lib/i18n";
import { Price } from "./currency";
import { IconFacebook, IconLinkedIn, IconMenu, IconWhatsApp, IconX } from "./icons";
import { useContent, useLang } from "./lang";

const wa = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

function LangSwitch({ className = "lang" }: { className?: string }) {
  const lang = useLang();
  const { ui } = useContent();
  return (
    <div className={className} aria-label={ui.nav.language}>
      <a href={HOME.en} hrefLang="en" lang="en" aria-current={lang === "en" ? "page" : undefined}>
        EN
      </a>
      <span className="lang__sep" aria-hidden="true">
        |
      </span>
      <a href={HOME.bn} hrefLang="bn" lang="bn" aria-current={lang === "bn" ? "page" : undefined}>
        বাংলা
      </a>
    </div>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const { nav, ui } = useContent();
  const lang = useLang();

  return (
    <header className={`nav${open ? " nav--open" : ""}`}>
      <div className="nav__bar wrap">
        <a href="#top" className="nav__logo" aria-label={ui.nav.home} onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/argus-logo.webp" alt="ARGUS" width={132} height={30} />
        </a>
        <nav className="nav__links" aria-label={ui.nav.main}>
          {nav.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav__right">
          <LangSwitch />
          <a className="btn btn--line btn--sm nav__wa" href={wa(ui.wa.hello)} target="_blank" rel="noopener">
            <IconWhatsApp size={16} /> {ui.common.whatsapp}
          </a>
          <a className="btn btn--mint btn--sm nav__cta" href={wa(ui.wa.audit)} target="_blank" rel="noopener">
            {ui.common.seeAudit} · <Price bdt={2500} />
          </a>
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? ui.nav.close : ui.nav.open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <IconX size={22} /> : <IconMenu />}
          </button>
        </div>
      </div>
      <span className="nav__progress" aria-hidden="true" />
      <div id="mobile-menu" className="nav__sheet" hidden={!open}>
        {nav.map((l) => (
          <a key={l.href} href={l.href} onClick={close}>
            {l.label}
          </a>
        ))}
        <a className="btn btn--mint" href={wa(ui.wa.audit)} target="_blank" rel="noopener" onClick={close}>
          {ui.common.bookAudit} · <Price bdt={2500} />
        </a>
        <LangSwitch className="lang lang--sheet" />
        <div className="nav__social">
          <a href={SOCIAL.facebook} target="_blank" rel="noopener" onClick={close}>
            <IconFacebook size={16} /> Facebook
          </a>
          <a href={SOCIAL.linkedin} target="_blank" rel="noopener" onClick={close}>
            <IconLinkedIn size={16} /> LinkedIn
          </a>
        </div>
        <p className="nav__sheet-note">{digits(ui.nav.sheetNote, lang)}</p>
      </div>
    </header>
  );
}
