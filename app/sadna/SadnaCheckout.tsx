"use client";

import { useState } from "react";

const btnStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
  background: "linear-gradient(135deg,#E8B94A,#9E7C3A)",
  color: "#1A1206", fontWeight: 800, fontSize: 16,
  padding: "16px 40px", borderRadius: 9999,
  border: "none", cursor: "pointer", width: "100%",
  letterSpacing: "0.02em", fontFamily: "inherit",
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
        body: JSON.stringify({ name, email, phone, source: "sadna" }),
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
