"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Floating return-path for diagnosed leads: anyone who completed the signal
 * diagnosis and registered, but isn't a hive member yet, sees a small pill
 * that takes them straight back to their locked result page (/kaveret/i)
 * where their personal offer lives. Without it, returning visitors wander
 * the site and never find their way back to the sales page.
 *
 * Mutually exclusive with HiveFloatBar (that one requires hive_status=active,
 * this one requires NOT active) — the two can never stack.
 */
const HIDE_PREFIXES = ["/kaveret", "/signal", "/admin", "/hive/signal-kit/broadcast", "/login", "/signup", "/en"];
const DISMISS_KEY = "signal_return_banner_dismissed";

export function SignalReturnBanner({ href }: { href: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;
  if (HIDE_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 900,
        maxWidth: "min(460px, calc(100vw - 104px))", // keeps clear of the accessibility button (bottom-left)
        background: "linear-gradient(145deg, #1D2430, #111620)",
        border: "1px solid #C9964A55",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "var(--font-assistant), Assistant, sans-serif",
      }}
    >
      <button
        onClick={() => {
          setVisible(false);
          try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
        }}
        aria-label="סגירה"
        style={{
          background: "none", border: "none", color: "#9E9990", cursor: "pointer",
          fontSize: 16, lineHeight: 1, padding: 4, flexShrink: 0,
        }}
      >
        ✕
      </button>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "#EDE9E1", fontSize: 14, fontWeight: 700 }}>האות שלכם שמור אצלנו ✨</div>
        <div style={{ color: "#9E9990", fontSize: 12 }}>התוצאה וההצעה האישית מחכות לכם</div>
      </div>
      <a
        href={href}
        style={{
          flexShrink: 0,
          background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
          color: "#0D1018",
          fontWeight: 800,
          fontSize: 13,
          textDecoration: "none",
          borderRadius: 10,
          padding: "9px 16px",
          whiteSpace: "nowrap",
        }}
      >
        חזרה לאות ←
      </a>
    </div>
  );
}
