// Every word on the page, per language. Numbers (prices, codes) come from data.ts
// so English and Bangla can never show different prices.
import {
  CHAIN,
  COMPARE,
  DEMOS,
  FAQ,
  GUARANTEES,
  KIT_TABS,
  NAV_LINKS,
  PAYMENTS,
  PROBLEMS,
  PROMISES,
  RATE_GROUPS,
  SERVICES,
  STEPS,
  SYSTEM_STEPS,
  type Kit,
  type Pillar,
  type RateItem,
  type Service,
} from "./data";
import type { Lang } from "./i18n";
import { BN } from "./content-bn";

type Pair = [string, string]; // [plain, mint highlight]

export const UI_EN = {
  meta: {
    title: "ARGUS — Branding, Websites, AI Chatbots & Ads | Bangladesh & Worldwide",
    description:
      "One team for your brand identity, website or online store, AI chatbot for Messenger, Instagram & WhatsApp, and Facebook ads. Fixed prices, BDT & USD.",
  },
  wa: {
    hello: "Hi ARGUS, I want to know more.",
    audit: "Hi ARGUS, I want to book a SEE Audit (৳2,500 / $20).",
    pricing: "Hi ARGUS, I have a question about pricing.",
    question: "Hi ARGUS, I have a question.",
    demos: "Hi ARGUS, I saw the demos. I want this for my business.",
    about: (name: string) => `Hi ARGUS, I’m interested in ${name}.`,
    kit: (name: string, price: string) => `Hi ARGUS, I want the ${name} (${price}).`,
  },
  common: {
    nextStep: "Next step",
    demo: "Demo",
    example: "Example",
    whatsapp: "WhatsApp",
    bookAudit: "Book SEE Audit",
    seeAudit: "SEE Audit",
    showPricesIn: "Show prices in",
    perMonth: "/mo",
  },
  nav: {
    home: "ARGUS home",
    main: "Main",
    open: "Open menu",
    close: "Close menu",
    language: "Language",
    sheetNote: "English · Bangla · Banglish — Bangladesh & worldwide",
    skip: "Skip to services",
  },
  hero: {
    h1: "Branding, website design, AI chatbots & Facebook ads — for businesses in Bangladesh and worldwide",
    words: ["Brand.", "Website.", "AI replies.", "Ads."],
    oneTeam: "One team.",
    sub: "For businesses in Bangladesh and abroad that sell on Facebook, Instagram, WhatsApp and the web. Fixed prices in BDT & USD. Everything in your name.",
    seePricing: "See pricing",
    trust: ["30-day free fixes", "bKash · Nagad · Card · PayPal · Wise", "English · Bangla · Banglish"],
    posterAlt: "Joy Howlader, founder of ARGUS — graphic designer, UI/UX designer and automation enthusiast",
    liveLabel: "Demo: an ad turns into an order",
    liveAd: "Ad · Click to WhatsApp",
    liveQ: "dam koto? M size ache?",
    liveQTime: "1:12 AM",
    liveA: "৳1,250 · M in stock · 2 days. Order korben?",
    liveAMeta: "AI reply · 3 sec",
    liveOk: "Order saved to sheet",
    cue: "Scroll",
    cueLabel: "Scroll to the next section",
  },
  marquee: { label: "What you can count on", extra: ["bKash", "Nagad", "PayPal", "Wise", "Payoneer", "Stripe", "Card"] },
  problem: {
    eyebrow: "Facebook page · Messenger · WhatsApp",
    h2: ["Running a Facebook page means ", "100 small problems."] as Pair,
    lead: "Messages at 1 AM. The same price question 100 times. Fake COD orders. Boosts that bring likes, not sales. A logo from one person, a website from another, a bot from a third — and none of it talks to each other.",
    inbox: "Example inbox",
    parcelTitle: "Parcel returned",
    parcelText: "COD order · customer not reachable · ৳130 delivery lost",
    cta: "Fix this with ARGUS",
    next: "See the system",
  },
  system: {
    eyebrow: "Brand design · websites · AI automation",
    h2: ["See. Create. Automate. — ", "one team, one system."] as Pair,
    chainLabel: "How it connects",
    next: "See all 10 services",
  },
  services: {
    eyebrow: "Logo design · website design · AI chatbot · Facebook ads",
    h2: ["10 services: branding, websites, AI chatbots & ads — ", "every price on the page."] as Pair,
    filter: "Filter services",
    all: "All",
    from: "From ",
    ask: "Ask",
    askAria: (name: string) => `Ask about ${name} on WhatsApp`,
    next: "Compare kits & prices",
    rateCard: "Full rate card",
  },
  pricing: {
    eyebrow: "Packages · BDT & USD",
    h2: ["Website, chatbot & ads packages — ", "pick a kit, save ~15%."] as Pair,
    lead: "Wherever you are, we work with you. Talk to us in English, Bangla or Banglish, meet on WhatsApp, Google Meet or Zoom, and pay in BDT or USD.",
    payTitle: "Pay your way",
    paySub: "Invoice + receipt every time.",
    payBd: "Bangladesh · BDT",
    payAbroad: "Abroad · USD",
    talk: "Talk on WhatsApp",
  },
  kits: {
    choose: "Choose your business",
    recommended: "Recommended",
    separately: "Separately",
    save: (pct: string) => `save ${pct}%`,
    monthlyNote: "AI, hosting, tuning & report",
    oneFee: "One monthly fee · month-to-month",
    get: (name: string) => `Get ${name}`,
    prepayLabel: "Prepay monthly fees",
    live: (n: string, pct: string) => `Prepaying ${n} months: every kit’s monthly fee is ${pct}% lower.`,
    liveOff: "Monthly fees are month-to-month. Prepay 3 months to save 10%, or 12 months to save 15%.",
    savePerMonth: "save",
    totalKit: (n: number, nText: string) => (n === 1 ? "Kit + first month" : `Kit + ${nText} months prepaid`),
    totalPlan: (n: number, nText: string) => (n === 1 ? "First month" : `${nText} months prepaid`),
    totalSave: "you save",
  },
  prepay: ["Monthly", "3 months −10%", "12 months −15%"],
  rate: {
    eyebrow: "Digital marketing prices · no hidden cost",
    h2: ["Full rate card — ", "prices in BDT & USD."] as Pair,
    lead: "Every service, what’s inside, how long it takes. Monthly plans are month-to-month; prepay and save.",
    prepayAria: "Prepay discount on monthly plans",
    items: (n: number, nText: string) => `${nText} ${n === 1 ? "item" : "items"}`,
    onMonthly: (pct: string, n: string) => `−${pct}% on ${n} monthly`,
    head: ["Code", "Package", "What you get", "Delivery", "One-time", "Monthly"],
    prepayHead: (n: string) => ` · ${n} mo prepay`,
    save: "save",
    forMonths: (n: string) => `for ${n} months`,
    liveOn: (n: string, count: string, pct: string) => `Prepaying ${n} months: all ${count} monthly prices below are ${pct}% lower. Example:`,
    livePay: "you pay",
    liveFor: (n: string) => `for ${n} months and save`,
    liveOff: "Monthly plans are month-to-month. Prepay 3 months to save 10%, or 12 months to save 15%.",
    note: "Prepay discounts apply to monthly plans only; one-time prices stay the same. Prices exclude VAT. Ad spend and WhatsApp template fees are paid by you at cost (0% markup). USD at 1 USD = ৳122.77. Need something else?",
    noteLink: "Start with a SEE Audit",
    cta: "Not sure? Start with a SEE Audit",
    next: "See how we compare",
  },
  compare: {
    eyebrow: "Agency vs freelancer vs software",
    h2: ["Better than a freelancer. ", "Less than a big agency."] as Pair,
    aria: "ARGUS compared with a freelancer, a big agency and a DIY app",
    next: "See how it works",
  },
  how: {
    eyebrow: "How it works",
    h2: ["From first message to launch ", "in 5 clear steps."] as Pair,
    cta: "Start step 01: SEE Audit · ",
  },
  demos: {
    eyebrow: "Demos · made by ARGUS",
    h2: ["See the system ", "working."] as Pair,
    lead: "These are demos we made to show how each service works — not client results.",
    storyAria: "Demo: The ARGUS story, 10 services in 3 minutes, with voiceover",
    storyTitle: "The ARGUS story",
    storyMeta: "10 services · 2:58 · sound on",
    reels: "Service demo reels",
    cta: "Get this for your business",
  },
  founder: {
    eyebrow: "Founder · Joy Howlader",
    h2: ["T-shirt or suit? ", "It has to fit."] as Pair,
    lead: "A T-shirt from a shelf fits almost everyone, almost well. A suit is cut for one person. Most brands, websites and bots are T-shirts. ARGUS makes suits: we SEE your business first, then create and automate what fits it.",
    body: "I’m Joy — graphic designer, UI/UX designer and automation enthusiast. I started ARGUS so small businesses get one team that designs, builds and connects everything, at a price written on the page.",
    photoAlt: "Joy Howlader, founder of ARGUS, at the ARGUS studio",
    linkedin: "Joy on LinkedIn",
    facebook: "ARGUS on Facebook",
  },
  guarantees: {
    eyebrow: "Our promises, in writing",
    h2: ["We can’t promise sales. ", "We promise these."] as Pair,
    faq: "Read the FAQ",
  },
  faq: {
    eyebrow: "FAQ",
    h2: ["Questions, ", "answered."] as Pair,
    sub: "Something else? Message us on WhatsApp from anywhere. We reply in English, Bangla or Banglish.",
  },
  cta: {
    eyebrow: "Start here",
    h2: ["Your chapter ", "starts here."] as Pair,
    leadA: "SEE Audit · ",
    leadB: " — credited in full to any package within 30 days.",
    seePricing: "See pricing",
  },
  footer: {
    place: "Dhaka, Bangladesh · working worldwide",
    fbAria: "ARGUS on Facebook",
    liAria: "Joy Howlader on LinkedIn",
    servicesH: "Services",
    services: [
      ["#brand-identity", "Brand identity design"],
      ["#website-design", "Website & online store"],
      ["#ai-chatbot", "AI chatbot & auto-reply"],
      ["#facebook-ads", "Facebook & Instagram ads"],
      ["#whatsapp-booking", "WhatsApp booking"],
    ],
    companyH: "ARGUS",
    company: [
      ["#pricing", "Pricing"],
      ["#rate-card", "Rate card"],
      ["#how-it-works", "How it works"],
      ["#founder", "Founder"],
      ["#faq", "FAQ"],
    ],
    payH: "Pay with",
    aboutH: "About ARGUS",
    about:
      "ARGUS is a branding, website design and AI automation studio in Dhaka, Bangladesh, working with businesses in Bangladesh and worldwide. We design logos and brand identities, build websites, landing pages and e-commerce stores with bKash, Nagad, card and COD, set up AI chatbots and auto-reply for Facebook Messenger, Instagram and WhatsApp in Bangla, Banglish and English, build WhatsApp booking systems and lead generation with CRM follow-ups (n8n automation), and run Facebook and Instagram ads. Fixed prices in BDT and USD, written delivery dates, and everything in your name.",
    copy: "© 2026 ARGUS · Founded by Joy Howlader · Prices exclude VAT · USD at 1 USD = ৳122.77",
  },
  floating: { aria: "Chat with ARGUS on WhatsApp", prices: "Prices" },
};

