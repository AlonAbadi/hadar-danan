"use client";

import { useState, useEffect } from "react";
import { trackBooking } from "@/lib/analytics";
import { getSessionUser } from "@/lib/quiz-session";

// ── Types ────────────────────────────────────────────────────
interface BookedSlot { slot_date: string; slot_time: string }

export interface BookingSuccessData {
  bookingId: string;
  userId:    string;
  date:      string;
  time:      string;
}

interface Props {
  bookedSlots:  BookedSlot[];
  onSuccess?:   (data: BookingSuccessData) => void;
  initialForm?: { name: string; email: string; phone: string };
}

// ── Constants ────────────────────────────────────────────────
const TIME_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

const HE_DAYS    = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const HE_MONTHS  = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

// ── Date helpers ─────────────────────────────────────────────
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getAvailableDates(): Date[] {
  const result: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // start tomorrow

  while (result.length < 14) {
    const dow = cursor.getDay(); // 0=Sun … 6=Sat
    if (dow !== 5 && dow !== 6) result.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

function formatDateLabel(d: Date): { dayName: string; dayNum: string; month: string } {
  return {
    dayName: HE_DAYS[d.getDay()],
    dayNum:  String(d.getDate()),
    month:   HE_MONTHS[d.getMonth()],
  };
}

function formatDateFull(d: Date): string {
  const { dayName, dayNum, month } = formatDateLabel(d);
  return `יום ${dayName}, ${dayNum} ב${month} ${d.getFullYear()}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
}

// ── Component ────────────────────────────────────────────────
export function BookingForm({ bookedSlots, onSuccess, initialForm }: Props) {
  const dates = getAvailableDates();

  const [phase, setPhase]               = useState<"date" | "time" | "form" | "success">("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [form, setForm]                 = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [booking, setBooking]           = useState<{ date: string; time: string } | null>(null);

  useEffect(() => {
    if (initialForm) {
      setForm({ name: initialForm.name, email: initialForm.email, phone: initialForm.phone });
      return;
    }
    const user = getSessionUser();
    if (user) {
      setForm({ name: user.name, email: user.email, phone: user.phone });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function isSlotBooked(date: Date, time: string): boolean {
    const ds = toDateStr(date);
    return bookedSlots.some((s) => s.slot_date === ds && s.slot_time === time);
  }

  function handleDateSelect(d: Date) {
    setSelectedDate(d);
    setSelectedTime(null);
    setPhase("time");
  }

  function handleTimeSelect(t: string) {
    setSelectedTime(t);
    setPhase("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         form.name,
          email:        form.email,
          phone:        form.phone,
          slot_date:    toDateStr(selectedDate),
          slot_time:    selectedTime,
          anonymous_id: getCookie("anon_id"),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setError("המועד הזה כבר נתפס. אנא בחר/י מועד אחר.");
          setPhase("time");
        } else {
          setError(data.error ?? "שגיאה, נסה שוב");
        }
        return;
      }

      const resData = await res.json().catch(() => ({}));
      if (onSuccess) {
        onSuccess({
          bookingId: resData.booking_id ?? "",
          userId:    resData.user_id    ?? "",
          date:      formatDateFull(selectedDate),
          time:      selectedTime,
        });
        return;
      }
      trackBooking();
      setBooking({ date: formatDateFull(selectedDate), time: selectedTime });
      setPhase("success");
    } catch {
      setError("שגיאת רשת, נסה שוב");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────────────
  if (phase === "success" && booking) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: "rgba(251,191,36,0.15)", border: "2px solid rgba(251,191,36,0.4)" }}
        >
          <svg className="w-10 h-10" fill="none" stroke="#fbbf24" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-white">הפגישה קבועה! 🎯</h2>
          <p className="text-slate-400">שלחתי אישור לאימייל שלך עם כל הפרטים</p>
        </div>
        <div
          className="w-full rounded-2xl p-5 flex flex-col gap-2 text-right"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}
        >
          <p className="text-sm text-slate-400">פגישת אסטרטגיה אישית · 90 דקות</p>
          <p className="font-black text-white text-lg">📅 {booking.date}</p>
          <p className="font-bold text-white">🕙 {booking.time}</p>
        </div>
        <p className="text-sm text-slate-400">
          קישור ל-Zoom ישלח 24 שעות לפני הפגישה
        </p>
      </div>
    );
  }

  // ── Date picker ────────────────────────────────────────────
  if (phase === "date") {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="font-black text-white text-lg mb-1">בחר/י תאריך</h3>
          <p className="text-slate-400 text-sm">מציג 14 ימי עסקים הקרובים (א׳-ה׳)</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {dates.map((d) => {
            const { dayName, dayNum, month } = formatDateLabel(d);
            const allBooked = TIME_SLOTS.every((t) => isSlotBooked(d, t));
            return (
              <button
                key={toDateStr(d)}
                onClick={() => !allBooked && handleDateSelect(d)}
                disabled={allBooked}
                className="rounded-2xl p-4 flex flex-col gap-1 text-right transition border"
                style={{
                  background: allBooked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                  borderColor: allBooked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
                  opacity: allBooked ? 0.4 : 1,
                  cursor: allBooked ? "not-allowed" : "pointer",
                }}
                onMouseOver={(e) => {
                  if (!allBooked) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.5)";
                }}
                onMouseOut={(e) => {
                  if (!allBooked) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                <span className="text-xs text-slate-500">יום {dayName}</span>
                <span className="font-black text-white text-xl">{dayNum}</span>
                <span className="text-xs text-slate-400">{month}</span>
                {allBooked && <span className="text-xs text-red-400">תפוס</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Time picker ────────────────────────────────────────────
  if (phase === "time" && selectedDate) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase("date")}
            className="text-slate-400 hover:text-white transition text-sm"
          >
            ← חזור
          </button>
          <div>
            <h3 className="font-black text-white text-lg">בחר/י שעה</h3>
            <p className="text-slate-400 text-sm">{formatDateFull(selectedDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TIME_SLOTS.map((t) => {
            const booked = isSlotBooked(selectedDate, t);
            return (
              <button
                key={t}
                onClick={() => !booked && handleTimeSelect(t)}
                disabled={booked}
                className="rounded-2xl p-4 text-center font-black text-lg transition border"
                style={{
                  background: booked ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)",
                  borderColor: booked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)",
                  color: booked ? "#4b5563" : "#ffffff",
                  cursor: booked ? "not-allowed" : "pointer",
                  textDecoration: booked ? "line-through" : "none",
                }}
                onMouseOver={(e) => {
                  if (!booked) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(251,191,36,0.6)";
                }}
                onMouseOut={(e) => {
                  if (!booked) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
                }}
              >
                {t}
                {booked && <span className="block text-xs font-normal text-slate-600 mt-0.5">תפוס</span>}
              </button>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    );
  }

  // ── Details form ───────────────────────────────────────────
  if (phase === "form" && selectedDate && selectedTime) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" dir="rtl">
        {/* Summary */}
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
        >
          <div>
            <p className="text-sm text-slate-400">{formatDateFull(selectedDate)}</p>
            <p className="font-black text-white">🕙 {selectedTime}</p>
          </div>
          <button
            type="button"
            onClick={() => { setPhase("time"); setError(null); }}
            className="text-xs text-slate-400 hover:text-white transition"
          >
            שנה
          </button>
        </div>

        {/* Fields */}
        {[
          { id: "name",  label: "שם מלא",  type: "text",  placeholder: "ישראל ישראלי" },
          { id: "email", label: "אימייל",   type: "email", placeholder: "israel@example.com" },
          { id: "phone", label: "טלפון",    type: "tel",   placeholder: "0501234567" },
        ].map(({ id, label, type, placeholder }) => (
          <div key={id} className="flex flex-col gap-1">
            <label htmlFor={id} className="text-sm font-medium text-slate-300">{label}</label>
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
                background: "rgba(255,255,255,0.06)",
                borderColor: "rgba(255,255,255,0.12)",
                color: "#ffffff",
              }}
            />
          </div>
        ))}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl py-4 text-lg font-black text-gray-900 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          style={{ background: "#fbbf24" }}
        >
          {submitting ? "שומר פגישה..." : "קבע את הפגישה ←"}
        </button>

        <p className="text-center text-xs text-slate-500">
          תקבל/י אישור מיידי באימייל · ניתן לבטל עד 24 שעות לפני
        </p>
      </form>
    );
  }

  return null;
}
