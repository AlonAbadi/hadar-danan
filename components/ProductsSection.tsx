"use client";

import { useState, useEffect, useRef } from "react";
import {
  WORKSHOP_DATES,
  getNextDate,
  formatHebrew,
} from "@/lib/products";

// ─── Types ──────────────────────────────────────────────────────────────────

type Stage = "כל" | "מתחיל" | "מייצר תוכן" | "רוצה לגדול";

// ─── Stage config ────────────────────────────────────────────────────────────

const STAGES: Stage[] = ["כל", "מתחיל", "מייצר תוכן", "רוצה לגדול"];

const HEADLINE: Record<Stage, { h: string; sub: string }> = {
  "כל":          { h: "כל אחד נמצא במקום אחר",              sub: "כשהאות שלך ברור — הלקוחות הנכונים מגיעים מאליהם" },
  "מתחיל":       { h: "מתחיל מאפס? התחל כאן",               sub: "הדרכה חינמית שמסבירה בדיוק מאיפה להתחיל" },
  "מייצר תוכן":  { h: "כבר מייצר תוכן? הגיע הזמן לתוצאות", sub: "יש לך תוכן — נשתמש בו נכון כדי שיביא לקוחות" },
  "רוצה לגדול":  { h: "מוכן לצמיחה אמיתית?",               sub: "הצמיחה מגיעה עם בהירות. בנה אסטרטגיה מדויקת" },
};

