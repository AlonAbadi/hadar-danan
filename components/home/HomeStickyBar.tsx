"use client";

import { useEffect, useState } from "react";

interface HomeStickyBarProps {
  ctaText: string;
  heroSelector?: string;
}

export default function HomeStickyBar({
  ctaText,
  heroSelector = "[data-home-hero-cta]",
}: HomeStickyBarProps) {
  const [visible, setVisible] = useState(false);
  const [heroInView, setHeroInView] = useState(true);

  // IntersectionObserver על כפתורי ה-hero
  useEffect(() => {
    const targets = document.querySelectorAll(heroSelector);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((e) => e.isIntersecting);
        setHeroInView(anyVisible);
      },
      { threshold: 0.1 }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [heroSelector]);

  // Scroll listener — מופיע אחרי 400px + רק אם hero לא נראה
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400 && !heroInView);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [heroInView]);

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
        לא בטוח/ה איפה להתחיל?
        <br />
        <span style={{ color: "#AAB0BD", fontWeight: 400, fontSize: 12 }}>
          קוויז קצר - ונדע בדיוק מה מתאים לך
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
