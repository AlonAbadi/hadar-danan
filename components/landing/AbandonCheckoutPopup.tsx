"use client";

import { useEffect, useState } from "react";

type Product = "challenge" | "workshop" | "course_1800" | "strategy";

const CONTENT: Record<Product, { name: string; href: string; ctaLabel: string }> = {
  challenge:   { name: "הצ׳אלנג׳ 7 הימים",    href: "#join",   ctaLabel: "חזור לצ׳אלנג׳ ←" },
  workshop:    { name: "הסדנה יום אחד",        href: "#join",   ctaLabel: "חזור לסדנה ←" },
  course_1800: { name: "הקורס הדיגיטלי",       href: "#enroll", ctaLabel: "חזור לקורס ←" },
  strategy:    { name: "פגישת האסטרטגיה",      href: "#form",   ctaLabel: "חזור לפגישה ←" },
};

export function AbandonCheckoutPopup({ product }: { product: Product }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("abandon_shown")) return;

    const handleLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        setShow(true);
        sessionStorage.setItem("abandon_shown", "1");
      }
    };

    document.addEventListener("mouseleave", handleLeave);
    return () => document.removeEventListener("mouseleave", handleLeave);
  }, []);

  if (!show) return null;

  const { name, href, ctaLabel } = CONTENT[product];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={() => setShow(false)}
    >
      <div
        dir="rtl"
        className="relative w-full max-w-md rounded-3xl p-8 flex flex-col gap-5 font-assistant"
        style={{ background: "#ffffff" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => setShow(false)}
          className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          aria-label="סגור"
        >
          ✕
        </button>

        {/* Emoji */}
        <div className="text-4xl text-center">⏳</div>

        {/* Headline */}
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-2xl font-black text-gray-900">רגע לפני שאת/ה הולך/ת...</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            המקום שלך ב<strong>{name}</strong> עדיין שמור - אבל לא לנצח.
            <br />
            השאר/י קוד הנחה מיוחד עם 10% הנחה:
          </p>
        </div>

        {/* Coupon */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{ background: "#0a0a0f" }}
        >
          <p className="text-gray-400 text-xs mb-2">קוד קופון</p>
          <p
            className="font-black text-3xl tracking-widest"
            style={{ color: "#4ade80" }}
          >
            HADAR10
          </p>
          <p className="text-gray-500 text-xs mt-2">10% הנחה · תקף ל-24 שעות</p>
        </div>

        {/* CTA */}
        <a
          href={href}
          onClick={() => setShow(false)}
          className="w-full rounded-2xl py-4 text-center font-black text-gray-900 text-lg transition hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#4ade80" }}
        >
          {ctaLabel}
        </a>

        <button
          onClick={() => setShow(false)}
          className="text-xs text-gray-400 text-center hover:underline"
        >
          לא תודה, אמשיך בלי ההנחה
        </button>
      </div>
    </div>
  );
}
