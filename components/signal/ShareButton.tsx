"use client";

import { useState } from "react";

interface Props {
  extractionId: string;
  firstName?:   string;
}

type Status = "idle" | "preparing" | "sharing" | "shared" | "error";

/**
 * Fetches the PNG share-card for this extraction and either:
 *  - hands it to navigator.share() on mobile (opens the native share sheet
 *    so the user can pick WhatsApp / IG / Camera Roll), or
 *  - triggers a direct download on desktop.
 *
 * Why fetch the PNG client-side instead of just passing the URL:
 * navigator.share with `files` triggers the native sheet with image preview
 * + save options, which is the experience we want for "share my signal".
 * Sharing a URL alone is weaker — most receivers don't unfurl OG images
 * in messaging apps cleanly.
 */
export function ShareButton({ extractionId, firstName }: Props) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleShare() {
    if (status === "preparing" || status === "sharing") return;
    setStatus("preparing");

    let blob: Blob;
    try {
      const res = await fetch(`/api/signal/${extractionId}/share-card`);
      if (!res.ok) throw new Error("share-card fetch failed");
      blob = await res.blob();
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    const file = new File([blob], "האות-שלי.png", { type: "image/png" });

    // Try native share with the file (mobile only — Android + recent iOS)
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        setStatus("sharing");
        await navigator.share({
          files: [file],
          title: firstName ? `${firstName} — האות שלי` : "האות שלי",
          text:  "האות המותגי שלי לפי שיטת TrueSignal© של beegood.online",
        });
        setStatus("shared");
        setTimeout(() => setStatus("idle"), 2500);
        return;
      } catch (e) {
        // User canceled the share sheet — not an error, just reset
        if ((e as Error).name === "AbortError") {
          setStatus("idle");
          return;
        }
        // fall through to download fallback
      }
    }

    // Desktop / unsupported: download as PNG
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "האות-שלי.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus("shared");
    setTimeout(() => setStatus("idle"), 2500);
  }

  const label =
    status === "preparing" ? "מכין…" :
    status === "sharing"   ? "פתח שיתוף…" :
    status === "shared"    ? "✓ מוכן" :
    status === "error"     ? "תקלה, נסה שוב" :
    "↗ שתף את האות שלי";

  return (
    <button
      onClick={handleShare}
      disabled={status === "preparing" || status === "sharing"}
      style={{
        background:   "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
        color:        "#2a1d05",
        border:       "none",
        borderRadius: 999,
        padding:      "10px 22px",
        fontSize:     13,
        fontWeight:   800,
        cursor:       status === "preparing" || status === "sharing" ? "default" : "pointer",
        fontFamily:   "inherit",
        boxShadow:    "0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 16px -6px rgba(214,155,31,0.55)",
        transition:   "all 0.15s",
      }}
      aria-label="שתף את האות"
    >
      {label}
    </button>
  );
}
