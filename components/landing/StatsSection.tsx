"use client";

import { useEffect, useRef, useState } from "react";
import { AGGREGATE, REVIEWS } from "@/data/reviews";

interface Stat {
  value: number | null;       // null = render rating instead of count-up
  label: string;
  sub?: string;
  isRating?: boolean;
}

const STATS: Stat[] = [
  { value: 3500,  label: "לקוחות" },
  { value: 50000, label: "תכנים", sub: "סרטונים, קופי ועיצובים שיצרנו ללקוחות" },
  { value: 80,    label: "תחומים" },
  { value: null,  label: "דירוג Google", isRating: true },
];

function easeQuarticOut(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function formatNum(n: number): string {
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    const remainder = String(Math.floor(n % 1000)).padStart(3, "0");
    return `${thousands},${remainder}`;
  }
  return String(n);
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="Google" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.5-4.2 7.3-10.4 7.3-17.3z" />
      <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.4v6.2C6.4 42.6 14.6 48 24 48z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6v-6.2H2.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.4 10.8l8.1-6.2z" />
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.8-6.8C35.9 2.1 30.4 0 24 0 14.6 0 6.4 5.4 2.4 13.2l8.1 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
    </svg>
  );
}

export function StatsSection() {
  const ref     = useRef<HTMLElement>(null);
  const started = useRef(false);
  const animatedCount = STATS.filter(s => s.value !== null).length;
  const [counts, setCounts]   = useState<number[]>(Array(animatedCount).fill(0));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          obs.disconnect();
          setVisible(true);

          const duration = 2200;
          const t0 = performance.now();
          const targets = STATS.filter(s => s.value !== null).map(s => s.value as number);

          function tick(now: number) {
            const t = Math.min((now - t0) / duration, 1);
            const e = easeQuarticOut(t);
            setCounts(targets.map(target => Math.round(target * e)));
            if (t < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const lineStyle: React.CSSProperties = {
    width:      36,
    height:     2,
    margin:     "0 auto",
    background: "linear-gradient(90deg, #E8B94A, #9E7C3A)",
    opacity:    visible ? 1 : 0,
    transition: "opacity 0.8s ease 0.4s",
  };

  let animIdx = 0;

  return (
    <section
      ref={ref}
      className="font-assistant py-6 md:py-14 px-6"
      style={{ background: "#080C14" }}
    >
      {/* Gold line — top */}
      <div style={lineStyle} aria-hidden />

      {/* Stats grid: 2x2 mobile, 4-col desktop */}
      <div
        className="my-5 md:my-10 grid grid-cols-2 md:grid-cols-4"
        style={{
          maxWidth:    920,
          marginLeft:  "auto",
          marginRight: "auto",
          gap:         "28px 8px",
          alignItems:  "start",
        }}
      >
        {STATS.map((stat, i) => {
          const delay = i * 0.14;

          return (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                padding:   "0 6px",
                opacity:   visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
              }}
            >
              {/* Number / rating */}
              {stat.isRating ? (
                <div
                  dir="ltr"
                  style={{
                    unicodeBidi: "embed",
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 4,
                    lineHeight: 1,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "clamp(30px, 6vw, 48px)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      background: "linear-gradient(160deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {AGGREGATE.rating.toFixed(1)}
                  </span>
                </div>
              ) : (
                <div
                  dir="ltr"
                  style={{
                    unicodeBidi: "embed",
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 2,
                    lineHeight: 1,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 300,
                      color: "#9E7C3A",
                      fontSize: "clamp(18px, 3vw, 26px)",
                      lineHeight: 1,
                    }}
                  >
                    +
                  </span>
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "clamp(30px, 6vw, 48px)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      background: "linear-gradient(160deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {formatNum(counts[animIdx++] ?? 0)}
                  </span>
                </div>
              )}

              {/* Stars row (only on rating stat) */}
              {stat.isRating && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  marginTop: 6, lineHeight: 1,
                }}>
                  <GoogleG />
                  <span style={{
                    color: "#E8B94A", fontSize: 14, letterSpacing: "0.18em", lineHeight: 1,
                  }}>★★★★★</span>
                </div>
              )}

              {/* Label */}
              <p
                style={{
                  fontSize: "clamp(13px, 2vw, 15px)",
                  color: "#AAB0BD",
                  letterSpacing: "0.06em",
                  marginTop: stat.isRating ? 8 : 10,
                  opacity: visible ? 1 : 0,
                  transition: `opacity 0.65s ease ${delay + 0.18}s`,
                }}
              >
                {stat.label}
                {stat.isRating && (
                  <span style={{ color: "#AAB0BD", opacity: 0.7 }}> · {REVIEWS.length} ביקורות</span>
                )}
              </p>

              {/* Sub-context */}
              {stat.sub && (
                <p
                  style={{
                    fontSize: "clamp(10px, 1.6vw, 11px)",
                    color: "#8e887e",
                    marginTop: 4,
                    lineHeight: 1.4,
                    maxWidth: 180,
                    marginInline: "auto",
                    opacity: visible ? 1 : 0,
                    transition: `opacity 0.65s ease ${delay + 0.28}s`,
                  }}
                >
                  {stat.sub}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Gold line — bottom */}
      <div style={lineStyle} aria-hidden />

      <p style={{ textAlign: "center", color: "#AAB0BD", fontSize: 12, marginTop: 24, fontWeight: 500, opacity: visible ? 1 : 0, transition: "opacity 0.8s ease 0.6s" }}>
        המספרים מבוססים על הצטברות לקוחות, סדנאות, וקמפיינים מאז 2023.
      </p>
    </section>
  );
}
