"use client";

import { useState } from "react";
import { KIT_TABS, RATE_GROUPS, SERVICES, WA_AUDIT, fmtBDT, fmtUSD, waLink, type Pillar } from "@/lib/data";
import { CurrencySwitch, Price, useCurrency } from "./currency";
import { IconArrow, IconCheck, IconPlus, IconWhatsApp } from "./icons";

/* ---------- Services: filter chips + bento grid ---------- */

const FILTERS: ("All" | Pillar)[] = ["All", "See", "Create", "Automate", "Grow"];

export function ServicesGrid() {
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const list = SERVICES.filter((s) => f === "All" || s.pillar === f);
  return (
    <>
      <div className="chips" role="group" aria-label="Filter services">
        {FILTERS.map((x) => (
          <button key={x} type="button" className="chip" aria-pressed={f === x} onClick={() => setF(x)}>
            {x}
            <span className="chip__n">{x === "All" ? SERVICES.length : SERVICES.filter((s) => s.pillar === x).length}</span>
          </button>
        ))}
      </div>
      <div className="bento" data-reveal>
        {list.map((s, i) => (
          <article
            key={s.id}
            id={s.id}
            className={`svc${s.big && f === "All" ? " svc--big" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="svc__top">
              <span className="mono svc__n">{s.n}</span>
              <span className="tag">{s.pillar}</span>
            </div>
            <h3 className="svc__name">{s.name}</h3>
            <p className="svc__tag mono">{s.tag}</p>
            <p className="svc__hook">{s.hook}</p>
            <ul className="ticks">
              {s.benefits.map((b) => (
                <li key={b}>
                  <IconCheck size={16} /> {b}
                </li>
              ))}
            </ul>
            <div className="svc__price">
              <div>
                {s.from && <span className="svc__from">From </span>}
                <Price bdt={s.price} per={s.per} className="price--lg" />
                {s.monthly ? (
                  <div className="svc__sub">
                    + <Price bdt={s.monthly} per="mo" />
                  </div>
                ) : null}
                {s.note && <div className="svc__sub">{s.note}</div>}
              </div>
              <a
                className="btn btn--line btn--sm"
                href={waLink(`Hi ARGUS, I’m interested in ${s.name}.`)}
                target="_blank"
                rel="noopener"
                aria-label={`Ask about ${s.name} on WhatsApp`}
              >
                Ask <IconArrow size={16} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

/* ---------- Kits: segment tabs + currency switch ---------- */

export function Kits() {
  const [tab, setTab] = useState(KIT_TABS[0].id);
  const cur = useCurrency();
  const active = KIT_TABS.find((t) => t.id === tab) ?? KIT_TABS[0];
  const pct = (a: number, b: number) => Math.round((1 - a / b) * 100);

  return (
    <>
      <div className="kits__bar">
        <div className="tabs" role="tablist" aria-label="Choose your business">
          {KIT_TABS.map((t) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              className="tab"
              aria-selected={tab === t.id}
              aria-controls="kit-panel"
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CurrencySwitch />
      </div>

      <div id="kit-panel" role="tabpanel" aria-labelledby={`tab-${active.id}`} className={`kits kits--${active.kits.length}`}>
        {active.kits.map((k) => (
          <article key={k.code} className={`kit${k.recommended && active.kits.length > 1 ? " kit--rec" : ""}`}>
            {k.recommended && active.kits.length > 1 && <span className="kit__badge">Recommended</span>}
            <p className="mono kit__code">{k.code} · {k.forWho}</p>
            <h3 className="kit__name">{k.name}</h3>
            <p className="kit__what">{k.what}</p>
            <div className="kit__price">
              <Price bdt={k.price} per={k.perMonth ? "mo" : undefined} className="price--xl" />
              <div className="kit__sep">
                Separately <s>{cur === "USD" ? fmtUSD(k.separately) : fmtBDT(k.separately)}{k.perMonth ? "/mo" : ""}</s>{" "}
                <span className="kit__save">save {pct(k.price, k.separately)}%</span>
              </div>
              {k.monthly ? (
                <div className="kit__mo">
                  + <Price bdt={k.monthly} per="mo" /> <span className="muted">AI, hosting, tuning &amp; report</span>
                </div>
              ) : (
                <div className="kit__mo muted">One monthly fee · month-to-month</div>
              )}
            </div>
            <ul className="ticks">
              {k.includes.map((i) => (
                <li key={i}>
                  <IconCheck size={16} /> {i}
                </li>
              ))}
            </ul>
            <a
              className={`btn ${k.recommended ? "btn--mint" : "btn--line"}`}
              href={waLink(`Hi ARGUS, I want the ${k.name} (${fmtBDT(k.price)} / ${fmtUSD(k.price)}).`)}
              target="_blank"
              rel="noopener"
            >
              <IconWhatsApp size={18} /> Get {k.name}
            </a>
          </article>
        ))}
      </div>
    </>
  );
}

/* ---------- Rate card: accordion + prepay toggle ---------- */

const PREPAY = [
  { id: 1, label: "Monthly", off: 0 },
  { id: 3, label: "3 months −10%", off: 0.1 },
  { id: 12, label: "12 months −15%", off: 0.15 },
];

export function RateCard() {
  const [openId, setOpenId] = useState<string | null>(RATE_GROUPS[0].id);
  const [pp, setPp] = useState(1);
  const off = PREPAY.find((p) => p.id === pp)?.off ?? 0;

  return (
    <>
      <div className="rc__bar">
        <div className="seg" role="group" aria-label="Prepay discount on monthly plans">
          {PREPAY.map((p) => (
            <button key={p.id} type="button" className="seg__btn" aria-pressed={pp === p.id} onClick={() => setPp(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
        <CurrencySwitch />
      </div>
      <div className="rc">
        {RATE_GROUPS.map((g) => {
          const isOpen = openId === g.id;
          return (
            <div key={g.id} className={`rc__group${isOpen ? " is-open" : ""}`}>
              <h3 className="rc__h">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`rc-${g.id}`}
                  onClick={() => setOpenId(isOpen ? null : g.id)}
                >
                  <span>{g.label}</span>
                  <span className="mono muted">
                    {g.items.length} {g.items.length === 1 ? "item" : "items"}
                  </span>
                  <IconPlus className="rc__plus" />
                </button>
              </h3>
              <div id={`rc-${g.id}`} className="rc__collapse" inert={!isOpen}>
                <div className="rc__inner">
                <div className="rc__body">
                <div className="rc__row rc__row--head mono" aria-hidden="true">
                  <span>Code</span>
                  <span>Package</span>
                  <span>What you get</span>
                  <span>Delivery</span>
                  <span>One-time</span>
                  <span>Monthly</span>
                </div>
                {g.items.map((it) => (
                  <div key={it.code} className="rc__row">
                    <span className="mono rc__code">{it.code}</span>
                    <span className="rc__name">{it.name}</span>
                    <span className="rc__what">{it.what}</span>
                    <span className="rc__days" data-label="Delivery">{it.days ?? "—"}</span>
                    <span className="rc__num" data-label="One-time">{it.once ? <Price bdt={it.once} /> : "—"}</span>
                    <span className="rc__num" data-label="Monthly">
                      {it.monthly ? <Price bdt={Math.round(it.monthly * (1 - off))} per="mo" /> : "—"}
                    </span>
                  </div>
                ))}
                </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="rc__note">
        {off ? `Showing monthly prices with ${Math.round(off * 100)}% prepay discount. ` : ""}
        Prices exclude VAT. Ad spend and WhatsApp template fees are paid by you at cost (0% markup). USD at 1 USD = ৳122.77.
        Need something else? <a href={WA_AUDIT} target="_blank" rel="noopener">Start with a SEE Audit</a>.
      </p>
    </>
  );
}