export type UI = typeof UI_EN;

export type Content = {
  lang: Lang;
  ui: UI;
  nav: { href: string; label: string }[];
  services: Service[];
  pillars: Record<Pillar | "All", string>;
  kitTabs: { id: string; label: string; kits: Kit[] }[];
  rateGroups: { id: string; label: string; items: RateItem[] }[];
  payments: typeof PAYMENTS;
  promises: string[];
  problems: { who: string; own: boolean; text: string; time: string }[];
  systemSteps: typeof SYSTEM_STEPS;
  chain: string[];
  compare: typeof COMPARE;
  steps: typeof STEPS;
  demos: typeof DEMOS;
  guarantees: typeof GUARANTEES;
  faq: typeof FAQ;
};

const EN: Content = {
  lang: "en",
  ui: UI_EN,
  nav: NAV_LINKS,
  services: SERVICES,
  pillars: { All: "All", See: "See", Create: "Create", Automate: "Automate", Grow: "Grow" },
  kitTabs: KIT_TABS,
  rateGroups: RATE_GROUPS,
  payments: PAYMENTS,
  promises: PROMISES,
  problems: PROBLEMS.map((p) => ({ ...p, own: p.who === "Owner" })),
  systemSteps: SYSTEM_STEPS,
  chain: CHAIN,
  compare: COMPARE,
  steps: STEPS,
  demos: DEMOS,
  guarantees: GUARANTEES,
  faq: FAQ,
};

export const CONTENT: Record<Lang, Content> = { en: EN, bn: BN };
