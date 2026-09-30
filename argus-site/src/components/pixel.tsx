"use client";

import Script from "next/script";
import { useEffect } from "react";
import { META_PIXEL_ID } from "@/lib/data";

// Meta (Facebook) Pixel. Uses META_PIXEL_ID from data.ts; a build can override it with
// NEXT_PUBLIC_META_PIXEL_ID=<id>, or turn tracking off with NEXT_PUBLIC_META_PIXEL_ID=off.
// Events: PageView on load, ViewContent when the pricing section is seen,
// Lead when a SEE Audit WhatsApp link is clicked, Contact for any other WhatsApp link.
const RAW = process.env.NEXT_PUBLIC_META_PIXEL_ID || META_PIXEL_ID;
const PIXEL_ID = /^\d{6,20}$/.test(RAW) ? RAW : "";

type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window {
    fbq?: Fbq;
  }
}

const track = (...args: unknown[]) => window.fbq?.(...args);

export default function MetaPixel() {
  useEffect(() => {
    if (!PIXEL_ID) return;

    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !a.href.startsWith("https://wa.me/")) return;
      const text = new URL(a.href).searchParams.get("text") ?? "";
      if (text.includes("SEE")) {
        track("track", "Lead", { content_name: "SEE Audit", value: 2500, currency: "BDT" });
      } else {
        track("track", "Contact", { content_name: text.slice(0, 80) });
      }
    };
    document.addEventListener("click", onClick);

    let io: IntersectionObserver | undefined;
    const pricing = document.getElementById("pricing");
    if (pricing && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((x) => x.isIntersecting)) {
            track("track", "ViewContent", { content_name: "Pricing" });
            io?.disconnect();
          }
        },
        { threshold: 0.25 },
      );
      io.observe(pricing);
    }

    return () => {
      document.removeEventListener("click", onClick);
      io?.disconnect();
    };
  }, []);

  if (!PIXEL_ID) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}
