"use client";

import { useState, useEffect } from "react";
import { trackProductLead, trackInitiateCheckout } from "@/lib/analytics";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";
import { getSessionUser } from "@/lib/quiz-session";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

export function PremiumLeadForm() {
  const [form, setForm]         = useState({ name: "", email: "", phone: "", business: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);
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
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/premium-lead", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, anonymous_id: getCookie("anon_id"), marketing_consent: consent }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "שגיאה, נסה שוב");
        return;
      }

      const premiumData = await res.json().catch(() => ({}));
      const premiumUserId = (premiumData as Record<string, string>).user_id;
      trackProductLead("premium", premiumUserId ?? undefined);
      fetch("/api/meta-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName:        "Lead",
          eventId:          premiumUserId ?? undefined,
          email:            form.email,
          phone:            form.phone,
          firstName:        form.name.split(" ")[0],
          lastName:         form.name.split(" ").slice(1).join(" ") || undefined,
          userId:           premiumUserId ?? undefined,
          contentName:      "premium",
          productEventName: "LeadPremium",
          value:            2100,
          currency:         "ILS",
        }),
      }).catch(() => {});
      setDone(true);
    } catch {
      setError("שגיאת רשת, נסה שוב");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "rgba(201,150,74,0.08)", border: "2px solid rgba(201,150,74,0.5)" }}
        >
          <svg className="w-10 h-10" fill="none" stroke="#C9964A" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-black" style={{ color: "#EDE9E1" }}>הבקשה התקבלה!</h3>
          <p style={{ color: "#9E9990" }}>ניצור קשר תוך 24 שעות לתיאום שיחת היכרות</p>
        </div>
        <div
          className="w-full rounded-2xl p-5 text-right"
          style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.12)" }}
        >
          <p className="text-sm" style={{ color: "#9E9990" }}>מה הצפוי:</p>
          <p className="font-medium mt-2" style={{ color: "#EDE9E1" }}>📞 שיחת היכרות - 15 דקות</p>
          <p className="font-medium mt-1" style={{ color: "#EDE9E1" }}>📋 בניית אסטרטגיית תוכן</p>
          <p className="font-medium mt-1" style={{ color: "#EDE9E1" }}>🎬 תיאום יום הצילום</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" dir="rtl">
      {[
        { id: "name",     label: "שם מלא",      type: "text",  placeholder: "ישראל ישראלי" },
        { id: "business", label: "שם העסק",     type: "text",  placeholder: "חברה בע״מ" },
        { id: "phone",    label: "טלפון",        type: "tel",   placeholder: "0501234567" },
        { id: "email",    label: "אימייל",       type: "email", placeholder: "israel@example.com" },
      ].map(({ id, label, type, placeholder }) => (
        <div key={id} className="flex flex-col gap-1">
          <label htmlFor={id} className="text-sm font-medium" style={{ color: "#9E9990" }}>{label}</label>
          <input
            id={id}
            type={type}
            placeholder={placeholder}
            required
            value={form[id as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
            dir={type === "email" || type === "tel" ? "ltr" : "rtl"}
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition"
            style={{
              background:   "#1D2430",
              borderColor:  "#2C323E",
              color:        "#EDE9E1",
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "rgba(201,150,74,0.6)"; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = "#2C323E"; }}
          />
        </div>
      ))}

      <ConsentCheckbox
        checked={consent}
        onChange={(v) => { setConsent(v); if (v) setConsentErr(false); }}
        error={consentErr}
        dark
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] disabled:opacity-60 btn-cta-gold"
      >
        {submitting ? "שולח..." : "אני רוצה לדבר עם נציג ←"}
      </button>

      <p className="text-center text-xs" style={{ color: "rgba(158,153,144,0.5)" }}>
        ללא התחייבות · חוזרים תוך 24 שעות
      </p>
    </form>
  );
}

// ── Pay button ────────────────────────────────────────────────
export function PremiumPayButton({ credit = 0 }: { credit?: number }) {
  const [loading, setLoading] = useState(false);
  const LIST_PRICE = 14000;
  const toPay      = Math.max(0, LIST_PRICE - credit);

  async function handleClick() {
    setLoading(true);
    trackInitiateCheckout("premium_14000", 14000);
    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ product: "premium_14000", user_id: "00000000-0000-0000-0000-000000000000" }),
      });

      if (res.status === 503) {
        // Cardcom not configured - show message
        alert("תשלום מקוון בקרוב - בינתיים מלא/י את טופס יצירת הקשר למטה");
        return;
      }

      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch {
      alert("שגיאת רשת, נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full rounded-full py-4 text-lg font-bold text-center active:scale-[0.98] disabled:opacity-60 btn-cta-gold"
    >
      {loading
        ? "מעביר..."
        : toPay < LIST_PRICE
          ? `לתשלום ₪${toPay.toLocaleString("he-IL")} בלבד ←`
          : "לתשלום מאובטח ←"}
    </button>
  );
}
