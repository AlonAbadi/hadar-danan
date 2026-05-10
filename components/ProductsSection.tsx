"use client";

import { useState, useEffect, useRef } from "react";
import {
  WORKSHOP_DATES,
  getNextDate,
  formatHebrew,
} from "@/lib/products";

// ─── Types ──────────────────────────────────────────────────────────────────

type Stage = "הכל" | "מתחיל" | "מייצר תוכן" | "רוצה לגדול";

// ─── Stage config ────────────────────────────────────────────────────────────

const STAGES: Stage[] = ["הכל", "מתחיל", "מייצר תוכן", "רוצה לגדול"];

const HEADLINE: Record<Stage, { h: string; sub: string }> = {
  "הכל":         { h: "כל אחד נמצא במקום אחר",              sub: "כשהאות שלך ברור — הלקוחות הנכונים מגיעים מאליהם" },
  "מתחיל":       { h: "מתחיל מאפס? התחל כאן",               sub: "הדרכה חינמית שמסבירה בדיוק מאיפה להתחיל" },
  "מייצר תוכן":  { h: "כבר מייצר תוכן? הגיע הזמן לתוצאות", sub: "יש לך תוכן — נשתמש בו נכון כדי שיביא לקוחות" },
  "רוצה לגדול":  { h: "מוכן לצמיחה אמיתית?",               sub: "הצמיחה מגיעה עם בהירות. בנה אסטרטגיה מדויקת" },
};

