import localFont from "next/font/local";

// Bangla page: Noto Sans Bengali for reading, Anek Bangla for headings. Both OFL-1.1.
export const bangla = localFont({
  src: "../fonts/NotoSansBengali-Variable.woff2",
  weight: "100 900",
  variable: "--font-bn",
  display: "swap",
});
export const banglaDisplay = localFont({
  src: "../fonts/AnekBangla-Variable.woff2",
  weight: "100 800",
  variable: "--font-bn-display",
  display: "swap",
});
