import type { Metadata, Viewport } from "next";
import { CONTENT } from "./content";
import { SITE_URL } from "./data";
import { HOME, type Lang } from "./i18n";

const KEYWORDS: Record<Lang, string[]> = {
  en: [
    "website design Bangladesh",
    "e-commerce website Bangladesh",
    "Facebook page auto reply",
    "Messenger chatbot",
    "AI chatbot for Facebook page",
    "WhatsApp automation",
    "WhatsApp booking system",
    "F-commerce",
    "Facebook ads agency Bangladesh",
    "logo design Bangladesh",
    "brand identity design",
    "landing page design",
    "n8n automation",
    "AI automation agency",
  ],
  bn: [
    "ওয়েবসাইট ডিজাইন",
    "ই-কমার্স ওয়েবসাইট",
    "ফেসবুক পেজ অটো রিপ্লাই",
    "মেসেঞ্জার চ্যাটবট",
    "এআই চ্যাটবট",
    "হোয়াটসঅ্যাপ অটোমেশন",
    "এফ-কমার্স",
    "ফেসবুক অ্যাড এজেন্সি",
    "লোগো ডিজাইন",
    "ব্র্যান্ড আইডেন্টিটি",
    "ল্যান্ডিং পেজ ডিজাইন",
  ],
};

const OG_ALT: Record<Lang, string> = {
  en: "ARGUS — Joy Howlader, founder. Brand, website, AI replies and ads from one team.",
  bn: "ARGUS — প্রতিষ্ঠাতা জয় হাওলাদার। ব্র্যান্ড, ওয়েবসাইট, এআই রিপ্লাই ও অ্যাড — এক টিমে।",
};

export function pageMetadata(lang: Lang): Metadata {
  const { title, description } = CONTENT[lang].ui.meta;
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: "ARGUS",
    authors: [{ name: "Joy Howlader" }],
    keywords: KEYWORDS[lang],
    alternates: {
      canonical: HOME[lang],
      languages: { en: HOME.en, bn: HOME.bn, "x-default": HOME.en },
    },
    openGraph: {
      type: "website",
      url: HOME[lang],
      siteName: "ARGUS",
      title,
      description,
      locale: lang === "bn" ? "bn_BD" : "en_US",
      alternateLocale: [lang === "bn" ? "en_US" : "bn_BD"],
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: OG_ALT[lang] }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og-image.jpg"] },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = { themeColor: "#0B0D0C", colorScheme: "dark" };
