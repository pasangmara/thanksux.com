import Image from "next/image";
import { PHONE, SOCIAL, WA_NUMBER } from "@/lib/data";
import { CONTENT, type Content } from "@/lib/content";
import { digits, type Lang } from "@/lib/i18n";
import { Price } from "./currency";
import { Kits, RateCard, ServicesGrid } from "./interactive";
import JsonLd from "./json-ld";
import {
  IconArrow,
  IconBox,
  IconCard,
  IconChat,
  IconCheck,
  IconDown,
  IconEye,
  IconFacebook,
  IconGlobe,
  IconLinkedIn,
  IconPlus,
  IconSheet,
  IconShield,
  IconWhatsApp,
} from "./icons";

type P = { c: Content };

const d = (i: number) => ({ "--d": `${i * 90}ms` }) as React.CSSProperties;
const wa = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

function H2({ pair, className = "h2" }: { pair: [string, string]; className?: string }) {
  return (
    <h2 className={className} data-reveal>
      {pair[0]}
      <span className="mint">{pair[1]}</span>
    </h2>
  );
}

function NextStep({ c, primary, secondary }: P & { primary: React.ReactNode; secondary?: React.ReactNode }) {
  return (
    <div className="next" data-reveal>
      <span className="mono next__label">{c.ui.common.nextStep}</span>
      <div className="next__btns">
        {primary}
        {secondary}
      </div>
    </div>
  );
}

const WaBtn = ({ children, href, cls = "btn--mint" }: { children: React.ReactNode; href: string; cls?: string }) => (
  <a className={`btn ${cls}`} href={href} target="_blank" rel="noopener">
    {children}
  </a>
);

const Jump = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a className="btn btn--line" href={href}>
    {children} <IconDown size={16} />
  </a>
);

function Hero({ c }: P) {
  const u = c.ui.hero;
  return (
    <section id="top" className="sec sec--green hero dots">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <h1 className="eyebrow hero__h1">
            <IconGlobe size={14} /> {u.h1}
          </h1>
          <p className="hero__display display">
            {u.words.map((w, i) => (
              <span key={w}>
                <span className="word" style={d(i + 1)}>
                  {w}
                </span>{" "}
              </span>
            ))}
            <span className="word mint" style={d(5)}>
              {u.oneTeam}
            </span>
          </p>
          <p className="hero__sub">{u.sub}</p>
          <div className="hero__ctas">
            <WaBtn href={wa(c.ui.wa.audit)}>
              {c.ui.common.bookAudit} · <Price bdt={2500} />
            </WaBtn>
            <a className="btn btn--line" href="#pricing">
              {u.seePricing} <IconDown size={16} />
            </a>
          </div>
          <ul className="trust">
            <li>
              <IconShield size={14} /> {u.trust[0]}
            </li>
            <li>
              <IconCard size={14} /> {u.trust[1]}
            </li>
            <li>
              <IconChat size={14} /> {u.trust[2]}
            </li>
          </ul>
        </div>

        <div className="hero__media">
          <div className="photo">
            <Image
              src="/img/joy-howlader-poster.webp"
              alt={u.posterAlt}
              width={1000}
              height={1000}
              priority
              sizes="(max-width: 900px) 100vw, 460px"
            />
          </div>
          <div className="live" aria-label={u.liveLabel}>
            <span className="tag live__demo">{c.ui.common.demo}</span>
            <div className="live__chip live__ad">
              <IconEye size={14} /> {u.liveAd}
            </div>
            <div className="bubble bubble--in live__q" lang="en">
              {u.liveQ}
              <span className="bubble__meta" lang={c.lang}>
                {u.liveQTime}
              </span>
            </div>
            <div className="bubble bubble--out live__typing" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="bubble bubble--out live__a">
              {u.liveA}
              <span className="bubble__meta mint">{u.liveAMeta}</span>
            </div>
            <div className="live__chip live__ok">
              <IconCheck size={14} /> {u.liveOk}
            </div>
          </div>
        </div>
      </div>
      <a className="cue" href="#problem" aria-label={u.cueLabel}>
        <span className="cue__mouse" aria-hidden="true" />
        {u.cue}
      </a>
    </section>
  );
}

