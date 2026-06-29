"use client";

import { useEffect, useRef } from "react";
import type { AbVariant } from "@/lib/ab";

interface PageTrackerProps {
  abVariant: AbVariant;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function PageTracker({ abVariant }: PageTrackerProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const anonymousId = getCookie("anon_id");

    // Session-only cookie that proves the user actually saw the new
    // homepage copy in THIS browser session. /api/signal/extract reads it
    // before counting a landing_headline conversion — without this guard,
    // any visitor with an old ab_variant cookie (set up to 30 days earlier
    // from a different copy version) inflates conversion counts when they
    // hit /signal directly via email/quiz/bookmark. The session cookie
    // expires the moment the browser closes, so it can never carry across
    // copy iterations.
    if (typeof document !== "undefined") {
      document.cookie = `landing_home_session=${abVariant}; path=/; SameSite=Lax`;
    }

    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PAGE_VIEW",
        anonymous_id: anonymousId,
        metadata: {
          page: "/",
          ab_variant: abVariant,
          referrer: document.referrer || null,
        },
      }),
    }).catch(() => {
      // non-critical - silently ignore
    });
  }, [abVariant]);

  return null;
}
