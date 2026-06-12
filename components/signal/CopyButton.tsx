"use client";

import { useState } from "react";

interface Props {
  text:  string;
  label?: string;       // default "העתק"
  size?:  "sm" | "md";  // default "md"
}

/**
 * Copy-to-clipboard button. Soft "הועתק" state for ~1.6s after click.
 * Falls back silently if clipboard API isn't available (older mobile browsers).
 */
export function CopyButton({ text, label = "העתק", size = "md" }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // older browsers — try the textarea fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      } catch {
        // give up silently — they can long-press to copy
      }
    }
  }

  const isSm = size === "sm";
  return (
    <button
      onClick={handleCopy}
      style={{
        background:   copied ? "rgba(232,185,74,0.18)" : "rgba(232,185,74,0.10)",
        color:        copied ? "#E8B94A" : "#C9964A",
        border:       `1px solid ${copied ? "#E8B94A" : "rgba(232,185,74,0.30)"}`,
        borderRadius: 999,
        padding:      isSm ? "6px 14px" : "8px 18px",
        fontSize:     isSm ? 12 : 13,
        fontWeight:   700,
        cursor:       "pointer",
        fontFamily:   "inherit",
        transition:   "all 0.15s",
        display:      "inline-flex",
        alignItems:   "center",
        gap:          6,
      }}
      aria-label={copied ? "הועתק" : label}
    >
      {copied ? "✓ הועתק" : `⧉ ${label}`}
    </button>
  );
}
