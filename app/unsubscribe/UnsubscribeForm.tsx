"use client";

import { useState, FormEvent } from "react";

type Status = "idle" | "loading" | "success" | "error" | "not_found";

export function UnsubscribeForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
      } else if (res.status === 404 || data.error === "not_found") {
        setStatus("not_found");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: 14,
          padding: "24px 28px",
          textAlign: "center",
          color: "#EDE9E1",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
        <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 8 }}>ההסכמה לדיוור בוטלה</p>
        <p style={{ color: "#9E9990", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {email} הוסר מרשימת הדיוור שלנו. לא תקבל יותר עדכונים שיווקיים.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          htmlFor="unsub-email"
          style={{ fontSize: "0.875rem", fontWeight: 600, color: "#EDE9E1" }}
        >
          כתובת אימייל
        </label>
        <input
          id="unsub-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          dir="ltr"
          style={{
            background: "#1D2430",
            border: "1px solid #2C323E",
            borderRadius: 10,
            padding: "12px 16px",
            color: "#EDE9E1",
            fontSize: "1rem",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
      </div>

      {status === "not_found" && (
        <p style={{
          background: "rgba(201,150,74,0.1)",
          border: "1px solid rgba(201,150,74,0.3)",
          borderRadius: 8,
          padding: "10px 14px",
          color: "#C9964A",
          fontSize: "0.875rem",
        }}>
          האימייל הזה לא נמצא במערכת שלנו.
        </p>
      )}

      {status === "error" && (
        <p style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8,
          padding: "10px 14px",
          color: "#ef4444",
          fontSize: "0.875rem",
        }}>
          אירעה שגיאה. אנא נסה שוב או פנה אלינו ישירות.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          background: status === "loading" ? "rgba(201,150,74,0.4)" : "#C9964A",
          color: "#0D1018",
          fontWeight: 700,
          fontSize: "0.95rem",
          fontFamily: "inherit",
          border: "none",
          borderRadius: 10,
          padding: "13px 24px",
          cursor: status === "loading" ? "default" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "opacity 0.15s ease",
        }}
      >
        {status === "loading" && (
          <span style={{
            width: 14, height: 14,
            border: "2px solid rgba(13,16,24,0.3)",
            borderTopColor: "#0D1018",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            display: "inline-block",
            flexShrink: 0,
          }} />
        )}
        {status === "loading" ? "מבטל הסכמה..." : "בטל הסכמה לדיוור"}
      </button>
    </form>
  );
}
