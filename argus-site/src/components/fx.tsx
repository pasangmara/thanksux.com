"use client";

import { useEffect } from "react";

// Scroll effects without extra libraries. Everything is visible without JS;
// effects only start after mount, and are skipped for prefers-reduced-motion.
//  [data-reveal]         fades up the first time it enters the viewport
//  [data-progress]       gets --p (0 → 1) while the element scrolls through the screen
//  [data-step]           marks the matching [data-step-link] as active (System section)
//  video[data-inview]    plays muted while on screen, loads its source on first approach
export default function ScrollFx() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    // Reveal: anything already on screen stays visible; the rest waits for its turn.
    if (!reduce && "IntersectionObserver" in window) {
      const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
      const vh = window.innerHeight;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("in");
      }
      root.classList.add("fx");
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
      );
      els.filter((el) => !el.classList.contains("in")).forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    // Progress bars and timelines.
    const bars = Array.from(document.querySelectorAll<HTMLElement>("[data-progress]"));
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      for (const el of bars) {
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / (r.height + vh * 0.25)));
        el.style.setProperty("--p", reduce ? "1" : p.toFixed(3));
      }
      root.classList.toggle("scrolled", window.scrollY > 24);
      const max = document.documentElement.scrollHeight - vh;
      root.style.setProperty("--page", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : "0");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    });

    // Sticky step list in the System section.
    const steps = Array.from(document.querySelectorAll<HTMLElement>("[data-step]"));
    if (steps.length && "IntersectionObserver" in window) {
      const setActive = (id: string) => {
        document.querySelectorAll<HTMLElement>("[data-step-link]").forEach((l) => {
          l.toggleAttribute("data-active", l.dataset.stepLink === id);
        });
        steps.forEach((s) => s.toggleAttribute("data-active", s.dataset.step === id));
      };
      setActive(steps[0].dataset.step || "");
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.step || "");
        },
        { rootMargin: "-45% 0px -45% 0px" },
      );
      steps.forEach((s) => io.observe(s));
      cleanups.push(() => io.disconnect());
    }

    // Nav: highlight the link for the section on screen.
    const LINK_FOR: Record<string, string> = {
      services: "#services",
      pricing: "#pricing",
      "rate-card": "#pricing",
      compare: "#pricing",
      "how-it-works": "#how-it-works",
      demos: "#demos",
      faq: "#faq",
    };
    const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".nav__links a"));
    const secs = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
    if (navLinks.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const href = LINK_FOR[e.target.id];
            navLinks.forEach((a) => a.toggleAttribute("data-active", a.getAttribute("href") === href));
          }
        },
        { rootMargin: "-50% 0px -50% 0px" },
      );
      secs.forEach((s) => io.observe(s));
      cleanups.push(() => io.disconnect());
    }

    // Videos: lazy source, autoplay muted while visible.
    const vids = Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-inview]"));
    if (vids.length && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const v = e.target as HTMLVideoElement;
            if (e.isIntersecting) {
              if (v.dataset.src && !v.src) v.src = v.dataset.src;
              if (!reduce && v.dataset.inview === "play" && v.muted) v.play().catch(() => {});
            } else if (!v.paused && v.muted) {
              v.pause();
            }
          }
        },
        { rootMargin: "200px 0px", threshold: 0.01 },
      );
      vids.forEach((v) => io.observe(v));
      cleanups.push(() => io.disconnect());
    }

    return () => cleanups.forEach((c) => c());
  }, []);

  return null;
}
