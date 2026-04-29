"use client";

import { useState, useEffect } from "react";
import { getSessionUser } from "@/lib/quiz-session";
import { trackInitiateCheckout } from "@/lib/analytics";

const VAT_RATE = 1.18;

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

interface Props {
  price:         string;
  whatsappPhone: string;
}

export function PremiumBookingFlow({ price, whatsappPhone }: Props) {
  const [form, setForm]       = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const listPrice    = Number(price);
  const priceWithVat = Math.round(listPrice * VAT_RATE);

  useEffect(() => {
    const user = getSessionUser();
    if (user) setForm({ name: user.name, email: user.email, phone: user.phone });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const signupRes = await fetch("/api/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:         form.name,
          email:        form.email,
          phone:        form.phone,
          anonymous_id: getCookie("anon_id"),
        }),
      });

      if (!signupRes.ok) {
        setError("שגיאה, נסה שוב");
        return;
      }

      const { user_id } = await signupRes.json();

      trackInitiateCheckout("premium_14000", priceWithVat);

      fetch("/api/events", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:         "CHECKOUT_STARTED",
          anonymous_id: getCookie("anon_id"),
          metadata:     { product: "premium_14000", price: priceWithVat },
        }),
      }).catch(() => {});

      const checkoutRes = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ product: "premium_14000", user_id }),
      });

      if (checkoutRes.status === 503) {
        const msg = encodeURIComponent("היי הדר! אני מעוניין/ת ביום צילום פרמיום ורוצה להתקדם לתשלום");
        window.open(`https://wa.me/${whatsappPhone}?text=${msg}`, "_blank");
        return;
      }

      if (checkoutRes.ok) {
        const { url } = await checkoutRes.json();
        if (url) { window.location.href = url; return; }
      }

      setError("שגיאה בעת יצירת תשלום, נסה שוב");
    } catch {
      setError("שגיאת רשת, נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" dir="rtl">

      {[
        { id: "name",  label: "שם מלא",  type: "text",  placeholder: "ישראל ישראלי" },
        { id: "email", label: "אימייל",   type: "email", placeholder: "israel@example.com" },
        { id: "phone", label: "טלפון",    type: "tel",   placeholder: "0501234567" },
      ].map(({ id, label, type, placeholder }) => (
        <div key={id} className="flex flex-col gap-1">
          <label htmlFor={id} className="text-sm font-medium" style={{ color: "#9E9990" }}>
            {label}
          </label>
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
              background:  "rgba(255,255,255,0.06)",
              borderColor: "rgba(201,150,74,0.2)",
              color:       "#EDE9E1",
            }}
          />
        </div>
      ))}

      {/* Price summary */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-3"
        style={{ background: "linear-gradient(145deg, #1D2430, #111620)", border: "1px solid rgba(201,150,74,0.16)" }}
      >
        <div className="flex justify-between items-start">
          <span style={{ color: "#9E9990" }}>יום צילום פרמיום · 14 סרטונים</span>
          <div className="text-right">
            <p className="font-black text-2xl" style={{ color: "#EDE9E1" }}>
              ₪{listPrice.toLocaleString("he-IL")}
            </p>
            <p className="text-sm font-semibold" style={{ color: "#C9964A" }}>+ מע״מ</p>
          </div>
        </div>
        <p className="text-xs" style={{ color: "#9E9990" }}>
          סה״כ לתשלום כולל מע״מ: <span style={{ color: "#EDE9E1", fontWeight: 700 }}>₪{priceWithVat.toLocaleString("he-IL")}</span>
        </p>
        <ul className="flex flex-col gap-1 text-sm" style={{ color: "#9E9990" }}>
          {["אסטרטגיה עסקית ושיווקית לפני הצילום", "צוות מקצועי (צלם + במאי + מפיקה)", "14 סרטונים ערוכים תוך שבועיים", "3 חודשי ליווי אחרי"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span style={{ color: "#C9964A" }}>✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] disabled:opacity-60 btn-cta-gold"
      >
        {loading ? "מעביר לתשלום..." : `לתשלום ₪${priceWithVat.toLocaleString("he-IL")} כולל מע״מ ←`}
      </button>

      <p className="text-center text-xs" style={{ color: "#9E9990" }}>
        תשלום מאובטח · עד 6 תשלומים · לאחר התשלום ניצור קשר לתיאום יום הצילום
      </p>

    </form>
  );
}
