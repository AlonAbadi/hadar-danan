"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type Category = "הכל" | "וידאו" | "פודקאסטים" | "טיפים" | "סיפורים";

const CATEGORIES: Category[] = ["הכל", "וידאו", "פודקאסטים", "טיפים", "סיפורים"];

const SOURCE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  V: { label: "V", color: "#fff",    bg: "#E52D27" },
  Y: { label: "Y", color: "#fff",    bg: "#1DB954" },
  S: { label: "S", color: "#fff",    bg: "#00B4D8" },
  A: { label: "A", color: "#080C14", bg: "#C9964A" },
};

interface Item {
  id: string;
  title: string;
  duration: string;
  source: "V" | "Y" | "S" | "A";
  image: string;
  category: Exclude<Category, "הכל">;
  progress?: number;
}

const FEATURED = {
  title: "איך בונים אסטרטגיה שיווקית שעובדת ב-2024",
  subtitle: "פגישת אסטרטגיה מלאה — מהאבחון ועד לתוכנית הפעולה",
  duration: "52 דקות",
  source: "A" as const,
  image: "https://picsum.photos/seed/binge-featured/1200/750",
  tags: ["וידאו", "אסטרטגיה"],
};

const CONTINUE_WATCHING: Item[] = [
  { id: "cw1", title: "5 הטעויות הכי נפוצות בשיווק ברשתות", duration: "18 דק׳", source: "V", image: "https://picsum.photos/seed/binge-cw1/400/600", category: "וידאו",    progress: 60 },
  { id: "cw2", title: "איך לכתוב קאפשן שמוכר",               duration: "11 דק׳", source: "A", image: "https://picsum.photos/seed/binge-cw2/400/600", category: "טיפים",    progress: 35 },
  { id: "cw3", title: "אסטרטגיית ריטנשן לעסקים קטנים",        duration: "24 דק׳", source: "V", image: "https://picsum.photos/seed/binge-cw3/400/600", category: "וידאו",    progress: 80 },
  { id: "cw4", title: "הסיפור של מיכל — מאפס ל-10,000 עוקבים", duration: "31 דק׳", source: "S", image: "https://picsum.photos/seed/binge-cw4/400/600", category: "סיפורים", progress: 15 },
  { id: "cw5", title: "3 שאלות לפני כל פיסת תוכן",            duration: "9 דק׳",  source: "A", image: "https://picsum.photos/seed/binge-cw5/400/600", category: "טיפים",    progress: 50 },
];

const TRENDING: Item[] = [
  { id: "tr1", title: "מה זה TrueSignal ולמה זה שינה הכל",                        duration: "22 דק׳", source: "A", image: "https://picsum.photos/seed/binge-tr1/400/600", category: "וידאו" },
  { id: "tr2", title: "אינסטגרם בראש — הפסיכולוגיה מאחורי הסקרול",               duration: "14 דק׳", source: "V", image: "https://picsum.photos/seed/binge-tr2/400/600", category: "וידאו" },
  { id: "tr3", title: "3 שאלות שכל עסק חייב לענות לפני שמתחיל לפרסם",            duration: "8 דק׳",  source: "A", image: "https://picsum.photos/seed/binge-tr3/400/600", category: "טיפים" },
  { id: "tr4", title: "למה הלקוחות שלך לא מבינים מה אתה מוכר",                    duration: "19 דק׳", source: "V", image: "https://picsum.photos/seed/binge-tr4/400/600", category: "וידאו" },
  { id: "tr5", title: "בונים קהל ב-30 יום — מסגרת מעשית",                        duration: "27 דק׳", source: "Y", image: "https://picsum.photos/seed/binge-tr5/400/600", category: "פודקאסטים" },
  { id: "tr6", title: "ההבדל בין שיווק שמוכר לבין תוכן שמשעשע",                  duration: "16 דק׳", source: "V", image: "https://picsum.photos/seed/binge-tr6/400/600", category: "וידאו" },
];

const PODCASTS: Item[] = [
  { id: "p1", title: "שיחה עם רוני — שותפות עסקית שהפכה חיים",          duration: "44 דק׳", source: "Y", image: "https://picsum.photos/seed/binge-p1/600/600", category: "פודקאסטים" },
  { id: "p2", title: "הפרק על כסף ופחד — חשיפה מלאה",                   duration: "58 דק׳", source: "Y", image: "https://picsum.photos/seed/binge-p2/600/600", category: "פודקאסטים" },
  { id: "p3", title: "מה עובד בשיווק ב-2024 — עם ספיר כהן",             duration: "37 דק׳", source: "Y", image: "https://picsum.photos/seed/binge-p3/600/600", category: "פודקאסטים" },
  { id: "p4", title: "קריירה vs עסק עצמאי — מתי לקפוץ",                 duration: "51 דק׳", source: "Y", image: "https://picsum.photos/seed/binge-p4/600/600", category: "פודקאסטים" },
  { id: "p5", title: "הצד האפל של הרשתות החברתיות",                     duration: "46 דק׳", source: "Y", image: "https://picsum.photos/seed/binge-p5/600/600", category: "פודקאסטים" },
];

