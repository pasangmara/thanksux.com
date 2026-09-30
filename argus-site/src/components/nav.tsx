"use client";

import { useState } from "react";
import { NAV_LINKS, WA_AUDIT, waLink } from "@/lib/data";
import { Price } from "./currency";
import { IconMenu, IconWhatsApp, IconX } from "./icons";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className={`nav${open ? " nav--open" : ""}`}>
      <div className="nav__bar wrap">
        <a href="#top" className="nav__logo" aria-label="ARGUS home" onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/argus-logo.webp" alt="ARGUS" width={132} height={30} />
        </a>
        <nav className="nav__links" aria-label="Main">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={close}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav__right">
          <div className="lang" aria-label="Language">
            <span className="lang__on" aria-current="true">EN</span>
            <span className="lang__sep">|</span>
            <span className="lang__off" title="Bangla page coming soon" aria-disabled="true" lang="bn">
              বাংলা
            </span>
          </div>
          <a className="btn btn--line btn--sm nav__wa" href={waLink()} target="_blank" rel="noopener">
            <IconWhatsApp size={16} /> WhatsApp
          </a>
          <a className="btn btn--mint btn--sm nav__cta" href={WA_AUDIT} target="_blank" rel="noopener">
            SEE Audit · <Price bdt={2500} />
          </a>
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <IconX size={22} /> : <IconMenu />}
          </button>
        </div>
      </div>
      <div id="mobile-menu" className="nav__sheet" hidden={!open}>
        {NAV_LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={close}>
            {l.label}
          </a>
        ))}
        <a className="btn btn--mint" href={WA_AUDIT} target="_blank" rel="noopener" onClick={close}>
          Book SEE Audit · <Price bdt={2500} />
        </a>
        <p className="nav__sheet-note">English · Bangla · Banglish — Bangladesh &amp; worldwide</p>
      </div>
    </header>
  );
}
