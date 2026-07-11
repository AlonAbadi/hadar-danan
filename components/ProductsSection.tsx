"use client";

import { WORKSHOP_DATES, getNextDate, formatHebrew } from "@/lib/products";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProductCard {
  name: string;
  price: string;
  priceOriginal?: string;
  priceNote?: string;
  description: string;
  href: string;
  ctaLabel: string;
  badge?: string;
  variant: "primary" | "outline";
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProductsSection({ excludeTraining = false }: { excludeTraining?: boolean }) {
  const nextWorkshop = getNextDate(WORKSHOP_DATES);
  const workshopScarcity = nextWorkshop ? formatHebrew(nextWorkshop) : "מועד הבא בקרוב";

  const LANE_1: ProductCard[] = [
    {
      name:        "הדרכה חינמית",
      price:       "חינם",
      description: "להבין למה השיווק שלכם לא עובד",
      href:        "/training",
      ctaLabel:    "צפה בהדרכה ←",
      variant:     "primary",
    },
    {
      name:          "אתגר 7 ימים",
      price:         "₪197",
      priceOriginal: "₪297",
      description:   "7 סרטונים שמשנים את הדרך",
      href:          "/challenge",
      ctaLabel:      "להצטרף לאתגר ←",
      variant:       "outline",
    },
    {
      name:          "כוורת האות",
      price:         "₪590",
      priceOriginal: "₪880",
      description:   "חמישה שלבים שלוקחים את האות שלך מגילוי לשידור בעולם",
      href:        "/signal-hive",
      ctaLabel:    "אני מצטרף לכוורת האות ←",
      variant:     "outline",
    },
    {
      name:          "סדנה יום אחד",
      price:         "₪1,080",
      priceOriginal: "₪1,800",
      priceNote:     workshopScarcity,
      description:   "אסטרטגיה ברורה ביום אחד",
      href:          "/workshop",
      ctaLabel:      "אני רוצה להיות שם ←",
      variant:       "outline",
    },
  ];

  const LANE_2: ProductCard[] = [
    {
      name:        "פגישת אסטרטגיה",
      price:       "₪4,000",
      description: "90 דקות שבונות תכנית ל-90 יום",
      href:        "/strategy",
      ctaLabel:    "קבע פגישה ←",
      badge:       "מומלץ להתחלה",
      variant:     "primary",
    },
    {
      name:        "יום צילום",
      price:       "₪14,000",
      description: "14 סרטונים ערוכים, מוכנים לפרסום",
      href:        "/premium",
      ctaLabel:    "פנה לתיאום ←",
      variant:     "outline",
    },
    {
      name:        "שותפות אסטרטגית",
      price:       "₪10k–30k",
      priceNote:   "3 מקומות",
      description: "שותפה לטווח ארוך, לא עוד ספקית",
      href:        "/partnership",
      ctaLabel:    "פנה לתיאום ←",
      variant:     "outline",
    },
    {
      name:        "אטלייה ליוצרי תוכן",
      price:       "בהתאמה",
      description: "ממשפיענית למנהיגה תרבותית",
      href:        "/atelier",
      ctaLabel:    "פנה לתיאום ←",
      variant:     "outline",
    },
  ];

  const lane1 = excludeTraining ? LANE_1.slice(1) : LANE_1;

  return (
    <section id="products" style={{ background: "#080C14", position: "relative" }}>
      <div style={{ color: "#EDE9E1", maxWidth: 760, margin: "0 auto", padding: "80px 24px" }}>

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(201,150,74,0.10)",
            border: "1px solid rgba(201,150,74,0.30)",
            borderRadius: 9999, padding: "5px 16px", marginBottom: 22,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#E8B94A" }} />
            <span style={{ color: "#E8B94A", fontSize: 11, letterSpacing: ".14em", fontWeight: 700 }}>
              המוצרים
            </span>
          </div>
          <h2 style={{
            fontSize: "clamp(1.9rem,4.5vw,2.6rem)", fontWeight: 800,
            lineHeight: 1.15, margin: "0 0 12px", color: "#EDE9E1",
          }}>
            בחרו את הדרך שלכם
          </h2>
          <p style={{
            color: "#AAB0BD", fontSize: 15, lineHeight: 1.6,
            maxWidth: 440, margin: "0 auto",
          }}>
            שתי דרכים להתקדם — לבד, בקצב שלכם, או יחד איתנו לעומק.
          </p>
        </div>

        {/* Quiz nudge */}
        <a
          href="/quiz"
          style={{
            display: "flex", alignItems: "center", gap: 14,
            marginBottom: 56,
            padding: "14px 16px",
            borderRadius: 14,
            background: "linear-gradient(145deg, rgba(20,24,32,0.85), rgba(14,18,28,0.85))",
            border: "1px solid rgba(232,185,74,0.28)",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "rgba(232,185,74,0.10)",
            border: "1px solid rgba(232,185,74,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>
            🧭
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#EDE9E1", marginBottom: 2 }}>
              לא בטוחים מה מתאים?
            </div>
            <div style={{ fontSize: 13, color: "#AAB0BD", lineHeight: 1.5 }}>
              ענו על הקוויז — נתאים לכם מוצר ב-2 דקות
            </div>
          </div>
          <span style={{
            flexShrink: 0,
            color: "#E8B94A", fontSize: 13, fontWeight: 700,
            whiteSpace: "nowrap",
          }}>
            לקוויז ←
          </span>
        </a>

        {/* Lane 1 — התחילו לבד */}
        <LaneHeader
          eyebrow="משפחה 1"
          title="התחילו לבד"
          sub="דיגיטלי · גישה מיידית · בקצב שלכם"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 56 }}>
          {lane1.map((p) => <ProductCardItem key={p.name} product={p} />)}
        </div>

        {/* Lane 2 — צמחו איתנו */}
        <LaneHeader
          eyebrow="משפחה 2"
          title="צמחו איתנו"
          sub="אישי · בליווי הדר והצוות · כל אחד מתחיל בשיחה"
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {LANE_2.map((p) => <ProductCardItem key={p.name} product={p} />)}
        </div>
      </div>
    </section>
  );
}

// ─── LaneHeader ─────────────────────────────────────────────────────────────

function LaneHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(201,150,74,0.20)" }} />
        <span style={{
          fontSize: 11, fontWeight: 700, color: "#E8B94A",
          letterSpacing: ".24em",
        }}>
          {eyebrow}
        </span>
      </div>
      <h3 style={{
        fontSize: 28, fontWeight: 800, color: "#EDE9E1",
        margin: "0 0 6px", lineHeight: 1.2,
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: "#AAB0BD", margin: 0, lineHeight: 1.6 }}>
        {sub}
      </p>
    </div>
  );
}

