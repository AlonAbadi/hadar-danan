"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "bg_ts_q1";

export function QuestionCard() {
  const router = useRouter();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        ta.value = saved;
        autosize(ta);
      }
    } catch {}
    const onInput = () => {
      try { localStorage.setItem(STORAGE_KEY, ta.value); } catch {}
      autosize(ta);
    };
    ta.addEventListener("input", onInput);
    return () => ta.removeEventListener("input", onInput);
  }, []);

  function autosize(ta: HTMLTextAreaElement) {
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }

  function begin() {
    const v = taRef.current?.value ?? "";
    try { localStorage.setItem(STORAGE_KEY, v); } catch {}
    router.push("/en/signal");
  }

  return (
    <div
      style={{
        maxWidth: 580,
        margin: "52px auto 0",
        textAlign: "left",
        background: "#FFFFFF",
        border: "1px solid rgba(15,16,17,0.10)",
        borderRadius: 20,
        padding: 30,
        boxShadow:
          "0 2px 4px rgba(15,16,17,0.03), 0 30px 60px -40px rgba(15,16,17,0.30)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <span style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: "#9A9C9E" }}>
          Question 01 / 05
        </span>
        <span style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#9A7526" }}>
          TrueSignal©
        </span>
      </div>
      <label
        htmlFor="ts-q1"
        style={{
          display: "block",
          fontFamily: "var(--font-space-grotesk), sans-serif",
          fontWeight: 500,
          fontSize: 23,
          lineHeight: 1.25,
          letterSpacing: "-0.02em",
          color: "#0F1011",
          marginBottom: 18,
        }}
      >
        Describe a moment you lost all track of time.
      </label>
      <textarea
        ref={taRef}
        id="ts-q1"
        rows={2}
        placeholder="A sentence, or a few. There are no wrong answers."
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "#F5F5F2",
          border: `1px solid ${focused ? "rgba(154,117,38,0.6)" : "rgba(15,16,17,0.08)"}`,
          borderRadius: 12,
          fontFamily: "var(--font-hanken-grotesk), sans-serif",
          fontSize: 15,
          lineHeight: 1.6,
          color: "#0F1011",
          padding: "14px 14px",
          resize: "none",
          outline: "none",
          transition: "border-color .2s ease",
        }}
      />
      <button
        type="button"
        onClick={begin}
        style={{
          width: "100%",
          marginTop: 16,
          fontFamily: "var(--font-hanken-grotesk), sans-serif",
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: "0.01em",
          color: "#FBFBF9",
          background: "#0F1011",
          border: "none",
          borderRadius: 12,
          padding: "15px 22px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          transition: "background .2s ease",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#9A7526"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#0F1011"; }}
      >
        Reveal my signal <span style={{ fontSize: 16 }}>→</span>
      </button>
      <p style={{ fontFamily: "var(--font-hanken-grotesk), sans-serif", fontSize: 12.5, lineHeight: 1.5, color: "#9A9C9E", margin: "14px 0 0", textAlign: "center" }}>
        ≈ 10 minutes · free · the third question can be skipped
      </p>
    </div>
  );
}