function Marquee({ c }: P) {
  const items = [...c.promises, ...c.ui.marquee.extra];
  return (
    <div className="marquee" aria-label={c.ui.marquee.label}>
      <div className="marquee__track">
        {[0, 1].map((k) => (
          <ul key={k} aria-hidden={k === 1}>
            {items.map((t) => (
              <li key={t}>
                <span className="marquee__dot" />
                {t}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

function Problem({ c }: P) {
  const u = c.ui.problem;
  return (
    <section id="problem" className="sec sec--dark">
      <div className="wrap split">
        <div>
          <p className="eyebrow" data-reveal>
            {u.eyebrow}
          </p>
          <H2 pair={u.h2} />
          <p className="lead" data-reveal>
            {u.lead}
          </p>
        </div>
        <div className="inbox" aria-label={u.inbox}>
          <span className="tag inbox__tag">{c.ui.common.example}</span>
          {c.problems.map((p, i) => (
            <div key={p.text} className={`bubble ${p.own ? "bubble--own" : "bubble--in"}`} data-reveal style={d(i)}>
              <span lang="en">{p.text}</span>
              <span className="bubble__meta">
                {p.who} · {p.time}
              </span>
            </div>
          ))}
          <div className="parcel" data-reveal style={d(5)}>
            <IconBox size={20} />
            <div>
              <strong>{u.parcelTitle}</strong>
              <span>{u.parcelText}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="wrap">
        <NextStep
          c={c}
          primary={<WaBtn href={wa(c.ui.wa.audit)}>{u.cta}</WaBtn>}
          secondary={<Jump href="#system">{u.next}</Jump>}
        />
      </div>
    </section>
  );
}

function System({ c }: P) {
  const u = c.ui.system;
  return (
    <section id="system" className="sec sec--green dots">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          {u.eyebrow}
        </p>
        <H2 pair={u.h2} />
        <div className="sys" data-progress="center">
          <aside className="sys__nav">
            <div className="sys__bar">
              <span />
            </div>
            {c.systemSteps.map((s) => (
              <a key={s.id} href={`#step-${s.id}`} className="sys__link" data-step-link={s.id} lang="en">
                <span className="mono">{s.n}</span> {s.title}
              </a>
            ))}
            <ol className="chain" aria-label={u.chainLabel}>
              {c.chain.map((x, i) => (
                <li key={x}>
                  {x}
                  {i < c.chain.length - 1 && <IconArrow size={14} />}
                </li>
              ))}
            </ol>
          </aside>
          <div className="sys__panels">
            {c.systemSteps.map((s) => (
              <article key={s.id} id={`step-${s.id}`} className="sys__panel" data-step={s.id} data-reveal>
                <span className="mono sys__n">{s.n}</span>
                <h3 className="h3" lang="en">
                  {s.title}
                </h3>
                <p className="sys__line">{s.line}</p>
                <p className="muted-2">{s.body}</p>
                <ul className="pills">
                  {s.services.map((x) => (
                    <li key={x} className="pill">
                      {x}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
        <NextStep c={c} primary={<Jump href="#services">{u.next}</Jump>} />
      </div>
    </section>
  );
}

function Services({ c }: P) {
  const u = c.ui.services;
  return (
    <section id="services" className="sec sec--dark">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          {u.eyebrow}
        </p>
        <H2 pair={u.h2} />
        <ServicesGrid />
        <NextStep
          c={c}
          primary={<Jump href="#pricing">{u.next}</Jump>}
          secondary={
            <a className="btn btn--ghost" href="#rate-card">
              {u.rateCard} <IconArrow size={16} />
            </a>
          }
        />
      </div>
    </section>
  );
}

function Pricing({ c }: P) {
  const u = c.ui.pricing;
  return (
    <section id="pricing" className="sec sec--green dots">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          {u.eyebrow}
        </p>
        <H2 pair={u.h2} />
        <p className="lead" data-reveal>
          {u.lead}
        </p>
        <Kits />
        <div className="pay" data-reveal>
          <div className="pay__head">
            <h3 className="h4">{u.payTitle}</h3>
            <p className="muted-2">{u.paySub}</p>
          </div>
          <div className="pay__col">
            <p className="mono pay__label">{u.payBd}</p>
            <ul className="pills">
              {c.payments.bd.map((p) => (
                <li key={p} className="pill">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="pay__col">
            <p className="mono pay__label">{u.payAbroad}</p>
            <ul className="pills">
              {c.payments.abroad.map((p) => (
                <li key={p} className="pill">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <ul className="pay__terms">
            {c.payments.terms.map((t) => (
              <li key={t}>
                <IconCheck size={14} /> {t}
              </li>
            ))}
          </ul>
        </div>
        <NextStep
          c={c}
          primary={
            <WaBtn href={wa(c.ui.wa.audit)}>
              {c.ui.common.bookAudit} · <Price bdt={2500} />
            </WaBtn>
          }
          secondary={
            <WaBtn cls="btn--line" href={wa(c.ui.wa.pricing)}>
              <IconWhatsApp size={18} /> {u.talk}
            </WaBtn>
          }
        />
      </div>
    </section>
  );
}

function RateCardSection({ c }: P) {
  const u = c.ui.rate;
  return (
    <section id="rate-card" className="sec sec--dark">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          {u.eyebrow}
        </p>
        <H2 pair={u.h2} />
        <p className="lead" data-reveal>
          {u.lead}
        </p>
        <RateCard />
        <NextStep
          c={c}
          primary={<WaBtn href={wa(c.ui.wa.audit)}>{u.cta}</WaBtn>}
          secondary={<Jump href="#compare">{u.next}</Jump>}
        />
      </div>
    </section>
  );
}

function Compare({ c }: P) {
  const u = c.ui.compare;
  return (
    <section id="compare" className="sec sec--green">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          {u.eyebrow}
        </p>
        <H2 pair={u.h2} />
        <div className="cmp" role="table" aria-label={u.aria}>
          <div className="cmp__row cmp__row--head" role="row">
            <span role="columnheader" />
            {c.compare.cols.map((col, i) => (
              <span key={col} role="columnheader" className={i === 0 ? "cmp__us" : ""}>
                {col}
              </span>
            ))}
          </div>
          {c.compare.rows.map((r, ri) => (
            <div key={r.label} className="cmp__row" role="row" data-reveal style={d(ri)}>
              <span role="rowheader" className="cmp__label">
                {r.label}
              </span>
              {r.cells.map((cell, i) => (
                <span key={i} role="cell" className={i === 0 ? "cmp__us" : ""} data-col={c.compare.cols[i]}>
                  {i === 0 && <IconCheck size={16} />}
                  {cell}
                </span>
              ))}
            </div>
          ))}
        </div>
        <NextStep c={c} primary={<Jump href="#how-it-works">{u.next}</Jump>} />
      </div>
    </section>
  );
}

function How({ c }: P) {
  const u = c.ui.how;
  return (
    <section id="how-it-works" className="sec sec--dark">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          {u.eyebrow}
        </p>
        <H2 pair={u.h2} />
        <ol className="tl" data-progress>
          <span className="tl__line" aria-hidden="true">
            <span />
          </span>
          {c.steps.map((s, i) => (
            <li key={s.n} className="tl__step" data-reveal style={d(i)}>
              <span className="tl__dot mono">{s.n}</span>
              <p className="mono muted">{s.time}</p>
              <h3 className="h4">{s.title}</h3>
              <p className="muted-2">{s.body}</p>
            </li>
          ))}
        </ol>
        <NextStep
          c={c}
          primary={
            <WaBtn href={wa(c.ui.wa.audit)}>
              {u.cta}
              <Price bdt={2500} />
            </WaBtn>
          }
        />
      </div>
    </section>
  );
}

function Demos({ c }: P) {
  const u = c.ui.demos;
  return (
    <section id="demos" className="sec sec--green dots">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          {u.eyebrow}
        </p>
        <H2 pair={u.h2} />
        <p className="lead" data-reveal>
          {u.lead}
        </p>
        <div className="demos">
          <figure className="story" data-reveal>
            <span className="tag demos__tag">{c.ui.common.demo}</span>
            <video
              controls
              playsInline
              preload="none"
              poster="/media/story-poster.webp"
              src="/media/argus-story.mp4"
              width={720}
              height={1280}
              aria-label={u.storyAria}
            />
            <figcaption>
              <strong>{u.storyTitle}</strong>
              <span>{u.storyMeta}</span>
            </figcaption>
          </figure>
          <div className="reels" tabIndex={0} aria-label={u.reels}>
            {c.demos.map((r, i) => (
              <figure key={r.id} className="reel" data-reveal style={d(i)}>
                <span className="tag demos__tag">{c.ui.common.demo}</span>
                <video
                  muted
                  loop
                  playsInline
                  preload="none"
                  poster={`/media/reel-${r.id}.webp`}
                  data-src={`/media/reel-${r.id}.mp4`}
                  data-inview="play"
                  width={360}
                  height={640}
                  aria-label={r.alt}
                />
                <figcaption>{r.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
        <NextStep
          c={c}
          primary={
            <WaBtn href={wa(c.ui.wa.demos)}>
              <IconWhatsApp size={18} /> {u.cta}
            </WaBtn>
          }
        />
      </div>
    </section>
  );
}

function Founder({ c }: P) {
  const u = c.ui.founder;
  return (
    <section id="founder" className="sec sec--dark">
      <div className="wrap founder">
        <div className="founder__photo" data-reveal>
          <Image
            src="/img/joy-howlader-poster.webp"
            alt={c.ui.hero.posterAlt}
            width={1000}
            height={1000}
            sizes="(max-width: 900px) 100vw, 440px"
          />
        </div>
        <div>
          <p className="eyebrow" data-reveal>
            {u.eyebrow}
          </p>
          <H2 pair={u.h2} />
          <p className="lead" data-reveal>
            {u.lead}
          </p>
          <p className="muted-2" data-reveal>
            {u.body}
          </p>
          <p className="mono mint founder__sig" data-reveal lang="en">
            See . Create . Automate .
          </p>
          <div className="social" data-reveal>
            <a className="btn btn--line btn--sm" href={SOCIAL.linkedin} target="_blank" rel="noopener me">
              <IconLinkedIn size={16} /> {u.linkedin}
            </a>
            <a className="btn btn--line btn--sm" href={SOCIAL.facebook} target="_blank" rel="noopener">
              <IconFacebook size={16} /> {u.facebook}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Guarantees({ c }: P) {
  const u = c.ui.guarantees;
  return (
    <section id="guarantees" className="sec sec--green">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          {u.eyebrow}
        </p>
        <H2 pair={u.h2} />
        <div className="guar">
          {c.guarantees.map((g, i) => (
            <article key={g.title} className="guar__card" data-reveal style={d(i)}>
              <IconShield size={22} className="mint" />
              <h3 className="h4">{g.title}</h3>
              <p className="muted-2">{g.body}</p>
            </article>
          ))}
        </div>
        <NextStep
          c={c}
          primary={<WaBtn href={wa(c.ui.wa.audit)}>{c.ui.common.bookAudit}</WaBtn>}
          secondary={<Jump href="#faq">{u.faq}</Jump>}
        />
      </div>
    </section>
  );
}

function Faq({ c }: P) {
  const u = c.ui.faq;
  return (
    <section id="faq" className="sec sec--dark">
      <div className="wrap faq">
        <div>
          <p className="eyebrow" data-reveal>
            {u.eyebrow}
          </p>
          <H2 pair={u.h2} />
          <p className="muted-2" data-reveal>
            {u.sub}
          </p>
          <WaBtn cls="btn--line" href={wa(c.ui.wa.question)}>
            <IconWhatsApp size={18} /> {digits(PHONE, c.lang)}
          </WaBtn>
        </div>
        <div className="faq__list">
          {c.faq.map((f, i) => (
            <details key={f.q} className="faq__item" open={i === 0}>
              <summary>
                <h3>{f.q}</h3>
                <IconPlus className="faq__plus" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ c }: P) {
  const u = c.ui.cta;
  return (
    <section id="start" className="sec sec--cta dots">
      <div className="wrap cta">
        <p className="eyebrow" data-reveal>
          {u.eyebrow}
        </p>
        <H2 pair={u.h2} className="cta__h display" />
        <p className="lead" data-reveal>
          {u.leadA}
          <Price bdt={2500} />
          {u.leadB}
        </p>
        <div className="hero__ctas cta__btns" data-reveal>
          <WaBtn href={wa(c.ui.wa.audit)}>
            <IconWhatsApp size={18} /> {c.ui.common.whatsapp} {digits(PHONE, c.lang)}
          </WaBtn>
          <a className="btn btn--line" href="#pricing">
            {u.seePricing} <IconArrow size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer({ c }: P) {
  const u = c.ui.footer;
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/argus-logo.webp" alt="ARGUS" width={150} height={34} loading="lazy" />
          <p className="mono muted footer__tag" lang="en">
            See . Create . Automate .
          </p>
          <a className="footer__wa" href={wa(c.ui.wa.hello)} target="_blank" rel="noopener">
            <IconWhatsApp size={16} /> {digits(PHONE, c.lang)}
          </a>
          <p className="muted">{u.place}</p>
          <div className="footer__social">
            <a href={SOCIAL.facebook} target="_blank" rel="noopener" aria-label={u.fbAria}>
              <IconFacebook size={18} />
            </a>
            <a href={SOCIAL.linkedin} target="_blank" rel="noopener" aria-label={u.liAria}>
              <IconLinkedIn size={18} />
            </a>
          </div>
        </div>
        <nav aria-label={u.servicesH}>
          <p className="mono footer__h">{u.servicesH}</p>
          {u.services.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <nav aria-label={u.companyH}>
          <p className="mono footer__h">{u.companyH}</p>
          {u.company.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div>
          <p className="mono footer__h">{u.payH}</p>
          <p className="muted">{c.payments.bd.join(" · ")}</p>
          <p className="muted">{c.payments.abroad.join(" · ")}</p>
        </div>
      </div>
      <div className="wrap footer__about">
        <h2 className="mono footer__h">{u.aboutH}</h2>
        <p>{u.about}</p>
        <p className="muted footer__copy">{u.copy}</p>
      </div>
    </footer>
  );
}

function FloatingWa({ c }: P) {
  return (
    <>
      <a className="fab" href={wa(c.ui.wa.hello)} target="_blank" rel="noopener" aria-label={`${c.ui.floating.aria} ${PHONE}`}>
        <IconWhatsApp size={26} />
      </a>
      <div className="mbar">
        <a className="btn btn--mint" href={wa(c.ui.wa.hello)} target="_blank" rel="noopener">
          <IconWhatsApp size={18} /> {c.ui.common.whatsapp}
        </a>
        <a className="btn btn--line" href="#pricing">
          <IconSheet size={16} /> {c.ui.floating.prices}
        </a>
      </div>
    </>
  );
}

export default function Home({ lang }: { lang: Lang }) {
  const c = CONTENT[lang];
  return (
    <>
      <JsonLd lang={lang} />
      <main>
        <Hero c={c} />
        <Marquee c={c} />
        <Problem c={c} />
        <System c={c} />
        <Services c={c} />
        <Pricing c={c} />
        <RateCardSection c={c} />
        <Compare c={c} />
        <How c={c} />
        <Demos c={c} />
        <Founder c={c} />
        <Guarantees c={c} />
        <Faq c={c} />
        <FinalCta c={c} />
      </main>
      <Footer c={c} />
      <FloatingWa c={c} />
    </>
  );
}