// ─── ProductCardItem ────────────────────────────────────────────────────────

function ProductCardItem({ product }: { product: ProductCard }) {
  const cardStyle: React.CSSProperties = {
    position: "relative",
    background: "linear-gradient(180deg, #131A29, #0F1523)",
    border: "1px solid #1F2A40",
    borderRadius: 14,
    padding: "16px 16px 14px",
  };

  const ctaPrimary: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", minHeight: 44, padding: "8px 16px",
    background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
    color: "#2a1d05",
    fontWeight: 800, fontSize: 14, lineHeight: 1.2,
    borderRadius: 999,
    textDecoration: "none",
    boxShadow: "0 1px 0 rgba(255, 255, 255, 0.35) inset, 0 4px 10px -4px rgba(0, 0, 0, 0.45)",
  };

  const ctaOutline: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", minHeight: 44, padding: "8px 16px",
    background: "transparent",
    color: "#E8B94A",
    fontWeight: 700, fontSize: 13, lineHeight: 1.2,
    borderRadius: 999,
    textDecoration: "none",
    border: "1px solid rgba(232,185,74,0.45)",
  };

  const ctaStyle =
    product.variant === "primary" ? ctaPrimary :
    ctaOutline;

  return (
    <div style={cardStyle}>
      {product.badge && (
        <div style={{
          position: "absolute",
          top: -11, right: 18,
          background: "linear-gradient(180deg, #f4d27a 0%, #e8b942 52%, #d59b1f 100%)",
          color: "#2a1d05",
          fontSize: 10, fontWeight: 800,
          padding: "4px 12px", borderRadius: 999,
          letterSpacing: ".02em",
          boxShadow: "0 4px 10px rgba(214,155,31,0.32)",
        }}>
          {product.badge}
        </div>
      )}

      {/* Title row + price */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", gap: 14, marginBottom: 6,
      }}>
        <div style={{ minWidth: 0 }}>
          <h4 style={{
            fontSize: 19, fontWeight: 800, color: "#EDE9E1",
            margin: 0, lineHeight: 1.25,
          }}>
            {product.name}
          </h4>
        </div>
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "flex-end", gap: 0, flexShrink: 0, textAlign: "end",
        }}>
          {product.priceOriginal && (
            <span style={{
              fontSize: 12, color: "#8e887e",
              textDecoration: "line-through", lineHeight: 1.2,
            }}>
              {product.priceOriginal}
            </span>
          )}
          <span style={{
            fontSize: 17, fontWeight: 800,
            color: product.price === "חינם" ? "#7FD49B" : "#E8B94A",
            whiteSpace: "nowrap", lineHeight: 1.2,
          }}>
            {product.price}
          </span>
          {product.priceNote && (
            <span style={{ fontSize: 11, color: "#AAB0BD", lineHeight: 1.4, marginTop: 2 }}>
              {product.priceNote}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p style={{
        fontSize: 13, color: "#AAB0BD",
        margin: "0 0 12px", lineHeight: 1.5,
      }}>
        {product.description}
      </p>

      {/* CTA */}
      <a href={product.href} style={ctaStyle}>
        {product.ctaLabel}
      </a>
    </div>
  );
}
