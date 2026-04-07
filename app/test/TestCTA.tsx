"use client";

import { useState } from "react";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

export function TestCTA() {
  const [phase, setPhase]       = useState<"idle" | "form" | "loading" | "error">("idle");
  const [form, setForm]         = useState({ name: "", email: "", phone: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [consent, setConsent]   = useState(false);
  const [consentErr, setConsentErr] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setConsentErr(true); return; }
    setPhase("loading");
    setErrorMsg(null);

    try {
      const signupRes = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:              form.name,
          email:             form.email,
          phone:             form.phone,
          anonymous_id:      getCookie("anon_id"),
          marketing_consent: consent,
        }),
      });

      let userId: string | null = null;
      if (signupRes.ok) {
        const data = await signupRes.json();
        userId = data.user_id ?? null;
      }

      if (!userId) {
        setErrorMsg("שגיאה ביצירת משתמש, נסה שוב");
        setPhase("error");
        return;
      }

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "test_1", user_id: userId }),
      });

      if (checkoutRes.ok) {
        const { url } = await checkoutRes.json();
        if (url) { window.location.href = url; return; }
      }

      setErrorMsg("שגיאה בעת יצירת תשלום, נסה שוב");
      setPhase("error");
    } catch {
      setErrorMsg("שגיאת רשת, נסה שוב");
      setPhase("error");
    }
  }

  if (phase === "idle") {
    return (
      <button
        onClick={() => setPhase("form")}
        className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] btn-cta-gold"
      >
        לתשלום ₪1 ←
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" dir="rtl">
      {[
        { id: "name",  label: "שם מלא",  type: "text",  placeholder: "ישראל ישראלי" },
        { id: "email", label: "אימייל",   type: "email", placeholder: "israel@example.com" },
        { id: "phone", label: "טלפון",    type: "tel",   placeholder: "0501234567" },
      ].map(({ id, label, type, placeholder }) => (
        <div key={id} className="flex flex-col gap-1">
          <label htmlFor={`t-${id}`} className="text-sm font-medium" style={{ color: "#9E9990" }}>{label}</label>
          <input
            id={`t-${id}`}
            type={type}
            placeholder={placeholder}
            required
            value={form[id as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
            dir={type === "email" || type === "tel" ? "ltr" : "rtl"}
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition"
            style={{ background: "#1D2430", borderColor: "#2C323E", color: "#EDE9E1" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = "#2C323E"; }}
          />
        </div>
      ))}

      <ConsentCheckbox
        checked={consent}
        onChange={(v) => { setConsent(v); if (v) setConsentErr(false); }}
        error={consentErr}
        dark
      />

      {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={phase === "loading"}
        className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] disabled:opacity-60 btn-cta-gold"
      >
        {phase === "loading" ? "מעביר לתשלום..." : "לתשלום מאובטח ₪1 ←"}
      </button>

      <button
        type="button"
        onClick={() => { setPhase("idle"); setErrorMsg(null); }}
        className="text-sm text-center transition"
        style={{ color: "#9E9990" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#EDE9E1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#9E9990"; }}
      >
        ביטול
      </button>
    </form>
  );
}
