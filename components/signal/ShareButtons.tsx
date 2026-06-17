"use client";

import { useEffect, useState } from "react";

interface Props {
  extractionId: string;
  firstName?:   string;
}

type Status = "checking" | "ready" | "preparing" | "downloading" | "shared" | "error" | "disabled";

const CAPTION = "גילית עכשיו את האות שלי. שווה לכם לנסות: beegood.online/signal";

/**
 * Three distinct share actions, all rendered as a row of equal-weight gold
 * buttons under a visible "שתפו את האות שלכם" header. Replaces the legacy
 * single-button ShareButton — same look-and-feel, just three explicit paths.
 *
 *   1. WhatsApp — opens wa.me with the pre-filled caption (no PNG attach;
 *      WhatsApp doesn't accept file attachments via the wa.me URL scheme).
 *      User can then attach the downloaded PNG manually if they want.
 *   2. Story (Instagram) — uses the native share sheet on mobile (lets the
 *      user pick Instagram → Story). Falls back to PNG download + a toast
 *      with instructions on desktop or unsupported mobile browsers.
 *   3. PNG — direct download of /api/signal/[id]/share-card.
 *
 * Each click fires POST /api/events with type=SHARE_CARD_CLICKED and the
 * source in metadata so we can measure which channel each extraction
 * actually flows to.
 *
 * Hidden entirely if the share-card endpoint returns non-2xx on HEAD
 * (Bannerbear not configured yet) — same probe pattern as the legacy
 * ShareButton, so behavior in degraded mode is preserved.
 */
export function ShareButtons({ extractionId, firstName }: Props) {
  const [status, setStatus]   = useState<Status>("checking");
  const [toast, setToast]     = useState<string | null>(null);

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

  function track(source: "whatsapp" | "instagram" | "download") {
    // Fire-and-forget — never block the share UX on telemetry
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "SHARE_CARD_CLICKED",
        metadata: { source, extraction_id: extractionId },
      }),
    }).catch(() => {});
  }

  function showToast(msg: string, ms = 3500) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  async function fetchCardBlob(): Promise<Blob | null> {
    try {
      const res = await fetch(`/api/signal/${extractionId}/share-card`);
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href     = url;
    a.download = "האות-שלי.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Action: WhatsApp ────────────────────────────────────────
  // Opens wa.me with the caption. PNG isn't attached (wa.me can't carry
  // files), so the user shares the link + text; they can paste the PNG
  // in afterward if they want.
  function handleWhatsApp() {
    track("whatsapp");
    const href = `https://wa.me/?text=${encodeURIComponent(CAPTION)}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  // ── Action: Instagram Story (native share on mobile, download elsewhere) ─
  async function handleInstagram() {
    if (status !== "ready") return;
    track("instagram");
    setStatus("preparing");

    const blob = await fetchCardBlob();
    if (!blob) {
      setStatus("error");
      showToast("לא הצלחנו להכין את הכרטיס. נסו שוב בעוד רגע.");
      setTimeout(() => setStatus("ready"), 2500);
      return;
    }

    const file = new File([blob], "האות-שלי.png", { type: "image/png" });

    // Mobile: native share sheet — lets user pick Instagram → Story
    if (typeof navigator !== "undefined" && navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: firstName ? `${firstName} — האות שלי` : "האות שלי",
          text:  CAPTION,
        });
        setStatus("shared");
        setTimeout(() => setStatus("ready"), 2500);
        return;
      } catch (e) {
        // User cancelled → back to ready quietly
        if ((e as Error)?.name === "AbortError") {
          setStatus("ready");
          return;
        }
        // fall through to download
      }
    }

    // Desktop / unsupported mobile: download + show instructions
    downloadBlob(blob);
    setStatus("shared");
    showToast("התמונה ירדה. פתחו אינסטגרם → סטורי → בחרו את התמונה. תייגו @hadar_danan");
    setTimeout(() => setStatus("ready"), 3500);
  }

  // ── Action: PNG download ────────────────────────────────────
  async function handleDownload() {
    if (status !== "ready") return;
    track("download");
    setStatus("downloading");

    const blob = await fetchCardBlob();
    if (!blob) {
      setStatus("error");
      showToast("לא הצלחנו להכין את הכרטיס. נסו שוב.");
      setTimeout(() => setStatus("ready"), 2500);
      return;
    }
    downloadBlob(blob);
    setStatus("shared");
    setTimeout(() => setStatus("ready"), 2000);
  }

  // ── Render ──────────────────────────────────────────────────
  if (status === "checking" || status === "disabled") return null;

  const busy = status === "preparing" || status === "downloading";

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{
        color:         "#E8B94A",
        fontSize:      14,
        fontWeight:    700,
        letterSpacing: "0.04em",
        marginBottom:  12,
        textAlign:     "center",
      }}>
        שתפו את האות שלכם
      </div>

      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 8,
          maxWidth:            420,
          margin:              "0 auto",
        }}
      >
        <ShareButton
          onClick={handleWhatsApp}
          disabled={false}
          label="WhatsApp"
          icon={<WhatsAppIcon />}
        />
        <ShareButton
          onClick={handleInstagram}
          disabled={busy}
          label="Story"
          icon={<InstagramIcon />}
        />
        <ShareButton
          onClick={handleDownload}
          disabled={busy}
          label="PNG"
          icon={<DownloadIcon />}
        />
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop:    14,
            padding:      "10px 14px",
            background:   "rgba(232,185,74,0.08)",
            border:       "1px solid rgba(232,185,74,0.25)",
            borderRadius: 10,
            color:        "#EDE9E1",
            fontSize:     12.5,
            lineHeight:   1.55,
            textAlign:    "center",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Single button presenter ────────────────────────────────────
function ShareButton({
  onClick,
  disabled,
  label,
  icon,
}: {
  onClick:   () => void;
  disabled:  boolean;
  label:     string;
  icon:      React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`שתף — ${label}`}
      style={{
        background:    "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
        color:         "#2a1d05",
        border:        "none",
        borderRadius:  12,
        padding:       "12px 10px",
        fontSize:      13,
        fontWeight:    800,
        cursor:        disabled ? "default" : "pointer",
        fontFamily:    "inherit",
        boxShadow:     "0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 16px -6px rgba(214,155,31,0.55)",
        transition:    "transform 0.12s, box-shadow 0.12s",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           6,
        opacity:       disabled ? 0.6 : 1,
      }}
    >
      {icon}
      <span style={{ fontSize: 12.5, lineHeight: 1 }}>{label}</span>
    </button>
  );
}

// ── Icons (inline SVG, fill matches the dark button text color) ──
function WhatsAppIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="#2a1d05" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.464 3.488"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="#2a1d05" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="#2a1d05" aria-hidden="true">
      <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 4v-2h14v2H5z"/>
    </svg>
  );
}
