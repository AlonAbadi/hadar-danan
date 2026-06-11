"use client";

import { useState } from "react";

type Tier = "basic_59" | "full_149";

const FEATURES_BASIC = [
  "מנוע האות — אבחון אישי לפי שיטת TrueSignal©",
  "ספריית בינג' — תכנים מהשיטה",
  "שני רעיונות תוכן חודשיים מותאמים לאות שלך",
  "גישה לאזור החברים",
];

const FEATURES_FULL = [
  "הכל מהמסלול הבסיסי",
  "מפגש Zoom חודשי עם הדר",
  "קבוצת WhatsApp פעילה של חברי הכוורת",
  "₪500 הנחה בעבודה אישית עם הצוות",
];

const TIER_LABEL: Record<Tier, string> = {
  basic_59: "מסלול בסיסי",
  full_149: "מסלול מלא",
};

const TIER_PRICE: Record<Tier, string> = {
  basic_59: "₪59",
  full_149: "₪149",
};

export function HivePricingSection() {
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState<Tier>("basic_59");

  function openTier(t: Tier) {
    setTier(t);
    setOpen(true);
  }

  return (
    <>
      <section
        id="pricing"
        className="max-w-3xl mx-auto px-4 pb-20"
        dir="rtl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Basic ₪59 ── */}
          <div
            className="rounded-3xl p-8 flex flex-col gap-6"
            style={{ background: "#191F2B", border: "1px solid #2C323E" }}
          >
            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: "#9E9990" }}>
                בסיסי — לכולם
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black" style={{ color: "#EDE9E1" }}>
                  ₪59
                </span>
                <span className="text-sm" style={{ color: "#9E9990" }}>
                  /חודש כולל מע״מ
                </span>
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {FEATURES_BASIC.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "#EDE9E1" }}>
                  <span style={{ color: "#C9964A", marginTop: 2 }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => openTier("basic_59")}
              className="w-full py-4 rounded-2xl font-black text-lg active:scale-[0.98] btn-navy-secondary"
            >
              הצטרף לבסיסי ←
            </button>
          </div>

          {/* ── Full ₪149 ── */}
          <div
            className="rounded-3xl p-8 flex flex-col gap-6 relative"
            style={{
              background: "linear-gradient(145deg, #1D2430, #111620)",
              border: "1px solid rgba(232,185,74,0.30)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 28px rgba(232,185,74,0.10)",
            }}
          >
            {/* Featured badge */}
            <div
              className="absolute -top-3 right-6 text-xs font-black px-4 py-1.5 rounded-full"
              style={{
                background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                color: "#0D1018",
              }}
            >
              הכי פופולרי
            </div>

            <div>
              <p className="text-xs font-semibold mb-3" style={{ color: "#C9964A" }}>
                מלא — גישה ישירה להדר
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black" style={{ color: "#EDE9E1" }}>
                  ₪149
                </span>
                <span className="text-sm" style={{ color: "#9E9990" }}>
                  /חודש כולל מע״מ
                </span>
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {FEATURES_FULL.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "#EDE9E1" }}>
                  <span style={{ color: "#C9964A", marginTop: 2 }}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => openTier("full_149")}
              className="w-full py-4 rounded-2xl font-black text-lg active:scale-[0.98] btn-cta-gold"
            >
              הצטרף למלא ←
            </button>
          </div>

        </div>
      </section>

      {open && (
        <HiveJoinFormModal
          tier={tier}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// Modal that manages join flow state, pre-opened with a selected tier
function HiveJoinFormModal({ tier, onClose }: { tier: Tier; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<
    "form" | "legal" | "submitting" | "success" | "pending_payment"
  >("form");

  const tierPrice = TIER_PRICE[tier];
  const tierLabel = TIER_LABEL[tier];

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !name.trim()) {
      setError("יש למלא שם ואימייל");
      return;
    }

    setStep("legal");
  }

  async function handleConsentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;

    setStep("submitting");
    setError(null);

    try {
      const res = await fetch("/api/hive/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, tier }),
      });
      const data = (await res.json()) as { status?: string; error?: string };

      if (!res.ok) {
        setError(data.error ?? "שגיאה בהצטרפות. נסה שוב.");
        setStep("legal");
        return;
      }

      if (data.status === "pending_payment") {
        setStep("pending_payment");
      } else {
        setStep("success");
      }
    } catch {
      setError("שגיאה בהצטרפות. נסה שוב.");
      setStep("legal");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-assistant"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl p-8"
        style={{ background: "#191F2B", border: "1px solid #2C323E", color: "#EDE9E1" }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full transition hover:opacity-70"
          style={{ background: "#1D2430", color: "#9E9990" }}
          aria-label="סגור"
        >
          ✕
        </button>

        {/* ── FORM ── */}
        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5" dir="rtl">
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ color: "#EDE9E1" }}>
                הצטרף לכוורת
              </h2>
              <p className="text-sm" style={{ color: "#9E9990" }}>
                {tierLabel} — {tierPrice}/חודש
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold" style={{ color: "#9E9990" }}>
                שם מלא
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ישראל ישראלי"
                required
                className="rounded-xl px-4 py-3 text-base outline-none transition"
                style={{ background: "#1D2430", border: "1px solid #2C323E", color: "#EDE9E1" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C9964A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2C323E")}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold" style={{ color: "#9E9990" }}>
                אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="rounded-xl px-4 py-3 text-base outline-none transition"
                style={{ background: "#1D2430", border: "1px solid #2C323E", color: "#EDE9E1" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#C9964A")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#2C323E")}
              />
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: "#f87171" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-full font-bold text-lg active:scale-[0.98] btn-cta-gold"
            >
              המשך ←
            </button>
          </form>
        )}

        {/* ── LEGAL / SUBMITTING ── */}
        {(step === "legal" || step === "submitting") && (
          <form onSubmit={handleConsentSubmit} className="flex flex-col gap-5" dir="rtl">
            <div>
              <h2 className="text-xl font-black mb-1" style={{ color: "#EDE9E1" }}>
                פרטי המנוי
              </h2>
              <p className="text-sm" style={{ color: "#9E9990" }}>
                {tierLabel} — אנא קרא בעיון לפני האישור
              </p>
            </div>

            <div
              className="rounded-2xl p-5 flex flex-col gap-2 text-sm leading-relaxed"
              style={{
                background: "#101520",
                border: "1px solid rgba(201,150,74,0.08)",
                color: "#9E9990",
              }}
            >
              <p className="font-bold mb-1" style={{ color: "#EDE9E1" }}>
                פרטי המנוי:
              </p>
              <p>• חיוב חודשי אוטומטי של {tierPrice} כולל מע״מ</p>
              <p>• ניתן לביטול בכל עת — ללא קנס</p>
              <p>• ביטול תוך 14 יום מההצטרפות: החזר מלא</p>
              <p>• ביטול לאחר 14 יום: המנוי יסתיים בסוף תקופת החיוב הנוכחית</p>
              <p>
                • לביטול:{" "}
                <a
                  href="mailto:hive@beegood.online"
                  className="underline hover:opacity-80"
                  style={{ color: "#C9964A" }}
                >
                  hive@beegood.online
                </a>{" "}
                או לחץ &#39;בטל מנוי&#39; באזור האישי
              </p>
              <p>• החיוב מתבצע דרך Cardcom בתשלום מאובטח</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={step === "submitting"}
                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded cursor-pointer"
                style={{ accentColor: "#C9964A" }}
              />
              <span className="text-sm leading-relaxed" style={{ color: "#9E9990" }}>
                קראתי והבנתי את תנאי המנוי החודשי ואת מדיניות הביטול{" "}
                <a
                  href="/hive/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                  style={{ color: "#C9964A" }}
                >
                  ← תנאי מנוי
                </a>
              </span>
            </label>

            {error && (
              <p className="text-sm text-center" style={{ color: "#f87171" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!consent || step === "submitting"}
              className="w-full py-4 rounded-full font-bold text-lg active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed btn-cta-gold"
            >
              {step === "submitting" ? "שולח…" : "אשר והצטרף ←"}
            </button>
          </form>
        )}

        {/* ── PENDING_PAYMENT ── */}
        {step === "pending_payment" && (
          <div className="flex flex-col gap-5 text-center" dir="rtl">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl"
              style={{ background: "rgba(201,150,74,0.1)" }}
            >
              📧
            </div>
            <div>
              <h2 className="text-xl font-black mb-2" style={{ color: "#EDE9E1" }}>
                הבקשה שלך התקבלה
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#9E9990" }}>
                נחזור אליך עם פרטי תשלום בקרוב.
              </p>
              {email && (
                <p className="text-sm mt-2" style={{ color: "#9E9990" }}>
                  אימייל:{" "}
                  <span className="font-semibold" style={{ color: "#EDE9E1" }}>
                    {email}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-sm transition hover:opacity-70"
              style={{ background: "#1D2430", border: "1px solid #2C323E", color: "#9E9990" }}
            >
              סגור
            </button>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {step === "success" && (
          <div className="flex flex-col gap-5 text-center" dir="rtl">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl"
              style={{
                background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)",
              }}
            >
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-black mb-2" style={{ color: "#EDE9E1" }}>
                ברוך הבא לכוורת
              </h2>
              {email && (
                <p className="text-sm" style={{ color: "#9E9990" }}>
                  פרטים נשלחו לאימייל:{" "}
                  <span className="font-semibold" style={{ color: "#EDE9E1" }}>
                    {email}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-sm transition hover:opacity-70"
              style={{ background: "#1D2430", border: "1px solid #2C323E", color: "#9E9990" }}
            >
              סגור
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
