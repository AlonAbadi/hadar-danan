"use client";

import { useState, useEffect } from "react";
import { trackInitiateCheckout, trackProductLead } from "@/lib/analytics";
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

interface ChallengeCTAProps {
  price: string;
  originalPrice?: number;
  whatsappPhone: string;
  credit?: number;
}

function PriceWas({ amount }: { amount: number }) {
  return (
    <span style={{ position: "relative", fontSize: 17, fontWeight: 600, color: "#6b5320", opacity: 0.78, display: "inline-block" }}>
      {amount}₪
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: -2,
          right: -2,
          top: "52%",
          height: 2,
          background: "#6b5320",
          borderRadius: 2,
          transform: "rotate(-7deg)",
          opacity: 0.85,
        }}
      />
    </span>
  );
}

function SavingsBadge({ savings }: { savings: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        gap: 7,
        background: "rgba(232, 185, 66, 0.12)",
        border: "1px solid rgba(232, 185, 66, 0.32)",
        color: "#E8B94A",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.2px",
        padding: "6px 13px",
        borderRadius: 999,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "#E8B94A",
          boxShadow: "0 0 0 4px rgba(232, 185, 66, 0.18)",
        }}
      />
      חסכת ₪{savings} · מבצע מסתיים בקרוב
    </span>
  );
}

function SecurityNote() {
  return (
    <p
      style={{
        textAlign: "center",
        color: "rgba(255,255,255,0.5)",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.2px",
        margin: 0,
      }}
    >
      תשלום מאובטח · <strong style={{ color: "rgba(255,255,255,0.78)", fontWeight: 700 }}>SSL 256-bit</strong> · הצטרפות מיידית
    </p>
  );
}

function ArrowChip() {
  return (
    <span
      className="cta-arrow"
      aria-hidden
      style={{
        flex: "0 0 auto",
        width: 42,
        height: 42,
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        background: "rgba(42, 29, 5, 0.14)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.35) inset",
        transition: "transform 0.18s ease, background 0.18s ease",
      }}
    >
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#2a1d05" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </span>
  );
}

const GOLD_BTN_STYLE: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  width: "100%",
  border: "none",
  cursor: "pointer",
  padding: "17px 22px",
  borderRadius: 18,
  textAlign: "right",
  background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
  boxShadow:
    "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
  overflow: "hidden",
  transition: "transform 0.18s cubic-bezier(.2,.8,.3,1), box-shadow 0.18s ease, filter 0.18s ease",
};

interface CtaButtonProps {
  label: React.ReactNode;
  priceNow?: number;
  priceWas?: number;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}

function CheckoutCtaButton({ label, priceNow, priceWas, onClick, disabled, type = "button" }: CtaButtonProps) {
  const showPriceWas = priceWas !== undefined && priceNow !== undefined && priceWas > priceNow;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="checkout-cta active:scale-[0.98]"
      style={{ ...GOLD_BTN_STYLE, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 19, fontWeight: 800, color: "#2a1d05", letterSpacing: "-0.2px", lineHeight: 1.1 }}>
          {label}
        </span>
        {priceNow !== undefined && (
          <span style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#2a1d05", lineHeight: 1 }}>
              {priceNow}
              <span style={{ fontSize: 19, fontWeight: 800, marginInlineStart: 1 }}>₪</span>
            </span>
            {showPriceWas && <PriceWas amount={priceWas!} />}
          </span>
        )}
      </span>
      <ArrowChip />
    </button>
  );
}

