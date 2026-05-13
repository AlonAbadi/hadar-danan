import type { Metadata } from "next";
import { SadnaCheckout } from "./SadnaCheckout";

export const metadata: Metadata = {
  title: "סדנת פרימיום | הדר דנן — 20 במאי",
  description: "סדנה קטנה ואינטימית — תרגול פרקטי של הגדרה עצמית, העמקת המסר, והטמעה נכונה בוידאו. 20 במאי, 17:00–20:00, רחוב החילזון 5 רמת גן. עד 20 משתתפים.",
  alternates: { canonical: "/sadna" },
};

export default function SadnaPage() {
  return (
    <main dir="rtl" className="font-assistant" style={{ background: "#080C14", color: "#EDE9E1", minHeight: "100vh" }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "72px 24px 56px", textAlign: "center" }}>

        {/* Eyebrow */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,150,74,0.10)", border: "1px solid rgba(201,150,74,0.28)", borderRadius: 9999, padding: "5px 18px", marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9964A", display: "inline-block" }} />
          <span style={{ color: "#C9964A", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em" }}>סדנת פרימיום · אירוע חד-פעמי</span>
        </div>

        {/* Date strip */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36, flexWrap: "wrap" }}>
          {[
            { val: "20.5",    label: "תאריך"  },
            { val: "17–20",   label: "שעות"   },
            { val: "20",      label: "מקומות" },
            { val: "₪500",    label: "השקעה"  },
          ].map((item, i, arr) => (
            <div key={i} style={{
              padding: "14px 24px",
              borderRight: i < arr.length - 1 ? "1px solid rgba(201,150,74,0.18)" : "none",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#E8B94A", lineHeight: 1 }}>{item.val}</div>
              <div style={{ fontSize: 11, color: "#9E9990", marginTop: 4, letterSpacing: "0.06em" }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.01em" }}>
          לדעת מי אתם —<br />
          <span style={{ background: "linear-gradient(135deg,#E8B94A,#9E7C3A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ולהגיד את זה נכון.
          </span>
        </h1>

        <p style={{ fontSize: "1.05rem", color: "#9E9990", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 40px" }}>
          שלוש שעות של תרגול פרקטי — להטמיע את ההגדרה העצמית שלכם, לחדד את המסר, ולדעת בדיוק איך להטמיע את זה נכון בוידאו.
        </p>

        {/* Checkout form */}
        <div style={{ maxWidth: 380, margin: "0 auto" }}>
          <SadnaCheckout />
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: "#9E9990" }}>
          נותרו מקומות ספורים
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 640, margin: "0 auto", borderTop: "1px solid rgba(201,150,74,0.14)" }} />

      {/* ── What you'll do ────────────────────────────────────────── */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".28em", color: "#9E7C3A", marginBottom: 32, textAlign: "center" }}>מה עושים בשלוש השעות</div>

        {[
          {
            num: "01",
            title: "הגדרה עצמית",
            body: "מזהים בדיוק מה שמבדיל אתכם — ומתרגלים לומר את זה בצורה שנוגעת, ולא מסבירה.",
          },
          {
            num: "02",
            title: "העמקת המסר",
            body: "לוקחים את מה שאתם יודעים להגיד — ומחדדים אותו כדי שיגע בדיוק למי שצריך לשמוע.",
          },
          {
            num: "03",
            title: "הטמעה נכונה בוידאו",
            body: "יוצאים עם ניסוח שעובד ויודעים בדיוק איך להעביר אותו מול המצלמה — לא תיאוריה שצריך ליישם אחר כך בבית.",
          },
        ].map((item) => (
          <div key={item.num} style={{ display: "flex", gap: 20, marginBottom: 32 }}>
            <div style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: "50%",
              border: "1px solid rgba(201,150,74,0.30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "monospace", fontSize: 11, fontWeight: 800, color: "#C9964A",
            }}>{item.num}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, color: "#EDE9E1" }}>{item.title}</div>
              <div style={{ fontSize: 14, color: "#9E9990", lineHeight: 1.65 }}>{item.body}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 640, margin: "0 auto", borderTop: "1px solid rgba(201,150,74,0.14)" }} />

      {/* ── Details ──────────────────────────────────────────────── */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".28em", color: "#9E7C3A", marginBottom: 20, textAlign: "center" }}>פרטי האירוע</div>

        {[
          { k: "תאריך",       v: "יום שלישי, 20 במאי 2025"          },
          { k: "שעות",        v: "17:00 – 20:00"                    },
          { k: "מיקום",       v: "רחוב החילזון 5, רמת גן"           },
          { k: "גודל קבוצה",  v: "עד 20 משתתפים בלבד"              },
          { k: "השקעה",       v: "₪500 לאדם"                        },
        ].map((row) => (
          <div key={row.k} style={{
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
            padding: "13px 2px", borderBottom: "1px solid rgba(201,150,74,0.10)", fontSize: 14,
          }}>
            <span style={{ color: "#9E9990" }}>{row.k}</span>
            <span style={{ fontWeight: 600, color: "#EDE9E1" }}>{row.v}</span>
          </div>
        ))}
      </section>

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 640, margin: "0 auto", borderTop: "1px solid rgba(201,150,74,0.14)" }} />

      {/* ── For whom ─────────────────────────────────────────────── */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".28em", color: "#9E7C3A", marginBottom: 20, textAlign: "center" }}>למי זה מתאים</div>
        {[
          "בעלי עסקים שיודעים מה הם עושים — אבל מתקשים לתאר את זה בצורה שנוגעת",
          "מי שכבר עשה עבודה על המסר שלו ורוצה לחדד ולתרגל אותו בקבוצה קטנה",
          "מי שרוצה לדעת בדיוק איך להטמיע את המסר שלו בוידאו ולא רק בכתב",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
            <span style={{ color: "#C9964A", fontWeight: 700, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 14, color: "rgba(237,233,225,0.85)", lineHeight: 1.6 }}>{item}</span>
          </div>
        ))}
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ background: "rgba(201,150,74,0.06)", border: "1px solid rgba(201,150,74,0.20)", borderRadius: 20, padding: "40px 32px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".28em", color: "#9E7C3A", marginBottom: 16, textAlign: "center" }}>20 במאי · 17:00–20:00 · רמת גן</div>
          <p style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, marginBottom: 8, textAlign: "center" }}>
            20 מקומות בלבד.
          </p>
          <p style={{ fontSize: 14, color: "#9E9990", marginBottom: 28, textAlign: "center" }}>
            הסדנה לא תחזור על עצמה בפורמט הזה.
          </p>
          <SadnaCheckout />
        </div>
      </section>

    </main>
  );
}
