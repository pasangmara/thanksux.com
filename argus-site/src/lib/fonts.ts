import localFont from "next/font/local";

// Latin faces used on every page.
export const display = localFont({
  src: [
    { path: "../fonts/space-grotesk-latin-500-normal.woff2", weight: "500" },
    { path: "../fonts/space-grotesk-latin-700-normal.woff2", weight: "700" },
  ],
  variable: "--font-display",
  display: "swap",
});
export const body = localFont({
  src: "../fonts/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--font-body",
  display: "swap",
});
export const mono = localFont({
  src: "../fonts/GeistMono-Variable.woff2",
  weight: "100 900",
  variable: "--font-mono",
  display: "swap",
});
// On the English page Bangla only appears in the Taka sign (৳) and the language switch,
// so it loads on demand.
export const banglaLite = localFont({
  src: "../fonts/NotoSansBengali-Variable.woff2",
  weight: "100 900",
  variable: "--font-bn",
  display: "swap",
  preload: false,
});
