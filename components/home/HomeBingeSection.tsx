"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Zap, Video, Sparkles } from "lucide-react";

// Single featured video — pulls from the same Vimeo asset used on /binge.
const FEATURED = {
  vimeoId:     "1188793450",
  title:       "תהליך שלם מהסדנה",
  durationSec: 368,
  thumb:       "https://i.vimeocdn.com/video/2153151822-24b35215f9175167f236d3fa86ab2fcd09dfde24c2deacb309b1193d407c603d-d_1280x720?&r=pad&region=us",
};

const STAGES = [
  { key: "beginner", icon: Zap,       name: "מתחיל",        sub: "יסודות הסיגנל · ראשון בסדרה" },
  { key: "creator",  icon: Video,     name: "מייצר תוכן",   sub: "תהליכים מלאים · 9 סרטונים" },
  { key: "growing",  icon: Sparkles,  name: "רוצה לגדול",   sub: "לקוחות שעבדו · 30+ סרטונים" },
];

function fmtDuration(s: number): string {
  const m   = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function VimeoLightbox({ vimeoId, title, onClose }: { vimeoId: string; title: string; onClose: () => void }) {
  // ESC closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position:  "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.93)",
        display:   "flex", alignItems: "center", justifyContent: "center",
        padding:   16,
      }}
    >
      <button
        onClick={onClose}
        aria-label="סגור"
        style={{
          position: "absolute", top: 16, right: 16,
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff", fontSize: 18,
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 201,
        }}
      >
        ✕
      </button>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:    "relative",
          width:       "100%", maxWidth: 960,
          aspectRatio: "16/9",
        }}
      >
        {/* Muted by default + Hebrew text track requested for accessibility */}
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&title=0&byline=0&portrait=0&texttrack=he`}
          title={title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", borderRadius: 10 }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export default function HomeBingeSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const [inView,  setInView]  = useState(false);

  // Lazy-mount the heavy thumbnail + stages once the section is near the viewport.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      dir="rtl"
      className="font-assistant"
      style={{ background: "#080C14", padding: "64px 20px" }}
    >
      {playing && (
        <VimeoLightbox vimeoId={FEATURED.vimeoId} title={FEATURED.title} onClose={() => setPlaying(false)} />
      )}

      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* ── Wordmark + tagline ─────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{
            margin: "0 0 10px",
            fontSize: "clamp(44px, 9vw, 64px)",
            fontWeight: 900, lineHeight: 1,
            letterSpacing: "-0.025em",
            background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            בינג׳
          </h2>
          <p style={{
            margin: "0 auto 14px",
            maxWidth: 460,
            fontSize: 14,
            color: "#CDD1DA",
            lineHeight: 1.6,
            fontWeight: 500,
          }}>
            80+ סרטונים · כל מה שלמדתי על שיווק אותנטי, במקום אחד.
          </p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px",
            background: "rgba(232,185,74,0.08)",
            border: "1px solid rgba(232,185,74,0.28)",
            borderRadius: 9999,
            fontSize: 11, color: "#E8B94A",
            fontWeight: 700, letterSpacing: ".10em",
          }}>
            מתעדכן כל שבוע
          </div>
        </div>

        {/* ── Featured video — opens lightbox ───────────────────── */}
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`הפעל סרטון נבחר: ${FEATURED.title}, ${fmtDuration(FEATURED.durationSec)}`}
          style={{
            position: "relative", width: "100%",
            aspectRatio: "16/9",
            background: "#1D2430",
            border: "1px solid #1F2A40",
            borderRadius: 18,
            overflow: "hidden",
            cursor: "pointer", padding: 0,
            marginBottom: 36,
            display: "block",
          }}
        >
          {inView && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={FEATURED.thumb}
                alt=""
                loading="lazy"
                decoding="async"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {/* Bottom scrim — keeps the title off the photo */}
              <div
                aria-hidden
                style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "55%",
                  background: "linear-gradient(to top, rgba(8,12,20,0.96) 0%, rgba(8,12,20,0.55) 55%, transparent 100%)",
                  pointerEvents: "none",
                }}
              />
              {/* Center play button */}
              <div
                aria-hidden
                style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 74, height: 74, borderRadius: "50%",
                  background: "rgba(232,185,74,0.94)",
                  color: "#080C14",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, fontWeight: 700,
                  boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
                  paddingLeft: 4,
                }}
              >
                ▶
              </div>
              {/* Title + duration on scrim */}
              <div
                style={{
                  position: "absolute", bottom: 16, right: 18, left: 18,
                  textAlign: "right", direction: "rtl",
                  color: "#EDE9E1",
                }}
              >
                <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.3, marginBottom: 4 }}>
                  {FEATURED.title}
                </div>
                <div style={{ fontSize: 12, color: "#AAB0BD", fontWeight: 600 }}>
                  {fmtDuration(FEATURED.durationSec)}
                </div>
              </div>
            </>
          )}
        </button>

        {/* ── Stage entries ─────────────────────────────────────── */}
        <p style={{
          margin: "0 0 14px",
          fontSize: 12, fontWeight: 700,
          color: "#AAB0BD",
          letterSpacing: ".14em",
          textAlign: "right",
        }}>
          לפי השלב שלך
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            return (
              <Link
                key={stage.key}
                href={`/binge?stage=${stage.key}`}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  minHeight: 64,
                  padding: "12px 14px",
                  background: "linear-gradient(180deg, #131A29, #0F1523)",
                  border: "1px solid #1F2A40",
                  borderRadius: 12,
                  textDecoration: "none",
                  transition: "border-color 0.2s ease, transform 0.15s ease",
                }}
              >
                <div style={{
                  flexShrink: 0,
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(232,185,74,0.10)",
                  border: "1px solid rgba(232,185,74,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#E8B94A",
                }}>
                  <Icon size={18} aria-hidden />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE9E1", lineHeight: 1.25, marginBottom: 2 }}>
                    {stage.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#AAB0BD", lineHeight: 1.4 }}>
                    {stage.sub}
                  </div>
                </div>
                <div aria-hidden style={{ color: "#E8B94A", fontSize: 18, flexShrink: 0 }}>
                  ←
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── Single gold CTA ──────────────────────────────────── */}
        <Link
          href="/binge"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "100%", minHeight: 48,
            padding: "10px 24px",
            background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
            color: "#2a1d05",
            fontWeight: 800, fontSize: 15, lineHeight: 1.2,
            borderRadius: 999,
            textDecoration: "none",
            boxShadow: "0 1px 0 rgba(255, 255, 255, 0.35) inset, 0 4px 10px -4px rgba(0, 0, 0, 0.45)",
          }}
        >
          כניסה לבינג׳ ←
        </Link>
      </div>
    </section>
  );
}
