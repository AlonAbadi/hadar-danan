// English checkout CTA for The Signal Hive ($149, product signal_hive_en_149).
// Mirrors app/signal-hive/SignalHiveCTA.tsx: known users (quiz session
// localStorage or auth via /api/user/me) go straight to Cardcom; unknown
// users fill a short lead form first (POST /api/signup, then checkout).
// A 503 from /api/checkout falls back to WhatsApp.
"use client";

import { useState, useEffect } from "react";
import { trackInitiateCheckout, trackProductLead } from "@/lib/analytics";
import { getSessionUser, saveUserDetails } from "@/lib/quiz-session";
import { getUtmFromCookies } from "@/lib/utm/client";
import { EN_HIVE_PRICE_USD } from "@/lib/products";

const PRODUCT = "signal_hive_en_149";
const LIST_PRICE = EN_HIVE_PRICE_USD;

const S = {
  gold: "#C2973F",
  goldFg: "#0D0C0A",
  input: { background: "#1A1814", border: "1px solid rgba(242,237,228,0.14)", color: "#F2EDE4" },
  label: { fontSize: 13, fontWeight: 600 as const, color: "rgba(242,237,228,0.55)" },
};

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

function GoldButton({
  children,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        borderRadius: 999,
        padding: "16px 20px",
        fontSize: 16,
        fontWeight: 800,
        fontFamily: "inherit",
        color: S.goldFg,
        background: "linear-gradient(180deg, #DFB662 0%, #C2973F 55%, #A87F2F 100%)",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 6px 18px rgba(194,151,63,0.25)",
      }}
    >
      {children}
    </button>
  );
}

export function HiveCTAEn({ whatsappPhone, initialEmail = "" }: { whatsappPhone: string; initialEmail?: string }) {
  const [phase, setPhase] = useState<"idle" | "phone" | "form" | "loading" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: initialEmail, phone: "" });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentErr, setConsentErr] = useState(false);
  const [knownUserId, setKnownUserId] = useState<string | null>(null);
  const [hasPhone, setHasPhone] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (sessionUser?.userId) {
      setKnownUserId(sessionUser.userId);
      setHasPhone(!!sessionUser.phone);
      setForm((f) => ({ ...f, name: sessionUser.name, email: sessionUser.email, phone: sessionUser.phone }));
      return;
    }
    fetch("/api/user/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) {
          setKnownUserId(data.id);
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
          metadata: { product: PRODUCT, price: LIST_PRICE, currency: "USD", locale: "en" },
        }),
      }).catch(() => {});

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: PRODUCT, user_id: userId }),
      });

      if (checkoutRes.status === 503) {
        fallbackWhatsapp();
        return;
      }
      if (checkoutRes.ok) {
        const { url, purchase_id } = await checkoutRes.json();
        trackInitiateCheckout(PRODUCT, LIST_PRICE, "USD", purchase_id ? `ic_${purchase_id}` : undefined);
        if (url) {
          window.location.href = url;
          return;
        }
      }
      setErrorMsg("Something went wrong creating the payment. Please try again.");
      setPhase("error");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPhase("error");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setConsentErr(true);
      return;
    }
    setPhase("loading");
    setErrorMsg(null);
    try {
      const signupRes = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          anonymous_id: getCookie("anon_id"),
          ab_variant: getCookie("ab_variant"),
          marketing_consent: consent,
          ...getUtmFromCookies(),
        }),
      });

      let userId: string | null = null;
      if (signupRes.ok) {
        const data = await signupRes.json();
        userId = data.user_id ?? null;
        trackProductLead("signal_hive_en", userId ?? undefined);
        if (userId) saveUserDetails({ name: form.name, email: form.email, phone: form.phone, userId });
      }
      if (!userId) {
        fallbackWhatsapp();
        return;
      }

      await doCheckout(userId);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPhase("error");
    }
  }

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneInput.trim() || !knownUserId) return;
    setPhase("loading");
    try {
      await fetch("/api/user/update-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput.trim() }),
      });
      await doCheckout(knownUserId);
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPhase("error");
    }
  }

  function fallbackWhatsapp() {
    if (whatsappPhone) {
      const msg = encodeURIComponent(`Hi, I want to join The Signal Hive ($${LIST_PRICE}). What is the next step?`);
      window.open(`https://wa.me/${whatsappPhone}?text=${msg}`, "_blank");
    }
    setPhase("idle");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 16,
    fontFamily: "inherit",
    outline: "none",
    ...S.input,
  };

  if (phase === "phone") {
    return (
      <form onSubmit={handlePhoneSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={S.label}>Phone number for your receipt</label>
          <input
            type="tel"
            placeholder="+1 555 000 0000"
            required
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            style={inputStyle}
          />
        </div>
        <GoldButton type="submit">Continue to payment</GoldButton>
        <button
          type="button"
          onClick={() => setPhase("idle")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "rgba(242,237,228,0.55)", textAlign: "center" }}
        >
          Cancel
        </button>
      </form>
    );
  }

  if (phase === "idle") {
    if (knownUserId) {
      return (
        <GoldButton onClick={() => (hasPhone ? doCheckout(knownUserId) : setPhase("phone"))}>
          Join The Signal Hive · ${LIST_PRICE}
        </GoldButton>
      );
    }
    return <GoldButton onClick={() => setPhase("form")}>Join The Signal Hive · ${LIST_PRICE}</GoldButton>;
  }

  if (knownUserId && (phase === "loading" || phase === "error")) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {errorMsg && <p style={{ color: "#E88", fontSize: 13.5, textAlign: "center", margin: 0 }}>{errorMsg}</p>}
        <GoldButton onClick={() => doCheckout(knownUserId)} disabled={phase === "loading"}>
          {phase === "loading" ? "Taking you to payment..." : "Try again"}
        </GoldButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {(
        [
          { id: "name", label: "Full name", type: "text", placeholder: "Jane Doe" },
          { id: "email", label: "Email", type: "email", placeholder: "jane@example.com" },
          { id: "phone", label: "Phone", type: "tel", placeholder: "+1 555 000 0000" },
        ] as const
      ).map(({ id, label, type, placeholder }) => (
        <div key={id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label htmlFor={`shen-${id}`} style={S.label}>
            {label}
          </label>
          <input
            id={`shen-${id}`}
            type={type}
            placeholder={placeholder}
            required
            value={form[id]}
            onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
            style={inputStyle}
          />
        </div>
      ))}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setConsentErr(false);
          }}
          style={{ marginTop: 3, width: 16, height: 16, accentColor: S.gold }}
        />
        <span style={{ fontSize: 12.5, lineHeight: 1.6, color: consentErr ? "#E88" : "rgba(242,237,228,0.55)" }}>
          I agree to receive updates and marketing content from Hadar Danan Ltd by email, SMS and WhatsApp. You can
          opt out at any time.
        </span>
      </label>
      {errorMsg && <p style={{ color: "#E88", fontSize: 13.5, margin: 0 }}>{errorMsg}</p>}
      <GoldButton type="submit" disabled={phase === "loading"}>
        {phase === "loading" ? "Taking you to payment..." : `Secure checkout · $${LIST_PRICE}`}
      </GoldButton>
      <button
        type="button"
        onClick={() => {
          setPhase("idle");
          setErrorMsg(null);
        }}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "rgba(242,237,228,0.55)", textAlign: "center" }}
      >
        Cancel
      </button>
    </form>
  );
}
