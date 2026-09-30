// Language helpers shared by server and client code.
import { groupBD, toUsd } from "./data";

export type Lang = "en" | "bn";
export const LANGS: Lang[] = ["en", "bn"];
export const HOME: Record<Lang, string> = { en: "/", bn: "/bn/" };

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
/** Western digits → Bangla digits on the Bangla page; unchanged in English. */
export const digits = (s: string | number, lang: Lang) =>
  lang === "bn" ? String(s).replace(/[0-9]/g, (d) => BN_DIGITS[+d]) : String(s);

export const bdt = (n: number, lang: Lang) => digits(`৳${groupBD(n)}`, lang);

/** Whole dollars stay whole, anything else shows cents ($40.50). */
export const usdExact = (v: number, lang: Lang) => {
  const c = Math.round(v * 100) / 100;
  const s = c.toLocaleString("en-US", Number.isInteger(c) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return digits(`$${s}`, lang);
};
export const usd = (bdtAmount: number, lang: Lang) => usdExact(toUsd(bdtAmount), lang);
