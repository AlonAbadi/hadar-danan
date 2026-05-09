"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
      scarcity: "36 מקומות בשנה בלבד",
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

  const overlay = "linear-gradient(to top, rgba(10,14,24,1) 0%, rgba(10,14,24,0.9) 18%, rgba(10,14,24,0.55) 35%, rgba(10,14,24,0.15) 55%, transparent 70%)";
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
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.25)" }} />
            <span style={{ fontSize: 22, letterSpacing: "0.06em", fontWeight: 800, color: "#EDE9E1" }}>פרימיום</span>
            <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.25)" }} />
          </div>

          <div className="ps-prem-grid">
            {/* יום צילום פרמיום */}
            <a href="/premium" onClick={dismissSticky} className="ps-prem-card">
              <Image src="/shooting.jpg" fill alt="" sizes="380px" style={{ objectFit: "cover", objectPosition: "15% 5%" }} />
              <div style={{ position: "absolute", inset: 0, background: overlay }} />
              <div style={{ position: "absolute", top: 14, left: 14, fontSize: 11, fontWeight: 700, color: "#C9964A", background: "rgba(201,150,74,0.15)", border: "1px solid rgba(201,150,74,0.3)", borderRadius: 6, padding: "4px 10px", letterSpacing: "0.08em", zIndex: 2 }}>PREMIUM</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9E9990", marginBottom: 6 }}>
                  <span style={{ color: "#C9964A", fontWeight: 700 }}>→</span>
                  <span>אסטרטגיה + הפקה + עריכה — 14 סרטונים</span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, color: "#C9964A", marginBottom: 2 }}>₪14,000 <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(237,233,225,0.5)" }}>+ מע״מ</span></div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#EDE9E1", marginBottom: 12 }}>יום צילום פרמיום</div>
                <span style={{ display: "inline-block", padding: "10px 24px", borderRadius: 9999, fontSize: 13, fontWeight: 700, border: "1px solid rgba(201,150,74,0.55)", color: "#EDE9E1" }}>לפרטים ←</span>
              </div>
            </a>

            {/* שותפות אסטרטגית */}
            <a href="/partnership" onClick={dismissSticky} className="ps-prem-card">
              <Image src="/partnership.jpg" fill alt="" sizes="380px" style={{ objectFit: "cover", objectPosition: "75% 5%" }} />
              <div style={{ position: "absolute", inset: 0, background: overlay }} />
              <div style={{ position: "absolute", top: 14, left: 14, fontSize: 11, fontWeight: 700, color: "#C9964A", background: "rgba(201,150,74,0.15)", border: "1px solid rgba(201,150,74,0.3)", borderRadius: 6, padding: "4px 10px", letterSpacing: "0.08em", zIndex: 2 }}>PREMIUM</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9E9990", marginBottom: 6 }}>
                  <span style={{ color: "#C9964A", fontWeight: 700 }}>→</span>
                  <span>לעסקים וחברות שרוצות שותף אסטרטגי לדרך</span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, color: "#C9964A", marginBottom: 2 }}>₪10k–30k <span style={{ fontSize: 12, fontWeight: 400, color: "rgba(237,233,225,0.5)" }}>/ חודש</span></div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#EDE9E1", marginBottom: 12 }}>שותפות אסטרטגית</div>
                <span style={{ display: "inline-block", padding: "10px 24px", borderRadius: 9999, fontSize: 13, fontWeight: 700, border: "1px solid rgba(201,150,74,0.55)", color: "#EDE9E1" }}>בדוק התאמה ←</span>
              </div>
            </a>

            {/* beegood atelier */}
            <a href="/atelier" onClick={dismissSticky} className="ps-prem-card">
              <Image src="/atelier-velvet-800x1120.png" fill alt="" sizes="380px" style={{ objectFit: "cover", objectPosition: "center top" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,14,24,0.95) 0%, rgba(10,14,24,0.5) 50%, rgba(10,14,24,0.2) 100%)" }} />
              <div style={{ position: "absolute", top: 14, left: 14, fontSize: 11, fontWeight: 700, color: "#C9964A", background: "rgba(201,150,74,0.15)", border: "1px solid rgba(201,150,74,0.3)", borderRadius: 6, padding: "4px 10px", letterSpacing: "0.08em", zIndex: 2 }}>ATELIER</div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px 20px 20px", zIndex: 2, textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#9E9990", marginBottom: 6 }}>
                  <span style={{ color: "#C9964A", fontWeight: 700 }}>→</span>
                  <span>למשפיעניות שרוצות להפוך למנהיגות תרבותיות</span>
                </div>
                <div style={{ fontSize: 19, fontWeight: 800, color: "#C9964A", marginBottom: 2 }}>בהתאמה אישית</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#EDE9E1", marginBottom: 12 }}>beegood atelier</div>
                <span style={{ display: "inline-block", padding: "10px 24px", borderRadius: 9999, fontSize: 13, fontWeight: 700, border: "1px solid rgba(201,150,74,0.45)", color: "#EDE9E1" }}>לבדיקת התאמה ←</span>
              </div>
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
        .ps-prem-card {
          display: block;
          position: relative;
          height: 380px;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid #1C2638;
          background: #0F1828;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s;
        }
        .ps-prem-card:hover {
          border-color: rgba(201,150,74,0.4);
          transform: translateY(-3px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
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
