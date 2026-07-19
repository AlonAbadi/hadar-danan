"use client";

import { useEffect, useState } from "react";
import { TrackedCta } from "../TrackedCta";

/**
 * LiveClient — all client behavior for /new/live that isn't the canvas:
 * (1) opts the page into hidden-then-reveal (adds `js-reveal` to .live-root) so
 *     copy is fully visible if JS fails; (2) an IntersectionObserver adds `.in`
 *     to [data-reveal] elements (CSS transitions do the motion — never per-frame
 *     DOM writes); (3) a sticky bottom CTA bar that appears once the hero scrolls
 *     out (toggled by IO on #live-hero-sentinel, not a scroll listener).
 */
export function LiveClient() {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const root = document.querySelector(".live-root");
    root?.classList.add("js-reveal");

    const ioR = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); ioR.unobserve(e.target); } }),
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll(".live-root [data-reveal]").forEach((el) => ioR.observe(el));

    let ioS: IntersectionObserver | undefined;
    const sentinel = document.getElementById("live-hero-sentinel");
    if (sentinel) {
      ioS = new IntersectionObserver(
        (entries) => { const e = entries[0]; setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0); },
        { threshold: 0 }
      );
      ioS.observe(sentinel);
    }

    return () => { ioR.disconnect(); ioS?.disconnect(); };
  }, []);

  return (
    <div className={`live-sticky${showSticky ? " show" : ""}`} aria-hidden={!showSticky}>
      <TrackedCta dest="kriah" placement="final_cta" className="live-gold live-sticky-btn">לגלות את האות שלי — בחינם</TrackedCta>
    </div>
  );
}
