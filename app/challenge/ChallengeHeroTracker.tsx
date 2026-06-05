"use client";

import { useEffect, useRef } from "react";
import type { AbVariant } from "@/lib/ab";
import { CHALLENGE_HERO_EXPERIMENT, CHALLENGE_HERO_CHECKOUT_EXPERIMENT } from "@/lib/ab";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

function detectDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  const w = window.innerWidth || 1024;
  if (w <= 640) return "mobile";
  if (w <= 1024) return "tablet";
  return "desktop";
}

// Fires PAGE_VIEW twice — once for each of the two parallel experiments
// (primary = purchase-based, secondary = checkout-based). Both share the
// same ab_variant cookie so visitor counts stay in lockstep across runs.
// Device type is sent in metadata so we can slice the result post-hoc.
export function ChallengeHeroTracker({ variant }: { variant: AbVariant }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const anonymous_id = getCookie("anon_id");
    const device_type  = detectDevice();
    const base = {
      type: "PAGE_VIEW" as const,
      anonymous_id,
      metadata: {
        page: "/challenge",
        ab_variant: variant,
        device_type,
        referrer: document.referrer || null,
      },
    };

    // Primary experiment (purchase-based)
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...base,
        metadata: { ...base.metadata, experiment_name: CHALLENGE_HERO_EXPERIMENT },
      }),
    }).catch(() => {});

    // Secondary experiment (checkout-based) — same visit, different counter
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...base,
        metadata: { ...base.metadata, experiment_name: CHALLENGE_HERO_CHECKOUT_EXPERIMENT },
      }),
    }).catch(() => {});
  }, [variant]);

  return null;
}