// Indices of recommended products per stage (0=training,1=challenge,2=workshop,3=strategy)
const HIGHLIGHT: Record<Stage, number[]> = {
  "כל":          [0, 1, 2, 3],
  "מתחיל":       [0],
  "מייצר תוכן":  [1],
  "רוצה לגדול":  [2, 3],
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductsSection({ excludeTraining = false }: { excludeTraining?: boolean }) {
  const [stage, setStage]           = useState<Stage>("כל");
  const [expanded, setExpanded]     = useState<Set<number>>(new Set());
  const [showNudge, setShowNudge]   = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [stickyGone, setStickyGone] = useState(false);
  const sectionRef                  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ps_stage") as Stage | null;
    if (saved && STAGES.includes(saved)) setStage(saved);
    if (localStorage.getItem("ps_visited")) setShowNudge(true);
    localStorage.setItem("ps_visited", "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("ps_stage", stage);
  }, [stage]);

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current || stickyGone) return;
      const rect   = sectionRef.current.getBoundingClientRect();
      const height = sectionRef.current.offsetHeight;
      const pct    = -rect.top / height;
      setShowSticky(pct > 0.6 && pct < 1.0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [stickyGone]);

  function dismissSticky() { setStickyGone(true); setShowSticky(false); }

  function toggleExpand(i: number) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const nextWorkshop = getNextDate(WORKSHOP_DATES);

  // ─── Product definitions ─────────────────────────────────────────────────

  const allProducts = [
    {
      badge:    "01",
      href:     "/training",
      price:    "חינם",
      name:     "הדרכה חינמית",
      tag:      "כניסה",
      outcome:  "מבין למה השיווק שלך לא עובד",
      scarcity: "גישה מידית",
      scIcon:   "⚡",
      ctas: [
        { label: "צפה בהדרכה ←",  href: "/training", primary: true  },
        { label: "הירשם חינם ←", href: "/training", primary: false },
      ],
      bullets: [
        "הסבר מלא למה השיווק שלך לא מייצר לקוחות",
        "2 תרגילים שמנקים את המסר שלך בפחות משעה",
        "המפה המלאה של הדרך קדימה — בלי ניחושים",
      ],
      quote: { text: "\"הדרכה אחת שינתה את כל הגישה שלי — תוך שעה הבנתי מה חסר לי\"", author: "מיכל ב., מאמנת עסקית" },
    },
    {
      badge:    "02",
      href:     "/challenge",
      price:    "₪197",
      name:     "אתגר 7 ימים",
      tag:      null,
      outcome:  "7 סרטונים שמשנים את הדרך",
      scarcity: "התחל עכשיו — גישה מידית",
      scIcon:   "⚡",
      ctas: [{ label: "להצטרף לאתגר ←", href: "/challenge", primary: true }],
      bullets: [
        "7 ימים, 7 שיעורים — כל יום שלב אחד בסיסטם",
        "גישה להקלטות לצמיתות, ללא מועד פקיעה",
        "קבוצת WhatsApp עם הדר לאורך כל הדרך",
      ],
      quote: { text: "\"תוך שבוע הייתה לי בהירות שלא הייתה לי שנה שלמה\"", author: "רונית ק., קמטולוגית" },
    },
    {
      badge:    "03",
      href:     "/workshop",
      price:    "₪1,080",
      name:     "סדנה יום אחד",
      tag:      null,
      outcome:  "אסטרטגיה ברורה ביום אחד",
      scarcity: nextWorkshop ? `${formatHebrew(nextWorkshop)} — מקומות מוגבלים` : "מועד הבא בקרוב",
      scIcon:   "📅",
      ctas: [{ label: "קבע את היום שלך ←", href: "/workshop", primary: true }],
      bullets: [
        "6 שעות אינטנסיביות עם הדר — קבוצה קטנה ואינטימית",
        "בונה לך אסטרטגיה מותאמת אישית לעסק שלך",
        "חוזרים הביתה עם תכנית עבודה מלאה ל-12 חודשים",
      ],
      quote: { text: "\"יצאתי עם תכנית ל-12 חודשים. לא ציפיתי לזה ביום אחד\"", author: "אורן מ., מאמן כושר" },
    },
    {
      badge:    "04",
      href:     "/strategy",
      price:    "₪4,000",
      name:     "פגישת אסטרטגיה",
      tag:      "מומלץ",
      outcome:  "90 דקות שבונות תכנית ל-90 יום",
      scarcity: "מספר מקומות מוגבל בכל חודש",
      scIcon:   "🔒",
      ctas: [{ label: "קבע פגישה ←", href: "/strategy", primary: true }],
      bullets: [
        "90 דקות אחד-על-אחד עם הדר — מיקוד מלא על העסק שלך",
        "אסטרטגיה מלאה ומדויקת לשנה הקרובה",
        "ערבות: לא פיצחנו ביחד? פגישה נוספת — חינם",
      ],
      quote: { text: "\"ה-ROI על הפגישה הזו היה פי 10 תוך 3 חודשים\"", author: "גיל ש., יועץ פיננסי" },
    },
  ];

  const products      = excludeTraining ? allProducts.slice(1) : allProducts;
  const highlighted   = HIGHLIGHT[stage];
  // When training excluded, shift indices: 1→0, 2→1, 3→2
  const effectiveHL   = excludeTraining
    ? highlighted.filter(i => i > 0).map(i => i - 1)
    : highlighted;

  const isHL = (i: number) => stage === "כל" || effectiveHL.includes(i);

  const ctaGold: React.CSSProperties = {
    display: "inline-block", padding: "9px 20px", borderRadius: 9999,
    fontSize: 13, fontWeight: 700, textDecoration: "none",
    background: "linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)",
    color: "#1A1206", border: "none",
  };
  const ctaOutline: React.CSSProperties = {
    display: "inline-block", padding: "9px 20px", borderRadius: 9999,
    fontSize: 13, fontWeight: 700, textDecoration: "none",
    background: "transparent", color: "#EDE9E1",
    border: "1px solid rgba(201,150,74,0.4)",
  };

  return (
    <section id="products" ref={sectionRef} style={{ background: "#080C14", position: "relative" }}>
      <div style={{ color: "#EDE9E1", maxWidth: 840, margin: "0 auto", padding: "80px 24px 0" }}>

        {/* ── Section header ─────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,150,74,0.1)", border: "1px solid rgba(201,150,74,0.28)", borderRadius: 9999, padding: "5px 16px", marginBottom: 20 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A" }} />
            <span style={{ color: "#C9964A", fontSize: 11, letterSpacing: "0.12em", fontWeight: 600 }}>הדרך</span>
          </div>
          <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: 10, transition: "all 0.3s" }}>
            {HEADLINE[stage].h}
          </h2>
          <p style={{ color: "#9E9990", fontSize: "0.95rem", marginBottom: 28, transition: "all 0.3s" }}>
            {HEADLINE[stage].sub}
          </p>

          {/* Stage filter pills */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => setStage(s)}
                style={{
                  padding: "7px 18px", borderRadius: 9999, fontSize: 13, fontWeight: 600,
                  border:      stage === s ? "1px solid #C9964A"            : "1px solid rgba(201,150,74,0.2)",
                  background:  stage === s ? "rgba(201,150,74,0.15)"        : "transparent",
                  color:       stage === s ? "#C9964A"                      : "#9E9990",
                  cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Nudge bar (returning visitors) ────────────────────────────── */}
        {showNudge && stage === "כל" && (
          <div style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#C9964A" }}>👋 חזרת! בחר שלב שמתאים לך לחוויה ממוקדת יותר</span>
            <button onClick={() => setShowNudge(false)} style={{ background: "none", border: "none", color: "#9E9990", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
          </div>
        )}

        {/* ── Core ladder panel ─────────────────────────────────────────── */}
        <div style={{ background: "#0F1523", border: "1px solid #1C2638", borderRadius: 20, overflow: "hidden", marginBottom: 48 }}>
          {products.map((p, i) => {
            const highlighted = isHL(i);
            const dimmed      = stage !== "כל" && !highlighted;
            const isExp       = expanded.has(i);
            const isLast      = i === products.length - 1;

            return (
              <div key={p.badge}>
                {/* Product row */}
                <div style={{ padding: "20px 24px", opacity: dimmed ? 0.4 : 1, transition: "opacity 0.25s", borderRight: highlighted && stage !== "כל" ? "3px solid #C9964A" : "3px solid transparent" }}>

                  {/* Top line: badge · name · tag · price */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 8 }}>
                    <div style={{
                      flexShrink: 0, width: 38, height: 38, borderRadius: 10,
                      background: highlighted && stage !== "כל" ? "linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)" : "rgba(201,150,74,0.1)",
                      border: "1px solid rgba(201,150,74,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
                      color: highlighted && stage !== "כל" ? "#1A1206" : "#C9964A",
                    }}>{p.badge}</div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#EDE9E1" }}>{p.name}</span>
                        {p.tag && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "linear-gradient(135deg,#E8B94A,#C9964A)", color: "#1A1206", padding: "2px 8px", borderRadius: 4 }}>
                            {p.tag}
                          </span>
                        )}
                      </div>
                      {/* Outcome strip */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "#9E9990" }}>
                        <span style={{ color: "#C9964A", fontWeight: 700 }}>→</span>
                        <span>{p.outcome}</span>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#C9964A", textAlign: "left" }}>{p.price}</div>
                    </div>
                  </div>

                  {/* Scarcity bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "rgba(201,150,74,0.05)", borderRadius: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 13 }}>{p.scIcon}</span>
                    <span style={{ fontSize: 12, color: "#9E9990" }}>{p.scarcity}</span>
                  </div>

                  {/* CTAs + expand chevron */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {p.ctas.map((cta, ci) => (
                      <a key={ci} href={cta.href} onClick={dismissSticky} style={cta.primary ? ctaGold : ctaOutline}>
                        {cta.label}
                      </a>
                    ))}
                    <button
                      onClick={() => toggleExpand(i)}
                      style={{
                        marginRight: "auto", background: "none",
                        border: "1px solid rgba(201,150,74,0.2)", borderRadius: 8,
                        padding: "7px 12px", cursor: "pointer", color: "#9E9990",
                        fontSize: 13, display: "flex", alignItems: "center", gap: 4,
                        fontFamily: "inherit", transition: "all 0.2s",
                      }}
                    >
                      <span>{isExp ? "פחות" : "קרא עוד"}</span>
                      <span style={{ display: "inline-block", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}>⌄</span>
                    </button>
                  </div>
                </div>

                {/* Expand panel */}
                {isExp && (
                  <div style={{
                    background: "rgba(201,150,74,0.04)",
                    borderTop:    "1px solid rgba(201,150,74,0.1)",
                    borderBottom: isLast ? "none" : "1px solid rgba(201,150,74,0.08)",
                    padding: "18px 24px",
                  }}>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", marginBottom: 16 }}>
                      {p.bullets.map((b, bi) => (
                        <li key={bi} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                          <span style={{ color: "#C9964A", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 14, color: "rgba(237,233,225,0.85)", lineHeight: 1.55 }}>{b}</span>
                        </li>
                      ))}
                    </ul>
                    <div style={{ background: "rgba(201,150,74,0.07)", border: "1px solid rgba(201,150,74,0.15)", borderRadius: 10, padding: "12px 16px" }}>
                      <p style={{ margin: 0, fontSize: 13, color: "rgba(237,233,225,0.8)", lineHeight: 1.6, fontStyle: "italic", marginBottom: 5 }}>{p.quote.text}</p>
                      <span style={{ fontSize: 12, color: "#9E9990" }}>— {p.quote.author}</span>
                    </div>
                  </div>
                )}

                {/* Row divider */}
                {!isLast && <div style={{ height: 1, background: "rgba(201,150,74,0.07)", margin: "0 24px" }} />}
              </div>
            );
          })}
        </div>

        {/* ── Premium section ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 48 }}>

          {/* Editorial header */}
          <div style={{ textAlign: "center", padding: "8px 0 28px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".24em", color: "#9E7C3A", marginBottom: 14 }}>◆ PREMIUM</div>
            <h2 style={{ margin: "0 0 10px", fontSize: "clamp(1.6rem,3.5vw,2rem)", fontWeight: 800, lineHeight: 1.15, color: "#EDE9E1", letterSpacing: "-0.01em" }}>
              לעסקים שמוכנים<br />
              <span style={{ fontStyle: "italic", fontWeight: 500, color: "#E8B94A" }}>לקפיצה הבאה</span>
            </h2>
            <p style={{ margin: "0 auto", maxWidth: 320, fontSize: 13, color: "#9E9990", lineHeight: 1.6 }}>
              שלוש דרכים לעבוד איתנו לעומק. כל אחת מתחילה בשיחה.
            </p>
          </div>

          {/* Cards */}
          <div className="ps-prem-grid">

            {/* PRODUCTION — יום צילום פרמיום */}
            <article style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(201,150,74,0.16)", background: "#0F1623" }}>
              <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 30%, rgba(232,185,74,0.18), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(232,185,74,0.10), transparent 50%), linear-gradient(135deg, #1a2238, #0F1623)" }}>
                  <div style={{ position: "absolute", bottom: 18, right: 18, display: "flex", gap: 4 }}>
                    {[0,1,2,3].map(i => <div key={i} style={{ width: 18, height: 24, border: "1px solid rgba(232,185,74,0.35)", borderRadius: 2 }} />)}
                  </div>
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, fontWeight: 800, letterSpacing: ".18em", color: "#E8B94A", background: "rgba(8,12,20,0.75)", padding: "4px 10px", borderRadius: 3, border: "1px solid rgba(232,185,74,0.30)" }}>PRODUCTION</div>
              </div>
              <div style={{ padding: "20px 18px 22px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#EDE9E1", lineHeight: 1.15 }}>יום צילום פרמיום</h3>
                  <div style={{ textAlign: "left", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#E8B94A", whiteSpace: "nowrap" }}>₪14,000</div>
                    <div style={{ fontSize: 10, color: "#9E9990", marginTop: 3 }}>+ מע״מ</div>
                  </div>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.5, color: "#EDE9E1", fontWeight: 500 }}>יום אחד · 14 סרטונים · ביד.</p>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C9964A", marginBottom: 14, letterSpacing: ".02em" }}>◆ 14 ימים מהצילום לאוויר</div>
                <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {["אסטרטגיה מקדימה (90 דק׳)", "יום צילום מלא + צוות", "14 סרטונים ערוכים"].map((d, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#9E9990", lineHeight: 1.5, position: "relative", paddingRight: 14 }}>
                      <span style={{ position: "absolute", right: 0, top: "0.45em", width: 4, height: 4, borderRadius: "50%", background: "#9E7C3A", display: "inline-block" }} />{d}
                    </li>
                  ))}
                </ul>
                <div style={{ padding: "10px 12px", marginBottom: 16, background: "rgba(0,0,0,0.25)", borderRight: "2px solid #9E7C3A", borderRadius: "0 6px 6px 0", fontSize: 12, fontStyle: "italic", color: "#EDE9E1", lineHeight: 1.5 }}>
                  ״השקעה שמחזירה את עצמה תוך 6 שבועות.״
                  <div style={{ fontStyle: "normal", fontSize: 10, color: "#9E7C3A", marginTop: 4 }}>— נועה · יועצת ניהל</div>
                </div>
                <a href="/premium" onClick={dismissSticky} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 999, border: "1px solid #C9964A", color: "#E8B94A", fontSize: 12, fontWeight: 800, textDecoration: "none", letterSpacing: ".02em" }}>
                  פנה ליצירת קשר ←
                </a>
              </div>
            </article>

            {/* PARTNERSHIP — שותפות אסטרטגית */}
            <article style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(201,150,74,0.16)", background: "#0F1623" }}>
              <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(155deg, #131C2E 0%, #0F1623 100%)" }}>
                  <div style={{ position: "absolute", inset: "20% 25%", background: "linear-gradient(135deg, rgba(232,185,74,0.10), transparent 60%)", border: "1px solid rgba(232,185,74,0.20)", borderRadius: 4 }} />
                  <div style={{ position: "absolute", top: "30%", right: "30%", width: 1, height: "40%", background: "linear-gradient(180deg, rgba(232,185,74,0.4), transparent)" }} />
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, fontWeight: 800, letterSpacing: ".18em", color: "#E8B94A", background: "rgba(8,12,20,0.75)", padding: "4px 10px", borderRadius: 3, border: "1px solid rgba(232,185,74,0.30)" }}>PARTNERSHIP</div>
                <div style={{ position: "absolute", bottom: 14, right: 14, fontSize: 10, fontWeight: 700, color: "#E8B94A", background: "rgba(232,185,74,0.12)", padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(232,185,74,0.35)" }}>← 2 מקומות פנויים</div>
              </div>
              <div style={{ padding: "20px 18px 22px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#EDE9E1", lineHeight: 1.15 }}>שותפות אסטרטגית</h3>
                  <div style={{ textAlign: "left", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#E8B94A", whiteSpace: "nowrap" }}>₪10k–30k</div>
                    <div style={{ fontSize: 10, color: "#9E9990", marginTop: 3 }}>/ חודש</div>
                  </div>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.5, color: "#EDE9E1", fontWeight: 500 }}>שותף אמיתי, לא ספק שירות.</p>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C9964A", marginBottom: 14, letterSpacing: ".02em" }}>◆ ROI x4 בשנה הראשונה (ממוצע)</div>
                <ul style={{ margin: "0 0 16px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {["שותף אסטרטגי קבוע", "נוכחות תוכן שוטפת", "פתיחת צנרת הזדמנויות"].map((d, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#9E9990", lineHeight: 1.5, position: "relative", paddingRight: 14 }}>
                      <span style={{ position: "absolute", right: 0, top: "0.45em", width: 4, height: 4, borderRadius: "50%", background: "#9E7C3A", display: "inline-block" }} />{d}
                    </li>
                  ))}
                </ul>
                <div style={{ padding: "10px 12px", marginBottom: 16, background: "rgba(0,0,0,0.25)", borderRight: "2px solid #9E7C3A", borderRadius: "0 6px 6px 0", fontSize: 12, fontStyle: "italic", color: "#EDE9E1", lineHeight: 1.5 }}>
                  ״זה כמו לקבל CMO במשרה חלקית — בלי overhead.״
                  <div style={{ fontStyle: "normal", fontSize: 10, color: "#9E7C3A", marginTop: 4 }}>— רן · רשת עסקאות</div>
                </div>
                <a href="/partnership" onClick={dismissSticky} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 999, border: "1px solid #C9964A", color: "#E8B94A", fontSize: 12, fontWeight: 800, textDecoration: "none", letterSpacing: ".02em" }}>
                  פנה ליצירת קשר ←
                </a>
              </div>
            </article>

            {/* ATELIER · BY INVITATION */}
            <article style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(201,150,74,0.16)", background: "#0F1623" }}>
              <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #0a0e18 0%, #131C2E 100%)" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 110%, rgba(232,185,74,0.20), transparent 55%)" }} />
                  <div style={{ position: "absolute", top: "45%", left: "50%", transform: "translate(-50%,-50%)", fontStyle: "italic", fontSize: 42, fontWeight: 400, color: "rgba(232,185,74,0.18)", letterSpacing: ".04em", userSelect: "none" }}>atelier</div>
                </div>
                <div style={{ position: "absolute", top: 14, right: 14, fontSize: 10, fontWeight: 800, letterSpacing: ".14em", color: "#E8B94A", background: "rgba(8,12,20,0.75)", padding: "4px 10px", borderRadius: 3, border: "1px solid rgba(232,185,74,0.30)" }}>ATELIER · BY INVITATION</div>
              </div>
              <div style={{ padding: "20px 18px 22px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 22, fontWeight: 500, fontStyle: "italic", color: "#EDE9E1", lineHeight: 1.15 }}>beegood atelier</h3>
                  <div style={{ textAlign: "left", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#E8B94A", whiteSpace: "nowrap" }}>בהתאמה אישית</div>
                  </div>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.5, color: "#EDE9E1", fontWeight: 500 }}>עבור משפיעניות שעוברות לשכבת מנהיגות תרבותית.</p>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#C9964A", marginBottom: 14, letterSpacing: ".02em" }}>◆ מותג נישה משכנת בלבד</div>
                <ul style={{ margin: "0 0 24px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                  {["ליווי 1-on-1 ארוך טווח", "הפקת תכנים בעולם שלך", "Personal branding מלא"].map((d, i) => (
                    <li key={i} style={{ fontSize: 12, color: "#9E9990", lineHeight: 1.5, position: "relative", paddingRight: 14 }}>
                      <span style={{ position: "absolute", right: 0, top: "0.45em", width: 4, height: 4, borderRadius: "50%", background: "#9E7C3A", display: "inline-block" }} />{d}
                    </li>
                  ))}
                </ul>
                <a href="/atelier" onClick={dismissSticky} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 999, border: "1px solid #C9964A", color: "#E8B94A", fontSize: 12, fontWeight: 800, textDecoration: "none", letterSpacing: ".02em" }}>
                  פנה ליצירת קשר ←
                </a>
              </div>
            </article>

          </div>

          {/* Closing */}
          <div style={{ marginTop: 28, padding: "24px 18px", textAlign: "center", borderTop: "1px solid rgba(201,150,74,0.16)" }}>
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "#9E9990" }}>כל פרויקט פרימיום מתחיל בשיחה.</p>
            <p style={{ margin: "0 0 18px", fontSize: 14, color: "#EDE9E1", fontWeight: 600 }}>השלב הראשון — בלי עלות, בלי התחייבות.</p>
            <a href="/strategy" onClick={dismissSticky} style={{ ...ctaGold, padding: "12px 28px", fontSize: 13, letterSpacing: ".02em" }}>
              קבע שיחת היכרות →
            </a>
          </div>
        </div>

        {/* ── Coming Soon rail ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.15)" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#9E9990", letterSpacing: "0.12em" }}>בקרוב</span>
            <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.15)" }} />
          </div>
          <div className="ps-soon-rail">
            {/* קורס דיגיטלי */}
            <div className="ps-soon-card">
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#C9964A", flexShrink: 0 }}>05</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE9E1" }}>קורס דיגיטלי</div>
                <div style={{ fontSize: 12, color: "#9E9990" }}>השיטה המלאה — ₪1,800</div>
              </div>
              <div style={{ flexShrink: 0, background: "linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)", color: "#1A1206", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 4 }}>🔜 בקרוב</div>
            </div>

            {/* הכוורת */}
            <div className="ps-soon-card">
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🐝</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE9E1" }}>הכוורת</div>
                <div style={{ fontSize: 12, color: "#9E9990" }}>קהילה חודשית — ₪29–97</div>
              </div>
              <div style={{ flexShrink: 0, background: "linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A)", color: "#1A1206", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 4 }}>🔜 בקרוב</div>
            </div>
          </div>
        </div>

        {/* ── Quiz strip ───────────────────────────────────────────────── */}
        <div style={{
          marginBottom: 80,
          background: "rgba(201,150,74,0.07)",
          border: "1px solid rgba(201,150,74,0.2)",
          borderRadius: 16,
          padding: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          textAlign: "right",
        }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#EDE9E1", marginBottom: 4 }}>לא בטוח מאיפה להתחיל?</div>
            <div style={{ fontSize: 13, color: "#9E9990" }}>שאלון של 3 דקות שמוצא בדיוק איפה אתה נמצא — והצעד הבא שמתאים לך</div>
          </div>
          <a href="/quiz" style={{ ...ctaGold, whiteSpace: "nowrap", fontSize: 14, padding: "11px 24px" }}>
            לשאלון ←
          </a>
        </div>

      </div>

      {/* ── Sticky bottom CTA ────────────────────────────────────────────── */}
      {showSticky && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          background: "rgba(15,21,35,0.97)",
          borderTop: "1px solid rgba(201,150,74,0.3)",
          backdropFilter: "blur(12px)",
          padding: "12px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <span style={{ fontSize: 14, color: "#EDE9E1", fontWeight: 600 }}>מוכן לצעד הבא?</span>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <a href={excludeTraining ? "/challenge" : "/training"} onClick={dismissSticky} style={ctaGold}>
              {excludeTraining ? "להצטרף לאתגר ←" : "התחל חינם ←"}
            </a>
            <button onClick={dismissSticky} style={{ background: "none", border: "none", color: "#9E9990", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>✕</button>
          </div>
        </div>
      )}

      <style>{`
        .ps-prem-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .ps-soon-rail {
          display: flex;
          gap: 12px;
        }
        .ps-soon-card {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          background: #0F1523;
          border-radius: 14px;
          border: 1px solid #1C2638;
          opacity: 0.65;
        }
        @media (max-width: 680px) {
          .ps-prem-grid { grid-template-columns: 1fr; }
          .ps-soon-rail { flex-direction: column; }
        }
      `}</style>
    </section>
  );
}
