"use client";

import { useState } from "react";

const C = {
  text:     "#F2EDE4",
  textMute: "rgba(242,237,228,0.55)",
  gold:     "#C2973F",
  border:   "rgba(242,237,228,0.18)",
  ctaBg:    "#C2973F",
  ctaFg:    "#0D0C0A",
};

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
      style={{
        fontFamily:    "var(--font-jakarta), sans-serif",
        fontSize:      13,
        fontWeight:    700,
        letterSpacing: "0.04em",
        color:         C.ctaFg,
        background:    C.ctaBg,
        border:        "none",
        borderRadius:  10,
        padding:       "11px 22px",
        cursor:        "pointer",
        display:       "inline-flex",
        alignItems:    "center",
        gap:           8,
      }}
    >
      {done ? "Copied" : "Copy to share"}
    </button>
  );
}

export function ShareButton({ title, text, url }: { title: string; text: string; url: string }) {
  const [done, setDone] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canShare = typeof navigator !== "undefined" && typeof (navigator as any).share === "function";

  async function share() {
    try {
      if (canShare) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (navigator as any).share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={share}
      style={{
        fontFamily:    "var(--font-jakarta), sans-serif",
        fontSize:      13,
        fontWeight:    700,
        letterSpacing: "0.04em",
        color:         C.text,
        background:    "transparent",
        border:        `1px solid ${C.border}`,
        borderRadius:  10,
        padding:       "11px 22px",
        cursor:        "pointer",
      }}
    >
      {done ? "Link copied" : canShare ? "Share" : "Copy link"}
    </button>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      style={{
        fontFamily:    "var(--font-jakarta), sans-serif",
        fontSize:      12,
        fontWeight:    600,
        letterSpacing: "0.06em",
        color:         C.textMute,
        background:    "transparent",
        border:        `1px solid ${C.border}`,
        borderRadius:  999,
        padding:       "10px 22px",
        cursor:        "pointer",
      }}
    >
      Print
    </button>
  );
}

export function RestartButton() {
  return (
    <button
      type="button"
      onClick={() => {
        try { localStorage.removeItem("bg_en_signal_draft_v1"); } catch {}
        try { localStorage.removeItem("bg_ts_q1"); } catch {}
        window.location.href = "/en/signal";
      }}
      style={{
        fontFamily:    "var(--font-jakarta), sans-serif",
        fontSize:      12,
        fontWeight:    600,
        letterSpacing: "0.06em",
        color:         C.textMute,
        background:    "transparent",
        border:        `1px solid ${C.border}`,
        borderRadius:  999,
        padding:       "10px 22px",
        cursor:        "pointer",
      }}
    >
      Start over
    </button>
  );
}
