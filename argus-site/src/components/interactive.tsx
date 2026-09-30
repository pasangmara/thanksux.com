"use client";

import { useState } from "react";
import { WA_NUMBER, toUsd, type Kit, type Pillar } from "@/lib/data";
import { bdt as fmtBdt, digits, usd as fmtUsd } from "@/lib/i18n";
import {
  CurrencySwitch,
  Money,
  PrepaySwitch,
  Price,
  cents,
  prepaid,
  prepayOff,
  setPrepay,
  useCurrency,
  usePrepay,
} from "./currency";
import { IconArrow, IconCheck, IconPlus, IconWhatsApp } from "./icons";
import { useContent, useLang } from "./lang";

const wa = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

/* ---------- Services: filter chips + bento grid ---------- */

const FILTERS: ("All" | Pillar)[] = ["All", "See", "Create", "Automate", "Grow"];

export function ServicesGrid() {
  const { services, pillars, ui } = useContent();
  const lang = useLang();
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const list = services.filter((s) => f === "All" || s.pillar === f);
  return (
    <>
      <div className="chips" role="group" aria-label={ui.services.filter}>
        {FILTERS.map((x) => (
          <button key={x} type="button" className="chip" aria-pressed={f === x} onClick={() => setF(x)}>
            {pillars[x]}
            <span className="chip__n">
              {digits(x === "All" ? services.length : services.filter((s) => s.pillar === x).length, lang)}
            </span>
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
              <span className="mono svc__n">{digits(s.n, lang)}</span>
              <span className="tag">{pillars[s.pillar]}</span>
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
                {s.from && <span className="svc__from">{ui.services.from}</span>}
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
                href={wa(ui.wa.about(s.name))}
                target="_blank"
                rel="noopener"
                aria-label={ui.services.askAria(s.name)}
              >
                {ui.services.ask} <IconArrow size={16} />
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

/* ---------- Kits: segment tabs, prepay + currency switches, live totals ---------- */

function KitCard({ k, single }: { k: Kit; single: boolean }) {
  const { ui } = useContent();
  const lang = useLang();
  const cur = useCurrency();
  const months = usePrepay();
  const off = prepayOff(months);
  const pct = digits(Math.round(off * 100), lang);
  const nText = digits(months, lang);
  const rec = k.recommended && !single;
  const savePct = digits(Math.round((1 - k.price / k.separately) * 100), lang);

  // The monthly part a prepay discount applies to: the plan price itself, or the kit's monthly fee.
  const monthlyBase = k.perMonth ? k.price : (k.monthly ?? 0);
  const base = { bdt: monthlyBase, usd: toUsd(monthlyBase) };
  const d = prepaid(monthlyBase, off);
  const total = k.perMonth
    ? { bdt: d.bdt * months, usd: cents(d.usd * months) }
    : { bdt: k.price + d.bdt * months, usd: cents(toUsd(k.price) + d.usd * months) };
  const saved = { bdt: (base.bdt - d.bdt) * months, usd: cents((base.usd - d.usd) * months) };

  const deal = off > 0 && (
    <span className="kit__deal" key={months}>
      <span className="rc__pct">−{pct}%</span> {ui.kits.savePerMonth}{" "}
      <Money bdt={base.bdt - d.bdt} usd={cents(base.usd - d.usd)} />
      {lang === "en" ? ui.common.perMonth : ""}
    </span>
  );

  return (
    <article className={`kit${rec ? " kit--rec" : ""}`}>
      {rec && <span className="kit__badge">{ui.kits.recommended}</span>}
      <p className="mono kit__code">
        {k.code} · {k.forWho}
      </p>
      <h3 className="kit__name">{k.name}</h3>
      <p className="kit__what">{k.what}</p>
      <div className="kit__price">
        {k.perMonth ? (
          <>
            {off > 0 && (
              <s className="rc__was">
                <Money {...base} />
                {ui.common.perMonth}
              </s>
            )}
            <Price bdt={d.bdt} usd={d.usd} per="mo" animate className={`price--xl${off ? " is-deal" : ""}`} />
          </>
        ) : (
          <Price bdt={k.price} className="price--xl" />
        )}
        <div className="kit__sep">
          {ui.kits.separately}{" "}
          <s>
            {cur === "USD" ? fmtUsd(k.separately, lang) : fmtBdt(k.separately, lang)}
            {k.perMonth ? ui.common.perMonth : ""}
          </s>{" "}
          <span className="kit__save">{ui.kits.save(savePct)}</span>
        </div>
        {k.monthly ? (
          <div className="kit__mo">
            {off > 0 && (
              <s className="rc__was">
                + <Money {...base} />
                {ui.common.perMonth}
              </s>
            )}
            <span className={off ? "is-deal" : ""}>
              + <Price bdt={d.bdt} usd={d.usd} per="mo" animate />
            </span>{" "}
            {off > 0 ? deal : <span className="muted">{ui.kits.monthlyNote}</span>}
          </div>
        ) : (
          <div className="kit__mo">{off > 0 ? deal : <span className="muted">{ui.kits.oneFee}</span>}</div>
        )}
        <div className="kit__total">
          <span className="kit__total-label">
            {k.perMonth ? ui.kits.totalPlan(months, nText) : ui.kits.totalKit(months, nText)}
          </span>
          <Price bdt={total.bdt} usd={total.usd} animate className="price--md" />
          {off > 0 && (
            <span className="kit__total-save" key={months}>
              {ui.kits.totalSave} <Money {...saved} />
            </span>
          )}
        </div>
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
        href={wa(ui.wa.kit(k.name, `${fmtBdt(k.price, lang)} / ${fmtUsd(k.price, lang)}`))}
        target="_blank"
        rel="noopener"
      >
        <IconWhatsApp size={18} /> {ui.kits.get(k.name)}
      </a>
    </article>
  );
}

export function Kits() {
  const { kitTabs, ui } = useContent();
  const lang = useLang();
  const months = usePrepay();
  const off = prepayOff(months);
  const [tab, setTab] = useState(kitTabs[0].id);
  const active = kitTabs.find((t) => t.id === tab) ?? kitTabs[0];

  return (
    <>
      <div className="kits__bar">
        <div className="tabs" role="tablist" aria-label={ui.kits.choose}>
          {kitTabs.map((t) => (
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
        <div className="kits__opts">
          <PrepaySwitch label={ui.kits.prepayLabel} />
          <CurrencySwitch />
        </div>
      </div>
      <p className={`kits__live${off ? " is-deal" : ""}`} aria-live="polite" key={months}>
        {off > 0 && <span className="rc__pct">−{digits(Math.round(off * 100), lang)}%</span>}
        <span>{off ? ui.kits.live(digits(months, lang), digits(Math.round(off * 100), lang)) : ui.kits.liveOff}</span>
      </p>

      <div id="kit-panel" role="tabpanel" aria-labelledby={`tab-${active.id}`} className={`kits kits--${active.kits.length}`}>
        {active.kits.map((k) => (
          <KitCard key={k.code} k={k} single={active.kits.length === 1} />
        ))}
      </div>
    </>
  );
}

/* ---------- Rate card: accordion + live prepay pricing ---------- */

function MonthlyCell({ monthly }: { monthly: number }) {
  const { ui } = useContent();
  const lang = useLang();
  const months = usePrepay();
  const off = prepayOff(months);
  const d = prepaid(monthly, off);
  const base = { bdt: monthly, usd: toUsd(monthly) };
  return (
    <span className={`rc__num rc__mo${off ? " is-deal" : ""}`} data-label={ui.rate.head[5]}>
      {off > 0 && (
        <s className="rc__was">
          <Money {...base} />
          {ui.common.perMonth}
        </s>
      )}
      <Price bdt={d.bdt} usd={d.usd} per="mo" animate />
      {off > 0 && (
        <span className="rc__deal" key={months}>
          <span className="rc__save">
            <span className="rc__pct">−{digits(Math.round(off * 100), lang)}%</span> {ui.rate.save}{" "}
            <Money bdt={base.bdt - d.bdt} usd={cents(base.usd - d.usd)} />
            {ui.common.perMonth}
          </span>
          <span className="rc__total">
            <Money bdt={d.bdt * months} usd={cents(d.usd * months)} /> {ui.rate.forMonths(digits(months, lang))}
          </span>
        </span>
      )}
    </span>
  );
}

export function RateCard() {
  const { rateGroups, ui } = useContent();
  const lang = useLang();
  const [openId, setOpenId] = useState<string | null>(rateGroups[0].id);
  const months = usePrepay();
  const off = prepayOff(months);
  const all = rateGroups.flatMap((g) => g.items);
  const monthlyCount = all.filter((i) => i.monthly).length;
  const example = all.find((i) => i.code === "AU-01");

  const choose = (m: number) => {
    setPrepay(m);
    const open = rateGroups.find((g) => g.id === openId);
    // A discount only changes monthly prices, so make sure some are on screen.
    if (prepayOff(m) && !open?.items.some((i) => i.monthly)) setOpenId("automation");
  };

  const ex = example?.monthly ?? 0;
  const exD = prepaid(ex, off);
  const exBase = { bdt: ex, usd: toUsd(ex) };
  const n = digits(months, lang);
  const pct = digits(Math.round(off * 100), lang);

  return (
    <>
      <div className="rc__bar">
        <div className="seg" role="group" aria-label={ui.rate.prepayAria}>
          {[1, 3, 12].map((m, i) => (
            <button key={m} type="button" className="seg__btn" aria-pressed={months === m} onClick={() => choose(m)}>
              {ui.prepay[i]}
            </button>
          ))}
        </div>
        <CurrencySwitch />
      </div>

      <p className={`rc__live${off ? " is-deal" : ""}`} aria-live="polite" key={months}>
        {off ? (
          <>
            <span className="rc__pct">−{pct}%</span>
            <span>
              {ui.rate.liveOn(n, digits(monthlyCount, lang), pct)} {example?.name}{" "}
              <s>
                <Money {...exBase} />
              </s>{" "}
              →{" "}
              <strong>
                <Money {...exD} />
                {ui.common.perMonth}
              </strong>
              , {ui.rate.livePay}{" "}
              <strong>
                <Money bdt={exD.bdt * months} usd={cents(exD.usd * months)} />
              </strong>{" "}
              {ui.rate.liveFor(n)}{" "}
              <strong className="mint">
                <Money bdt={(exBase.bdt - exD.bdt) * months} usd={cents((exBase.usd - exD.usd) * months)} />
              </strong>
              {lang === "bn" ? "।" : "."}
            </span>
          </>
        ) : (
          <span>{ui.rate.liveOff}</span>
        )}
      </p>

      <div className="rc">
        {rateGroups.map((g) => {
          const isOpen = openId === g.id;
          const monthlies = g.items.filter((i) => i.monthly).length;
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
                  <span className="mono muted">{ui.rate.items(g.items.length, digits(g.items.length, lang))}</span>
                  {off > 0 && monthlies > 0 && (
                    <span className="rc__tag" key={months}>
                      {ui.rate.onMonthly(pct, digits(monthlies, lang))}
                    </span>
                  )}
                  <IconPlus className="rc__plus" />
                </button>
              </h3>
              <div id={`rc-${g.id}`} className="rc__collapse" inert={!isOpen}>
                <div className="rc__inner">
                  <div className="rc__body">
                    <div className="rc__row rc__row--head mono" aria-hidden="true">
                      {ui.rate.head.map((h, i) => (
                        <span key={h}>
                          {h}
                          {i === 5 && off ? ui.rate.prepayHead(n) : ""}
                        </span>
                      ))}
                    </div>
                    {g.items.map((it) => (
                      <div key={it.code} className="rc__row">
                        <span className="mono rc__code">{it.code}</span>
                        <span className="rc__name">{it.name}</span>
                        <span className="rc__what">{it.what}</span>
                        <span className="rc__days" data-label={ui.rate.head[3]}>
                          {it.days ?? "—"}
                        </span>
                        <span className="rc__num" data-label={ui.rate.head[4]}>
                          {it.once ? <Price bdt={it.once} /> : "—"}
                        </span>
                        {it.monthly ? (
                          <MonthlyCell monthly={it.monthly} />
                        ) : (
                          <span className="rc__num" data-label={ui.rate.head[5]}>
                            —
                          </span>
                        )}
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
        {ui.rate.note}{" "}
        <a href={wa(ui.wa.audit)} target="_blank" rel="noopener">
          {ui.rate.noteLink}
        </a>
        {lang === "bn" ? "।" : "."}
      </p>
    </>
  );
}
