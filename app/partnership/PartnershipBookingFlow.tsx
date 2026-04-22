"use client";

import { useState, useEffect } from "react";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";
import { getSessionUser } from "@/lib/quiz-session";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

export function PartnershipBookingFlow() {
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [consent,    setConsent]    = useState(false);
  const [consentErr, setConsentErr] = useState(false);

  const [form, setForm] = useState({
    name:      "",
    business:  "",
    phone:     "",
    email:     "",
    challenge: "",
  });

  useEffect(() => {
    const user = getSessionUser();
    if (user) {
      setForm((f) => ({ ...f, name: user.name, email: user.email, phone: user.phone }));
    }
  }, []);

  const inputStyle = { background: "#1D2430", borderColor: "#2C323E", color: "#EDE9E1" };
  const focusBorder = "rgba(201,150,74,0.6)";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) { setConsentErr(true); return; }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partnership-lead", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          anonymous_id:      getCookie("anon_id"),
          marketing_consent: consent,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as Record<string, string>).error ?? "שגיאה, נסה שוב");
        return;
      }

      setSuccess(true);

      // Browser Pixel Lead — deduplicates with CAPI using matching eventID
      const userId = (data as Record<string, string>).user_id;
      window.fbq?.("track", "Lead",
        { content_name: "partnership_lead", content_ids: ["partnership_lead"] },
        userId ? { eventID: `partnership_${userId}` } : undefined,
      );
    } catch {
      setError("שגיאת רשת, נסה שוב");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center" dir="rtl">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "rgba(201,150,74,0.08)", border: "2px solid rgba(201,150,74,0.5)" }}
        >
          <svg className="w-10 h-10" fill="none" stroke="#C9964A" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-black" style={{ color: "#EDE9E1" }}>הפרטים התקבלו!</h3>
          <p style={{ color: "#9E9990" }}>נחזור אליך תוך 24–48 שעות לשיחת היכרות קצרה.</p>
        </div>
        <div
          className="w-full rounded-2xl p-5 text-right"
          style={{ background: "rgba(201,150,74,0.06)", border: "1px solid rgba(201,150,74,0.1)" }}
        >
          <p className="text-sm mb-2" style={{ color: "#9E9990" }}>מה הצפוי בשיחה:</p>
          <p className="font-medium" style={{ color: "#EDE9E1" }}>🔍 נבין את העסק והאתגר שלך</p>
          <p className="text-sm mt-1" style={{ color: "#9E9990" }}>בלי שאלות סטנדרטיות — שיחה אמיתית.</p>
          <p className="font-medium mt-3" style={{ color: "#EDE9E1" }}>✍️ גם אם לא נעבוד יחד</p>
          <p className="text-sm mt-1" style={{ color: "#9E9990" }}>תצא מהשיחה עם בהירות — זה הבטחה.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" dir="rtl">
      {[
        { id: "name",     label: "שם מלא",  type: "text",  placeholder: "ישראל ישראלי" },
        { id: "business", label: "שם העסק", type: "text",  placeholder: "חברה / מותג / שם הפרויקט" },
        { id: "phone",    label: "טלפון",   type: "tel",   placeholder: "0501234567" },
        { id: "email",    label: "אימייל",  type: "email", placeholder: "israel@example.com" },
      ].map(({ id, label, type, placeholder }) => (
        <div key={id} className="flex flex-col gap-1.5">
          <label htmlFor={`partner-${id}`} className="text-sm font-semibold" style={{ color: "#9E9990" }}>
            {label}
          </label>
          <input
            id={`partner-${id}`}
            type={type}
            placeholder={placeholder}
            required
            value={form[id as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
            dir={type === "email" || type === "tel" ? "ltr" : "rtl"}
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition"
            style={inputStyle}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = focusBorder; }}
            onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "#2C323E"; }}
          />
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="partner-challenge" className="text-sm font-semibold" style={{ color: "#9E9990" }}>
          מה האתגר העסקי שלך כרגע?
        </label>
        <textarea
          id="partner-challenge"
          required
          minLength={10}
          rows={4}
          placeholder="תאר בכמה משפטים - מה לא עובד, מה אתה מנסה להשיג, מה עוצר אותך"
          value={form.challenge}
          onChange={(e) => setForm((f) => ({ ...f, challenge: e.target.value }))}
          className="w-full rounded-xl border px-4 py-3 text-base outline-none transition resize-none"
          style={{ ...inputStyle, lineHeight: "1.6" }}
          onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = focusBorder; }}
          onBlur={(e)  => { (e.target as HTMLTextAreaElement).style.borderColor = "#2C323E"; }}
        />
      </div>

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
        {submitting ? "שולח..." : "השאר פרטים ונחזור אליך ←"}
      </button>

      <p className="text-center text-xs" style={{ color: "rgba(158,153,144,0.5)" }}>
        ללא התחייבות. גם אם לא נעבוד יחד — יוצאים עם בהירות.
      </p>
    </form>
  );
}
