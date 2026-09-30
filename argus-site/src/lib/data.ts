// ARGUS site content: one source for every price, service, kit and FAQ on the page.
// Prices are stored in BDT; USD is derived with the same rule as the price workbook.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://argus.agency").replace(/\/$/, "");
export const PHONE = "+880 1303-364567";
export const WA_NUMBER = "8801303364567";
export const FOUNDER = "Joy Howlader";
export const SOCIAL = {
  facebook: "https://www.facebook.com/profile.php?id=61594554400256",
  linkedin: "https://www.linkedin.com/in/joy-howlader-386089241/",
};

export const waLink = (text = "Hi ARGUS, I want to know more.") =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
export const WA_AUDIT = waLink("Hi ARGUS, I want to book a SEE Audit (৳2,500 / $20).");

/** 1 USD = ৳122.77 (28 Sep 2026). Above $10, rounded to the nearest $5. */
export const USD_RATE = 122.77;
export const toUsd = (bdt: number) => {
  const v = bdt / USD_RATE;
  return v < 10 ? Math.round(v) : Math.round(v / 5) * 5;
};

/** Bangladeshi digit grouping: 108000 → "1,08,000". */
export const groupBD = (n: number) => {
  const s = String(Math.round(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
};
export const fmtBDT = (n: number) => `৳${groupBD(n)}`;
export const fmtUSD = (n: number) => `$${toUsd(n).toLocaleString("en-US")}`;

export type Pillar = "See" | "Create" | "Automate" | "Grow";

export type Service = {
  id: string;
  n: string;
  name: string;
  pillar: Pillar;
  tag: string;
  hook: string;
  benefits: string[];
  from?: boolean;
  price: number;
  per?: "mo";
  monthly?: number;
  note?: string;
  big?: boolean;
};

export const SERVICES: Service[] = [
  { id: "see-audit", n: "01", name: "SEE — Business Audit", pillar: "See", tag: "For every business",
    hook: "Not sure what’s holding you back?",
    benefits: ["Page, brand, website & inbox review", "Written 1-page action plan", "45 minutes, online or in person", "Fully credited to any package within 30 days"],
    price: 2500, note: "credited in full within 30 days" },
  { id: "f-commerce-kit", n: "02", name: "F-commerce Kit", pillar: "Automate", tag: "For Facebook page sellers",
    hook: "“dam koto?” at 1 AM? Answered in 3 seconds.",
    benefits: ["24/7 replies, even in Banglish", "Every order in one sheet", "Fake-order confirm button", "Brand refresh + post templates"],
    from: true, price: 16500, monthly: 2500, big: true },
  { id: "ai-chatbot", n: "03", name: "AI Chatbot & Auto-Reply", pillar: "Automate", tag: "Messenger · Instagram · WhatsApp",
    hook: "Same question, 100 times a day?",
    benefits: ["Replies 24/7 with your prices", "Knows your stock & delivery", "Bangla, Banglish & English", "We set it up and train it"],
    price: 7500, monthly: 2500 },
  { id: "lead-machine", n: "04", name: "Lead Machine (CRM + follow-ups)", pillar: "Automate", tag: "For real estate & coaching",
    hook: "Leads come in. Nobody calls back?",
    benefits: ["Landing page + lead form", "AI asks the right questions", "Visits booked on WhatsApp", "Follow-ups on day 1, 3 and 7"],
    price: 49000, monthly: 5500 },
  { id: "whatsapp-booking", n: "05", name: "WhatsApp Booking System", pillar: "Automate", tag: "For clinics, restaurants & salons",
    hook: "Phone busy. Customers waiting.",
    benefits: ["Book on WhatsApp, 24/7", "Reminders 1 day + 1 hour before", "FAQ answered automatically", "Website with your schedule"],
    price: 49000, monthly: 3500 },
  { id: "brand-identity", n: "06", name: "Brand Identity", pillar: "Create", tag: "Look like a brand people trust",
    hook: "Looks like every other page?",
    benefits: ["Logo, colours & fonts", "Ready-to-use post templates", "A brand guide you can follow", "Full system with guide ৳30,000 ($245)"],
    from: true, price: 12000, note: "one-time" },
  { id: "website-design", n: "07", name: "Website & Online Store", pillar: "Create", tag: "Your own shop, open 24/7",
    hook: "Only a Facebook page? Not enough.",
    benefits: ["Landing page ৳15,000 ($120)", "Business website ৳38,000 ($310)", "Online store ৳72,000 ($585)", "WhatsApp + bKash / Nagad / COD / card"],
    from: true, price: 15000, note: "1 year hosting on website & store" },
  { id: "facebook-ads", n: "08", name: "Facebook & Instagram Ads", pillar: "Grow", tag: "Ads that start WhatsApp chats",
    hook: "Boosted again. Still no sales?",
    benefits: ["Pixel + audiences set up right", "Click-to-WhatsApp campaigns", "New creatives every month", "Weekly optimisation + report"],
    price: 12000, per: "mo", note: "৳8,000 ($65) setup · ad spend paid to Meta" },
  { id: "content-reels", n: "09", name: "Content & Reels", pillar: "Create", tag: "A page that looks alive",
    hook: "No time to post every day?",
    benefits: ["12 designed posts a month", "Stories + content calendar", "Motion reels (reels plan)", "Community group management"],
    from: true, price: 15000, per: "mo", note: "with reels ৳28,000 ($230)" },
  { id: "launch-system", n: "10", name: "Launch System", pillar: "Grow", tag: "Everything to launch, one team",
    hook: "Starting a new business?",
    benefits: ["Brand system + launch campaign", "Business website", "AI auto-reply", "Ads setup"],
    price: 92000, monthly: 2500, note: "separately ৳1,08,500 ($885)", big: true },
];

export type Kit = {
  code: string;
  name: string;
  forWho: string;
  what: string;
  includes: string[];
  price: number;
  separately: number;
  monthly?: number;
  perMonth?: boolean;
  recommended?: boolean;
};

export const KIT_TABS: { id: string; label: string; kits: Kit[] }[] = [
  { id: "fcommerce", label: "F-commerce", kits: [
    { code: "KIT-F1", name: "F-commerce Starter", forWho: "Facebook page sellers", what: "Get replies and orders handled, look professional.",
      includes: ["AI auto-reply on Messenger + comments", "Up to 50 products from a Google Sheet", "Orders saved to a sheet + WhatsApp alert", "Brand Starter: logo, colours, 5 templates"],
      price: 16500, separately: 19500, monthly: 2500 },
    { code: "KIT-F2", name: "F-commerce Growth", forWho: "Growing pages", what: "Full selling system across Messenger, Instagram and WhatsApp + ads.",
      includes: ["Messenger + Instagram + WhatsApp", "Up to 300 products, fake-order confirm", "24h follow-up + weekly sales report", "Brand Starter + Ads setup"],
      price: 32000, separately: 38000, monthly: 5500, recommended: true },
    { code: "KIT-F3", name: "F-commerce Pro", forWho: "Brands ready to scale", what: "Own store + brand system + selling system + ads.",
      includes: ["E-commerce store, bKash / Nagad / COD", "Full Brand System + guide", "Sell System on 3 channels", "Ads setup + 1 year hosting"],
      price: 108000, separately: 128000, monthly: 5500 },
  ] },
  { id: "leads", label: "Real estate & Coaching", kits: [
    { code: "KIT-LM", name: "Lead Machine Kit", forWho: "Real estate, coaching, education", what: "Landing page + AI qualifying + CRM + ads setup.",
      includes: ["Landing page + lead form", "AI qualifying questions", "Visits booked on WhatsApp", "CRM pipeline + day 1/3/7 follow-ups"],
      price: 49000, separately: 58000, monthly: 5500, recommended: true },
  ] },
  { id: "booking", label: "Clinic · Restaurant · Salon", kits: [
    { code: "KIT-BK", name: "Booking System Kit", forWho: "Clinics, restaurants, salons", what: "Website + WhatsApp booking with reminders.",
      includes: ["Business website (up to 6 pages)", "WhatsApp booking 24/7", "Reminders 1 day + 1 hour before", "FAQ auto-answer + monthly report"],
      price: 49000, separately: 58000, monthly: 3500, recommended: true },
  ] },
  { id: "launch", label: "New business", kits: [
    { code: "KIT-LS", name: "Launch System", forWho: "New businesses", what: "Brand + launch content + website + auto-reply + ads setup.",
      includes: ["Brand System + 7-day launch campaign", "Business website + 1 year hosting", "AI auto-reply", "Ads setup"],
      price: 92000, separately: 108500, monthly: 2500, recommended: true },
  ] },
  { id: "partner", label: "Growth Partner", kits: [
    { code: "PLAN-GP", name: "Growth Partner", forWho: "Businesses already running", what: "Content + reels + ads management + auto-reply, one monthly fee.",
      includes: ["12 posts + 4 reels + 12 stories a month", "Ads management + monthly report", "AI auto-reply (setup included)", "Community group management"],
      price: 36000, separately: 42500, perMonth: true, recommended: true },
  ] },
];

export type RateItem = { code: string; name: string; what: string; days?: string; once?: number; monthly?: number };

export const RATE_GROUPS: { id: string; label: string; items: RateItem[] }[] = [
  { id: "audit", label: "Audit", items: [
    { code: "SEE-01", name: "See — Business Audit", what: "45-min call; page, brand, website and inbox review; written 1-page action plan. Credited in full to any package ordered within 30 days.", days: "3 days", once: 2500 },
  ] },
  { id: "brand", label: "Brand & Design", items: [
    { code: "BR-01", name: "Brand Starter", what: "2 logo concepts + 2 revisions; colour + font pair; 5 editable post templates; Facebook profile + cover.", days: "7 days", once: 12000 },
    { code: "BR-02", name: "Brand System", what: "3 logo concepts; logo suite; palette; typography; 15 editable templates; business card; brand guide PDF; page setup.", days: "14 days", once: 30000 },
    { code: "BR-03", name: "Brand + Launch", what: "Brand System + 7-day launch campaign (7 posts, 2 carousels, 1 reel, 7 stories) + 30-day content calendar.", days: "21 days", once: 55000 },
  ] },
  { id: "web", label: "Web & Digital", items: [
    { code: "WB-01", name: "Landing Page", what: "1 page, mobile-first, WhatsApp + Messenger buttons, Meta Pixel, fast, lead form to Google Sheet.", days: "7 days", once: 15000 },
    { code: "WB-02", name: "Business Website", what: "Up to 6 pages, editable CMS, WhatsApp + Messenger, Pixel + GA4, basic SEO, 1 year hosting + domain.", days: "21 days", once: 38000 },
    { code: "WB-03", name: "E-commerce Store", what: "Up to 100 products, bKash / Nagad / COD / card, courier-ready order sheet, WhatsApp order alerts, 1 year hosting + domain.", days: "30 days", once: 72000 },
    { code: "WB-CARE", name: "Website Care", what: "Hosting + domain renewal, daily backup, updates, security, 1 hour of edits a month. From year 2.", monthly: 1500 },
  ] },
  { id: "automation", label: "AI & Automation", items: [
    { code: "AU-01", name: "Auto-Reply Starter", what: "AI replies on Messenger + comments (Bangla / Banglish / English); up to 50 products; orders to Sheet; owner alert on WhatsApp; 3,000 AI replies a month.", days: "5 days", once: 7500, monthly: 2500 },
    { code: "AU-02", name: "Sell System", what: "Messenger + Instagram + WhatsApp; up to 300 products; fake-order confirm; 24h follow-up; weekly sales report; 8,000 AI replies a month.", days: "10 days", once: 18000, monthly: 5500 },
    { code: "AU-03", name: "Booking System", what: "WhatsApp booking; reminders 1 day + 1 hour before; FAQ auto-answer; calendar / Sheet; no-show follow-up; 2,000 AI replies a month.", days: "10 days", once: 20000, monthly: 3500 },
    { code: "AU-04", name: "Lead Machine", what: "Lead form → AI qualifying questions → WhatsApp booking → CRM pipeline (n8n) → follow-ups day 1/3/7 → weekly report.", days: "14 days", once: 35000, monthly: 5500 },
    { code: "AU-05", name: "Custom Workflow", what: "One automation of your choice (invoice, report, stock alert, review request) + monitoring.", days: "7 days", once: 10000, monthly: 1000 },
    { code: "AU-X", name: "Extra AI replies", what: "+2,000 AI replies in the month. We tell you before we top up.", monthly: 500 },
  ] },
  { id: "growth", label: "Growth & Ads", items: [
    { code: "GR-01", name: "Ads Setup", what: "Business Manager check, Pixel / Conversions API, audiences, 1 Click-to-WhatsApp campaign, 3 ad creatives.", days: "5 days", once: 8000 },
    { code: "GR-02", name: "Ads Management", what: "Weekly optimisation, 4 new creatives a month, monthly report. Covers ad spend up to ৳60,000 a month; above that 15% of spend. Ad spend paid by you to Meta.", monthly: 12000 },
    { code: "GR-03", name: "Content 12", what: "12 designed posts (image + carousel), 8 stories, captions, monthly calendar.", monthly: 15000 },
    { code: "GR-04", name: "Content + Reels", what: "12 posts + 4 motion reels + 12 stories + community group (3 threads a week) + monthly calendar.", monthly: 28000 },
  ] },
];

export const PAYMENTS = {
  bd: ["bKash", "Nagad", "Rocket", "Upay", "Bank transfer", "Visa / Mastercard"],
  abroad: ["Payoneer", "Wise", "PayPal", "Stripe", "Visa / Mastercard / Amex", "Bank (SWIFT)"],
  terms: ["50% to start, 50% before launch", "Invoice + money receipt every time", "Quotes are valid for 14 days", "Meta & WhatsApp fees paid at cost, 0% markup"],
};

export const PROMISES = ["Fixed price", "Written delivery date", "30-day free fixes", "You own everything", "Messenger", "Instagram", "WhatsApp", "English · Bangla · Banglish", "Bangladesh & worldwide"];

export const PROBLEMS = [
  { who: "Customer", text: "dam koto?", time: "1:12 AM" },
  { who: "Customer", text: "delivery charge koto? Dhaka te?", time: "1:14 AM" },
  { who: "Customer", text: "reply dilen na keno?", time: "9:40 AM" },
  { who: "Owner", text: "boost korlam, sale nai…", time: "11:05 AM" },
  { who: "Customer", text: "COD hobe? size ki ache?", time: "2:30 PM" },
];

export const SYSTEM_STEPS = [
  { id: "see", n: "01", title: "See", line: "Find what’s really holding sales back.",
    body: "A 45-minute SEE Audit of your page, brand, website and inbox. You get a written 1-page plan, so you never pay to fix the wrong thing.",
    services: ["SEE — Business Audit"] },
  { id: "create", n: "02", title: "Create", line: "Look like a brand. Own your home online.",
    body: "Logo, colours and post templates people trust. A website or online store that takes WhatsApp orders, bKash, Nagad, cards and cash on delivery.",
    services: ["Brand Identity", "Website & Online Store", "Content & Reels"] },
  { id: "automate", n: "03", title: "Automate", line: "Reply in seconds. Follow up without thinking.",
    body: "An AI chatbot that answers in Bangla, Banglish or English, saves every order to a sheet, books visits, and follows up. Ads that start WhatsApp chats feed it.",
    services: ["AI Chatbot & Auto-Reply", "F-commerce Kit", "Lead Machine", "WhatsApp Booking", "Facebook & Instagram Ads"] },
];

export const CHAIN = ["Ad", "WhatsApp chat", "AI reply", "Order sheet", "Weekly report"];

export const COMPARE = {
  cols: ["ARGUS", "Freelancer", "Big agency", "DIY app"],
  rows: [
    { label: "Price", cells: ["Fixed, on the page", "Low, varies", "৳1 lakh+, on request", "Low monthly"] },
    { label: "Setup done for you", cells: ["Yes, in Bangla / Banglish / English", "Partly", "Yes", "No, you do it"] },
    { label: "Brand + web + AI + ads connected", cells: ["Yes, one system", "No", "Sometimes", "No"] },
    { label: "Written delivery date", cells: ["Yes, 10% off if we’re late", "Rarely", "Yes", "—"] },
    { label: "After launch", cells: ["30 days free fixes + report", "Often gone", "Paid retainer", "Help docs"] },
    { label: "You own everything", cells: ["Yes, all in your name", "Sometimes", "Often kept by agency", "Locked to the app"] },
  ],
};

export const STEPS = [
  { n: "01", title: "SEE Audit", time: "3 days", body: "45-minute call and review. You get a written 1-page action plan. ৳2,500 ($20), credited to any package within 30 days." },
  { n: "02", title: "Fixed quote", time: "1 day", body: "Written scope, price and delivery date. No “we’ll see”. Quotes are valid for 14 days." },
  { n: "03", title: "Build", time: "5–30 days", body: "50% to start. We design, build and train your AI with your products, prices and delivery rules." },
  { n: "04", title: "Launch", time: "Day 1", body: "Remaining 50% before launch. We hand over every login, file and account in your name." },
  { n: "05", title: "Care", time: "30 days +", body: "30 days of free fixes, then monthly tuning and a report. Month-to-month, 30 days’ notice." },
];

export const DEMOS = [
  { id: "autoreply", title: "AI auto-reply", alt: "Demo: AI chatbot replying to a customer in Banglish on Messenger" },
  { id: "fcommerce", title: "F-commerce Kit", alt: "Demo: order saved to a Google Sheet after an AI reply" },
  { id: "web", title: "Website & store", alt: "Demo: online store with WhatsApp order button, bKash, Nagad and COD" },
  { id: "booking", title: "WhatsApp booking", alt: "Demo: WhatsApp booking with reminders for a clinic" },
];

export const GUARANTEES = [
  { title: "Scope, price & date in writing", body: "Before any work starts. No surprise bills." },
  { title: "Late because of us? 10% off", body: "Taken off your remaining payment." },
  { title: "30 days of free fixes", body: "Bugs and small changes after launch, free." },
  { title: "Automation money-back", body: "Not happy after 14 days of tuning? That month’s fee back (setup excluded)." },
  { title: "Everything in your name", body: "Domain, hosting, page admin, Figma files, code and accounts." },
];

export const FAQ = [
  { q: "Can we work together if I’m outside Bangladesh?",
    a: "Yes. We work with businesses from anywhere, in Bangladesh or abroad. Talk to us in English, Bangla or Banglish, whichever feels easiest, on WhatsApp, Google Meet or Zoom. Every price on this page shows USD next to BDT (1 USD = ৳122.77), and you can pay with Payoneer, Wise, PayPal, Stripe, card or bank (SWIFT)." },
  { q: "How do I pay?",
    a: "In Bangladesh: bKash, Nagad, Rocket, Upay, bank transfer or Visa / Mastercard. From abroad: Payoneer, Wise, PayPal, Stripe, Visa / Mastercard / Amex or bank (SWIFT). One-time work is 50% to start and 50% before launch. You always get an invoice and a receipt." },
  { q: "Which languages can the AI chatbot reply in?",
    a: "Bangla, Banglish and English. We train it on your own products, prices, stock and delivery rules, so it answers like your team does." },
  { q: "Can you guarantee sales?",
    a: "No one honestly can. What we guarantee is in writing: scope, price and delivery date, 10% off if we’re late, 30 days of free fixes, and your monthly automation fee back if you’re not happy after 14 days of tuning." },
  { q: "Isn’t this more expensive than a freelancer or a ৳2,000 bot?",
    a: "The upfront price can be. But a moderator costs ৳20,000–30,000 a month, and a cheap bot means you set everything up yourself. Our Sell System is ৳5,500 ($45) a month, works 24/7, and is connected to your brand, website, order sheet and ads." },
  { q: "What happens if I stop the monthly plan?",
    a: "Monthly plans are month-to-month with 30 days’ notice. Everything we built is already in your name: domain, page, files, code and accounts. Nothing is held back." },
  { q: "Do I pay for ads and WhatsApp messages separately?",
    a: "Yes. Ad spend goes from your card directly to Meta, and WhatsApp template-message fees are paid at cost. We add 0% markup." },
  { q: "How do I start?",
    a: "Book a SEE Audit for ৳2,500 ($20). In 3 days you get a written 1-page plan. If you order any package within 30 days, the full ৳2,500 is credited." },
];

export const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#pricing", label: "Pricing" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#demos", label: "Demos" },
  { href: "#faq", label: "FAQ" },
];
