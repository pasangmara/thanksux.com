import Image from "next/image";
import {
  CHAIN,
  COMPARE,
  DEMOS,
  FAQ,
  FOUNDER,
  GUARANTEES,
  PAYMENTS,
  PHONE,
  PROBLEMS,
  PROMISES,
  STEPS,
  SYSTEM_STEPS,
  WA_AUDIT,
  waLink,
} from "@/lib/data";
import { Price } from "@/components/currency";
import { Kits, RateCard, ServicesGrid } from "@/components/interactive";
import JsonLd from "@/components/json-ld";
import {
  IconArrow,
  IconBox,
  IconCard,
  IconChat,
  IconCheck,
  IconDown,
  IconEye,
  IconGlobe,
  IconPlus,
  IconSheet,
  IconShield,
  IconWhatsApp,
} from "@/components/icons";

const d = (i: number) => ({ "--d": `${i * 90}ms` }) as React.CSSProperties;

function NextStep({ primary, secondary }: { primary: React.ReactNode; secondary?: React.ReactNode }) {
  return (
    <div className="next" data-reveal>
      <span className="mono next__label">Next step</span>
      <div className="next__btns">
        {primary}
        {secondary}
      </div>
    </div>
  );
}

const WaBtn = ({ children, text, cls = "btn--mint" }: { children: React.ReactNode; text?: string; cls?: string }) => (
  <a className={`btn ${cls}`} href={text ? waLink(text) : WA_AUDIT} target="_blank" rel="noopener">
    {children}
  </a>
);

const Jump = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a className="btn btn--line" href={href}>
    {children} <IconDown size={16} />
  </a>
);

