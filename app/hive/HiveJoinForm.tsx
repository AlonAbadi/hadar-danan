"use client";

import { useState } from "react";
import Link from "next/link";

type Step =
  | "idle"
  | "form"
  | "checking"
  | "not_eligible"
  | "legal"
  | "submitting"
  | "success"
  | "pending_payment";

type Tier = "basic_97" | "discounted_29";

interface HiveJoinFormProps {
  onClose?: () => void;
}

export function HiveJoinForm({ onClose }: HiveJoinFormProps) {
  const [step, setStep] = useState<Step>("idle");
  const [tier, setTier] = useState<Tier | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Exposed imperatively via a forwarded ref or by parent calling these
  // The parent (HivePricingSection) calls these directly
  function openStandard() {
    setTier("basic_97");
    setStep("form");
    setError(null);
  }

  function openDiscounted() {
    setTier("discounted_29");
    setStep("form");
    setError(null);
  }

  // Expose open functions on the component instance via a global-ish pattern.
  // Since the parent is a client component, it will call these via ref or
  // by lifting state. Here the parent passes a triggerRef pattern.
  // Actually, we expose via window for simplicity - but better: parent controls via props.
  // The component is self-contained; HivePricingSection imports and calls open* directly.

  function handleClose() {
    setStep("idle");
    setTier(null);
    setEmail("");
    setName("");
    setConsent(false);
    setError(null);
    onClose?.();
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !name.trim()) {
      setError("יש למלא שם ואימייל");
      return;
    }

    if (tier === "discounted_29") {
      setStep("checking");
      try {
        const res = await fetch("/api/hive/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = (await res.json()) as { eligible?: boolean };
        if (!data.eligible) {
          setStep("not_eligible");
          return;
        }
      } catch {
        setError("שגיאה בבדיקת הזכאות. נסה שוב.");
        setStep("form");
        return;
      }
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

  if (step === "idle") return null;

  const tierPrice = tier === "discounted_29" ? "₪29" : "₪97";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-3xl p-8 font-assistant"
        style={{ background: "#191F2B", border: "1px solid #2C323E", color: "#EDE9E1" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full transition hover:opacity-70"
          style={{ background: "#1D2430", color: "#9E9990" }}
          aria-label="סגור"
        >
          ✕
        </button>

        {/* ── FORM step ── */}
        {(step === "form" || step === "checking") && (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5" dir="rtl">
            <div>
              <h2 className="text-2xl font-black mb-1" style={{ color: "#EDE9E1" }}>
                הצטרף לכוורת 🐝
              </h2>
              <p className="text-sm" style={{ color: "#9E9990" }}>
                {tier === "discounted_29"
                  ? "מסלול לקוחות הדר - ₪29/חודש"
                  : "מסלול פתוח - ₪97/חודש"}
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
                disabled={step === "checking"}
                className="rounded-xl px-4 py-3 text-base outline-none transition"
                style={{
                  background: "#1D2430",
                  border: "1px solid #2C323E",
                  color: "#EDE9E1",
                }}
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
                disabled={step === "checking"}
                className="rounded-xl px-4 py-3 text-base outline-none transition"
                style={{
                  background: "#1D2430",
                  border: "1px solid #2C323E",
                  color: "#EDE9E1",
                }}
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
              disabled={step === "checking"}
              className="w-full py-4 rounded-full font-bold text-lg active:scale-[0.98] disabled:opacity-50 btn-cta-gold"
            >
              {step === "checking" ? "בודק זכאות..." : "המשך ←"}
            </button>
          </form>
        )}

        {/* ── NOT_ELIGIBLE step ── */}
        {step === "not_eligible" && (
          <div className="flex flex-col gap-6 text-center" dir="rtl">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl"
              style={{ background: "rgba(201,150,74,0.1)" }}
            >
              🐝
            </div>
            <div>
              <h2 className="text-xl font-black mb-2" style={{ color: "#EDE9E1" }}>
                המחיר המיוחד הזה שמור ללקוחות הדר
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#9E9990" }}>
                רוצה להתחיל את המסע ולקבל את ההטבה? בוא נכיר.
              </p>
            </div>
            <a
              href="/quiz"
              className="w-full py-4 rounded-full font-bold text-lg text-center transition hover:opacity-90 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)",
                color: "#1A1206",
                display: "block",
              }}
            >
              בוא נתחיל ←
            </a>
            <button
              onClick={handleClose}
              className="text-sm transition hover:opacity-70"
              style={{ color: "#9E9990" }}
            >
              חזור
            </button>
          </div>
        )}

        {/* ── LEGAL step ── */}
        {(step === "legal" || step === "submitting") && (
          <form onSubmit={handleConsentSubmit} className="flex flex-col gap-5" dir="rtl">
            <div>
              <h2 className="text-xl font-black mb-1" style={{ color: "#EDE9E1" }}>
                פרטי המנוי
              </h2>
              <p className="text-sm" style={{ color: "#9E9990" }}>
                אנא קרא בעיון לפני האישור
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
              <p>• ניתן לביטול בכל עת - ללא קנס</p>
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
                <Link
                  href="/hive/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80"
                  style={{ color: "#C9964A" }}
                >
                  ← תנאי מנוי
                </Link>
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
              {step === "submitting" ? "שולח..." : "אשר והצטרף ←"}
            </button>
          </form>
        )}

        {/* ── PENDING_PAYMENT step ── */}
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
                הבקשה שלך התקבלה!
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
              onClick={handleClose}
              className="w-full py-3 rounded-2xl font-bold text-sm transition hover:opacity-70"
              style={{ background: "#1D2430", border: "1px solid #2C323E", color: "#9E9990" }}
            >
              סגור
            </button>
          </div>
        )}

        {/* ── SUCCESS step ── */}
        {step === "success" && (
          <div className="flex flex-col gap-5 text-center" dir="rtl">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl"
              style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.20)" }}
            >
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-black mb-2" style={{ color: "#EDE9E1" }}>
                ברוך הבא לכוורת 🐝
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
              onClick={handleClose}
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

// Expose open functions so HivePricingSection can trigger the modal
export type { HiveJoinFormProps };
