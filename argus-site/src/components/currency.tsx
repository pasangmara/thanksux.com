"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { fmtBDT, fmtUsdExact, toUsd } from "@/lib/data";

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
    fallback = !tz || tz === "Asia/Dhaka" ? "BDT" : "USD";
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
  const b = useTween(bdt, animate);
  const u = useTween(usd ?? toUsd(bdt), animate);
  const bdtText = fmtBDT(Math.round(b));
  // Keep cents while easing only when the final USD value has cents.
  const cents = usd !== undefined && !Number.isInteger(Math.round(usd * 100) / 100);
  const usdText = fmtUsdExact(cents ? u : Math.round(u));
  const [main, alt] = cur === "USD" ? [usdText, bdtText] : [bdtText, usdText];
  const suffix = per === "mo" ? "/mo" : "";
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

export function CurrencySwitch({ label = "Show prices in" }: { label?: string }) {
  const cur = useCurrency();
  return (
    <div className="seg" role="group" aria-label={label}>
      {(["BDT", "USD"] as const).map((c) => (
        <button key={c} type="button" className="seg__btn" aria-pressed={cur === c} onClick={() => setCurrency(c)}>
          {c === "BDT" ? "BDT ৳" : "USD $"}
        </button>
      ))}
    </div>
  );
}