function Hero() {
  const words = ["Brand.", "Website.", "AI replies.", "Ads."];
  return (
    <section id="top" className="sec sec--green hero dots">
      <div className="wrap hero__grid">
        <div className="hero__copy">
          <h1 className="eyebrow hero__h1">
            <IconGlobe size={14} /> Branding, website design, AI chatbots &amp; Facebook ads — for businesses in Bangladesh and worldwide
          </h1>
          <p className="hero__display display">
            {words.map((w, i) => (
              <span key={w}>
                <span className="word" style={d(i + 1)}>
                  {w}
                </span>{" "}
              </span>
            ))}
            <span className="word mint" style={d(5)}>
              One team.
            </span>
          </p>
          <p className="hero__sub">
            For businesses in Bangladesh and abroad that sell on Facebook, Instagram, WhatsApp and the web. Fixed prices in BDT
            &amp; USD. Everything in your name.
          </p>
          <div className="hero__ctas">
            <WaBtn>
              Book SEE Audit · <Price bdt={2500} />
            </WaBtn>
            <a className="btn btn--line" href="#pricing">
              See pricing <IconDown size={16} />
            </a>
          </div>
          <ul className="trust">
            <li>
              <IconShield size={14} /> 30-day free fixes
            </li>
            <li>
              <IconCard size={14} /> bKash · Nagad · Card · PayPal · Wise
            </li>
            <li>
              <IconChat size={14} /> English · Bangla · Banglish
            </li>
          </ul>
        </div>

        <div className="hero__media">
          <div className="photo">
            <Image
              src="/img/joy-howlader-argus-studio.webp"
              alt="Joy Howlader, founder of ARGUS, at the ARGUS studio"
              width={900}
              height={1146}
              priority
              sizes="(max-width: 900px) 100vw, 460px"
            />
            <div className="live" aria-label="Demo: an ad turns into an order">
              <span className="tag live__demo">Demo</span>
              <div className="live__chip live__ad">
                <IconEye size={14} /> Ad · Click to WhatsApp
              </div>
              <div className="bubble bubble--in live__q">
                dam koto? M size ache?<span className="bubble__meta">1:12 AM</span>
              </div>
              <div className="bubble bubble--out live__a">
                ৳1,250 · M in stock · 2 days. Order korben?<span className="bubble__meta mint">AI reply · 3 sec</span>
              </div>
              <div className="live__chip live__ok">
                <IconCheck size={14} /> Order saved to sheet
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Marquee() {
  const items = [...PROMISES, ...PAYMENTS.bd.slice(0, 2), "PayPal", "Wise", "Payoneer", "Stripe", "Card"];
  return (
    <div className="marquee" aria-label="What you can count on">
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

function Problem() {
  return (
    <section id="problem" className="sec sec--dark">
      <div className="wrap split">
        <div>
          <p className="eyebrow" data-reveal>
            Facebook page · Messenger · WhatsApp
          </p>
          <h2 className="h2" data-reveal>
            Running a Facebook page means <span className="mint">100 small problems.</span>
          </h2>
          <p className="lead" data-reveal>
            Messages at 1 AM. The same price question 100 times. Fake COD orders. Boosts that bring likes, not sales. A logo
            from one person, a website from another, a bot from a third — and none of it talks to each other.
          </p>
        </div>
        <div className="inbox" aria-label="Example inbox">
          <span className="tag inbox__tag">Example</span>
          {PROBLEMS.map((p, i) => (
            <div key={p.text} className={`bubble ${p.who === "Owner" ? "bubble--own" : "bubble--in"}`} data-reveal style={d(i)}>
              {p.text}
              <span className="bubble__meta">
                {p.who} · {p.time}
              </span>
            </div>
          ))}
          <div className="parcel" data-reveal style={d(5)}>
            <IconBox size={20} />
            <div>
              <strong>Parcel returned</strong>
              <span>COD order · customer not reachable · ৳130 delivery lost</span>
            </div>
          </div>
        </div>
      </div>
      <div className="wrap">
        <NextStep primary={<WaBtn>Fix this with ARGUS</WaBtn>} secondary={<Jump href="#system">See the system</Jump>} />
      </div>
    </section>
  );
}

function System() {
  return (
    <section id="system" className="sec sec--green dots">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          Brand design · websites · AI automation
        </p>
        <h2 className="h2" data-reveal>
          See. Create. Automate. — <span className="mint">one team, one system.</span>
        </h2>
        <div className="sys">
          <aside className="sys__nav" data-progress>
            <div className="sys__bar">
              <span />
            </div>
            {SYSTEM_STEPS.map((s) => (
              <a key={s.id} href={`#step-${s.id}`} className="sys__link" data-step-link={s.id}>
                <span className="mono">{s.n}</span> {s.title}
              </a>
            ))}
            <ol className="chain" aria-label="How it connects">
              {CHAIN.map((c, i) => (
                <li key={c}>
                  {c}
                  {i < CHAIN.length - 1 && <IconArrow size={14} />}
                </li>
              ))}
            </ol>
          </aside>
          <div className="sys__panels">
            {SYSTEM_STEPS.map((s) => (
              <article key={s.id} id={`step-${s.id}`} className="sys__panel" data-step={s.id} data-reveal>
                <span className="mono sys__n">{s.n}</span>
                <h3 className="h3">{s.title}</h3>
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
        <NextStep primary={<Jump href="#services">See all 10 services</Jump>} />
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="services" className="sec sec--dark">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          Logo design · website design · AI chatbot · Facebook ads
        </p>
        <h2 className="h2" data-reveal>
          10 services: branding, websites, AI chatbots &amp; ads — <span className="mint">every price on the page.</span>
        </h2>
        <ServicesGrid />
        <NextStep
          primary={<Jump href="#pricing">Compare kits &amp; prices</Jump>}
          secondary={
            <a className="btn btn--ghost" href="#rate-card">
              Full rate card <IconArrow size={16} />
            </a>
          }
        />
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="sec sec--green dots">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          Packages · BDT &amp; USD
        </p>
        <h2 className="h2" data-reveal>
          Website, chatbot &amp; ads packages — <span className="mint">pick a kit, save ~15%.</span>
        </h2>
        <p className="lead" data-reveal>
          Outside Bangladesh? We work in English, meet on Google Meet or Zoom and quote in USD.
        </p>
        <Kits />
        <div className="pay" data-reveal>
          <div className="pay__head">
            <h3 className="h4">Pay your way</h3>
            <p className="muted-2">Invoice + receipt every time.</p>
          </div>
          <div className="pay__col">
            <p className="mono pay__label">Bangladesh · BDT</p>
            <ul className="pills">
              {PAYMENTS.bd.map((p) => (
                <li key={p} className="pill">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="pay__col">
            <p className="mono pay__label">Abroad · USD</p>
            <ul className="pills">
              {PAYMENTS.abroad.map((p) => (
                <li key={p} className="pill">
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <ul className="pay__terms">
            {PAYMENTS.terms.map((t) => (
              <li key={t}>
                <IconCheck size={14} /> {t}
              </li>
            ))}
          </ul>
        </div>
        <NextStep
          primary={
            <WaBtn>
              Book SEE Audit · <Price bdt={2500} />
            </WaBtn>
          }
          secondary={
            <WaBtn cls="btn--line" text="Hi ARGUS, I have a question about pricing.">
              <IconWhatsApp size={18} /> Talk on WhatsApp
            </WaBtn>
          }
        />
      </div>
    </section>
  );
}

function RateCardSection() {
  return (
    <section id="rate-card" className="sec sec--dark">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          Digital marketing prices · no hidden cost
        </p>
        <h2 className="h2" data-reveal>
          Full rate card — <span className="mint">prices in BDT &amp; USD.</span>
        </h2>
        <p className="lead" data-reveal>
          Every service, what’s inside, how long it takes. Monthly plans are month-to-month; prepay and save.
        </p>
        <RateCard />
        <NextStep
          primary={<WaBtn>Not sure? Start with a SEE Audit</WaBtn>}
          secondary={<Jump href="#compare">See how we compare</Jump>}
        />
      </div>
    </section>
  );
}

function Compare() {
  return (
    <section id="compare" className="sec sec--green">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          Agency vs freelancer vs software
        </p>
        <h2 className="h2" data-reveal>
          Better than a freelancer. <span className="mint">Less than a big agency.</span>
        </h2>
        <div className="cmp" role="table" aria-label="ARGUS compared with a freelancer, a big agency and a DIY app">
          <div className="cmp__row cmp__row--head" role="row">
            <span role="columnheader" />
            {COMPARE.cols.map((c, i) => (
              <span key={c} role="columnheader" className={i === 0 ? "cmp__us" : ""}>
                {c}
              </span>
            ))}
          </div>
          {COMPARE.rows.map((r, ri) => (
            <div key={r.label} className="cmp__row" role="row" data-reveal style={d(ri)}>
              <span role="rowheader" className="cmp__label">
                {r.label}
              </span>
              {r.cells.map((c, i) => (
                <span key={i} role="cell" className={i === 0 ? "cmp__us" : ""} data-col={COMPARE.cols[i]}>
                  {i === 0 && <IconCheck size={16} />}
                  {c}
                </span>
              ))}
            </div>
          ))}
        </div>
        <NextStep primary={<Jump href="#how-it-works">See how it works</Jump>} />
      </div>
    </section>
  );
}

function How() {
  return (
    <section id="how-it-works" className="sec sec--dark">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          How it works
        </p>
        <h2 className="h2" data-reveal>
          From first message to launch <span className="mint">in 5 clear steps.</span>
        </h2>
        <ol className="tl" data-progress>
          <span className="tl__line" aria-hidden="true">
            <span />
          </span>
          {STEPS.map((s, i) => (
            <li key={s.n} className="tl__step" data-reveal style={d(i)}>
              <span className="tl__dot mono">{s.n}</span>
              <p className="mono muted">{s.time}</p>
              <h3 className="h4">{s.title}</h3>
              <p className="muted-2">{s.body}</p>
            </li>
          ))}
        </ol>
        <NextStep
          primary={
            <WaBtn>
              Start step 01: SEE Audit · <Price bdt={2500} />
            </WaBtn>
          }
        />
      </div>
    </section>
  );
}

function Demos() {
  return (
    <section id="demos" className="sec sec--green dots">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          Demos · made by ARGUS
        </p>
        <h2 className="h2" data-reveal>
          See the system <span className="mint">working.</span>
        </h2>
        <p className="lead" data-reveal>
          These are demos we made to show how each service works — not client results.
        </p>
        <div className="demos">
          <figure className="story" data-reveal>
            <span className="tag demos__tag">Demo</span>
            <video
              controls
              playsInline
              preload="none"
              poster="/media/story-poster.webp"
              src="/media/argus-story.mp4"
              width={720}
              height={1280}
              aria-label="Demo: The ARGUS story, 10 services in 3 minutes, with voiceover"
            />
            <figcaption>
              <strong>The ARGUS story</strong>
              <span>10 services · 2:58 · sound on</span>
            </figcaption>
          </figure>
          <div className="reels" tabIndex={0} aria-label="Service demo reels">
            {DEMOS.map((r, i) => (
              <figure key={r.id} className="reel" data-reveal style={d(i)}>
                <span className="tag demos__tag">Demo</span>
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
          primary={
            <WaBtn text="Hi ARGUS, I saw the demos. I want this for my business.">
              <IconWhatsApp size={18} /> Get this for your business
            </WaBtn>
          }
        />
      </div>
    </section>
  );
}

function Founder() {
  return (
    <section id="founder" className="sec sec--dark">
      <div className="wrap founder">
        <div className="founder__photo" data-reveal>
          <Image
            src="/img/joy-howlader-argus-studio.webp"
            alt="Joy Howlader, founder of ARGUS, at the ARGUS studio"
            width={900}
            height={1146}
            sizes="(max-width: 900px) 100vw, 440px"
          />
        </div>
        <div>
          <p className="eyebrow" data-reveal>
            Founder · {FOUNDER}
          </p>
          <h2 className="h2" data-reveal>
            T-shirt or suit? <span className="mint">It has to fit.</span>
          </h2>
          <p className="lead" data-reveal>
            A T-shirt from a shelf fits almost everyone, almost well. A suit is cut for one person. Most brands, websites and
            bots are T-shirts. ARGUS makes suits: we SEE your business first, then create and automate what fits it.
          </p>
          <p className="muted-2" data-reveal>
            I’m Joy — graphic designer, UI/UX designer and automation enthusiast. I started ARGUS so small businesses get one
            team that designs, builds and connects everything, at a price written on the page.
          </p>
          <p className="mono mint founder__sig" data-reveal>
            See . Create . Automate .
          </p>
        </div>
      </div>
    </section>
  );
}

function Guarantees() {
  return (
    <section id="guarantees" className="sec sec--green">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          Our promises, in writing
        </p>
        <h2 className="h2" data-reveal>
          We can’t promise sales. <span className="mint">We promise these.</span>
        </h2>
        <div className="guar">
          {GUARANTEES.map((g, i) => (
            <article key={g.title} className="guar__card" data-reveal style={d(i)}>
              <IconShield size={22} className="mint" />
              <h3 className="h4">{g.title}</h3>
              <p className="muted-2">{g.body}</p>
            </article>
          ))}
        </div>
        <NextStep primary={<WaBtn>Book SEE Audit</WaBtn>} secondary={<Jump href="#faq">Read the FAQ</Jump>} />
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="sec sec--dark">
      <div className="wrap faq">
        <div>
          <p className="eyebrow" data-reveal>
            FAQ
          </p>
          <h2 className="h2" data-reveal>
            Questions, <span className="mint">answered.</span>
          </h2>
          <p className="muted-2" data-reveal>
            Something else? Ask us on WhatsApp — English, Bangla or Banglish.
          </p>
          <WaBtn cls="btn--line" text="Hi ARGUS, I have a question.">
            <IconWhatsApp size={18} /> {PHONE}
          </WaBtn>
        </div>
        <div className="faq__list">
          {FAQ.map((f, i) => (
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

function FinalCta() {
  return (
    <section id="start" className="sec sec--cta dots">
      <div className="wrap cta">
        <p className="eyebrow" data-reveal>
          Start here
        </p>
        <h2 className="cta__h display" data-reveal>
          Your chapter <span className="mint">starts here.</span>
        </h2>
        <p className="lead" data-reveal>
          SEE Audit · <Price bdt={2500} /> — credited in full to any package within 30 days.
        </p>
        <div className="hero__ctas cta__btns" data-reveal>
          <WaBtn>
            <IconWhatsApp size={18} /> WhatsApp {PHONE}
          </WaBtn>
          <a className="btn btn--line" href="#pricing">
            See pricing <IconArrow size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const year = 2026;
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/argus-logo.webp" alt="ARGUS" width={150} height={34} loading="lazy" />
          <p className="mono muted footer__tag">See . Create . Automate .</p>
          <a className="footer__wa" href={waLink()} target="_blank" rel="noopener">
            <IconWhatsApp size={16} /> {PHONE}
          </a>
          <p className="muted">Dhaka, Bangladesh · working worldwide</p>
        </div>
        <nav aria-label="Footer">
          <p className="mono footer__h">Services</p>
          <a href="#brand-identity">Brand identity design</a>
          <a href="#website-design">Website &amp; online store</a>
          <a href="#ai-chatbot">AI chatbot &amp; auto-reply</a>
          <a href="#facebook-ads">Facebook &amp; Instagram ads</a>
          <a href="#whatsapp-booking">WhatsApp booking</a>
        </nav>
        <nav aria-label="Company">
          <p className="mono footer__h">ARGUS</p>
          <a href="#pricing">Pricing</a>
          <a href="#rate-card">Rate card</a>
          <a href="#how-it-works">How it works</a>
          <a href="#founder">Founder</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div>
          <p className="mono footer__h">Pay with</p>
          <p className="muted">{PAYMENTS.bd.join(" · ")}</p>
          <p className="muted">{PAYMENTS.abroad.join(" · ")}</p>
        </div>
      </div>
      <div className="wrap footer__about">
        <h2 className="mono footer__h">About ARGUS</h2>
        <p>
          ARGUS is a branding, website design and AI automation studio in Dhaka, Bangladesh, working with businesses in
          Bangladesh and worldwide. We design logos and brand identities, build websites, landing pages and e-commerce stores
          with bKash, Nagad, card and COD, set up AI chatbots and auto-reply for Facebook Messenger, Instagram and WhatsApp in
          Bangla, Banglish and English, build WhatsApp booking systems and lead generation with CRM follow-ups (n8n automation),
          and run Facebook and Instagram ads. Fixed prices in BDT and USD, written delivery dates, and everything in your name.
        </p>
        <p className="muted footer__copy">
          © {year} ARGUS · Founded by {FOUNDER} · Prices exclude VAT · USD at 1 USD = ৳122.77
        </p>
      </div>
    </footer>
  );
}

function FloatingWa() {
  return (
    <>
      <a className="fab" href={waLink()} target="_blank" rel="noopener" aria-label={`Chat with ARGUS on WhatsApp ${PHONE}`}>
        <IconWhatsApp size={26} />
      </a>
      <div className="mbar">
        <a className="btn btn--mint" href={waLink()} target="_blank" rel="noopener">
          <IconWhatsApp size={18} /> WhatsApp
        </a>
        <a className="btn btn--line" href="#pricing">
          <IconSheet size={16} /> Prices
        </a>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <>
      <JsonLd />
      <main>
        <Hero />
        <Marquee />
        <Problem />
        <System />
        <Services />
        <Pricing />
        <RateCardSection />
        <Compare />
        <How />
        <Demos />
        <Founder />
        <Guarantees />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <FloatingWa />
    </>
  );
}