const TIPS: Item[] = [
  { id: "tip1", title: "הנוסחה לפוסט שמקבל שמירות",           duration: "3 דק׳", source: "A", image: "https://picsum.photos/seed/binge-tip1/400/600", category: "טיפים" },
  { id: "tip2", title: "איך לצלם Reel ב-15 דקות בלי ציוד",    duration: "5 דק׳", source: "V", image: "https://picsum.photos/seed/binge-tip2/400/600", category: "טיפים" },
  { id: "tip3", title: "הגדרת קהל יעד — מדריך מהיר",           duration: "4 דק׳", source: "A", image: "https://picsum.photos/seed/binge-tip3/400/600", category: "טיפים" },
  { id: "tip4", title: "5 כלים AI שיחסכו לך 3 שעות בשבוע",    duration: "7 דק׳", source: "A", image: "https://picsum.photos/seed/binge-tip4/400/600", category: "טיפים" },
  { id: "tip5", title: "ביו לאינסטגרם שמביא פניות",            duration: "2 דק׳", source: "A", image: "https://picsum.photos/seed/binge-tip5/400/600", category: "טיפים" },
  { id: "tip6", title: "איך לתמחר שירות ב-3 שלבים",            duration: "6 דק׳", source: "V", image: "https://picsum.photos/seed/binge-tip6/400/600", category: "טיפים" },
];

const STORIES: Item[] = [
  { id: "s1", title: "תמר — מעצבת שהפכה לנותנת שירות מבוקשת",          duration: "28 דק׳", source: "S", image: "https://picsum.photos/seed/binge-s1/400/600", category: "סיפורים" },
  { id: "s2", title: "אבי — קוסמטיקאי שהכפיל הכנסות תוך 3 חודשים",    duration: "34 דק׳", source: "S", image: "https://picsum.photos/seed/binge-s2/400/600", category: "סיפורים" },
  { id: "s3", title: "מיכל — מנהלת שיצאה לפרילנס ולא הסתכלה אחורה",    duration: "41 דק׳", source: "S", image: "https://picsum.photos/seed/binge-s3/400/600", category: "סיפורים" },
  { id: "s4", title: "דן — מאמן ספורט שיצר תוכן ששינה חיים",           duration: "25 דק׳", source: "S", image: "https://picsum.photos/seed/binge-s4/400/600", category: "סיפורים" },
  { id: "s5", title: "נועה — יועצת תזונה שמשכה לקוחות אורגניים",        duration: "32 דק׳", source: "S", image: "https://picsum.photos/seed/binge-s5/400/600", category: "סיפורים" },
];

// ─── Card components ────────────────────────────────────────────────────────

