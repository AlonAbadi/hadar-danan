"use client";

import { Fragment, useEffect, useRef, useState } from "react";

const STATS = [
  { value: 3500,  label: "לקוחות" },
  { value: 50000, label: "תכנים"  },
  { value: 80,    label: "תחומים" },
] as const;

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

export function StatsSection() {
  const ref     = useRef<HTMLElement>(null);
  const started = useRef(false);
  const [counts, setCounts]   = useState<[number, number, number]>([0, 0, 0]);
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
          const targets = STATS.map((s) => s.value);

          function tick(now: number) {
            const t = Math.min((now - t0) / duration, 1);
            const e = easeQuarticOut(t);
            setCounts([
              Math.round(targets[0] * e),
              Math.round(targets[1] * e),
              Math.round(targets[2] * e),
            ]);
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

  const sepStyle: React.CSSProperties = {
    width:      1,
    alignSelf:  "stretch",
    flexShrink: 0,
    background: "linear-gradient(180deg, transparent 0%, #C9964A28 30%, #C9964A28 70%, transparent 100%)",
  };

  return (
    <section
      ref={ref}
      className="font-assistant py-6 md:py-14 px-6"
      style={{ background: "#080C14" }}
    >
      {/* Gold line — top */}
      <div style={lineStyle} aria-hidden />

      {/* Stats row */}
      <div
        className="my-5 md:my-10"
        style={{
          display:      "flex",
          maxWidth:     680,
          marginLeft:   "auto",
          marginRight:  "auto",
          alignItems:   "center",
        }}
      >
        {STATS.map((stat, i) => (
          <Fragment key={stat.label}>
            {i > 0 && <div style={sepStyle} aria-hidden />}

            <div
              style={{
                flex:      1,
                textAlign: "center",
                padding:   "0 12px",
                opacity:   visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.65s ease ${i * 0.18}s, transform 0.65s ease ${i * 0.18}s`,
              }}
            >
              {/* +Number */}
              <div
                dir="ltr"
                style={{
                  unicodeBidi: "embed",
                  display:     "inline-flex",
                  alignItems:  "baseline",
                  gap:         2,
                  lineHeight:  1,
                }}
              >
                <span
                  style={{
                    fontWeight: 300,
                    color:      "#9E7C3A",
                    fontSize:   "clamp(18px, 3vw, 26px)",
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
                <span
                  style={{
                    fontWeight:            800,
                    fontSize:              "clamp(30px, 6vw, 48px)",
                    letterSpacing:         "-0.02em",
                    lineHeight:            1,
                    background:            "linear-gradient(160deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)",
                    WebkitBackgroundClip:  "text",
                    WebkitTextFillColor:   "transparent",
                    backgroundClip:        "text",
                  }}
                >
                  {formatNum(counts[i])}
                </span>
              </div>

              {/* Label */}
              <p
                style={{
                  fontSize:      "clamp(13px, 2vw, 15px)",
                  color:         "#9E9990",
                  letterSpacing: "0.06em",
                  marginTop:     8,
                  opacity:       visible ? 1 : 0,
                  transition:    `opacity 0.65s ease ${i * 0.18 + 0.25}s`,
                }}
              >
                {stat.label}
              </p>
            </div>
          </Fragment>
        ))}
      </div>

      {/* Gold line — bottom */}
      <div style={lineStyle} aria-hidden />
    </section>
  );
}
