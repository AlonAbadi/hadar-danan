"use client";

import { useState, useEffect } from "react";
import { trackInitiateCheckout, trackLead } from "@/lib/analytics";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";
import { getSessionUser, saveUserDetails } from "@/lib/quiz-session";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

export function CourseCTA({ whatsappPhone, credit = 0, initialEmail = "" }: { whatsappPhone: string; credit?: number; initialEmail?: string }) {
  const [phase, setPhase]       = useState<"idle" | "phone" | "form" | "loading" | "error">("idle");
  const [form, setForm]         = useState({ name: "", email: initialEmail, phone: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [consent, setConsent]   = useState(false);
  const [consentErr, setConsentErr] = useState(false);
  const [quizUserId, setQuizUserId] = useState<string | null>(null);
  const [quizName, setQuizName]     = useState<string | null>(null);
  const [hasPhone, setHasPhone]     = useState(true);
  const [phoneInput, setPhoneInput] = useState("");

  const LIST_PRICE = 1800;
  const toPay      = Math.max(0, LIST_PRICE - credit);

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (sessionUser?.userId) {
      setQuizUserId(sessionUser.userId);
      setQuizName(sessionUser.name.split(" ")[0]);
      setHasPhone(!!sessionUser.phone);
      setForm((f) => ({ ...f, name: sessionUser.name, email: sessionUser.email, phone: sessionUser.phone }));
      return;
    }
    fetch("/api/user/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) {
          setQuizUserId(data.id);
          setQuizName(data.name?.split(" ")[0] ?? null);
          setHasPhone(!!data.phone);
          setForm((f) => ({ ...f, name: data.name ?? "", email: data.email ?? "", phone: data.phone ?? "" }));
        }
      })
      .catch(() => {});
  }, []);

  async function doCheckout(userId: string) {
    setPhase("loading");
    setErrorMsg(null);
    try {
      trackInitiateCheckout("course_1800", toPay);
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CHECKOUT_STARTED",
          anonymous_id: getCookie("anon_id"),
          metadata: { product: "course_1800", price: toPay },
        }),
      }).catch(() => {});

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "course_1800", user_id: userId }),
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
      // 1. Upsert user + fire CHECKOUT_STARTED
      const signupRes = await fetch("/api/signup", {
        method:  "POST",
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

      // Fire CHECKOUT_STARTED event
      trackInitiateCheckout("course_1800", 1800);
      fetch("/api/events", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:         "CHECKOUT_STARTED",
          anonymous_id: getCookie("anon_id"),
          metadata:     { product: "course_1800", price: 1800 },
        }),
      }).catch(() => {});

      if (!userId) {
        // Signup failed - WhatsApp fallback
        fallbackWhatsapp();
        return;
      }

      // 2. Create Cardcom payment
      const checkoutRes = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "course_1800", user_id: userId }),
      });

      if (checkoutRes.status === 503) {
        // Cardcom not configured - WhatsApp fallback
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

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneInput.trim() || !quizUserId) return;
    setPhase("loading");
    try {
      await fetch("/api/user/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      await doCheckout(quizUserId);
    } catch {
      setErrorMsg("שגיאת רשת, נסה שוב");
      setPhase("error");
    }
  }

  function fallbackWhatsapp() {
    if (whatsappPhone) {
      const msg = encodeURIComponent(`היי הדר! אני רוצה להירשם לקורס הדיגיטלי ב-₪1,800. מה הצעד הבא?`);
      window.open(`https://wa.me/${whatsappPhone}?text=${msg}`, "_blank");
    }
    setPhase("idle");
  }

  if (phase === "phone") {
    return (
      <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4" dir="rtl">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#9E9990]">מספר טלפון לחשבונית</label>
          <input
            type="tel"
            placeholder="0501234567"
            required
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            dir="ltr"
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition"
            style={{ background: "#1D2430", borderColor: "#2C323E", color: "#EDE9E1" }}
          />
        </div>
        <button type="submit" className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] btn-cta-gold">
          המשך לתשלום ←
        </button>
        <button type="button" onClick={() => setPhase("idle")} className="text-sm text-[#9E9990] hover:text-[#EDE9E1] transition text-center">
          ביטול
        </button>
      </form>
    );
  }

  if (phase === "idle") {
    if (quizUserId) {
      return (
        <button
          onClick={() => hasPhone ? doCheckout(quizUserId) : setPhase("phone")}
          className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] btn-cta-gold"
        >
          {quizName ? `${quizName}, ` : ""}
          {toPay === 0
            ? "קבל גישה חינם ←"
            : toPay < LIST_PRICE
              ? `המשך לתשלום ₪${toPay.toLocaleString("he-IL")} ←`
              : `המשך לתשלום ₪${LIST_PRICE.toLocaleString("he-IL")} ←`}
        </button>
      );
    }

    return (
      <button
        onClick={() => setPhase("form")}
        className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] btn-cta-gold"
      >
        {toPay === 0
          ? "קבל גישה חינם ←"
          : toPay < LIST_PRICE
            ? `אני רוצה להירשם - ₪${toPay.toLocaleString("he-IL")} ←`
            : "אני רוצה להירשם ←"}
      </button>
    );
  }

  // Quiz user in loading/error state — no registration form
  if (quizUserId && (phase === "loading" || phase === "error")) {
    return (
      <div className="flex flex-col gap-3">
        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        <button
          onClick={() => doCheckout(quizUserId)}
          disabled={phase === "loading"}
          className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] disabled:opacity-60 btn-cta-gold"
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
          <label htmlFor={`course-${id}`} className="text-sm font-medium text-[#9E9990]">{label}</label>
          <input
            id={`course-${id}`}
            type={type}
            placeholder={placeholder}
            required
            value={form[id as keyof typeof form]}
            onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
            dir={type === "email" || type === "tel" ? "ltr" : "rtl"}
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition"
            style={{ background: "#1D2430", borderColor: "#2C323E", color: "#EDE9E1" }}
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
        {phase === "loading"
          ? "מעביר לתשלום..."
          : toPay === 0
            ? "קבל גישה חינם ←"
            : toPay < LIST_PRICE
              ? `לתשלום ₪${toPay.toLocaleString("he-IL")} בלבד ←`
              : "לתשלום מאובטח ←"}
      </button>

      <button
        type="button"
        onClick={() => { setPhase("idle"); setErrorMsg(null); }}
        className="text-sm text-[#9E9990] hover:text-[#EDE9E1] transition text-center"
      >
        ביטול
      </button>
    </form>
  );
}
