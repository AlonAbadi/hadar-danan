"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trackPurchase, trackProductPurchase } from "@/lib/analytics";

interface SuccessPageProps {
  productName: string;
  emoji: string;
  confirmationTitle: string;
  confirmationDesc: string;
  nextStepLabel: string;
  nextStepHref: string;
  nextStepDesc: string;
  whatsappPhone?: string;
  trackingProduct?: string;
  trackingValue?: number;
}

const WA_ICON = (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function SuccessPage({
  productName,
  emoji,
  confirmationTitle,
  confirmationDesc,
  nextStepLabel,
  nextStepHref,
  nextStepDesc,
  whatsappPhone,
  trackingProduct,
  trackingValue,
}: SuccessPageProps) {
  const [visible, setVisible] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  useEffect(() => {
    if (!trackingProduct || !trackingValue) return;
    // sessionStorage guard prevents re-firing on page refresh
    const key = `purchase_fired_${trackingProduct}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    const eventId = searchParams.get("oid") ?? undefined;
    trackPurchase(trackingProduct, trackingValue, "ILS", eventId);
    trackProductPurchase(trackingProduct, trackingValue, "ILS", eventId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STEPS = [
    { num: "1", title: "קיבלת מייל אישור", desc: "בדוק את תיבת הדואר שלך" },
    { num: "2", title: "תכין את עצמך", desc: nextStepDesc },
    { num: "3", title: nextStepLabel, desc: null, href: nextStepHref },
  ];

  const isExternal = nextStepHref.startsWith("http");

  return (
    <div
      dir="rtl"
      className="min-h-screen font-assistant flex flex-col items-center justify-center px-4 pt-16 pb-12"
      style={{ background: "#080C14", color: "#EDE9E1" }}
    >
      <div
        className="w-full max-w-lg flex flex-col items-center gap-6 transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)" }}
      >
        {/* Animated checkmark */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
          style={{
            background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
            boxShadow: "0 0 0 8px rgba(201,150,74,0.12), 0 0 32px rgba(201,150,74,0.3)",
            animation: "pulse 2s infinite",
          }}
        >
          ✓
        </div>

        {/* Label pill */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
          style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.30)", color: "#C9964A" }}
        >
          הרכישה אושרה בהצלחה ✓
        </div>

        {/* Title */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-4xl font-black" style={{ color: "#EDE9E1" }}>{confirmationTitle}</h1>
          <p className="text-lg leading-relaxed" style={{ color: "#9E9990" }}>{confirmationDesc}</p>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: "linear-gradient(145deg, #141820, #0D1018)", border: "1px solid rgba(201,150,74,0.20)" }}
        >
          {/* Product name */}
          <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid #2C323E" }}>
            <span className="text-2xl">{emoji}</span>
            <span className="font-bold text-lg" style={{ color: "#EDE9E1" }}>{productName}</span>
          </div>

          {/* Steps */}
          <p className="text-sm font-bold" style={{ color: "#C9964A" }}>מה קורה עכשיו?</p>
          <div className="flex flex-col gap-3">
            {STEPS.map((step) => (
              <div key={step.num} className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.25)", color: "#C9964A" }}
                >
                  {step.num}
                </div>
                <div className="flex flex-col gap-0.5">
                  {step.href ? (
                    isExternal ? (
                      <a
                        href={step.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline"
                        style={{ color: "#E8B94A" }}
                      >
                        {step.title} ←
                      </a>
                    ) : (
                      <Link href={step.href} className="font-semibold underline" style={{ color: "#E8B94A" }}>
                        {step.title} ←
                      </Link>
                    )
                  ) : (
                    <p className="font-semibold" style={{ color: "#EDE9E1" }}>{step.title}</p>
                  )}
                  {step.desc && <p className="text-sm" style={{ color: "#9E9990" }}>{step.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary CTA */}
        {isExternal ? (
          <a
            href={nextStepHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full py-4 text-center text-lg font-bold btn-cta-gold active:scale-[0.98]"
          >
            {nextStepLabel} ←
          </a>
        ) : (
          <Link
            href={nextStepHref}
            className="w-full rounded-full py-4 text-center text-lg font-bold btn-cta-gold active:scale-[0.98]"
          >
            {nextStepLabel} ←
          </Link>
        )}

        {/* WhatsApp CTA */}
        {whatsappPhone && (
          <a
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-full py-3 text-center text-base font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
            style={{ background: "#25d366", color: "#fff" }}
          >
            {WA_ICON}
            הצטרף לקבוצת הווטסאפ ←
          </a>
        )}

        {/* Secondary CTA */}
        <Link
          href="/"
          className="w-full rounded-full py-3 text-center text-base font-semibold transition hover:opacity-80"
          style={{ border: "1px solid #2C323E", color: "#9E9990" }}
        >
          לדף הבית
        </Link>

        {/* Footer note */}
        <p className="text-xs text-center" style={{ color: "rgba(158,153,144,0.6)" }}>
          שלחנו אליך מייל עם כל הפרטים. לשאלות:{" "}
          <a href="mailto:hadar@beegood.online" className="underline hover:opacity-80">
            hadar@beegood.online
          </a>
        </p>
      </div>
    </div>
  );
}
