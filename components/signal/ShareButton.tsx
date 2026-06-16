"use client";

import { useEffect, useState } from "react";

interface Props {
  extractionId: string;
  firstName?:   string;
}

type Status = "checking" | "ready" | "preparing" | "sharing" | "shared" | "error" | "disabled";

/**
 * Hides itself entirely if the share-card endpoint returns 503 (Bannerbear
 * not configured yet). On mount, sends a HEAD request to probe — if the
 * endpoint is live, the button appears; if not, it's silently absent.
 *
 * When live: fetches the PNG, hands it to navigator.share({files}) on mobile
 * (opens native share sheet for WhatsApp/IG/Camera Roll), or downloads
 * directly on desktop.
 */
export function ShareButton({ extractionId, firstName }: Props) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/signal/${extractionId}/share-card`, { method: "HEAD" });
        if (cancelled) return;
        setStatus(res.ok ? "ready" : "disabled");
      } catch {
        if (!cancelled) setStatus("disabled");
      }
    })();
    return () => { cancelled = true; };
  }, [extractionId]);

  async function handleShare() {
    if (status !== "ready" && status !== "shared" && status !== "error") return;
    setStatus("preparing");

    let blob: Blob;
    try {
      const res = await fetch(`/api/signal/${extractionId}/share-card`);
      if (!res.ok) throw new Error("share-card fetch failed");
      blob = await res.blob();
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("ready"), 2000);
      return;
    }

    const file = new File([blob], "האות-שלי.png", { type: "image/png" });

    // Native share on mobile
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        setStatus("sharing");
        await navigator.share({
          files: [file],
          title: firstName ? `${firstName} — האות שלי` : "האות שלי",
          text:  "האות המותגי שלי לפי שיטת TrueSignal© של beegood.online",
        });
        setStatus("shared");
        setTimeout(() => setStatus("ready"), 2500);
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setStatus("ready");
          return;
        }
        // fall through to download
      }
    }

    // Desktop: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "האות-שלי.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus("shared");
    setTimeout(() => setStatus("ready"), 2500);
  }

  if (status === "checking" || status === "disabled") return null;

  const busy = status === "preparing" || status === "sharing";
  // Note: was using ↗ which renders as tofu in the bundled font on some
  // platforms. Switched to ← to match the rest of the site's CTA arrows
  // (RTL "forward" indicator).
  const label =
    status === "preparing" ? "מכין…" :
    status === "sharing"   ? "פתח שיתוף…" :
    status === "shared"    ? "✓ מוכן" :
    status === "error"     ? "תקלה, נסה שוב" :
    "שתף את האות שלי ←";

  return (
    <button
      onClick={handleShare}
      disabled={busy}
      style={{
        background:   "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
        color:        "#2a1d05",
        border:       "none",
        borderRadius: 999,
        padding:      "10px 22px",
        fontSize:     13,
        fontWeight:   800,
        cursor:       busy ? "default" : "pointer",
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
