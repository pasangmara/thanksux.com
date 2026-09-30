import { FOUNDER, PHONE, SITE_URL, SOCIAL, WA_NUMBER, toUsd } from "@/lib/data";
import { CONTENT } from "@/lib/content";
import { HOME, type Lang } from "@/lib/i18n";

// Structured data for search engines: Organization, ProfessionalService with an
// offer catalog (BDT prices), and the FAQ.
export default function JsonLd({ lang }: { lang: Lang }) {
  const c = CONTENT[lang];
  const pageUrl = `${SITE_URL}${HOME[lang]}`;
  const org = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#org`,
    name: "ARGUS",
    url: SITE_URL,
    logo: `${SITE_URL}/img/argus-logo.png`,
    sameAs: [SOCIAL.facebook],
    founder: {
      "@type": "Person",
      name: FOUNDER,
      jobTitle: "Founder",
      knowsAbout: ["Graphic design", "UI/UX design", "Automation"],
      sameAs: [SOCIAL.linkedin],
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: PHONE.replace(/[\s-]/g, ""),
      contactType: "sales",
      availableLanguage: ["English", "Bengali"],
      url: `https://wa.me/${WA_NUMBER}`,
    },
  };

  const offer = (name: string, bdt: number, description?: string, monthly = false) => ({
    "@type": "Offer",
    name,
    ...(description ? { description } : {}),
    price: bdt,
    priceCurrency: "BDT",
    priceSpecification: [
      { "@type": "UnitPriceSpecification", price: bdt, priceCurrency: "BDT", ...(monthly ? { unitText: "MONTH" } : {}) },
      { "@type": "UnitPriceSpecification", price: toUsd(bdt), priceCurrency: "USD", ...(monthly ? { unitText: "MONTH" } : {}) },
    ],
  });

  const service = {
    "@type": "ProfessionalService",
    "@id": `${pageUrl}#service`,
    name: c.ui.meta.title.split(" | ")[0],
    url: pageUrl,
    inLanguage: lang,
    image: `${SITE_URL}/og-image.jpg`,
    logo: `${SITE_URL}/img/argus-logo.png`,
    telephone: PHONE.replace(/[\s-]/g, ""),
    priceRange: "৳2,500 – ৳1,08,000",
    currenciesAccepted: "BDT, USD",
    paymentAccepted: "bKash, Nagad, Rocket, Upay, Bank transfer, Credit card, Payoneer, Wise, PayPal, Stripe",
    address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
    areaServed: [{ "@type": "Country", name: "Bangladesh" }, "Worldwide"],
    knowsLanguage: ["en", "bn"],
    parentOrganization: { "@id": `${SITE_URL}/#org` },
    sameAs: [SOCIAL.facebook],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "ARGUS services",
      itemListElement: [
        ...c.services.map((s) => ({
          "@type": "Service",
          name: s.name,
          description: `${s.hook} ${s.benefits.join(". ")}.`,
          provider: { "@id": `${SITE_URL}/#org` },
          offers: offer(s.name, s.price, undefined, s.per === "mo"),
        })),
        ...c.kitTabs.flatMap((t) => t.kits).map((k) => offer(k.name, k.price, k.what, !!k.perMonth)),
        ...c.rateGroups.flatMap((g) => g.items)
          .filter((i) => i.once)
          .map((i) => offer(i.name, i.once as number, i.what)),
      ],
    },
  };

  const faq = {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    inLanguage: lang,
    mainEntity: c.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const data = { "@context": "https://schema.org", "@graph": [org, service, faq] };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
