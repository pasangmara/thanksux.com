import type { Metadata } from "next";
import Link from "next/link";
import { body, display } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Page not found — ARGUS",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <main className="sec sec--green dots notfound">
          <div className="wrap">
            <p className="eyebrow">404</p>
            <h1 className="h2">
              This page doesn’t exist. <span className="mint">The rest of ARGUS does.</span>
            </h1>
            <div className="hero__ctas">
              <Link className="btn btn--mint" href="/">
                Go to the homepage
              </Link>
              <Link className="btn btn--line" href="/bn/" lang="bn">
                বাংলা হোমপেজ
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
