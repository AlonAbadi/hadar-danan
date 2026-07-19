import type { ReactNode } from "react";

/**
 * Soft rounded-hexagon "honey cell" + a bespoke duotone icon set for /new.
 * The hexagon corners are rounded (SVG quadratic joins) so the shape speaks the
 * bee logo's soft/rounded language instead of a sharp technical hexagon. Icons
 * are custom duotone (soft filled mass + crisp rounded-cap detail, single
 * currentColor) — warmer and more intentional than stock line icons.
 */

const HEX_D =
  "M 62.99 10.5 L 77.71 19 Q 90.7 26.5 90.7 41.5 L 90.7 58.5 Q 90.7 73.5 77.71 81 " +
  "L 62.99 89.5 Q 50 97 37.01 89.5 L 22.29 81 Q 9.3 73.5 9.3 58.5 L 9.3 41.5 " +
  "Q 9.3 26.5 22.29 19 L 37.01 10.5 Q 50 4 62.99 10.5 Z";

/** Render ONCE per page — shared gradient defs referenced by every hex. */
export function HexDefs() {
  return (
    <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="nhHexGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8DC8C" />
          <stop offset="0.5" stopColor="#E8B94A" />
          <stop offset="1" stopColor="#C1892F" />
        </linearGradient>
        <linearGradient id="nhHexRim" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#F0C866" />
          <stop offset="1" stopColor="#8C6C33" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HoneyHex({
  children,
  gold = false,
  size = "md",
  className,
}: {
  children: ReactNode;
  gold?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span className={`nh-hx nh-hx-${size}${gold ? " nh-hx-gold" : ""}${className ? " " + className : ""}`}>
      <svg viewBox="0 0 100 100" className="nh-hx-bg" aria-hidden>
        {gold ? (
          <path d={HEX_D} fill="url(#nhHexGold)" />
        ) : (
          <path d={HEX_D} fill="#12161F" stroke="url(#nhHexRim)" strokeWidth="4" strokeLinejoin="round" />
        )}
      </svg>
      <span className="nh-hx-ico" aria-hidden>{children}</span>
    </span>
  );
}

/* ── bespoke duotone icons (soft mass @ .22 + crisp rounded detail) ── */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const soft = { fill: "currentColor", opacity: 0.3 };

export function IcAI() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <path {...soft} d="M5 4.5h13a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3v-3H5A2.5 2.5 0 0 1 2.5 13V7A2.5 2.5 0 0 1 5 4.5Z" />
      <path {...S} d="M11.5 6.6c.7 2.1 1.4 2.8 3.5 3.5-2.1.7-2.8 1.4-3.5 3.5-.7-2.1-1.4-2.8-3.5-3.5 2.1-.7 2.8-1.4 3.5-3.5Z" />
    </svg>
  );
}

export function IcCopy() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <rect {...soft} x="3.5" y="3.5" width="12" height="12" rx="3.6" />
      <rect {...S} x="8.5" y="8.5" width="12" height="12" rx="3.6" />
    </svg>
  );
}

export function IcLost() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <path {...soft} d="M8 17a4.3 4.3 0 0 1-.9-8.5 4.8 4.8 0 0 1 9.2-1.2A3.7 3.7 0 0 1 16.2 17H8Z" />
      <path {...S} d="M10.4 10.6a1.7 1.7 0 1 1 2.4 1.6c-.6.3-.9.8-.9 1.4" />
      <circle cx="11.9" cy="16.1" r="1" fill="currentColor" />
    </svg>
  );
}

export function IcSignal() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <rect {...soft} x="2.5" y="5.5" width="19" height="13" rx="4.2" />
      <path {...S} d="M5 12h2.6l1.7-4.6 3.1 9 2-6.1 1.4 1.7H19" />
    </svg>
  );
}

export function IcStrategy() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <circle {...soft} cx="12" cy="12" r="8.5" />
      <circle {...S} cx="12" cy="12" r="4.6" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function IcContent() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <path {...soft} d="M14.8 5.2l4 4-9.1 9.1-4.7 1.4 1.4-4.7 8.4-9.8Z" />
      <path {...S} d="M13.5 6.5l4 4M6.4 15l-1.4 4.6L9.6 18" />
    </svg>
  );
}

export function IcData() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <rect {...soft} x="4" y="12.5" width="3.4" height="7" rx="1.5" />
      <rect {...soft} x="10.3" y="9" width="3.4" height="10.5" rx="1.5" />
      <rect {...soft} x="16.6" y="6.5" width="3.4" height="13" rx="1.5" />
      <path {...S} d="M5 9.5l4-2.6 3.2 1.8 6-4" />
    </svg>
  );
}

export function IcHuman() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <path {...soft} d="M4.5 20.5a7.5 7.5 0 0 1 15 0Z" />
      <circle {...S} cx="12" cy="7" r="3.4" />
    </svg>
  );
}

export function IcLasting() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <path {...soft} d="M12 12.5c0-3.4 2.3-5.6 6.5-5.6 0 3.4-2.3 5.6-6.5 5.6Zm0 0c0-3.4-2.3-5.6-6.5-5.6 0 3.4 2.3 5.6 6.5 5.6Z" />
      <path {...S} d="M12 20.5v-9" />
    </svg>
  );
}

export function IcSoul() {
  return (
    <svg viewBox="0 0 24 24" className="nh-ic">
      <path {...soft} d="M5.5 18.5C5.5 11.2 10.7 6 18 6c0 7.3-5.2 12.5-12.5 12.5Z" />
      <ellipse {...S} cx="12" cy="12" rx="8.4" ry="3.5" transform="rotate(-45 12 12)" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
