"use client";

import { useState, useEffect } from "react";
import { trackInitiateCheckout, trackLead } from "@/lib/analytics";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";
import { getSessionUser, saveUserDetails } from "@/lib/quiz-session";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

const WA_ICON = (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function WorkshopCTA({ price, whatsappPhone, credit = 0 }: { price: string; whatsappPhone: string; credit?: number }) {
  const [phase, setPhase]       = useState<"idle" | "form" | "loading" | "error">("idle");
  const [form, setForm]         = useState({ name: "", email: "", phone: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [consent, setConsent]   = useState(false);
  const [consentErr, setConsentErr] = useState(false);
  const [quizUserId, setQuizUserId] = useState<string | null>(null);
  const [quizName, setQuizName]     = useState<string | null>(null);

  const listPrice = Number(price);
  const toPay     = Math.max(0, listPrice - credit);

  useEffect(() => {
    const user = getSessionUser();
    if (user?.userId) {
      setQuizUserId(user.userId);
      setQuizName(user.name.split(" ")[0]);
      setForm({ name: user.name, email: user.email, phone: user.phone });
    }
  }, []);

  async function doCheckout(userId: string) {
    setPhase("loading");
    setErrorMsg(null);
    try {
      trackInitiateCheckout("workshop_1080", toPay);
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CHECKOUT_STARTED",
          anonymous_id: getCookie("anon_id"),
          metadata: { product: "workshop_1080", price: toPay },
        }),
      }).catch(() => {});

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "workshop_1080", user_id: userId }),
      });

      if (checkoutRes.status === 503) { fallbackWhatsapp(); return; }
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
          name:         form.name,
          email:        form.email,
          phone:             form.phone,
          anonymous_id:      getCookie("anon_id"),
          marketing_consent: consent,
        }),
      });

      let userId: string | null = null;
      if (signupRes.ok) {
        const data = await signupRes.json();
        userId = data.user_id ?? null;
        trackLead();
        if (userId) saveUserDetails({ name: form.name, email: form.email, phone: form.phone, userId });
      }

      trackInitiateCheckout("workshop_1080", toPay);
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CHECKOUT_STARTED",
          anonymous_id: getCookie("anon_id"),
          metadata: { product: "workshop_1080", price: toPay },
        }),
      }).catch(() => {});

      if (!userId) {
        fallbackWhatsapp();
        return;
      }

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "workshop_1080", user_id: userId }),
      });

      if (checkoutRes.status === 503) {
        fallbackWhatsapp();
        return;
      }

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

  function fallbackWhatsapp() {
    if (whatsappPhone) {
      const msg = credit > 0
        ? encodeURIComponent(`היי הדר! יש לי זיכוי של ₪${credit} ואני רוצה להצטרף לסדנה. מה הצעד הבא?`)
        : encodeURIComponent(`היי הדר! אני רוצה להצטרף לסדנה יום אחד ב-₪${price}. מה הצעד הבא?`);
      window.open(`https://wa.me/${whatsappPhone}?text=${msg}`, "_blank");
    }
    setPhase("idle");
  }

  const waHref = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent("היי הדר! יש לי שאלה לגבי הסדנה יום אחד")}`
    : null;

  const BTN_STYLE: React.CSSProperties = {
    display: "inline-block",
    width: "auto",
    padding: "15px 36px",
    borderRadius: 14,
    fontSize: 15,
    fontWeight: 800,
    border: "none",
    cursor: "pointer",
  };

  const WRAPPER_STYLE: React.CSSProperties = {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  };

  if (phase === "idle") {
    if (quizUserId) {
      return (
        <div style={WRAPPER_STYLE}>
          <button
            onClick={() => doCheckout(quizUserId)}
            className="btn-cta-gold active:scale-[0.98]"
            style={BTN_STYLE}
          >
            {quizName ? `${quizName}, ` : ""}
            {toPay === 0
              ? "קבל גישה חינם ←"
              : toPay < listPrice
                ? `המשך לתשלום ₪${toPay.toLocaleString("he-IL")} ←`
                : `המשך לתשלום ₪${Number(price).toLocaleString("he-IL")} ←`}
          </button>
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm transition hover:opacity-80"
              style={{ color: "#9E9990" }}
            >
              {WA_ICON}
              שאלות? דבר איתנו בוואטסאפ
            </a>
          )}
        </div>
      );
    }

    return (
      <div style={WRAPPER_STYLE}>
        <button
          onClick={() => setPhase("form")}
          className="btn-cta-gold active:scale-[0.98]"
          style={BTN_STYLE}
        >
          {toPay === 0
            ? "קבל גישה חינם ←"
            : toPay < listPrice
              ? `הצטרף עכשיו - ₪${toPay.toLocaleString("he-IL")} ←`
              : `הרשם לסדנה ← ₪${Number(price).toLocaleString("he-IL")}`}
        </button>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm transition hover:opacity-80"
            style={{ color: "#9E9990" }}
          >
            {WA_ICON}
            שאלות? דבר איתנו בוואטסאפ
          </a>
        )}
      </div>
    );
  }

  // Quiz user in loading/error state — no registration form
  if (quizUserId && (phase === "loading" || phase === "error")) {
    return (
      <div style={WRAPPER_STYLE}>
        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        <button
          onClick={() => doCheckout(quizUserId)}
          disabled={phase === "loading"}
          className="btn-cta-gold active:scale-[0.98] disabled:opacity-60"
          style={BTN_STYLE}
        >
          {phase === "loading" ? "מעביר לתשלום..." : "נסה שוב ←"}
        </button>
      </div>
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
          <label htmlFor={`ws-${id}`} className="text-sm font-medium" style={{ color: "#9E9990" }}>{label}</label>
          <input
            id={`ws-${id}`}
            type={type}
            placeholder={placeholder}
            required
            value={form[id as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
            dir={type === "email" || type === "tel" ? "ltr" : "rtl"}
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition"
            style={{ background: "#1D2430", borderColor: "#2C323E", color: "#EDE9E1" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
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
        className="w-full btn-cta-gold active:scale-[0.98] disabled:opacity-60"
        style={{ borderRadius: 14, padding: "15px 36px", fontSize: 15, fontWeight: 800, border: "none", cursor: "pointer" }}
      >
        {phase === "loading"
          ? "מעביר לתשלום..."
          : toPay === 0
            ? "קבל גישה חינם ←"
            : toPay < listPrice
              ? `לתשלום ₪${toPay.toLocaleString("he-IL")} ←`
              : "לתשלום מאובטח ←"}
      </button>

      <button
        type="button"
        onClick={() => { setPhase("idle"); setErrorMsg(null); }}
        className="text-sm transition text-center"
        style={{ color: "#9E9990" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#EDE9E1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#9E9990"; }}
      >
        ביטול
      </button>
    </form>
  );
}
