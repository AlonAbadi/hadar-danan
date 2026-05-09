import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { parseVariant, AB_CONTENT } from "@/lib/ab";
import { createServerClient } from "@/lib/supabase/server";
import { PageTracker } from "@/components/landing/PageTracker";
import { ProductsSection } from "@/components/ProductsSection";
import { BookOpen, Zap, Target, GraduationCap, Compass, Video, Users, Sparkles } from "lucide-react";

const StatsSection       = dynamic(() => import("@/components/landing/StatsSection").then(m => ({ default: m.StatsSection })));
const SocialProofStrip   = dynamic(() => import("@/components/SocialProofStrip"));
const PhilosophySection  = dynamic(() => import("@/components/landing/PhilosophySection").then(m => ({ default: m.PhilosophySection })));
const WorkshopTestimonials = dynamic(() => import("@/app/workshop/WorkshopTestimonials").then(m => ({ default: m.WorkshopTestimonials })));
const HomeStickyBar      = dynamic(() => import("@/components/home/HomeStickyBar"));

export const metadata: Metadata = {
  title: "הדר דנן | אסטרטגיה שיווקית שמביאה תוצאות",
  description: "אנחנו עוזרים לעסקים לאתר איפה הם חזקים באמת - ולבנות שיווק שמרגיש טבעי ומביא תוצאות",
  alternates: { canonical: "/" },
};

