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
        background: "#FFFFFF",
        borderRadius: 20,
        overflow: "hidden",
        border: "1px solid rgba(13,12,10,0.08)",
        boxShadow:
          "0 4px 12px rgba(13,12,10,0.04), 0 40px 80px -48px rgba(13,12,10,0.24)",
      }}
    >
      <div style={{ height: 4, background: "linear-gradient(90deg, #C2973F, #9A7526)" }} />
      <div style={{ padding: 30 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", color: "#A79C8C" }}>
            Question 01 / 05
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#9A7526",
            }}
          >
            TrueSignal©
          </span>
        </div>
        <label
          htmlFor="ts-q1"
          style={{
            display: "block",
            fontSize: "clamp(21px, 3vw, 26px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.2,
            color: "#0D0C0A",
            marginBottom: 20,
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
            background: "#F5F1E8",
            border: `1.5px solid ${focused ? "rgba(194,151,63,0.55)" : "rgba(13,12,10,0.07)"}`,
            borderRadius: 12,
            fontFamily: "var(--font-jakarta), -apple-system, system-ui, sans-serif",
            fontSize: 14.5,
            lineHeight: 1.6,
            color: "#0D0C0A",
            padding: 14,
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
            marginTop: 14,
            fontFamily: "var(--font-jakarta), -apple-system, system-ui, sans-serif",
            fontSize: 14.5,
            fontWeight: 700,
            color: "#FFFFFF",
            background: "#0D0C0A",
            border: "none",
            borderRadius: 10,
            padding: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxSizing: "border-box",
            transition: "background .2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#1E1C18"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#0D0C0A"; }}
        >
          Reveal my signal <span style={{ fontSize: 16 }}>→</span>
        </button>
      </div>
    </div>
  );
}
