// חדר השידור — shared UI atoms: consistent navigation bar, buttons with real
// press/busy/disabled feedback, and the global interaction styles.
// Every screen uses these — no more dead ends and no more silent taps.
"use client";

import Link from "next/link";

export function RoomStyles() {
  return (
    <style>{`
      .br-btn { transition: transform 0.1s ease, opacity 0.1s ease, filter 0.1s ease; -webkit-tap-highlight-color: transparent; }
      .br-btn:active:not(:disabled) { transform: scale(0.96); filter: brightness(1.12); }
      .br-btn:disabled { cursor: default; }
      @keyframes br-spin { to { transform: rotate(360deg); } }
      @keyframes br-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      .br-spinner { display: inline-block; width: 16px; height: 16px; border-radius: 8px;
        border: 2px solid rgba(42,29,5,0.25); border-top-color: currentColor;
        animation: br-spin 0.8s linear infinite; vertical-align: -3px; }
      .br-spinner-gold { border-color: rgba(232,185,74,0.25); border-top-color: #E8B94A; }
      .br-live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 4px;
        background: #E8B94A; animation: br-pulse 1.4s infinite; }
    `}</style>
  );
}

// Slim persistent top bar: every non-camera screen gets one — the user always
// knows where she is and always has a way back.
export function TopBar({
  title,
  backHref,
  onBack,
  backLabel = "חזרה",
}: {
  title: string;
  backHref?: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  const back = (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: "#C9964A",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span style={{ fontSize: 17 }}>→</span> {backLabel}
    </span>
  );
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 16px",
        paddingTop: "calc(env(safe-area-inset-top) + 10px)",
        background: "rgba(8,12,20,0.92)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(44,50,62,0.6)",
      }}
    >
      {backHref ? (
        <Link href={backHref} style={{ textDecoration: "none" }} className="br-btn">
          {back}
        </Link>
      ) : onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="br-btn"
          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
        >
          {back}
        </button>
      ) : (
        <span style={{ width: 60 }} />
      )}
      <span style={{ color: "#EDE9E1", fontSize: 15, fontWeight: 700 }}>{title}</span>
      <span style={{ width: 60 }} />
    </div>
  );
}

export function ActionButton({
  variant,
  busy,
  busyLabel,
  disabled,
  onClick,
  href,
  download,
  children,
}: {
  variant: "primary" | "secondary" | "ghost";
  busy?: boolean;
  busyLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  download?: boolean;
  children: React.ReactNode;
}) {
  const enabled = !disabled && !busy;
  const base: React.CSSProperties = {
    width: "100%",
    minHeight: variant === "primary" ? 52 : 48,
    borderRadius: 12,
    fontSize: variant === "primary" ? 17 : 16,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    textDecoration: "none",
    fontFamily: "inherit",
    cursor: enabled ? "pointer" : "default",
    border: "none",
  };
  const styles: React.CSSProperties =
    variant === "primary"
      ? {
          ...base,
          background: enabled
            ? "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)"
            : "#2C323E",
          color: enabled ? "#2a1d05" : "#9E9990",
        }
      : variant === "secondary"
        ? {
            ...base,
            border: "1px solid rgba(232,185,74,0.4)",
            background: "transparent",
            color: enabled ? "#E8B94A" : "#9E9990",
          }
        : {
            ...base,
            background: "transparent",
            color: "#9E9990",
            fontWeight: 600,
            minHeight: 40,
          };

  const content = busy ? (
    <>
      <span className={`br-spinner ${variant !== "primary" ? "br-spinner-gold" : ""}`} />
      {busyLabel ?? children}
    </>
  ) : (
    children
  );

  if (href && enabled) {
    return (
      <a href={href} download={download} onClick={onClick} className="br-btn" style={styles}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" disabled={!enabled} onClick={onClick} className="br-btn" style={styles}>
      {content}
    </button>
  );
}