// Indices of recommended products per stage (0=training,1=challenge,2=workshop,3=strategy)
const HIGHLIGHT: Record<Stage, number[]> = {
  "הכל":         [0, 1, 2, 3],
  "מתחיל":       [0],
  "מייצר תוכן":  [1],
  "רוצה לגדול":  [2, 3],
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductsSection({ excludeTraining = false }: { excludeTraining?: boolean }) {
  const [stage, setStage]           = useState<Stage>("הכל");
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

  const isHL = (i: number) => stage === "הכל" || effectiveHL.includes(i);

  // Fix 2 — CTA hierarchy: primary 44px filled, secondary 32px quiet outline
  const ctaGold: React.CSSProperties = {
    display: "inline-flex", alignItems: "center",
    padding: "0 22px", height: 44, borderRadius: 9999,
    fontSize: 12, fontWeight: 800, textDecoration: "none",
    background: "linear-gradient(135deg,#E8B94A,#9E7C3A)",
    color: "#1A1206", border: "none", whiteSpace: "nowrap" as const,
  };
  const ctaOutline: React.CSSProperties = {
    display: "inline-flex", alignItems: "center",
    padding: "0 14px", height: 32, borderRadius: 9999,
    fontSize: 11, fontWeight: 600, textDecoration: "none",
    background: "transparent", color: "#C9964A",
    border: "1px solid rgba(201,150,74,0.30)", whiteSpace: "nowrap" as const,
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
        {showNudge && stage === "הכל" && (
          <div style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#C9964A" }}>👋 חזרת! בחר שלב שמתאים לך לחוויה ממוקדת יותר</span>
            <button onClick={() => setShowNudge(false)} style={{ background: "none", border: "none", color: "#9E9990", cursor: "pointer", fontSize: 16, padding: 0 }}>✕</button>
          </div>
        )}

        {/* ── Core ladder panel ─────────────────────────────────────────── */}
        <div className="ps-ladder" style={{ background: "#0F1523", border: "1px solid #1C2638", borderRadius: 20, overflow: "hidden", marginBottom: 48 }}>
          {products.map((p, i) => {
            const highlighted = isHL(i);
            const dimmed      = stage !== "הכל" && !highlighted;
            const isExp       = expanded.has(i);
            const isLast      = i === products.length - 1;

            return (
              <div key={p.badge}>
                {/* Product row */}
                <div style={{ padding: "20px 24px", opacity: dimmed ? 0.4 : 1, transition: "opacity 0.25s", borderRight: highlighted && stage !== "הכל" ? "3px solid #C9964A" : "3px solid transparent" }}>

                  {/* Top line: badge · name · tag · price */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 8 }}>
                    {/* Fix 5 — 32×32 circle step number */}
                    <div className="ps-step" style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
                      background:  highlighted && stage !== "הכל" ? "linear-gradient(135deg,#E8B94A,#9E7C3A)" : "#131C2E",
                      border:      highlighted && stage !== "הכל" ? "none"                                     : "1px solid rgba(201,150,74,0.30)",
                      boxShadow:   highlighted && stage !== "הכל" ? "0 0 24px rgba(232,185,74,0.35)"          : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "monospace", fontSize: 12, fontWeight: 800,
                      color: highlighted && stage !== "הכל" ? "#1A1206" : "#C9964A",
                    }}>{p.badge}</div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#EDE9E1" }}>{p.name}</span>
                        {/* Fix 4 — outline badge, not filled */}
                        {p.tag && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "transparent", color: "#E8B94A", padding: "2px 8px", borderRadius: 4, border: "1px solid #9E7C3A", opacity: 0.85, letterSpacing: "0.06em" }}>
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

                  {/* Scarcity bar — Fix 1: ⚡→✦ gold glyph, 📅 dropped */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "rgba(201,150,74,0.05)", borderRadius: 6, marginBottom: 14 }}>
                    {p.scIcon === "⚡" && <span style={{ fontSize: 11, color: "#C9964A", lineHeight: 1 }}>✦</span>}
                    <span style={{ fontSize: 12, color: "#9E9990" }}>{p.scarcity}</span>
                  </div>

                  {/* CTAs + Fix 3: disclosure "פרטים" text link, not pill button */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {p.ctas.map((cta, ci) => (
                      <a key={ci} href={cta.href} onClick={dismissSticky} style={cta.primary ? ctaGold : ctaOutline}>
                        {cta.label}
                      </a>
                    ))}
                    <button
                      onClick={() => toggleExpand(i)}
                      style={{
                        marginRight: "auto", background: "none", border: "none",
                        borderBottom: "1px solid rgba(201,150,74,0.20)",
                        padding: "0 0 2px", cursor: "pointer", color: "#9E9990",
                        fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                        display: "flex", alignItems: "center", gap: 3,
                      }}
                    >
                      <span>{isExp ? "פחות" : "פרטים"}</span>
                      <span style={{ fontSize: 10, display: "inline-block", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
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

        {/* ── Premium section — V3 Editorial ────────────────────────────── */}
        <div style={{ marginBottom: 48, position: "relative" }}>

          {/* Ambient gradient */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5,
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,150,74,0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(201,150,74,0.06), transparent 60%)",
          }} />

          {/* Header */}
          <div style={{ padding: "56px 0 36px", textAlign: "center", position: "relative" }}>
            <div style={{ width: 32, height: 1, background: "#9E7C3A", margin: "0 auto 20px", opacity: 0.5 }} />
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".32em", color: "#9E7C3A", marginBottom: 18 }}>PREMIUM</div>
            <h2 style={{ margin: "0 auto 12px", maxWidth: 340, fontSize: 30, fontWeight: 300, lineHeight: 1.2, color: "#f6f1e6", letterSpacing: "-0.01em" }}>
              לעסקים שמוכנים<br/>
              <em style={{ fontStyle: "italic", fontWeight: 400, color: "#E8B94A" }}>לקפיצה הבאה.</em>
            </h2>
            <p style={{ margin: "0 auto", maxWidth: 300, fontSize: 13, color: "#8e887e", lineHeight: 1.65 }}>
              שלוש דרכים לעבוד איתנו לעומק.<br/>כל אחת מתחילה בשיחה.
            </p>
          </div>

          {/* Top border */}
          <div style={{ borderTop: "1px solid rgba(201,150,74,0.28)" }} />

          {/* Items */}
          {([
            {
              num: "I",
              kind: "PRODUCTION DAY",
              pull: "יום צילום אחד.\nתוכן שבאמת עובד.",
              body: "צלם ובמאי לצדך ליום שלם — אצלך או אצלנו. יוצאים עם 14 סרטונים ערוכים, מוכנים לפרסום, שמייצרים פניות ולקוחות.",
              meta: [
                { k: "משך",           v: "יום אחד"             },
                { k: "תוצר",          v: "14 סרטונים ערוכים"   },
                { k: "ליווי אחרי",    v: "3 חודשים"            },
              ],
              price: "₪14,000", priceNote: "+ מע״מ",
              quote: "14 סרטונים שיושבים לי וממשיכים להביא פניות. הכי טובה ההשקעה שעשיתי.",
              quoteBy: "אמיר ש. · יועץ פיננסי",
              href: "/premium",
            },
            {
              num: "II",
              kind: "STRATEGIC PARTNERSHIP",
              pull: "שותפה לצדך —\nלא עוד ספקית.",
              body: "שותפות שיווקית לטווח ארוך — אסטרטגיית תוכן, כתיבה שיווקית, ניתוח חודשי וליווי שוטף. לעסקים שרוצים בניית נוכחות אמיתית.",
              meta: [
                { k: "מסגרת",       v: "חודשי, מתמשך"         },
                { k: "היקף",        v: "עד 30 שעות / חודש"    },
                { k: "מקומות",      v: "3 בלבד"               },
              ],
              price: "₪10k–30k", priceNote: "/ חודש",
              quote: "הדר לא רק כותבת לנו תוכן — היא חושבת איתנו על העסק. זה שינה את כל הדרך שבה אנחנו מתקשרים.",
              quoteBy: "אבי ל. · מנכ״ל חברת ייעוץ",
              href: "/partnership",
            },
            {
              num: "III",
              kind: "BY INVITATION",
              pull: "ממשפיענית\nלמנהיגה תרבותית.",
              body: "עובדים עם מספר מצומצם של משפיעניות נבחרות — אסטרטגיה, נרטיב ופלטפורמה דיגיטלית מלאה. מיועד להזמנה בלבד.",
              meta: [
                { k: "מותג",      v: "אישי, בנייה מלאה"       },
                { k: "תוצרים",    v: "פלטפורמה + תוכן"        },
                { k: "ליווי",     v: "מתמשך לאורך זמן"        },
              ],
              price: "בהתאמה אישית", priceNote: "",
              quote: "", quoteBy: "",
              href: "/atelier",
            },
          ] as const).map((item, i, arr) => (
            <article key={item.num} style={{
              padding: "28px 24px 32px",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(201,150,74,0.14)" : "none",
              position: "relative",
            }}>
              {/* Roman numeral + kind */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 18 }}>
                <div aria-hidden="true" style={{ fontSize: 34, fontWeight: 400, fontStyle: "italic", color: "#9E7C3A", lineHeight: 1, minWidth: 24 }}>
                  {item.num}
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ height: 1, background: "rgba(201,150,74,0.14)", marginBottom: 8 }} />
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".24em", color: "#C9964A" }}>{item.kind}</div>
                </div>
              </div>

              {/* Pull quote */}
              <div style={{
                margin: "0 0 18px",
                fontSize: 28, fontWeight: 300, fontStyle: "italic",
                color: "#f6f1e6", lineHeight: 1.18, letterSpacing: "-0.01em",
                whiteSpace: "pre-line",
              }}>{item.pull}</div>

              {/* Body */}
              <p style={{ margin: "0 0 24px", fontSize: 14, lineHeight: 1.7, color: "#8e887e", maxWidth: 340 }}>
                {item.body}
              </p>

              {/* Meta table */}
              <div style={{ marginBottom: item.quote ? 22 : 26, borderTop: "1px solid rgba(201,150,74,0.14)" }}>
                {item.meta.map((m, mi) => (
                  <div key={mi} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    padding: "11px 2px", borderBottom: "1px solid rgba(201,150,74,0.14)", fontSize: 12,
                  }}>
                    <span style={{ color: "#8e887e", letterSpacing: ".02em" }}>{m.k}</span>
                    <span style={{ color: "#f6f1e6", fontWeight: 500 }}>{m.v}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 2px 0" }}>
                  <span style={{ fontSize: 12, color: "#8e887e", letterSpacing: ".02em" }}>השקעה</span>
                  <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
                    {item.priceNote && <span style={{ fontSize: 11, color: "#8e887e", order: 2 }}>{item.priceNote}</span>}
                    <span style={{ fontSize: 20, fontWeight: 600, color: "#E8B94A", letterSpacing: ".01em", order: 1 }}>{item.price}</span>
                  </span>
                </div>
              </div>

              {/* Quote */}
              {item.quote && (
                <div style={{ marginBottom: 24, paddingRight: 14, borderRight: "1px solid #9E7C3A" }}>
                  <div style={{ fontStyle: "italic", fontSize: 15, color: "#f6f1e6", lineHeight: 1.5, marginBottom: 6 }}>
                    ״{item.quote}״
                  </div>
                  <div style={{ fontSize: 11, color: "#8e887e", letterSpacing: ".04em" }}>— {item.quoteBy}</div>
                </div>
              )}

              {/* CTA — typographic link */}
              <a href={item.href} onClick={dismissSticky} aria-label={`פנה ליצירת קשר — ${item.kind}`} style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                fontSize: 12, fontWeight: 600, letterSpacing: ".06em",
                color: "#E8B94A", textDecoration: "none",
                borderBottom: "1px solid #9E7C3A", paddingBottom: 4,
              }}>
                <span>פנה ליצירת קשר</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>←</span>
              </a>
            </article>
          ))}

          {/* Bottom border */}
          <div style={{ borderTop: "1px solid rgba(201,150,74,0.28)" }} />

          {/* Closing */}
          <div style={{ padding: "40px 24px 56px", textAlign: "center", position: "relative" }}>
            <div style={{ width: 32, height: 1, background: "#9E7C3A", margin: "0 auto 24px", opacity: 0.5 }} />
            <p style={{ margin: "0 auto 8px", maxWidth: 280, fontStyle: "italic", fontSize: 18, fontWeight: 400, color: "#f6f1e6", lineHeight: 1.4 }}>
              כל פרויקט פרימיום<br/>מתחיל בשיחה.
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 12, color: "#8e887e", lineHeight: 1.6 }}>בלי עלות. בלי התחייבות.</p>
            <a href="/strategy" onClick={dismissSticky} style={{
              display: "inline-block", padding: "14px 32px",
              border: "1px solid #C9964A", color: "#E8B94A",
              fontWeight: 600, fontSize: 12, letterSpacing: ".14em",
              textDecoration: "none", textTransform: "uppercase",
            }}>קבע שיחת היכרות</a>
            <div style={{ marginTop: 24, fontSize: 11, color: "#8e887e", letterSpacing: ".04em" }}>
              או: <span style={{ color: "#C9964A" }}>premium@beegood.co.il</span>
            </div>
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
        /* Fix 5 — vertical connector line behind step circles */
        .ps-ladder { position: relative; }
        .ps-ladder::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          right: 40px;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(201,150,74,0.16) 8%, rgba(201,150,74,0.16) 92%, transparent);
          pointer-events: none;
        }
        .ps-step { position: relative; z-index: 1; }
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
