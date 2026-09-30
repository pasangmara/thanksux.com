"use client";

import { useSyncExternalStore } from "react";
import { fmtBDT, fmtUSD } from "@/lib/data";

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

export function Price({ bdt, per, className }: { bdt: number; per?: "mo"; className?: string }) {
  const cur = useCurrency();
  const [a, b] = cur === "USD" ? [fmtUSD(bdt), fmtBDT(bdt)] : [fmtBDT(bdt), fmtUSD(bdt)];
  const suffix = per === "mo" ? "/mo" : "";
  return (
    <span className={`price ${className ?? ""}`}>
      <span className="price__main">
        {a}
        {suffix}
      </span>{" "}
      <span className="price__alt">
        ({b}
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
