"use client";

import { useState } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
  background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
  color: "#2a1d05", fontWeight: 800, fontSize: 16,
  padding: "16px 40px", borderRadius: 9999,
  border: "none", cursor: "pointer", width: "100%",
  letterSpacing: "0.02em", fontFamily: "inherit",
  boxShadow: "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "13px 16px", borderRadius: 10,
  background: "#131C2E", border: "1px solid rgba(201,150,74,0.25)",
  color: "#EDE9E1", fontSize: 15, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
};

export function SadnaCheckout() {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !phone) { setError("יש למלא את כל השדות"); return; }
    setError(""); setLoading(true);

    try {
      // 1. Create / find user
      const signupRes = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          source:       "sadna",
          ab_variant:   getCookie("ab_variant"),
          anonymous_id: getCookie("anon_id"),
        }),
      });
      const signupData = await signupRes.json();
      if (!signupRes.ok || !signupData.user_id) throw new Error("הרישום נכשל");

      // 2. Create Cardcom payment page
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "sadna_500", user_id: signupData.user_id }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.url) throw new Error(`שגיאה ביצירת דף תשלום (${checkoutData.error ?? checkoutRes.status})`);

      window.location.href = checkoutData.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה — נסה שוב");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input
        style={inputStyle} placeholder="שם מלא" value={name}
        onChange={e => setName(e.target.value)} required dir="rtl"
      />
      <input
        style={inputStyle} placeholder="אימייל" type="email" value={email}
        onChange={e => setEmail(e.target.value)} required dir="ltr"
      />
      <input
        style={inputStyle} placeholder="טלפון" type="tel" value={phone}
        onChange={e => setPhone(e.target.value)} required dir="ltr"
      />
      {error && <p style={{ color: "#E8B94A", fontSize: 13, margin: 0 }}>{error}</p>}
      <button type="submit" style={btnStyle} disabled={loading}>
        {loading ? "מעביר לתשלום..." : "לתשלום מאובטח ←"}
      </button>
      <p style={{ fontSize: 12, color: "#9E9990", textAlign: "center", margin: 0 }}>
        ₪500 · תשלום מאובטח דרך Cardcom
      </p>
    </form>
  );
}