export function ChallengeCTA({ price, originalPrice, whatsappPhone, credit = 0 }: ChallengeCTAProps) {
  const [phase, setPhase]       = useState<"idle" | "phone" | "form" | "loading" | "error">("idle");
  const [form, setForm]         = useState({ name: "", email: "", phone: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [consent, setConsent]   = useState(false);
  const [consentErr, setConsentErr] = useState(false);
  const [quizUserId, setQuizUserId] = useState<string | null>(null);
  const [quizName, setQuizName]     = useState<string | null>(null);
  const [hasPhone, setHasPhone]     = useState(true);
  const [phoneInput, setPhoneInput] = useState("");

  const listPrice = Number(price);
  const toPay     = Math.max(0, listPrice - credit);

  const WRAPPER_STYLE: React.CSSProperties = {
    width: "100%",
    maxWidth: 520,
    marginInline: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 16,
  };

  const hasDiscount = !!originalPrice && originalPrice > toPay && toPay > 0;
  const savings = hasDiscount ? originalPrice! - toPay : 0;

  useEffect(() => {
    // 1. Quiz session (users who came through the quiz)
    const sessionUser = getSessionUser();
    if (sessionUser?.userId) {
      setQuizUserId(sessionUser.userId);
      setQuizName(sessionUser.name.split(" ")[0]);
      setHasPhone(!!sessionUser.phone);
      setForm({ name: sessionUser.name, email: sessionUser.email, phone: sessionUser.phone });
      return;
    }
    // 2. Auth session (logged-in users via Google OAuth or email)
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
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CHECKOUT_STARTED",
          anonymous_id: getCookie("anon_id"),
          metadata: {
            product: "challenge_197",
            price: toPay,
            ab_variant: getCookie("ab_variant"),
            experiment_name: "challenge_hero_format_checkout",
          },
        }),
      }).catch(() => {});

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "challenge_197", user_id: userId }),
      });

      if (checkoutRes.status === 503) { fallbackWhatsapp(); return; }
      if (checkoutRes.ok) {
        const { url, purchase_id } = await checkoutRes.json();
        // Fire IC after getting purchase_id so eventID matches CAPI ic_${purchase_id}
        trackInitiateCheckout("challenge_197", toPay, "ILS", purchase_id ? `ic_${purchase_id}` : undefined);
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
        trackProductLead("challenge", userId ?? undefined);
        fetch("/api/meta-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventName:        "Lead",
            eventId:          userId ?? undefined,
            email:            form.email,
            phone:            form.phone,
            firstName:        form.name.split(" ")[0],
            lastName:         form.name.split(" ").slice(1).join(" ") || undefined,
            userId:           userId ?? undefined,
            contentName:      "challenge",
            productEventName: "LeadChallenge",
            value:            197,
            currency:         "ILS",
          }),
        }).catch(() => {});
        if (userId) saveUserDetails({ name: form.name, email: form.email, phone: form.phone, userId });
      }

      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CHECKOUT_STARTED",
          anonymous_id: getCookie("anon_id"),
          metadata: {
            product: "challenge_197",
            price: toPay,
            ab_variant: getCookie("ab_variant"),
            experiment_name: "challenge_hero_format_checkout",
          },
        }),
      }).catch(() => {});

      if (!userId) {
        fallbackWhatsapp();
        return;
      }

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "challenge_197", user_id: userId }),
      });

      if (checkoutRes.status === 503) {
        fallbackWhatsapp();
        return;
      }

      if (checkoutRes.ok) {
        const { url, purchase_id } = await checkoutRes.json();
        trackInitiateCheckout("challenge_197", toPay, "ILS", purchase_id ? `ic_${purchase_id}` : undefined);
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
      const msg = credit > 0
        ? encodeURIComponent(`היי הדר! יש לי זיכוי של ₪${credit} ואני רוצה להצטרף לצ׳אלנג׳ 7 הימים. מה הצעד הבא?`)
        : encodeURIComponent(`היי הדר! אני רוצה להצטרף לצ׳אלנג׳ 7 הימים ב-₪${price}. מה הצעד הבא?`);
      window.open(`https://wa.me/${whatsappPhone}?text=${msg}`, "_blank");
    }
    setPhase("idle");
  }

  const waHref = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent("היי הדר! יש לי שאלה לגבי הצ׳אלנג׳ 7 הימים")}`
    : null;

  if (phase === "phone") {
    return (
      <form onSubmit={handlePhoneSubmit} className="flex flex-col gap-4" dir="rtl">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" style={{ color: "#9E9990" }}>מספר טלפון לחשבונית</label>
          <input
            type="tel"
            placeholder="0501234567"
            required
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            dir="ltr"
            className="w-full rounded-xl border px-4 py-3 text-base outline-none transition"
            style={{ background: "#1D2430", borderColor: "#2C323E", color: "#EDE9E1" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,150,74,0.6)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#2C323E"; }}
          />
        </div>
        <CheckoutCtaButton
          type="submit"
          label="המשך לתשלום"
          priceNow={toPay > 0 ? toPay : undefined}
          priceWas={hasDiscount ? originalPrice : undefined}
        />
        <SecurityNote />
        <button type="button" onClick={() => setPhase("idle")} className="text-sm text-center transition" style={{ color: "#9E9990" }}>
          ביטול
        </button>
      </form>
    );
  }

  if (phase === "idle") {
    if (quizUserId) {
      const label = toPay === 0
        ? `${quizName ? `${quizName}, ` : ""}קבל גישה חינם`
        : `${quizName ? `${quizName}, ` : ""}המשך לתשלום`;
      return (
        <div style={WRAPPER_STYLE}>
          {hasDiscount && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <SavingsBadge savings={savings} />
            </div>
          )}
          <CheckoutCtaButton
            label={label}
            priceNow={toPay > 0 ? toPay : undefined}
            priceWas={hasDiscount ? originalPrice : undefined}
            onClick={() => (hasPhone ? doCheckout(quizUserId) : setPhase("phone"))}
          />
          <SecurityNote />
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

    const anonLabel = toPay === 0 ? "קבל גישה חינם" : "הצטרף לאתגר";
    return (
      <div style={WRAPPER_STYLE}>
        {hasDiscount && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SavingsBadge savings={savings} />
          </div>
        )}
        <CheckoutCtaButton
          label={anonLabel}
          priceNow={toPay > 0 ? toPay : undefined}
          priceWas={hasDiscount ? originalPrice : undefined}
          onClick={() => setPhase("form")}
        />
        <SecurityNote />
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

  // Quiz user in loading/error state — show without registration form
  if (quizUserId && (phase === "loading" || phase === "error")) {
    return (
      <div style={WRAPPER_STYLE}>
        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
        <CheckoutCtaButton
          label={phase === "loading" ? "מעביר לתשלום..." : "נסה שוב"}
          priceNow={phase === "error" && toPay > 0 ? toPay : undefined}
          priceWas={phase === "error" && hasDiscount ? originalPrice : undefined}
          onClick={() => doCheckout(quizUserId)}
          disabled={phase === "loading"}
        />
        <SecurityNote />
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
          <label htmlFor={`ch-${id}`} className="text-sm font-medium" style={{ color: "#9E9990" }}>{label}</label>
          <input
            id={`ch-${id}`}
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

      <CheckoutCtaButton
        type="submit"
        label={phase === "loading" ? "מעביר לתשלום..." : toPay === 0 ? "קבל גישה חינם" : "לתשלום מאובטח"}
        priceNow={phase !== "loading" && toPay > 0 ? toPay : undefined}
        priceWas={phase !== "loading" && hasDiscount ? originalPrice : undefined}
        disabled={phase === "loading"}
      />
      <SecurityNote />

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
