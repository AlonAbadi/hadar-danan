/**
 * Shared checkout CTA primitives — used by ChallengeCTA + WorkshopCTA so
 * both products present an identical, premium-feeling pay button.
 *
 * Exports:
 *   CheckoutCtaButton — the full-width gold gradient button with priceNow / priceWas
 *   SavingsBadge      — gold pill showing "חסכת ₪X · {subtext}"
 *   SecurityNote      — "תשלום מאובטח · SSL 256-bit · הצטרפות מיידית" line
 */
"use client";

import type React from "react";

function PriceWas({ amount }: { amount: number }) {
  return (
    <span style={{ position: "relative", fontSize: 17, fontWeight: 600, color: "#6b5320", opacity: 0.78, display: "inline-block" }}>
      {amount}₪
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: -2,
          right: -2,
          top: "52%",
          height: 2,
          background: "#6b5320",
          borderRadius: 2,
          transform: "rotate(-7deg)",
          opacity: 0.85,
        }}
      />
    </span>
  );
}

export function SavingsBadge({
  savings,
  subtext = "מבצע מסתיים בקרוב",
  percent,
}: {
  savings:  number;
  subtext?: string;
  /** When provided, the badge reads "X% הנחה" instead of "חסכת ₪Y". */
  percent?: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        gap: 7,
        background: "rgba(232, 185, 66, 0.12)",
        border: "1px solid rgba(232, 185, 66, 0.32)",
        color: "#E8B94A",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.2px",
        padding: "6px 13px",
        borderRadius: 999,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#E8B94A",
          boxShadow: "0 0 0 4px rgba(232, 185, 66, 0.18)",
        }}
      />
      {percent !== undefined ? `${percent}% הנחה` : `חסכת ₪${savings}`} · {subtext}
    </span>
  );
}

export function SecurityNote() {
  return (
    <p
      style={{
        textAlign: "center",
        color: "rgba(255,255,255,0.5)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.2px",
        margin: 0,
      }}
    >
      תשלום מאובטח · <strong style={{ color: "rgba(255,255,255,0.78)", fontWeight: 700 }}>SSL 256-bit</strong> · הצטרפות מיידית
    </p>
  );
}

function ArrowChip() {
  return (
    <span
      className="cta-arrow"
      aria-hidden
      style={{
        flex: "0 0 auto",
        width: 42,
        height: 42,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "rgba(42, 29, 5, 0.14)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.35) inset",
        transition: "transform 0.18s ease, background 0.18s ease",
      }}
    >
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#2a1d05" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </span>
  );
}

const GOLD_BTN_STYLE: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  width: "100%",
  border: "none",
  cursor: "pointer",
  padding: "17px 22px",
  borderRadius: 18,
  textAlign: "right",
  background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
  boxShadow:
    "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
  overflow: "hidden",
  transition: "transform 0.18s cubic-bezier(.2,.8,.3,1), box-shadow 0.18s ease, filter 0.18s ease",
};

interface CtaButtonProps {
  label:     React.ReactNode;
  priceNow?: number;
  priceWas?: number;
  onClick?:  () => void;
  disabled?: boolean;
  type?:     "button" | "submit";
}

export function CheckoutCtaButton({ label, priceNow, priceWas, onClick, disabled, type = "button" }: CtaButtonProps) {
  const showPriceWas = priceWas !== undefined && priceNow !== undefined && priceWas > priceNow;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="checkout-cta active:scale-[0.98]"
      style={{ ...GOLD_BTN_STYLE, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 19, fontWeight: 800, color: "#2a1d05", letterSpacing: "-0.2px", lineHeight: 1.1 }}>
          {label}
        </span>
        {priceNow !== undefined && (
          <span style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#2a1d05", lineHeight: 1 }}>
              {priceNow}
              <span style={{ fontSize: 19, fontWeight: 800, marginInlineStart: 1 }}>₪</span>
            </span>
            {showPriceWas && <PriceWas amount={priceWas!} />}
          </span>
        )}
      </span>
      <ArrowChip />
    </button>
  );
}
