"use client";

import { useState } from "react";

interface Props {
  extractionId: string;
  ownerEmail:   string;          // the email tied to this extraction (gate input or session)
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * "שלח לי את האות באימייל" — posts to /api/signal/[id]/email-result with the
 * owner's email as proof-of-ownership. Immediate send via Resend on success.
 * Soft transient states; recovers if the user clicks again after an error.
 */
export function EmailMeButton({ extractionId, ownerEmail }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function handleSend() {
    if (status === "sending") return;
    setStatus("sending");
    setErrMsg(null);
    try {
      const res = await fetch(`/api/signal/${extractionId}/email-result`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ email: ownerEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrMsg(data?.error ?? "תקלה בשליחה");
        return;
      }
      setStatus("sent");
      // Re-enable after a few seconds so they can resend if needed
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setErrMsg("תקלה ברשת");
    }
  }

  const disabled = status === "sending" || !extractionId || !ownerEmail;
  const label =
    status === "sending" ? "שולח…" :
    status === "sent"    ? "✓ נשלח לאימייל שלך" :
    status === "error"   ? (errMsg ?? "נסה שוב") :
    "✉ שלח לי את כל האות באימייל";

  return (
    <button
      onClick={handleSend}
      disabled={disabled}
      style={{
        background:   status === "sent" ? "rgba(76,175,130,0.12)" : "rgba(232,185,74,0.10)",
        color:        status === "sent" ? "#4CAF82" : "#C9964A",
        border:       `1px solid ${status === "sent" ? "rgba(76,175,130,0.35)" : "rgba(232,185,74,0.30)"}`,
        borderRadius: 999,
        padding:      "10px 22px",
        fontSize:     13,
        fontWeight:   700,
        cursor:       disabled ? "default" : "pointer",
        fontFamily:   "inherit",
        opacity:      disabled && status !== "sent" ? 0.6 : 1,
        transition:   "all 0.15s",
      }}
      aria-label="שלח לי באימייל"
    >
      {label}
    </button>
  );
}