async function getUserCount(): Promise<number> {
  try {
    const supabase = createServerClient();
    const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}


const ROW1_PRODUCTS = [
  { title: "הדרכה חינמית",    who: "לכל מי שרוצה להבין למה השיווק שלו לא עובד",                      price: "חינם",          cta: "התחל כאן ←",         href: "/training",    icon: BookOpen },
  { title: "אתגר 7 ימים",     who: "לכל מי שרוצה לצאת לדרך ולייצר תוכן שמביא לקוחות",              price: "₪197",          cta: "להתחיל ←", href: "/challenge",   icon: Zap },
  { title: "סדנה יום אחד",    who: "לכל מי שמייצר תוכן אבל לא רואה תוצאות",                        price: "₪1,080",        cta: "קבע יום ←",          href: "/workshop",    icon: Target },
  { title: "קורס דיגיטלי",    who: "לכל מי שרוצה ללמוד לעומק - לא רק לצלם אלא להבין",              price: "₪1,800",        cta: "לקורס ←",            href: "/course",      icon: GraduationCap },
  { title: "פגישת אסטרטגיה",  who: "לכל מי שרוצה לשבת עם הדר ולבנות אסטרטגיה מדויקת",            price: "₪4,000",        cta: "קבע פגישה ←",        href: "/strategy",    icon: Compass },
];

const ROW2_PRODUCTS = [
  { title: "יום צילום פרמיום",  who: "לעסקים שרוצים תוצאה מלאה: אסטרטגיה + הפקה + עריכה",           price: "₪14,000",        priceNote: "+ מע״מ",  cta: "לפרטים ←",         href: "/premium",     icon: Video,     tag: "יום הפקה" },
  { title: "שותפות אסטרטגית",   who: "לעסקים וחברות שרוצות שותף לדרך - לא ספק שירות",           price: "₪10,000-30,000", priceNote: "/ חודש",  cta: "בדוק התאמה ←",     href: "/partnership", icon: Users,     tag: "על בסיס מקום פנוי" },
  { title: "beegood atelier",   who: "למשפיעניות שרוצות להפוך למנהיגות תרבותיות - עולם שלם תחת הדומיין שלך", price: "בהתאמה אישית", priceNote: "", cta: "לבדיקת התאמה ←", href: "/atelier",     icon: Sparkles,  tag: "בוטיק · מספר מקומות מוגבל" },
];

const TESTIMONIALS = [
  {
    text: "מרוצה במקסימום הצלחתם להפוך את הנקודה שהכי קשה לי בעסק לנקודת חוזקה ואני אפילו נהנה מזה עכשיו :) אין עליכם תודה ענקית!!",
    name: "רועי מנדלמן",
    date: "לפני 8 חודשים",
    initial: "ר",
  },
  {
    text: "שירות ברמה אחרת! אחרי אכזבות מחברות אחרות, סוף סוף מצאתי צוות מקצועי, אדיב וקשוב לצרכים שלי. מהרגע הראשון הרגשתי שאני בידיים טובות. הם הצליחו לקחת את העסק שלי כמה צעדים קדימה עם תוכן מדוייק שהביא לי הרבה פניות. מומלץ בחום.",
    name: "gal masas",
    date: "לפני שנה",
    initial: "G",
  },
  {
    text: "מקצוענות נטו!! נהנתי מהדרך ומהשירות. זה הכי כיף לעבוד עם אנשים שגם סופר מקצועיים וגם סופר שירותיים ואדיבים בנוסף, הקפיץ לי את העסק והעלה לי את רמת החשיפה וכמות הלקוחות! ממליץ בחום!",
    name: "ת. ב.",
    date: "לפני שנה",
    initial: "T",
  },
];

export default async function LandingPage() {
  const cookieStore = await cookies();
  const variant = parseVariant(cookieStore.get("ab_variant")?.value);
  const content = AB_CONTENT[variant];
  const userCount = await getUserCount();
  const displayCount = Math.max(userCount + 250, 3500);

  return (
    <>
      <PageTracker abVariant={variant} />

      <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: "#080C14" }}>



        <main className="flex-1">

          {/* ══════════════════════════════════════════════════════
              1. HERO
          ══════════════════════════════════════════════════════ */}
          <section style={{ overflow: "hidden", background: "#0B1220" }}>

            {/* ── MOBILE: full-bleed overlay, thumb-zone optimized ── */}
            <div className="md:hidden" style={{ position: "relative", height: "93svh" }}>
              <Image
                src="/hadar1.jpg"
                alt="הדר דנן"
                fill
                priority
                sizes="100vw"
                style={{ objectFit: "cover", objectPosition: "center 10%" }}
              />
              {/* Bottom-to-top overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, #080C14 0%, rgba(8,12,20,0.95) 20%, rgba(8,12,20,0.85) 35%, rgba(8,12,20,0.6) 55%, rgba(8,12,20,0.3) 70%, transparent 85%)",
              }} />
              {/* Top fade - navbar blend */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)",
              }} />
              {/* Left side fade */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to right, #080C14 0%, rgba(8,12,20,0.6) 25%, transparent 55%)",
              }} />
              {/* Content anchored from bottom */}
              <div style={{
                position: "absolute", bottom: "32px", left: 0, right: 0,
                padding: "0 24px", direction: "rtl", textAlign: "right",
              }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.32)",
                  borderRadius: 9999, padding: "5px 14px", marginBottom: 12,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A", flexShrink: 0 }} />
                  <span style={{ color: "#C9964A", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700 }}>
                    <span style={{ direction: "rtl" }}>שיטת <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></span>
                  </span>
                </div>
                <h1 style={{ color: "#EDE9E1", fontWeight: 800, fontSize: "clamp(1.7rem, 4.5vw, 2rem)", lineHeight: 1.18, marginBottom: 12, whiteSpace: "pre-line" }}>
                  {content.headline}
                </h1>
                <p style={{ color: "#9E9990", fontSize: "clamp(0.9rem, 2vw, 1rem)", lineHeight: 1.72, marginBottom: 16 }}>
                  {content.description}
                </p>
                <a href="/quiz" data-home-hero-cta="" style={{
                  display: "block", textAlign: "center",
                  background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                  color: "#1A1206", fontWeight: 800, fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
                  borderRadius: 9999, padding: "14px", marginBottom: 14, textDecoration: "none",
                  width: "100%",
                }}>
                  {content.cta}
                </a>
                <p style={{
                  color: "#9E9990",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 8,
                  direction: "rtl",
                }}>
                  6 שאלות · 2 דקות · ללא כרטיס אשראי
                </p>
              </div>
            </div>

            {/* ── DESKTOP: full-bleed overlay, seamless fade ─────── */}
            <div className="hidden md:block" style={{ position: "relative", minHeight: "100vh" }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: "-5%",
                height: "163%",
                width: "auto",
                display: "inline-block",
              }}>
                <Image
                  src="/hadar1.jpg"
                  alt="הדר דנן"
                  width={842}
                  height={1264}
                  priority
                  sizes="50vw"
                  quality={80}
                  style={{
                    height: "100%",
                    width: "auto",
                    maxWidth: "none",
                    display: "block",
                    WebkitMaskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
                    maskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
                  }}
                />
              </div>
              {/* Top fade - navbar blend */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)",
              }} />
              {/* Text floats over right side */}
              <div style={{
                position: "absolute", top: "50%", right: 0,
                transform: "translateY(-50%)",
                width: "45%", padding: "0 72px 0 0",
                direction: "rtl", textAlign: "right",
              }}>

                {/* Tag pill */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.32)",
                  borderRadius: 9999, padding: "5px 14px", marginBottom: 22,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A", flexShrink: 0 }} />
                  <span style={{ color: "#C9964A", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700 }}>
                    <span style={{ direction: "rtl" }}>שיטת <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></span>
                  </span>
                </div>

                {/* Headline */}
                <h1 style={{
                  color: "#EDE9E1", fontWeight: 800,
                  fontSize: "clamp(2rem, 2.6vw, 3rem)",
                  lineHeight: 1.2, marginBottom: 18, whiteSpace: "pre-line",
                }}>
                  {content.headline}
                </h1>

                {/* Body */}
                <p style={{
                  color: "#9E9990", fontSize: "1rem",
                  lineHeight: 1.78, marginBottom: 36,
                }}>
                  {content.description}
                </p>

                {/* CTA */}
                <a href="/quiz" data-home-hero-cta="" style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                  color: "#1A1206", fontWeight: 800, fontSize: "1.05rem",
                  borderRadius: 9999, padding: "16px 52px",
                  textDecoration: "none", marginBottom: 22,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 6px rgba(0,0,0,0.25), 0 10px 28px rgba(0,0,0,0.35), 0 0 40px rgba(201,150,74,0.15)",
                }}>
                  {content.cta}
                </a>
                <p style={{
                  color: "#9E9990",
                  fontSize: 12,
                  textAlign: "center",
                  marginTop: 8,
                  direction: "rtl",
                }}>
                  6 שאלות · 2 דקות · ללא כרטיס אשראי
                </p>


              </div>
            </div>

          </section>

          {/* ══════════════════════════════════════════════════════
              2. STATS
          ══════════════════════════════════════════════════════ */}
          <StatsSection />

          <SocialProofStrip />

          {/* ══════════════════════════════════════════════════════
              3. PHILOSOPHY
          ══════════════════════════════════════════════════════ */}
          <section
            className="px-6 py-20 md:py-28"
            style={{ background: "#101520" }}
          >
            <div className="max-w-5xl mx-auto flex flex-col gap-14">
              <div className="text-center flex flex-col gap-3">
                <h2 className="text-3xl md:text-4xl font-black" style={{ color: "#EDE9E1" }}>
                  הגישה שלנו
                </h2>
                <p className="text-base font-semibold" style={{ color: "#C9964A" }}>
                  כי אפשר למכור רק את מה שאתה באמת - זה הבסיס של <span dir="ltr" style={{unicodeBidi:"embed"}}>TrueSignal©</span>
                </p>
              </div>

              <PhilosophySection />

              <div
                className="rounded-3xl px-8 py-7 text-center"
                style={{ background: "rgba(201,150,74,0.08)", border: "1px solid rgba(201,150,74,0.12)" }}
              >
                <p className="text-base md:text-lg leading-relaxed font-medium" style={{ color: "#EDE9E1" }}>
                  ״אנחנו לא מוכרים סרטונים.<br className="hidden md:block" />
                  אנחנו מוכרים את הבהירות שגורמת לתוכן לעבוד.״
                </p>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════
              4. PRODUCTS - LADDER + NETFLIX
          ══════════════════════════════════════════════════════ */}
          {/* Quiz bridge — recovers visitors overwhelmed by product choices */}
          <div
            style={{
              background: "#080C14",
              paddingTop: 8,
              paddingBottom: 8,
              textAlign: "center",
            }}
          >
            <a
              href="/quiz"
              style={{
                color: "#C9964A",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                direction: "rtl",
              }}
            >
              לא בטוח/ה מה מתאים לך? ← קח את הקוויז וקבל המלצה אישית
            </a>
          </div>
          <ProductsSection />

          {/* ══════════════════════════════════════════════════════
              5. BINGE CTA
          ══════════════════════════════════════════════════════ */}
          <section style={{ background: "#080C14", padding: "48px 20px" }}>
            <style>{`
              .binge-card {
                display: block;
                max-width: 860px;
                margin: 0 auto;
                border-radius: 20px;
                overflow: hidden;
                text-decoration: none;
                border: 1px solid rgba(201,150,74,0.2);
                box-shadow: 0 8px 48px rgba(0,0,0,0.45);
                transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
                background: #0A0E18;
                position: relative;
              }
              .binge-card:hover {
                border-color: rgba(201,150,74,0.55);
                box-shadow: 0 0 80px rgba(201,150,74,0.14), 0 24px 64px rgba(0,0,0,0.55);
                transform: translateY(-3px);
              }
              .binge-card:hover .binge-thumb-img {
                transform: scale(1.07);
              }
              .binge-card:hover .binge-play {
                background: rgba(201,150,74,0.92) !important;
                color: #080C14 !important;
              }
              .binge-card:hover .binge-enter-btn {
                background: linear-gradient(135deg,#E8B94A,#C9964A,#9E7C3A) !important;
                color: #080C14 !important;
                border-color: transparent !important;
              }
              .binge-thumb-img {
                transition: transform 0.5s ease;
              }
              .binge-play {
                transition: background 0.2s ease, color 0.2s ease;
              }
            `}</style>
            <Link href="/binge" className="binge-card">

              {/* ── Thumbnail strip ─────────────────────────── */}
              <div style={{ display: "flex", height: 220, position: "relative", overflow: "hidden" }}>
                {[
                  { src: "https://i.vimeocdn.com/video/2153151890-8e7a70d2ddab4ee1e253e06a69db11e3c8575e13cfb18ee1b2d6631e4f29815d-d_640x360?&r=pad&region=us", mobileHide: false },
                  { src: "https://i.vimeocdn.com/video/2153148315-1a053bf671a4af54ec57a9a43271b6db0acdcae7066c0564da52f081c77544f0-d_640x360?&r=pad&region=us", mobileHide: false },
                  { src: "https://i.vimeocdn.com/video/2153147710-6fe1753b3439622ea3d24b037d1bb5e0ebc718eac24b56464a0551af09372d23-d_640x360?&r=pad&region=us", mobileHide: false },
                  { src: "https://i.vimeocdn.com/video/2153153525-777573a5f129e2ecea1e05fbf334c1ccbe937d959ac0d72f3a5036ea076ca655-d_640x360?&r=pad&region=us", mobileHide: true },
                  { src: "https://i.vimeocdn.com/video/2153153469-e3d1f9a5ba2e65cb2c4b116246fd505e0324e7844f77e3c4f4d46cce682a3373-d_640x360?&r=pad&region=us", mobileHide: true },
                ].map(({ src, mobileHide }, i) => (
                  <div key={i} className={mobileHide ? "hidden md:flex" : ""} style={{ flex: 1, overflow: "hidden", position: "relative", borderLeft: i > 0 ? "1px solid rgba(0,0,0,0.4)" : "none" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      loading="lazy"
                      className="binge-thumb-img"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                    />
                    {/* Per-thumb dark overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "rgba(8,12,20,0.28)" }} />
                    {/* Play icon */}
                    <div className="binge-play" style={{
                      position: "absolute", top: "50%", left: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(255,255,255,0.18)",
                      backdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, color: "#fff",
                    }}>▶</div>
                  </div>
                ))}
                {/* Heavy bottom gradient to blend into card body */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: "65%",
                  background: "linear-gradient(to top, #0A0E18 0%, rgba(10,14,24,0.7) 50%, transparent 100%)",
                  pointerEvents: "none",
                }} />
                {/* Badge top-right */}
                <div style={{
                  position: "absolute", top: 14, right: 16,
                  background: "rgba(10,14,24,0.82)",
                  border: "1px solid rgba(201,150,74,0.35)",
                  color: "#C9964A", fontSize: 11, fontWeight: 700,
                  padding: "4px 12px", borderRadius: 20,
                  backdropFilter: "blur(6px)",
                  fontFamily: "var(--font-assistant), Assistant, sans-serif",
                }}>80+ סרטונים</div>
              </div>

              {/* ── Card body ───────────────────────────────── */}
              <div style={{ padding: "18px 24px 26px", direction: "rtl" }}>
                {/* Title row */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <p style={{
                    margin: 0, fontSize: 32, fontWeight: 900, lineHeight: 1,
                    background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    fontFamily: "var(--font-assistant), Assistant, sans-serif",
                  }}>בינג׳</p>
                  <span style={{ fontSize: 13, color: "#6B7480", fontWeight: 400, fontFamily: "var(--font-assistant), Assistant, sans-serif" }}>
                    — ספריית התוכן של הדר דנן
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  margin: "0 0 14px", fontSize: 14, color: "#9E9990", lineHeight: 1.6,
                  fontFamily: "var(--font-assistant), Assistant, sans-serif",
                }}>
                  רילס, תהליכים מהסדנה, עדויות לקוחות — הכל במקום אחד, בחינם.
                </p>

                {/* Category chips */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
                  {["רילס של הדר", "תהליכים מלאים", "לקוחות מדברים"].map(tag => (
                    <span key={tag} style={{
                      background: "rgba(44,50,62,0.7)", color: "#9E9990",
                      fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 12,
                      fontFamily: "var(--font-assistant), Assistant, sans-serif",
                    }}>{tag}</span>
                  ))}
                </div>

                {/* CTA */}
                <span className="binge-enter-btn" style={{
                  display: "inline-block",
                  border: "1px solid rgba(201,150,74,0.45)",
                  color: "#C9964A",
                  fontSize: 14, fontWeight: 800,
                  padding: "11px 30px", borderRadius: 24,
                  fontFamily: "var(--font-assistant), Assistant, sans-serif",
                  transition: "all 0.2s ease",
                }}>
                  ▶ כניסה לבינג׳
                </span>
              </div>
            </Link>
          </section>

          {/* ══════════════════════════════════════════════════════
              6. SOCIAL PROOF
          ══════════════════════════════════════════════════════ */}
          <section className="px-6 py-24 md:py-36" style={{ background: "#080C14" }}>
            <div className="max-w-5xl mx-auto flex flex-col gap-16">

              {/* Header */}
              <div className="text-center flex flex-col items-center gap-5">
                {/* Google badge */}
                <div
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="Google">
                    <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.5-4.2 7.3-10.4 7.3-17.3z" />
                    <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.4v6.2C6.4 42.6 14.6 48 24 48z" />
                    <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6v-6.2H2.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.4 10.8l8.1-6.2z" />
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.8-6.8C35.9 2.1 30.4 0 24 0 14.6 0 6.4 5.4 2.4 13.2l8.1 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: "#9E9990" }}>ביקורות Google</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className="w-4 h-4" fill="#E8B94A" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#EDE9E1" }}>5.0</span>
                </div>

                <h2 className="text-3xl md:text-5xl font-black leading-tight" style={{ color: "#EDE9E1" }}>
                  מעל {displayCount.toLocaleString("he-IL")} עסקים כבר מצאו<br className="hidden md:block" /> את הבהירות שלהם עם הדר
                </h2>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TESTIMONIALS.map((t) => (
                  <div
                    key={t.name}
                    className="rounded-3xl p-8 flex flex-col gap-6"
                    style={{
                      background: "linear-gradient(145deg,#131c2e,#0d1520)",
                      border: "1px solid rgba(201,150,74,0.15)",
                      boxShadow: "0 4px 32px rgba(0,0,0,0.4)",
                    }}
                  >
                    {/* Stars + Google logo */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <svg key={i} className="w-4 h-4" fill="#E8B94A" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-label="Google" style={{ opacity: 0.7 }}>
                        <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.1-.4-4.6H24v8.7h13.2c-.6 3-2.3 5.5-4.8 7.2v6h7.8c4.5-4.2 7.3-10.4 7.3-17.3z" />
                        <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.8-6c-2.2 1.5-5 2.3-8.2 2.3-6.3 0-11.6-4.2-13.5-9.9H2.4v6.2C6.4 42.6 14.6 48 24 48z" />
                        <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.2.8-4.6v-6.2H2.4A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.4 10.8l8.1-6.2z" />
                        <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.8-6.8C35.9 2.1 30.4 0 24 0 14.6 0 6.4 5.4 2.4 13.2l8.1 6.2C12.4 13.7 17.7 9.5 24 9.5z" />
                      </svg>
                    </div>

                    {/* Quote */}
                    <p className="text-base md:text-lg leading-relaxed flex-1" style={{ color: "#D8D4CC" }}>
                      &ldquo;{t.text}&rdquo;
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-5" style={{ borderTop: "1px solid rgba(201,150,74,0.12)" }}>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg, rgba(232,185,74,0.2), rgba(158,124,58,0.2))",
                          color: "#C9964A",
                          border: "1px solid rgba(201,150,74,0.3)",
                        }}
                      >
                        {t.initial}
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: "#EDE9E1" }}>{t.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9E9990" }}>{t.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Video testimonials carousel */}
              <div>
                <p style={{
                  fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
                  color: "#C9964A", textTransform: "uppercase", textAlign: "center",
                  marginBottom: 16,
                }}>
                  מה אומרים עליה בוידאו
                </p>
                <WorkshopTestimonials />
              </div>

            </div>
          </section>

        </main>

        {/* ══════════════════════════════════════════════════════
            7. FOOTER
        ══════════════════════════════════════════════════════ */}
        <footer className="px-6 py-12" style={{ background: "#101520", paddingBottom: "100px" }}>
          <div className="max-w-5xl mx-auto flex flex-col gap-8">

            {/* Links */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" style={{ color: "#9E9990" }}>
              {[
                { label: "בית",       href: "/" },
                { label: "הדרכה",     href: "/training" },
                { label: "אתגר",      href: "/challenge" },
                { label: "סדנה",      href: "/workshop" },
                { label: "קורס",      href: "/course" },
                { label: "אסטרטגיה",  href: "/strategy" },
                { label: "הכוורת",    href: "/hive" },
                { label: "פרימיום",   href: "/premium" },
                { label: "שותפות",    href: "/partnership" },
                { label: "אזור אישי", href: "/my" },
              ].map((link) => (
                <a key={link.href} href={link.href} className="hover:text-white transition" style={{ color: "#C9964A" }}>
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Legal */}
            <div className="flex flex-col items-center gap-2 text-xs" style={{ color: "#9E9990" }}>
              <div className="flex gap-4">
                <a href="/privacy" className="hover:text-white transition">מדיניות פרטיות</a>
                <a href="/terms" className="hover:text-white transition">תנאי שימוש</a>
                <a href="/accessibility" className="hover:text-white transition">הצהרת נגישות</a>
              </div>
              <p className="font-medium">אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr" style={{unicodeBidi:"embed"}}>TrueSignal©</span></p>
              <p>© 2026 הדר דנן בע״מ | ח.פ. 516791555 · כל הזכויות שמורות</p>
              <p>החילזון 5, רמת גן | 053-9566961</p>
              <p className="mt-1">
                <a href="/unsubscribe" className="hover:text-white transition">לביטול הסכמה לדיוור</a>
              </p>
            </div>

          </div>
        </footer>

      </div>
      <HomeStickyBar ctaText={content.cta} />
    </>
  );
}
