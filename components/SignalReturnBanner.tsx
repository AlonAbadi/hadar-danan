"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import sty from "@/app/kaveret/kaveret.module.css";

/**
 * Floating return-path for diagnosed leads - the same breathing glass bar as
 * the members' HiveFloatBar (identical pill, identical scroll behavior:
 * shrinks on scroll down, expands on scroll up), carrying one message and one
 * destination: the lead's locked result page where their personal offer
 * lives. Never dismissible - per Alon (2026-07-21) it must not disappear.
 *
 * Mutually exclusive with HiveFloatBar (that one requires hive_status=active,
 * this one requires NOT active) - the two can never stack.
 */
const HIDE_PREFIXES = ["/kaveret", "/signal", "/admin", "/hive/signal-kit/broadcast", "/login", "/signup", "/en"];

const SIGNAL_ICON = (
  <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, stroke: "currentColor", fill: "none", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", flexShrink: 0 }}>
    <circle cx="12" cy="12" r="2.4" />
    <path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
  </svg>
);

export function SignalReturnBanner({ href }: { href: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mini, setMini] = useState(false);
  const lastY = useRef(0);
  const acc = useRef(0);

  // The exact HiveFloatBar breathing: accumulate scroll direction, flip
  // between full and mini past a small threshold, always full near the top.
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      lastY.current = y;
      if (y < 90) { setMini(false); acc.current = 0; return; }
      if ((dy > 0 && acc.current < 0) || (dy < 0 && acc.current > 0)) acc.current = 0;
      acc.current += dy;
      if (acc.current > 24) setMini(true);
      else if (acc.current < -24) setMini(false);
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  if (HIDE_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return (
    <nav className={`${sty.tabbar} ${mini ? sty.mini : ""}`} aria-label="האות שלך" dir="rtl">
      <button
        type="button"
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(6);
          router.push(href);
        }}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          color: "#EDE9E1",
          padding: "8px 10px",
          minHeight: 52,
        }}
      >
        <span style={{ color: "#E8B94A", display: "flex" }}>{SIGNAL_ICON}</span>
        <span style={{ textAlign: "right", minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>
            האות שלכם שמור אצלנו
          </span>
          <span style={{ display: "block", fontSize: 11.5, color: "#A9A49B", lineHeight: 1.3 }}>
            התוצאה וההצעה האישית מחכות לכם
          </span>
        </span>
        <span
          style={{
            flexShrink: 0,
            background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
            color: "#0D1018",
            fontWeight: 800,
            fontSize: 12.5,
            borderRadius: 999,
            padding: "8px 16px",
            whiteSpace: "nowrap",
          }}
        >
          לאות שלי ←
        </span>
      </button>
    </nav>
  );
}
