"use client";

import { useEffect, useState } from "react";

interface HomeStickyBarProps {
  ctaText: string;
}

export default function HomeStickyBar({
  ctaText,
}: HomeStickyBarProps) {
  const [visible, setVisible] = useState(false);

  // Option A: observe #products with rootMargin "0px 0px -100% 0px" so the callback
  // fires when the section's bottom leaves the top of the viewport. Show bar once
  // the user has scrolled past the products section.
  useEffect(() => {
    const target = document.getElementById("products");
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setVisible(entry.boundingClientRect.bottom < 0);
      },
      { rootMargin: "0px 0px -100% 0px", threshold: 0 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "rgba(13,16,24,0.97)",
        backdropFilter: "blur(12px)",
        borderTop: "1px solid #2C323E",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.4)",
        fontFamily: "var(--font-assistant), Assistant, sans-serif",
        direction: "rtl",
      }}
    >
      <div style={{ color: "#EDE9E1", fontSize: 14, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
        לא בטוחים איפה להתחיל?
        <br />
        <span style={{ color: "#AAB0BD", fontWeight: 400, fontSize: 12 }}>
          קוויז קצר - ונדע בדיוק מה מתאים לכם
        </span>
      </div>
      <a
        href="/quiz"
        style={{
          background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
          color: "#2a1d05",
          fontSize: 13,
          fontWeight: 800,
          padding: "10px 20px",
          borderRadius: 24,
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
          boxShadow: "0 1px 0 rgba(255, 255, 255, 0.55) inset, 0 -10px 22px rgba(157, 110, 12, 0.35) inset, 0 18px 34px -12px rgba(214, 155, 31, 0.55), 0 6px 14px -6px rgba(0, 0, 0, 0.55)",
        }}
      >
        {ctaText}
      </a>
    </div>
  );
}
