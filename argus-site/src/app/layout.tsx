import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import ScrollFx from "@/components/fx";
import Nav from "@/components/nav";
import { SITE_URL } from "@/lib/data";
import "./globals.css";

const display = localFont({
  src: [
    { path: "../fonts/space-grotesk-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/space-grotesk-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});
const body = localFont({
  src: "../fonts/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--font-body",
  display: "swap",
});
const mono = localFont({
  src: "../fonts/GeistMono-Variable.woff2",
  weight: "100 900",
  variable: "--font-mono",
  display: "swap",
});
// Only used for the Taka sign (৳) and Bangla words.
const bangla = localFont({
  src: [
    { path: "../fonts/noto-sans-bengali-bengali-400-normal.woff2", weight: "400" },
    { path: "../fonts/noto-sans-bengali-bengali-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-bn",
  display: "swap",
  preload: false,
});

const title = "ARGUS — Branding, Websites, AI Chatbots & Ads | Bangladesh & Worldwide";
const description =
  "One team for your brand identity, website or online store, AI chatbot for Messenger, Instagram & WhatsApp, and Facebook ads. Fixed prices, BDT & USD.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "ARGUS",
  authors: [{ name: "Joy Howlader" }],
  keywords: [
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
  alternates: { canonical: "/", languages: { en: "/", "x-default": "/" } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "ARGUS",
    title,
    description,
    locale: "en_US",
    alternateLocale: ["bn_BD"],
  },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0B0D0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} ${bangla.variable}`}>
      <body>
        <a className="skip" href="#services">
          Skip to services
        </a>
        <Nav />
        {children}
        <ScrollFx />
      </body>
    </html>
  );
}
