// The bee-on-a-timeline waiting element — the flying beegood logo riding a
// gold progress bar over rotating curated bee facts. Extracted from the
// signal funnel's extraction wait so every long moment in the journey
// (kriah reading, entering the kaveret) feels like the same brand breath.
"use client";

import { useEffect, useState } from "react";

const C = {
  card: "#141820",
  cardSoft: "#1D2430",
  line: "#2C323E",
  gold: "#E8B94A",
  goldMid: "#C9964A",
  goldDeep: "#9E7C3A",
  fg: "#EDE9E1",
  muted: "#9E9990",
};

// Hand-checked Hebrew facts (never AI-generated at runtime — clean text).
const BEE_FACTS = [
  "דבורת הדבש מבקרת בין 50 ל-100 פרחים בטיסה אחת לאיסוף צוף.",
  "כדי לייצר כף דבש אחת, דבורים טסות יחד מרחק ששווה לפעמיים הקפת כדור הארץ.",
  "דבורים מתקשרות זו עם זו דרך ריקוד מיוחד שמראה לחברות בכוורת את הכיוון והמרחק לפרחים.",
  "מלכת הכוורת יכולה להטיל עד 2,000 ביצים ביום, יותר ממשקל גופה.",
  "דבורים זוכרות פרצופים אנושיים ומסוגלות לזהות את אותו אדם שוב לאחר ימים.",
  "כוורת בריאה מכילה בין 50,000 ל-80,000 דבורים, כמעט כולן נקבות.",
  "דבורים ישנות כחמש עד שמונה שעות ביממה, לפעמים בתוך פרחים.",
  "כנפי הדבורה מרפרפות כ-200 פעמים בשנייה, וזה מה שיוצר את הזמזום המוכר.",
  "דבורים רואות צבעים שאנחנו לא רואים כלל, כולל אור אולטרה-סגול.",
  "הדבש כמעט אינו מתקלקל. נמצא דבש בן 3,000 שנה בקברי פרעונים שעדיין היה אכיל.",
  "דבורת פועלת אחת מייצרת בכל חייה רק כ-1/12 כפית דבש.",
  "הדבורים שומרות על חום של כ-35 מעלות בכוורת גם בקור עז, באמצעות רעידות שרירים.",
  "לדבורה חמש עיניים, שלוש קטנות בראש ושתיים גדולות בצדדים.",
  "הדבורים מאביקות כשליש מהמזון שאנחנו אוכלים מדי יום.",
];

export function BeeWait({
  title,
  showFacts = true,
  durationMs = 22_000,
  dir = "rtl",
}: {
  title: string;
  showFacts?: boolean;
  durationMs?: number;
  /** "ltr" for the English funnel — the bee facts stay Hebrew, so English
   *  callers should also pass showFacts={false}. */
  dir?: "rtl" | "ltr";
}) {
  const [progress, setProgress] = useState(4);
  const [factIdx, setFactIdx] = useState(() => Math.floor(Math.random() * BEE_FACTS.length));

  // Self-driven progress: eases toward 96% over durationMs (never claims done).
  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      const t = Math.min((Date.now() - started) / durationMs, 1);
      setProgress(4 + Math.round(92 * (1 - Math.pow(1 - t, 2))));
    }, 400);
    return () => clearInterval(id);
  }, [durationMs]);

  useEffect(() => {
    const id = setInterval(() => setFactIdx((i) => (i + 1) % BEE_FACTS.length), 7000);
    return () => clearInterval(id);
  }, []);

  const clamped = Math.min(progress, 96);

  return (
    <div
      dir={dir}
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        padding: "40px 28px 36px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        fontFamily: "inherit",
      }}
    >
      {showFacts ? (
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            background: C.cardSoft,
            borderRadius: 12,
            padding: "14px 18px",
            border: `1px solid ${C.line}`,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: C.goldMid, letterSpacing: ".14em", marginBottom: 6 }}>
            ידעת על הדבורים?
          </div>
          <div key={factIdx} style={{ fontSize: 15, color: C.fg, lineHeight: 1.65, animation: "bw-fade 4s ease infinite" }}>
            {BEE_FACTS[factIdx]}
          </div>
        </div>
      ) : null}

      <div style={{ fontSize: 19, fontWeight: 800, color: C.goldMid, lineHeight: 1.3 }}>{title}</div>

      <div style={{ width: "100%", maxWidth: 360, position: "relative", paddingTop: 48 }}>
        <div style={{ position: "absolute", top: 0, insetInlineStart: `calc(${clamped}% - 22px)`, transition: "inset-inline-start 0.6s ease" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/beegood_logo.png"
            alt=""
            width={44}
            height={44}
            style={{ objectFit: "contain", display: "block", animation: "bw-fly 1.2s ease-in-out infinite" }}
          />
        </div>
        <div style={{ width: "100%", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 20 }}>
          <div
            style={{
              height: 6,
              borderRadius: 20,
              background: `linear-gradient(90deg, ${C.goldDeep}, ${C.goldMid}, ${C.gold})`,
              width: `${progress}%`,
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 12, color: C.muted }}>0%</span>
          <span style={{ fontSize: 13, color: C.goldMid, fontWeight: 700 }}>{Math.round(progress)}%</span>
          <span style={{ fontSize: 12, color: C.muted }}>100%</span>
        </div>
      </div>

      <style>{`
        @keyframes bw-fly { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes bw-fade { 0% { opacity: 0; } 12% { opacity: 1; } 88% { opacity: 1; } 100% { opacity: 0.2; } }
      `}</style>
    </div>
  );
}
