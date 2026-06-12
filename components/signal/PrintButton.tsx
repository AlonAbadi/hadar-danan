"use client";

/**
 * Triggers the browser's native print dialog. Combined with the @media print
 * styles in SignalClient.tsx, the page prints/exports-to-PDF with nav, CTAs,
 * and footer hidden — just the diagnostic itself.
 */
export function PrintButton() {
  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <button
      onClick={handlePrint}
      style={{
        background:   "transparent",
        color:        "#AAB0BD",
        border:       "1px solid rgba(232,185,74,0.20)",
        borderRadius: 999,
        padding:      "10px 22px",
        fontSize:     13,
        fontWeight:   600,
        cursor:       "pointer",
        fontFamily:   "inherit",
        display:      "inline-flex",
        alignItems:   "center",
        gap:          6,
      }}
      aria-label="הורד כ-PDF"
    >
      ⤓ הורד כ-PDF
    </button>
  );
}