function PosterCard({ item, square = false }: { item: Item; square?: boolean }) {
  const badge = SOURCE_BADGE[item.source];
  const h = square ? 160 : 240;
  return (
    <div style={{ flexShrink: 0, width: 160, display: "flex", flexDirection: "column" }}>
      <div style={{
        position: "relative",
        borderRadius: 8,
        overflow: "hidden",
        width: 160,
        height: h,
        background: "#1D2430",
        cursor: "pointer",
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Bottom gradient */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "65%",
          background: "linear-gradient(to top, rgba(8,12,20,0.97) 0%, rgba(8,12,20,0.5) 50%, transparent 100%)",
          pointerEvents: "none",
        }} />
        {/* Duration badge — top left (visually right in RTL display) */}
        <div style={{
          position: "absolute",
          top: 7, left: 7,
          background: "rgba(0,0,0,0.72)",
          color: "#EDE9E1",
          fontSize: 10,
          fontWeight: 600,
          padding: "2px 6px",
          borderRadius: 4,
          backdropFilter: "blur(4px)",
        }}>
          {item.duration}
        </div>
        {/* Source badge — top right */}
        <div style={{
          position: "absolute",
          top: 7, right: 7,
          background: badge.bg,
          color: badge.color,
          fontSize: 9,
          fontWeight: 800,
          width: 18,
          height: 18,
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {badge.label}
        </div>
        {/* Title overlay */}
        <p style={{
          position: "absolute",
          bottom: 8, left: 8, right: 8,
          color: "#EDE9E1",
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1.4,
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>
          {item.title}
        </p>
      </div>
      {/* Progress bar */}
      {item.progress !== undefined && (
        <div style={{ height: 3, background: "#2C323E", borderRadius: "0 0 3px 3px", marginTop: 0 }}>
          <div style={{
            height: "100%",
            width: `${item.progress}%`,
            background: "#E52D27",
            borderRadius: "0 0 3px 3px",
          }} />
        </div>
      )}
    </div>
  );
}

function ScrollRow({
  title,
  items,
  square = false,
}: {
  title: string;
  items: Item[];
  square?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2 style={{
        color: "#EDE9E1",
        fontSize: 16,
        fontWeight: 700,
        margin: 0,
        paddingRight: 20,
        paddingLeft: 20,
        fontFamily: "var(--font-assistant), Assistant, sans-serif",
      }}>
        {title}
      </h2>
      <div
        className="binge-scroll-row"
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          paddingInlineStart: 20,
          paddingInlineEnd: 20,
          paddingBottom: 4,
        }}
      >
        {items.map((item) => (
          <PosterCard key={item.id} item={item} square={square} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BingePage() {
  const [activeCategory, setActiveCategory] = useState<Category>("הכל");

  const filter = (items: Item[]) =>
    activeCategory === "הכל" ? items : items.filter((i) => i.category === activeCategory);

  const filteredContinue  = filter(CONTINUE_WATCHING);
  const filteredTrending  = filter(TRENDING);
  const filteredPodcasts  = filter(PODCASTS);
  const filteredTips      = filter(TIPS);
  const filteredStories   = filter(STORIES);

  const allEmpty =
    filteredContinue.length === 0 &&
    filteredTrending.length === 0 &&
    filteredPodcasts.length === 0 &&
    filteredTips.length === 0 &&
    filteredStories.length === 0;

  const featuredBadge = SOURCE_BADGE[FEATURED.source];

  return (
    <div
      dir="rtl"
      style={{
        background: "#0D1018",
        minHeight: "100vh",
        fontFamily: "var(--font-assistant), Assistant, sans-serif",
        color: "#EDE9E1",
      }}
    >
      {/* Hide scrollbar site-wide for scroll rows */}
      <style>{`
        .binge-scroll-row::-webkit-scrollbar { display: none; }
        .binge-scroll-row { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        height: 52,
        background: "rgba(13,16,24,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1E2430",
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <h1 style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 900,
            letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontFamily: "var(--font-assistant), Assistant, sans-serif",
          }}>
            בינג׳
          </h1>
        </Link>
        <button
          aria-label="חפש"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            lineHeight: 0,
            color: "#9E9990",
          }}
        >
          <Search size={20} color="#9E9990" />
        </button>
      </div>

      {/* ── Featured card ────────────────────────────────────── */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16/10", background: "#1D2430", maxHeight: 480, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={FEATURED.image}
          alt={FEATURED.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Top gradient into header */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "30%",
          background: "linear-gradient(to bottom, rgba(13,16,24,0.7), transparent)",
          pointerEvents: "none",
        }} />
        {/* Bottom gradient + content */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          padding: "32px 20px 20px",
          background: "linear-gradient(to top, rgba(8,12,20,1) 0%, rgba(8,12,20,0.85) 60%, transparent 100%)",
        }}>
          {/* Tags row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {FEATURED.tags.map((tag) => (
              <span key={tag} style={{
                background: "rgba(201,150,74,0.18)",
                border: "1px solid rgba(201,150,74,0.35)",
                color: "#C9964A",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: 20,
              }}>
                {tag}
              </span>
            ))}
            <span style={{
              background: featuredBadge.bg,
              color: featuredBadge.color,
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 4,
            }}>
              {featuredBadge.label}
            </span>
          </div>
          <h2 style={{ margin: "0 0 6px", fontSize: "clamp(16px, 4vw, 22px)", fontWeight: 800, lineHeight: 1.3, color: "#EDE9E1" }}>
            {FEATURED.title}
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#9E9990", lineHeight: 1.5 }}>
            {FEATURED.subtitle}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{
              background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
              color: "#080C14",
              border: "none",
              borderRadius: 20,
              padding: "8px 22px",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "var(--font-assistant), Assistant, sans-serif",
            }}>
              ▶ צפה עכשיו
            </button>
            <span style={{ color: "#6B7080", fontSize: 12 }}>{FEATURED.duration}</span>
          </div>
        </div>
      </div>

      {/* ── Category pills ───────────────────────────────────── */}
      <div
        className="binge-scroll-row"
        style={{
          display: "flex",
          gap: 8,
          overflowX: "auto",
          paddingInlineStart: 20,
          paddingInlineEnd: 20,
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0,
              background: activeCategory === cat
                ? "linear-gradient(135deg, #E8B94A, #9E7C3A)"
                : "#1D2430",
              color: activeCategory === cat ? "#080C14" : "#EDE9E1",
              border: activeCategory === cat ? "none" : "1px solid #2C323E",
              borderRadius: 20,
              padding: "7px 18px",
              fontSize: 13,
              fontWeight: activeCategory === cat ? 800 : 400,
              cursor: "pointer",
              fontFamily: "var(--font-assistant), Assistant, sans-serif",
              transition: "all 150ms",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Content rows ─────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 48 }}>

        {allEmpty ? (
          <div style={{
            textAlign: "center",
            padding: "48px 20px",
            color: "#6B7080",
            fontSize: 15,
          }}>
            אין תכנים בקטגוריה זו עדיין
          </div>
        ) : (
          <>
            <ScrollRow title="המשיכי לצפות"    items={filteredContinue} />
            <ScrollRow title="הכי נצפים היום"   items={filteredTrending} />
            <ScrollRow title="פודקאסטים"         items={filteredPodcasts} square />
            <ScrollRow title="טיפים קצרים"       items={filteredTips} />
            <ScrollRow title="סיפורי הצלחה"      items={filteredStories} />
          </>
        )}

      </div>
    </div>
  );
}
