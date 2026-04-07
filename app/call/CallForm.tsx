"use client";

import { useState, useEffect } from "react";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";
import { getSessionUser } from "@/lib/quiz-session";

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

export function CallForm({ price }: { price: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", business: "", goal: "" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [consent, setConsent]   = useState(false);
  const [consentErr, setConsentErr] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    if (user) {
      setForm((f) => ({ ...f, name: user.name, email: user.email, phone: user.phone }));
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setConsentErr(true); return; }
    setState("loading");

    try {
      // Fire CHECKOUT_STARTED event for strategy call
      await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CHECKOUT_STARTED",
          anonymous_id: getCookie("anon_id"),
          metadata: { product: "strategy_4000", price: Number(price) },
        }),
      });

      // Also signup/upsert the user so they're in the CRM
      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:              form.name,
          email:             form.email,
          phone:             form.phone,
          anonymous_id:      getCookie("anon_id"),
          ab_variant:        getCookie("ab_variant"),
          marketing_consent: consent,
        }),
      });

      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(201,150,74,0.08)", border: "2px solid rgba(201,150,74,0.4)" }}
        >
          <svg className="w-8 h-8" fill="none" stroke="#C9964A" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-xl font-black" style={{ color: "#EDE9E1" }}>קיבלתי את הפנייה!</h3>
        <p className="text-sm text-[#9E9990]">אחזור אליך תוך 24 שעות לתיאום מועד השיחה.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" dir="rtl">
      {[
        { id: "name", label: "שם מלא", type: "text", placeholder: "ישראל ישראלי", required: true },
        { id: "email", label: "אימייל", type: "email", placeholder: "israel@example.com", required: true },
        { id: "phone", label: "טלפון", type: "tel", placeholder: "0501234567", required: true },
        { id: "business", label: "במה עוסק העסק שלך?", type: "text", placeholder: "לדוגמה: מאמן אישי, יועץ עסקי...", required: true },
      ].map(({ id, label, type, placeholder, required }) => (
        <div key={id} className="flex flex-col gap-1">
          <label htmlFor={id} className="text-sm font-medium text-[#9E9990]">{label}</label>
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            required={required}
            value={form[id as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
            dir={type === "email" || type === "tel" ? "ltr" : "rtl"}
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition"
            style={{ background: "#1D2430", borderColor: "#2C323E", color: "#EDE9E1" }}
          />
        </div>
      ))}

      <div className="flex flex-col gap-1">
        <label htmlFor="goal" className="text-sm font-medium text-[#9E9990]">
          מה המטרה העיקרית שלך לשנה הקרובה?
        </label>
        <textarea
          id="goal"
          rows={3}
          placeholder="ספר לי על האתגר הכי גדול שלך עכשיו..."
          value={form.goal}
          onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
          className="w-full rounded-xl border px-4 py-3 text-base outline-none transition resize-none"
          style={{ background: "#1D2430", borderColor: "#2C323E", color: "#EDE9E1" }}
        />
      </div>

      <ConsentCheckbox
        checked={consent}
        onChange={(v) => { setConsent(v); if (v) setConsentErr(false); }}
        error={consentErr}
        dark
      />

      {state === "error" && (
        <p className="text-red-400 text-sm text-center">שגיאה, נסה שוב</p>
      )}

      <button
        type="submit"
        disabled={state === "loading"}
        className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] disabled:opacity-60 btn-cta-gold"
      >
        {state === "loading" ? "שולח..." : `שמור את המקום שלי - ₪${price}`}
      </button>

      <p className="text-center text-xs text-[#9E9990]">
        שמירת מקום אינה מחייבת תשלום עכשיו - נתאם ואז נשלח פרטי תשלום.
      </p>
    </form>
  );
}
