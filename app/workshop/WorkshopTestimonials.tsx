"use client";

import { useState, useRef, useEffect } from "react";

const TESTIMONIALS = [
  {
    id: "1190122900",
    hash: "d02f0b098d",
    thumb: "https://i.vimeocdn.com/video/2154814555-be6ca697373b8a428f3d95856c44477edbe81daca0d5e855bc0e5b92229dd8e0-d_360x640?r=crop&region=us",
    quote: "הבנתי איך לשווק ועדיין להיות אני",
  },
  {
    id: "1190122820",
    hash: "fb41cfe4f4",
    thumb: "https://i.vimeocdn.com/video/2154814484-b783beffa52f96fa976d979b94a26eba3d28ebee73ad27ae702a04d73cc06d41-d_360x640?r=crop&region=us",
    quote: "ראיתי כיצד להביא את הבן אדם שאני",
  },
  {
    id: "1190123084",
    hash: "5dc8f93743",
    thumb: "https://i.vimeocdn.com/video/2154814775-2939436b74daf316f4980675ca7a38e023ed75704bf5eabd8d673731455c5b96-d_360x640?r=crop&region=us",
    quote: "יצאתי עם בהירות, סטרטגיה וכלים פרקטיים",
  },
  {
    id: "1190122999",
    hash: "5b72d8c140",
    thumb: "https://i.vimeocdn.com/video/2154814699-9246321625ea8c1729ee12fe5b8a44cd067b2b0484099a75286384d0dd440470-d_360x640?r=crop&region=us",
    quote: "אם הדר לא הייתה קיימת היה צריך לברוא מישהי",
  },
  {
    id: "1190121014",
    hash: "478522c71f",
    thumb: "https://i.vimeocdn.com/video/2154812152-5a8a216523bee8091fd2aaad1f11bed1a0b51353490e5c78cf2a5351d864830a-d_360x640?r=crop&region=us",
    quote: "הייתי בהרבה סדנאות שלא הצליחו לפצח אותי — עד היום",
  },
  {
    id: "1190120865",
    hash: "2d571bb4da",
    thumb: "https://i.vimeocdn.com/video/2154811976-aee428867a81857ea237116e57d74b8741c372cf24cbb539092c6d1e854c5f0d-d_360x640?r=crop&region=us",
    quote: "יצאתי עם היכולת לדייק את עצמי",
  },
  {
    id: "1190120935",
    hash: "207647a09c",
    thumb: "https://i.vimeocdn.com/video/2154812069-61912cbc9c431c479af1f6e8bbe83726ae20e572b91801ea6e8ba5f6e68dc133-d_360x640?r=crop&region=us",
    quote: "מיקס עדויות — כולן יחד",
    isMix: true,
  },
];

const CARD_W = 200;
const CARD_H = 356; // ~9:16

export function WorkshopTestimonials() {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  function scroll(dir: "left" | "right") {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir === "left" ? -CARD_W * 2 : CARD_W * 2, behavior: "smooth" });
  }

  const activeItem = TESTIMONIALS.find((t) => t.id === active);

  return (
    <>
      {/* ── Carousel ───────────────────────────────────────────── */}
      <div style={{ position: "relative", margin: "0 -4px" }}>
        {/* Left fade + arrow */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 64, zIndex: 2,
          background: "linear-gradient(to right, #0D1018 40%, transparent)",
          display: "flex", alignItems: "center", pointerEvents: "none",
        }}>
          <button
            onClick={() => scroll("left")}
            aria-label="הקודם"
            style={{
              pointerEvents: "all", width: 36, height: 36, borderRadius: "50%",
              background: "rgba(201,150,74,0.15)", border: "1px solid rgba(201,150,74,0.3)",
              color: "#C9964A", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginLeft: 6, transition: "background 0.2s",
            }}
          >‹</button>
        </div>

        {/* Right fade + arrow */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 64, zIndex: 2,
          background: "linear-gradient(to left, #0D1018 40%, transparent)",
          display: "flex", alignItems: "center", justifyContent: "flex-end", pointerEvents: "none",
        }}>
          <button
            onClick={() => scroll("right")}
            aria-label="הבא"
            style={{
              pointerEvents: "all", width: 36, height: 36, borderRadius: "50%",
              background: "rgba(201,150,74,0.15)", border: "1px solid rgba(201,150,74,0.3)",
              color: "#C9964A", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginRight: 6, transition: "background 0.2s",
            }}
          >›</button>
        </div>

        {/* Scrollable rail */}
        <div
          ref={railRef}
          data-testimonials-rail=""
          style={{
            display: "flex", gap: 12, overflowX: "auto", padding: "4px 48px 12px",
            scrollbarWidth: "none",
            direction: "rtl",
          }}
        >
          {TESTIMONIALS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                flexShrink: 0, width: CARD_W, height: CARD_H,
                borderRadius: 12, overflow: "hidden",
                border: t.isMix
                  ? "1px solid rgba(201,150,74,0.5)"
                  : "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", background: "none", padding: 0,
                position: "relative",
                transform: hovered === t.id ? "scale(1.04)" : "scale(1)",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                boxShadow: hovered === t.id
                  ? "0 8px 32px rgba(0,0,0,0.6)"
                  : "0 2px 10px rgba(0,0,0,0.3)",
              }}
            >
              {/* Thumbnail */}
              <img
                src={t.thumb}
                alt=""
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: "cover",
                }}
              />

              {/* Gradient overlay — bottom 60% */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(8,12,20,0.96) 0%, rgba(8,12,20,0.6) 45%, rgba(8,12,20,0.1) 70%, transparent 100%)",
              }} />

              {/* Mix badge */}
              {t.isMix && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(201,150,74,0.9)", color: "#080C14",
                  fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 20,
                  fontFamily: "Assistant, sans-serif",
                }}>
                  כל העדויות ▶
                </div>
              )}

              {/* Play circle */}
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 48, height: 48, borderRadius: "50%",
                background: hovered === t.id
                  ? "rgba(201,150,74,0.95)"
                  : "rgba(255,255,255,0.18)",
                backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.25s",
                border: "2px solid rgba(255,255,255,0.3)",
              }}>
                <span style={{
                  fontSize: 18,
                  color: hovered === t.id ? "#080C14" : "#fff",
                  marginLeft: 3, lineHeight: 1,
                }}>▶</span>
              </div>

              {/* Quote text */}
              <div style={{
                position: "absolute", bottom: 0, right: 0, left: 0,
                padding: "0 14px 16px",
                textAlign: "right", direction: "rtl",
              }}>
                <p style={{
                  margin: 0, fontSize: 13, fontWeight: 700,
                  color: "#EDE9E1", lineHeight: 1.5,
                  fontFamily: "Assistant, sans-serif",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {active && activeItem && (
        <div
          onClick={() => setActive(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(380px, 90vw)",
              aspectRatio: "9/16",
              borderRadius: 16, overflow: "hidden",
              position: "relative",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
              border: "1px solid rgba(201,150,74,0.25)",
            }}
          >
            <iframe
              src={`https://player.vimeo.com/video/${activeItem.id}?h=${activeItem.hash}&autoplay=1&badge=0&loop=0`}
              allow="autoplay; fullscreen; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={() => setActive(null)}
            style={{
              position: "absolute", top: 20, right: 20,
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)", border: "none",
              color: "#fff", fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >✕</button>
        </div>
      )}

      <style>{`
        div[data-testimonials-rail]::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
