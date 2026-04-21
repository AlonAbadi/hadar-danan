"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trackLead } from "@/lib/analytics";
import { ConsentCheckbox } from "@/components/landing/ConsentCheckbox";
import { getSessionUser, saveUserDetails } from "@/lib/quiz-session";

interface FormState {
  name: string;
  email: string;
  phone: string;
}

interface FieldError {
  name?: string;
  email?: string;
  phone?: string;
  general?: string;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`))
    ?.split("=")[1];
}

interface SignupFormProps {
  ctaLabel: string;
  dark?: boolean;
}

export function SignupForm({ ctaLabel, dark = false }: SignupFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState<FieldError>({});
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [utmData, setUtmData] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If user is already known (quiz or prior signup), skip this form
    const user = getSessionUser();
    if (user) {
      router.replace("/training/watch");
      return;
    }
    setChecking(false);

    const keys = ["utm_source", "utm_campaign", "utm_adset", "utm_ad", "fbclid", "gclid"];
    const data: Record<string, string> = {};
    for (const key of keys) {
      const val = getCookie(key);
      if (val) data[key === "fbclid" || key === "gclid" ? "click_id" : key] = val;
    }
    setUtmData(data);
  }, [router]);

  function validate(): boolean {
    const errs: FieldError = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "שם חייב להכיל לפחות 2 תווים";
    if (!form.email.includes("@") || !form.email.includes("."))
      errs.email = "כתובת אימייל לא תקינה";
    const phone = form.phone.replace(/[\s-]/g, "");
    if (!/^05\d{8}$/.test(phone) && !/^\+9725\d{8}$/.test(phone))
      errs.phone = "מספר טלפון לא תקין (לדוגמה: 0501234567 או +972501234567)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!consent) { setConsentError(true); return; }
    setLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.replace(/[\s-]/g, ""),
          ab_variant: getCookie("ab_variant"),
          anonymous_id: getCookie("anon_id"),
          marketing_consent: consent,
          ...utmData,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrors(json.errors ?? { general: json.error ?? "שגיאה, נסה שוב" });
        return;
      }
      const userId = (json as Record<string, unknown>).user_id as string | undefined;
      trackLead(userId);
      if (userId) sessionStorage.setItem("last_signup_user_id", userId);
      if (userId) saveUserDetails({ name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.replace(/[\s-]/g, ""), userId });
      router.push("/training/watch");
    } catch {
      setErrors({ general: "שגיאת רשת, נסה שוב" });
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null;

  const labelCls = "text-sm font-medium";
  const inputBase = "w-full rounded-xl border px-4 py-3 text-base outline-none transition";
  const inputOk   = "focus:ring-2";
  const inputErr  = "border-red-500/60 bg-red-500/10";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" dir="rtl">
      {errors.general && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errors.general}
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1">
        <label htmlFor="sf-name" className={labelCls} style={{ color: "#9E9990" }}>שם מלא</label>
        <input
          id="sf-name" type="text" autoComplete="name" placeholder="ישראל ישראלי"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
          style={
            errors.name
              ? {}
              : { background: "#1D2430", border: "1px solid #2C323E", color: "#EDE9E1" }
          }
          onFocus={(e) => { if (!errors.name) (e.target as HTMLInputElement).style.borderColor = "rgba(201,150,74,0.6)"; }}
          onBlur={(e) => { if (!errors.name) (e.target as HTMLInputElement).style.borderColor = "#2C323E"; }}
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1">
        <label htmlFor="sf-email" className={labelCls} style={{ color: "#9E9990" }}>כתובת אימייל</label>
        <input
          id="sf-email" type="email" autoComplete="email" placeholder="israel@example.com" dir="ltr"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={`${inputBase} text-left ${errors.email ? inputErr : inputOk}`}
          style={
            errors.email
              ? {}
              : { background: "#1D2430", border: "1px solid #2C323E", color: "#EDE9E1" }
          }
          onFocus={(e) => { if (!errors.email) (e.target as HTMLInputElement).style.borderColor = "rgba(201,150,74,0.6)"; }}
          onBlur={(e) => { if (!errors.email) (e.target as HTMLInputElement).style.borderColor = "#2C323E"; }}
        />
        {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1">
        <label htmlFor="sf-phone" className={labelCls} style={{ color: "#9E9990" }}>טלפון נייד</label>
        <input
          id="sf-phone" type="tel" autoComplete="tel" placeholder="0501234567" dir="ltr"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className={`${inputBase} text-left ${errors.phone ? inputErr : inputOk}`}
          style={
            errors.phone
              ? {}
              : { background: "#1D2430", border: "1px solid #2C323E", color: "#EDE9E1" }
          }
          onFocus={(e) => { if (!errors.phone) (e.target as HTMLInputElement).style.borderColor = "rgba(201,150,74,0.6)"; }}
          onBlur={(e) => { if (!errors.phone) (e.target as HTMLInputElement).style.borderColor = "#2C323E"; }}
        />
        {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
      </div>

      <ConsentCheckbox
        checked={consent}
        onChange={(v) => { setConsent(v); if (v) setConsentError(false); }}
        error={consentError}
        dark={dark}
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-4 text-lg font-black shadow-lg transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #C9964A, #9E7C3A)", color: "#101520" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            שולח...
          </span>
        ) : ctaLabel}
      </button>

    </form>
  );
}
