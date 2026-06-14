"use client";

import { useState } from "react";

const C = {
  ink:      "#211B12",
  inkSoft:  "#594F41",
  inkFaint: "#988D7B",
  gold:     "#9A7526",
  goldDeep: "#6F521A",
  paper:    "#F4EFE4",
  lineSoft: "rgba(33,27,18,0.10)",
  card:     "#FCFAF3",
};

export function NotifyForm({ centered = false }: { centered?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = validEmail && state !== "sending";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setState("sending");
    setMsg(null);
    try {
      const res = await fetch("/api/en/hive/notify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof data?.error === "string" ? data.error : "Something went wrong. Try again in a moment.");
        setState("err");
        return;
      }
      setState("ok");
    } catch {
      setMsg("Network error. Try again.");
      setState("err");
    }
  }

  if (state === "ok") {
    return (
      <div
        style={{
          textAlign: centered ? "center" : "left",
          fontFamily: "var(--font-spectral), Georgia, serif",
          fontStyle: "italic",
          fontSize: 18,
          lineHeight: 1.55,
          color: C.ink,
          maxWidth: "44ch",
          margin: centered ? "0 auto" : undefined,
        }}
      >
        We will write back when the door opens.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 460,
        margin: centered ? "0 auto" : undefined,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          background: C.card,
          border: `1px solid ${C.lineSoft}`,
          borderRadius: 6,
          padding: 6,
          alignItems: "stretch",
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            padding: "12px 14px",
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: 15,
            color: C.ink,
          }}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            fontFamily:    "var(--font-hanken-grotesk), sans-serif",
            fontSize:      12.5,
            fontWeight:    500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color:         "#F4EFE4",
            background:    canSubmit ? C.ink : "rgba(33,27,18,0.4)",
            border:        "none",
            borderRadius:  4,
            padding:       "13px 22px",
            cursor:        canSubmit ? "pointer" : "not-allowed",
            transition:    "background .2s ease",
            whiteSpace:    "nowrap",
          }}
        >
          {state === "sending" ? "Sending…" : "Notify me"}
        </button>
      </div>
      {msg && (
        <p
          role="alert"
          style={{
            fontFamily: "var(--font-hanken-grotesk), sans-serif",
            fontSize: 13,
            color: "#B5654A",
            margin: 0,
            textAlign: centered ? "center" : "left",
          }}
        >
          {msg}
        </p>
      )}
      <p
        style={{
          fontFamily:    "var(--font-hanken-grotesk), sans-serif",
          fontSize:      11.5,
          letterSpacing: "0.06em",
          color:         C.inkFaint,
          margin:        0,
          textAlign:     centered ? "center" : "left",
          lineHeight:    1.55,
        }}
      >
        We will email you once when the door opens - and never again unless you ask.
      </p>
    </form>
  );
}
