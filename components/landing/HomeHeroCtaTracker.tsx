"use client";

import { useEffect } from "react";
import type { AbVariant } from "@/lib/ab";

interface Props { abVariant: AbVariant }

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

/**
 * Fires PAGE_VIEW (for landing_headline_click experiment) immediately on mount,
 * then a CTA_CLICKED event the first time the visitor clicks the hero CTA.
 *
 * This is the secondary/leading-indicator experiment alongside the primary
 * landing_headline test. The two are sliced from the same visitor pool — same
 * ab_variant cookie, same /; the only difference is what counts as conversion:
 *   - landing_headline       → completed signal extraction (lagging, accurate)
 *   - landing_headline_click → CTA click (leading, noisier but quick)
 *
 * The page-view increment is fired here (not via the existing PageTracker) so
 * the click experiment has its own visitor pool tied 1:1 to its conversions.
 */
export function HomeHeroCtaTracker({ abVariant }: Props) {
  useEffect(() => {
    const anonymousId = getCookie("anon_id");

    // 1. Mark the visitor for the click experiment
    fetch("/api/events", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        type: "PAGE_VIEW",
        anonymous_id: anonymousId,
        metadata: {
          page:            "/",
          ab_variant:      abVariant,
          experiment_name: "landing_headline_click",
        },
      }),
    }).catch(() => {});

    // 2. Attach a one-shot click handler to all hero CTA anchors
    const ctas = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-home-hero-cta]"));
    let fired = false;
    const onClick = () => {
      if (fired) return;
      fired = true;
      // navigator.sendBeacon is the right tool here: the browser is about
      // to navigate away, fetch() would race the unload. Beacon delivers
      // even after navigation starts.
      const body = JSON.stringify({
        type: "CTA_CLICKED",
        anonymous_id: anonymousId,
        metadata: {
          page:            "/",
          target:          "/signal",
          ab_variant:      abVariant,
          experiment_name: "landing_headline_click",
        },
      });
      try {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/events", blob);
      } catch {
        // fallback — keepalive lets fetch survive the unload race in most browsers
        fetch("/api/events", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    for (const cta of ctas) cta.addEventListener("click", onClick);
    return () => { for (const cta of ctas) cta.removeEventListener("click", onClick); };
  }, [abVariant]);

  return null;
}
