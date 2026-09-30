"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toUsd } from "@/lib/data";
import { bdt as fmtBdt, usdExact } from "@/lib/i18n";
import { useContent, useLang } from "./lang";

// Every price shows BDT and USD together. The switch only decides which one is
// shown first. Visitors outside Bangladesh (by time zone) see USD first.
export type Cur = "BDT" | "USD";
const KEY = "argus-currency";
const EVENT = "argus-currency";
let fallback: Cur | null = null;

function read(): Cur {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "BDT" || v === "USD") return v;
  } catch {}
  if (!fallback) {
    let tz = "";
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {}
    // The Bangla page always opens in Taka; elsewhere, visitors outside Bangladesh see USD first.
    const bangla = document.documentElement.lang === "bn";
    fallback = bangla || !tz || tz === "Asia/Dhaka" ? "BDT" : "USD";
  }
  return fallback;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function setCurrency(c: Cur) {
  try {
    localStorage.setItem(KEY, c);
  } catch {}
  fallback = c;
  window.dispatchEvent(new Event(EVENT));
}

export const useCurrency = () => useSyncExternalStore(subscribe, read, () => "BDT" as Cur);

/* Prepay choice (months) is shared by the kit cards and the rate card. */
export const PREPAY = [
  { id: 1, off: 0 },
  { id: 3, off: 0.1 },
  { id: 12, off: 0.15 },
];
let prepay = 1;
const prepayListeners = new Set<() => void>();
export function setPrepay(months: number) {
  prepay = months;
  prepayListeners.forEach((l) => l());
}
export const usePrepay = () =>
  useSyncExternalStore(
    (cb) => {
      prepayListeners.add(cb);
      return () => prepayListeners.delete(cb);
    },
    () => prepay,
    () => 1,
  );
export const prepayOff = (months: number) => PREPAY.find((p) => p.id === months)?.off ?? 0;

/** Discounted monthly price. USD is the listed USD price less the same %, to the cent. */
export const cents = (v: number) => Math.round(v * 100) / 100;
export const prepaid = (bdtAmount: number, off: number) => ({
  bdt: Math.round(bdtAmount * (1 - off)),
  usd: cents(toUsd(bdtAmount) * (1 - off)),
});

/** One amount in the currency shown first, with the page's digits. */
export function Money({ bdt, usd }: { bdt: number; usd: number }) {
  const cur = useCurrency();
  const lang = useLang();
  return <>{cur === "USD" ? usdExact(usd, lang) : fmtBdt(bdt, lang)}</>;
}

export function PrepaySwitch({ label }: { label: string }) {
  const months = usePrepay();
  const { ui } = useContent();
  return (
    <div className="seg" role="group" aria-label={label}>
      {PREPAY.map((p, i) => (
        <button key={p.id} type="button" className="seg__btn" aria-pressed={months === p.id} onClick={() => setPrepay(p.id)}>
          {ui.prepay[i]}
        </button>
      ))}
    </div>
  );
}

/** Eases a number to its new value so price changes are visible (skipped for reduced motion). */
export function useTween(target: number, enabled = true, ms = 520) {
  const [value, setValue] = useState(target);
  const shown = useRef(target);
  useEffect(() => {
    const from = shown.current;
    if (from === target) return;
    const reduce = !enabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = reduce ? 1 : Math.min(1, (now - start) / ms);
      const v = from + (target - from) * (1 - Math.pow(1 - k, 3));
      shown.current = v;
      setValue(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, ms]);
  return value;
}

type PriceProps = {
  bdt: number;
  /** Exact USD to show instead of the rounded conversion (e.g. a discounted price). */
  usd?: number;
  per?: "mo";
  className?: string;
  animate?: boolean;
};

export function Price({ bdt, usd, per, className, animate = false }: PriceProps) {
  const cur = useCurrency();
  const lang = useLang();
  const { ui } = useContent();
  const b = useTween(bdt, animate);
  const u = useTween(usd ?? toUsd(bdt), animate);
  const bdtText = fmtBdt(Math.round(b), lang);
  // Keep cents while easing only when the final USD value has cents.
  const hasCents = usd !== undefined && !Number.isInteger(cents(usd));
  const usdText = usdExact(hasCents ? u : Math.round(u), lang);
  const [main, alt] = cur === "USD" ? [usdText, bdtText] : [bdtText, usdText];
  const suffix = per === "mo" ? ui.common.perMonth : "";
  return (
    <span className={`price ${className ?? ""}`}>
      <span className="price__main">
        {main}
        {suffix}
      </span>{" "}
      <span className="price__alt">
        ({alt}
        {suffix})
      </span>
    </span>
  );
}

export function CurrencySwitch() {
  const cur = useCurrency();
  const { ui } = useContent();
  return (
    <div className="seg" role="group" aria-label={ui.common.showPricesIn}>
      {(["BDT", "USD"] as const).map((c) => (
        <button key={c} type="button" className="seg__btn" aria-pressed={cur === c} onClick={() => setCurrency(c)}>
          {c === "BDT" ? "BDT ৳" : "USD $"}
        </button>
      ))}
    </div>
  );
}
