"use client";

import { useState, useRef, useEffect } from "react";

const TESTIMONIALS = [
  {
    id: "1190122900",
    hash: "d02f0b098d",
    thumb: "/testimonials/1190122900.jpg",
    quote: "הבנתי איך לשווק ועדיין להיות אני",
  },
  {
    id: "1190122820",
    hash: "fb41cfe4f4",
    thumb: "/testimonials/1190122820.jpg",
    quote: "ראיתי כיצד להביא את הבן אדם שאני",
  },
  {
    id: "1190123084",
    hash: "5dc8f93743",
    thumb: "/testimonials/1190123084.jpg",
    quote: "יצאתי עם בהירות, סטרטגיה וכלים פרקטיים",
  },
  {
    id: "1190122999",
    hash: "5b72d8c140",
    thumb: "/testimonials/1190122999.jpg",
    quote: "אם הדר לא הייתה קיימת היה צריך לברוא מישהי",
  },
  {
    id: "1190121014",
    hash: "478522c71f",
    thumb: "/testimonials/1190121014.jpg",
    quote: "הייתי בהרבה סדנאות שלא הצליחו לפצח אותי — עד היום",
  },
  {
    id: "1190120865",
    hash: "2d571bb4da",
    thumb: "/testimonials/1190120865.jpg",
    quote: "יצאתי עם היכולת לדייק את עצמי",
  },
  {
    id: "1190120935",
    hash: "207647a09c",
    thumb: "/testimonials/1190120935.jpg",
    quote: "כל העדויות יחד",
    isMix: true,
  },
];

export function WorkshopTestimonials() {
  const [active, setActive] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active]);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  function scroll(dir: "left" | "right") {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir === "left" ? -430 : 430, behavior: "smooth" });
  }

  const activeItem = TESTIMONIALS.find((t) => t.id === active);

  return (
    <>
      {/* ── Outer wrapper — arrows sit outside the scroll rail ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* Left arrow (← in RTL = scroll right visually) */}
        <button
          onClick={() => scroll("right")}
          aria-label="הבא"
          style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
            background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.3)",
            color: "#C9964A", fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >‹</button>

        {/* Scrollable rail — fade on both ends via mask */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div
            ref={railRef}
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              padding: "6px 2px 12px",
              scrollbarWidth: "none",
              direction: "rtl",
              WebkitMaskImage: "linear-gradient(to left, transparent 0%, black 6%, black 94%, transparent 100%)",
              maskImage: "linear-gradient(to left, transparent 0%, black 6%, black 94%, transparent 100%)",
            }}
          >
            {TESTIMONIALS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  flexShrink: 0,
                  width: 180,
                  height: 320,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: t.isMix
                    ? "1px solid rgba(201,150,74,0.5)"
                    : "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  background: "#0D1018",
                  padding: 0,
                  position: "relative",
                  transform: hovered === t.id ? "scale(1.04)" : "scale(1)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: hovered === t.id
                    ? "0 8px 28px rgba(0,0,0,0.7)"
                    : "0 2px 8px rgba(0,0,0,0.4)",
                }}
              >
                {/* Thumbnail */}
                <img
                  src={t.thumb}
                  alt=""
                  loading="lazy"
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover",
                  }}
                />

                {/* Bottom gradient */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(8,12,20,0.97) 0%, rgba(8,12,20,0.55) 42%, rgba(8,12,20,0.1) 65%, transparent 100%)",
                }} />

                {/* Mix badge */}
                {t.isMix && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    background: "rgba(201,150,74,0.92)", color: "#080C14",
                    fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 20,
                    fontFamily: "Assistant, sans-serif",
                    letterSpacing: "0.02em",
                  }}>כל העדויות</div>
                )}

                {/* Play circle */}
                <div style={{
                  position: "absolute",
                  top: "42%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 44, height: 44, borderRadius: "50%",
                  background: hovered === t.id
                    ? "rgba(201,150,74,0.95)"
                    : "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(3px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                  border: "2px solid rgba(255,255,255,0.25)",
                }}>
                  <span style={{
                    fontSize: 16, lineHeight: 1, marginLeft: 3,
                    color: hovered === t.id ? "#080C14" : "#fff",
                  }}>▶</span>
                </div>

                {/* Quote */}
                <div style={{
                  position: "absolute", bottom: 0, right: 0, left: 0,
                  padding: "0 12px 14px",
                  textAlign: "right", direction: "rtl",
                }}>
                  <p style={{
                    margin: 0, fontSize: 12, fontWeight: 700,
                    color: "#EDE9E1", lineHeight: 1.5,
                    fontFamily: "Assistant, sans-serif",
                    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                  }}>
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("left")}
          aria-label="הקודם"
          style={{
            flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
            background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.3)",
            color: "#C9964A", fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >›</button>
      </div>

      {/* ── Modal ─────────────────────────────────────────────── */}
      {active && activeItem && (
        <div
          onClick={() => setActive(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(360px, 88vw)",
              aspectRatio: "9/16",
              borderRadius: 16, overflow: "hidden",
              boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
              border: "1px solid rgba(201,150,74,0.2)",
            }}
          >
            <iframe
              src={`https://player.vimeo.com/video/${activeItem.id}?h=${activeItem.hash}&autoplay=1&badge=0&loop=0`}
              allow="autoplay; fullscreen; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            />
          </div>

          <button
            onClick={() => setActive(null)}
            style={{
              position: "absolute", top: 20, right: 20,
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)",
            }}
          >✕</button>
        </div>
      )}
    </>
  );
}
