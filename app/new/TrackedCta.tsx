"use client";

/**
 * Local /new-only tracked CTA. Fires a GA4 event (gtag is already loaded
 * globally by components/analytics/Pixels.tsx) on click, then lets the normal
 * navigation proceed. No new analytics infra, no GA4 config change, no PII.
 * Used ONLY on /new.
 */
import type { CSSProperties, ReactNode } from "react";

type Dest = "kriah" | "strategy";
type Placement = "header" | "hero" | "path_card" | "final_cta" | "broadcast";

const EVENT: Record<Dest, string> = {
  kriah:    "NEW_HOME_KRIAH_CLICK",
  strategy: "NEW_HOME_STRATEGY_CLICK",
};
const HREF: Record<Dest, string> = { kriah: "/kriah", strategy: "/strategy" };

export function TrackedCta({
  dest,
  placement,
  className,
  style,
  children,
}: {
  dest:       Dest;
  placement:  Placement;
  className?: string;
  style?:     CSSProperties;
  children:   ReactNode;
}) {
  const onClick = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).gtag?.("event", EVENT[dest], {
        placement,
        destination: HREF[dest],
      });
    } catch {
      /* tracking must never block navigation */
    }
  };
  return (
    <a href={HREF[dest]} className={className} style={style} onClick={onClick}>
      {children}
    </a>
  );
}
