import { FAQ, FOUNDER, KIT_TABS, PHONE, RATE_GROUPS, SERVICES, SITE_URL, WA_NUMBER, toUsd } from "@/lib/data";

// Structured data for search engines: Organization, ProfessionalService with an
// offer catalog (BDT prices), and the FAQ.
export default function JsonLd() {
  const org = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#org`,
    name: "ARGUS",
    url: SITE_URL,
    logo: `${SITE_URL}/img/argus-logo.png`,
    founder: { "@type": "Person", name: FOUNDER },
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
    "@id": `${SITE_URL}/#service`,
    name: "ARGUS — Branding, Websites, AI Chatbots & Ads",
    url: SITE_URL,
    image: `${SITE_URL}/opengraph-image.jpg`,
    logo: `${SITE_URL}/img/argus-logo.png`,
    telephone: PHONE.replace(/[\s-]/g, ""),
    priceRange: "৳2,500 – ৳1,08,000",
    currenciesAccepted: "BDT, USD",
    paymentAccepted: "bKash, Nagad, Rocket, Upay, Bank transfer, Credit card, Payoneer, Wise, PayPal, Stripe",
    address: { "@type": "PostalAddress", addressLocality: "Dhaka", addressCountry: "BD" },
    areaServed: [{ "@type": "Country", name: "Bangladesh" }, "Worldwide"],
    knowsLanguage: ["en", "bn"],
    parentOrganization: { "@id": `${SITE_URL}/#org` },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "ARGUS services",
      itemListElement: [
        ...SERVICES.map((s) => ({
          "@type": "Service",
          name: s.name,
          description: `${s.hook} ${s.benefits.join(". ")}.`,
          provider: { "@id": `${SITE_URL}/#org` },
          offers: offer(s.name, s.price, undefined, s.per === "mo"),
        })),
        ...KIT_TABS.flatMap((t) => t.kits).map((k) => offer(k.name, k.price, k.what, !!k.perMonth)),
        ...RATE_GROUPS.flatMap((g) => g.items)
          .filter((i) => i.once)
          .map((i) => offer(i.name, i.once as number, i.what)),
      ],
    },
  };

  const faq = {
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
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
