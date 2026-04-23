"use client";

import { useState } from "react";
import { trackProductLead } from "@/lib/analytics";
import { BookingForm, type BookingSuccessData } from "./BookingForm";

interface Props {
  bookedSlots:   { slot_date: string; slot_time: string }[];
  price:         string;
  credit:        number;
  whatsappPhone: string;
}

export function StrategyBookFlow({ bookedSlots, price, credit, whatsappPhone }: Props) {
  const [phase, setPhase]     = useState<"booking" | "payment">("booking");
  const [booked, setBooked]   = useState<BookingSuccessData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const listPrice = Number(price);
  const toPay     = Math.max(0, listPrice - credit);

  function handleBooked(data: BookingSuccessData) {
    setBooked(data);
    setPhase("payment");

    trackProductLead("strategy", data.bookingId);
    fetch("/api/meta-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName:        "Lead",
        eventId:          data.bookingId,
        userId:           data.userId ?? undefined,
        contentName:      "strategy",
        productEventName: "LeadStrategy",
        value:            800,
        currency:         "ILS",
      }),
    }).catch(() => {});
  }

  async function handlePayment() {
    if (!booked?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ product: "strategy_4000", user_id: booked.userId }),
      });

      if (res.status === 503) {
        const msg = encodeURIComponent(
          `היי הדר! קבעתי פגישת אסטרטגיה ל-${booked.date} ב-${booked.time} ורוצה לסיים את התשלום`
        );
        window.open(`https://wa.me/${whatsappPhone}?text=${msg}`, "_blank");
        return;
      }

      if (res.ok) {
        const { url } = await res.json();
        if (url) { window.location.href = url; return; }
      }

      setError("שגיאה בעת יצירת תשלום, נסה שוב");
    } catch {
      setError("שגיאת רשת, נסה שוב");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Booking ───────────────────────────────────────────
  if (phase === "booking") {
    return <BookingForm bookedSlots={bookedSlots} onSuccess={handleBooked} />;
  }

  // ── Step 2: Payment ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">

      {/* Booking confirmation */}
      <div
        className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: "rgba(201,150,74,0.06)", border: "1px solid rgba(201,150,74,0.2)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.3)" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="#C9964A" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-black" style={{ color: "#EDE9E1" }}>הפגישה נקבעה!</p>
          <p className="text-sm" style={{ color: "#9E9990" }}>{booked?.date} · {booked?.time}</p>
          <p className="text-xs mt-0.5" style={{ color: "#9E9990" }}>אישור ישלח לאימייל לאחר התשלום</p>
        </div>
      </div>

      {/* Payment card */}
      <div
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "linear-gradient(145deg, #1D2430, #111620)", border: "1px solid rgba(201,150,74,0.16)" }}
      >
        <div
          className="flex justify-between items-center pb-4"
          style={{ borderBottom: "1px solid #2C323E" }}
        >
          <span style={{ color: "#9E9990" }}>פגישת אסטרטגיה · 90 דקות</span>
          <div className="text-right">
            {credit > 0 && (
              <p className="text-xs line-through" style={{ color: "#9E9990" }}>
                ₪{listPrice.toLocaleString("he-IL")}
              </p>
            )}
            <p className="font-black text-2xl" style={{ color: "#EDE9E1" }}>
              ₪{toPay.toLocaleString("he-IL")}
            </p>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full rounded-full py-4 text-lg font-bold active:scale-[0.98] disabled:opacity-60 btn-cta-gold"
        >
          {loading ? "מעביר לתשלום..." : `לתשלום ₪${toPay.toLocaleString("he-IL")} ←`}
        </button>

        <p className="text-center text-sm font-semibold" style={{ color: "rgba(201,150,74,0.8)" }}>
          ✓ לא פיצחנו בפגישה הראשונה? פגישה נוספת עלינו
        </p>
      </div>

    </div>
  );
}
