"use client";

import { useEffect, useRef } from "react";

interface PageTrackerProps {
  abVariant: "A" | "B";
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
