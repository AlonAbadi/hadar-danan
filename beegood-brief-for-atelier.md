# beegood.online - Codebase Brief for atelier Product Page

## app/ structure
```
about
accessibility
account
admin
api
auth
binge
call
challenge
course
favicon.ico
forgot-password
globals.css
hive
layout.tsx
login
members
method
my
not-found.tsx
page.tsx
partnership
premium
press
privacy
quiz
reset-password
robots.ts
signup
sitemap.ts
strategy
team
terms
test
thank-you
training
unsubscribe
workshop
```

## app/page.tsx (homepage)
```tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import { parseVariant, AB_CONTENT } from "@/lib/ab";
import { createServerClient } from "@/lib/supabase/server";
import { PageTracker } from "@/components/landing/PageTracker";
import { CarouselWithDots } from "@/components/landing/CarouselWithDots";
import { PhilosophySection } from "@/components/landing/PhilosophySection";
import { StatsSection } from "@/components/landing/StatsSection";
import { ProductsSection } from "@/components/ProductsSection";
import HomeStickyBar from "@/components/home/HomeStickyBar";
import SocialProofStrip from "@/components/SocialProofStrip";
import { BookOpen, Zap, Target, GraduationCap, Compass, Video, Users, Star } from "lucide-react";

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
  { title: "יום צילום פרמיום",  who: "לעסקים שרוצים תוצאה מלאה: אסטרטגיה + הפקה + עריכה",           price: "₪14,000",        priceNote: "+ מע״מ",  cta: "לפרטים ←",      href: "/premium",     icon: Video, tag: "יום הפקה" },
  { title: "שותפות אסטרטגית",   who: "למשפיעניות וחברות שרוצות שותף לדרך - לא ספק שירות",           price: "₪10,000-30,000", priceNote: "/ חודש",  cta: "בדוק התאמה ←",  href: "/partnership", icon: Users, tag: "על בסיס מקום פנוי" },
];

const TESTIMONIALS = [
  {
    text: "מי שרוצה שירות פרימיום יחס מעולה ושיוציאו אותך הכי אותנטי זה המקום!!",
    name: "ניסן אלנקווה",
    date: "לפני 11 חודשים",
    initial: "נ",
  },
  {
    text: "שירות מעולה, הבנה מאוד רצינית ומעמיקה על איך לשווק נכון עסק ואיזה סרטונים טובים לו. מומלץ בחום.",
    name: "נטע מרום",
    date: "לפני שנה",
    initial: "נ",
  },
  {
    text: "הגעתי לצילומים אצל הדר דנן עם קצת חשש ופרפרים אבל תוך רגע כל הלחץ הסתיים. הצוות שם פשוט תותחים מהרגע שנכנסתי, הייתה אווירה כיפית, נעימה ומקצועית בטירוף.",
    name: "נטלי גדקר",
    date: "לפני שנה",
    initial: "נ",
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
                src="/hadar1.png"
                alt="הדר דנן"
                fill
                priority
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
                  src="/hadar1.png"
                  alt="הדר דנן"
                  width={842}
                  height={1264}
                  priority
                  quality={90}
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
          <ProductsSection />

          {/* ══════════════════════════════════════════════════════
              5. BINGE CTA
          ══════════════════════════════════════════════════════ */}
          <section style={{ background: "#080C14", padding: "40px 24px" }}>
            <div
              className="rounded-2xl"
              style={{
                maxWidth: 480,
                margin: "0 auto",
                background: "#141820",
                border: "1px solid #2C323E",
                padding: "32px 28px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Image src="/beegood_logo.png" alt="Bee Good" width={36} height={28} />
              <p style={{
                margin: 0,
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1,
                background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontFamily: "var(--font-assistant), Assistant, sans-serif",
              }}>
                בינג׳
              </p>
              <p style={{ margin: 0, fontSize: 15, color: "#9E9990", fontFamily: "var(--font-assistant), Assistant, sans-serif" }}>
                כל התכנים של הדר במקום אחד
              </p>
              <a
                href="/binge"
                style={{
                  marginTop: 4,
                  display: "inline-block",
                  background: "linear-gradient(135deg, #E8B94A, #9E7C3A)",
                  color: "#080C14",
                  fontSize: 14,
                  fontWeight: 800,
                  padding: "10px 28px",
                  borderRadius: 24,
                  textDecoration: "none",
                  fontFamily: "var(--font-assistant), Assistant, sans-serif",
                }}
              >
                לכל התכנים ←
              </a>
            </div>
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
                        <p className="text-xs mt-0.5" style={{ color: "#6B7080" }}>{t.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

        </main>

        {/* ══════════════════════════════════════════════════════
            7. FOOTER
        ══════════════════════════════════════════════════════ */}
        <footer className="px-6 py-12" style={{ background: "#101520", paddingBottom: "100px" }}>
          <div className="max-w-5xl mx-auto flex flex-col gap-8">

            {/* Credit CTA */}
            <div className="text-center">
              <a
                href="/my"
                className="inline-flex items-center gap-2 text-sm font-bold transition hover:opacity-80"
                style={{ color: "#C9964A" }}
              >
                יש לך זיכוי? בדוק באזור האישי שלך ←
              </a>
            </div>

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
            <div className="flex flex-col items-center gap-2 text-xs" style={{ color: "rgba(158,153,144,0.5)" }}>
              <div className="flex gap-4">
                <a href="/privacy" className="hover:text-white transition">מדיניות פרטיות</a>
                <a href="/terms" className="hover:text-white transition">תנאי שימוש</a>
                <a href="/accessibility" className="hover:text-white transition">הצהרת נגישות</a>
              </div>
              <p className="font-medium" style={{ color: "rgba(158,153,144,0.6)" }}>אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr" style={{unicodeBidi:"embed"}}>TrueSignal©</span></p>
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
```

## app/course/page.tsx (reference product page)
```tsx
import type { Metadata } from "next";
import { CourseLandingClient } from "./CourseLandingClient";
import { ProductSchema } from "@/components/ProductSchema";
import { FAQSchema } from "@/components/FAQSchema";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";

export const metadata: Metadata = {
  title: "קורס בידול מותג אישי - 8 מודולים | הדר דנן",
  description: "8 מודולים. 16 שיעורים. שיטה שעברו דרכה 3,500+ עסקים. 1,800 שקל - גישה לנצח.",
  alternates: { canonical: "/course" },
};

const COURSE_FAQS = [
  { question: "לא בטוח שזה מתאים לתחום שלי",   answer: "הקורס עבר עם יותר מ-3,500 עסקים - רופאים, עורכי דין, מאמנים, יועצים, בעלי מקצוע. הבידול רלוונטי לכל מי שמוכר את עצמו ואת הידע שלו." },
  { question: "כמה זמן לוקח לסיים את הקורס?",   answer: '16 שיעורים של כחצי שעה - סה"כ כ-8 שעות. אפשר שיעור ביום ולסיים תוך שבועיים, או לרוץ על זה בסוף שבוע. הגישה שלך לנצח.' },
  { question: "ניסיתי קורסים בעבר ולא יצא לי כלום", answer: "רוב הקורסים נותנים תיאוריה. הקורס הזה בנוי על שיטה שהדר יישמה בשטח עם 3,500 עסקים - כל שיעור נגמר עם משימה אחת ברורה שמיישמים מיד." },
  { question: "מה קורה אם אני לא מרוצה?",       answer: "צור קשר ונטפל בזה. ערבות תוצאה - עברת את כל 8 המודולים ולא יצאת עם מסר ברור, נחזיר לך את הכסף." },
  { question: "האם הקורס מתעדכן?",              answer: "כן. כשהדר מוסיפה תכנים - אתה מקבל אותם ללא עלות נוספת. קנית פעם אחת, מרוויח לאורך זמן." },
];

export default async function CoursePage() {
  const whatsappPhone = process.env.WHATSAPP_PHONE ?? "972539566961";
  const APP_URL       = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

  return (
    <>
      <ProductSchema
        type="Course"
        name="קורס בידול מותג אישי - שיטת TrueSignal"
        description="8 מודולים, 16 שיעורים. שיטת TrueSignal של הדר דנן שעברו דרכה 3,500+ עסקים."
        url={`${APP_URL}/course`}
        price={1800}
        imageUrl={`${APP_URL}/coursehadar.png`}
      />
      <FAQSchema items={COURSE_FAQS} />
      <BreadcrumbSchema crumbs={[
        { name: "דף הבית", url: APP_URL },
        { name: "קורס דיגיטלי", url: `${APP_URL}/course` },
      ]} />
      <p
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "28px 20px 0",
          color: "#9E9990",
          fontSize: 16,
          lineHeight: 1.8,
          textAlign: "center",
          fontFamily: "var(--font-assistant)",
        }}
      >
        קורס בידול מותג אישי הוא קורס דיגיטלי של 8 מודולים ו-16 שיעורים המבוסס על שיטת TrueSignal. הקורס מלמד בעלי עסקים לאתר את הבידול האמיתי שלהם, לבנות מסר שמוכר ולהפוך תוכן ללידים. 3,500+ עסקים כבר יישמו את השיטה. גישה לנצח, ₪1,800 תשלום חד-פעמי.
      </p>
      <CourseLandingClient credit={0} whatsappPhone={whatsappPhone} email="" />
    </>
  );
}
```

## app/layout.tsx
```tsx
import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Pixels }              from "@/components/analytics/Pixels";
import { AccessibilityWidget } from "@/components/AccessibilityWidget";
import { MobileNavServer }     from "@/components/MobileNavServer";
import { DesktopNavServer }    from "@/components/DesktopNavServer";
import { LayoutShell }         from "@/components/LayoutShell";
import { SchemaMarkup }        from "@/components/SchemaMarkup";

const assistant = Assistant({
  subsets:  ["hebrew", "latin"],
  variable: "--font-assistant",
  display:  "swap",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const OG_IMAGE = "https://beegood.online/og-image.jpg";

const TITLE       = "הדר דנן | שיטת TrueSignal by BeeGood - שיווק אותנטי לעסקים";
const DESCRIPTION = "הדר דנן, מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal by BeeGood. קורסים, סדנאות וליווי אישי לבעלי עסקים שרוצים לשווק בלי לאבד את עצמם.";

export const metadata: Metadata = {
  title: {
    default:  TITLE,
    template: "%s | הדר דנן",
  },
  description: DESCRIPTION,
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type:        "website",
    locale:      "he_IL",
    siteName:    "הדר דנן | BeeGood",
    title:       TITLE,
    description: DESCRIPTION,
    url:         APP_URL,
    images:      [{ url: OG_IMAGE, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       TITLE,
    description: DESCRIPTION,
    images:      [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${assistant.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-assistant antialiased" style={{ background: "#101520", color: "#EDE9E1" }}>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-L76SZ1SCS1" strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-L76SZ1SCS1');
        `}</Script>
        <SchemaMarkup />
        <a href="#main-content" className="skip-link">דלג לתוכן הראשי</a>
        <Pixels />
        <AccessibilityWidget />
        <LayoutShell nav={<><MobileNavServer /><DesktopNavServer /></>}>
          <div id="main-content" tabIndex={-1} style={{ outline: "none" }} />
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
```

## app/globals.css
```css
@import "tailwindcss";

/* ══ Santosha brand tokens ════════════════════════════════════ */
:root {
  --bg:         #0D1018;
  --card:       #141820;
  --card-soft:  #181D26;
  --border:     #2C323E;
  --muted:      #272D38;
  --gold:       #C9964A;
  --gold-light: #E8B94A;
  --gold-dark:  #9E7C3A;

  /* brand scale (Gold-1 = high-emphasis, Gold-2 = base, Gold-3 = dark) */
  --brand-gold-1: #E8B94A;
  --brand-gold-2: #C9964A;
  --brand-gold-3: #9E7C3A;
  --fg:         #EDE9E1;
  --fg-muted:   #9E9990;
  --cream:      #EBE4D6;

  --grad-gold:      linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%);
  --grad-hero:      linear-gradient(180deg, hsl(220,20%,8%) 0%, hsl(220,18%,12%) 100%);
  --grad-card:      linear-gradient(145deg, hsl(220,18%,14%), hsl(220,20%,10%));
  --grad-text-gold: linear-gradient(135deg, #E8B94A 0%, #C9964A 100%);

  --glow-gold:   0 0 60px rgba(201,150,74,0.15);
  --shadow-card: 0 8px 40px rgba(0,0,0,0.4);

  /* legacy compat */
  --background:    var(--bg);
  --foreground:    var(--fg);
  --color-primary: var(--gold);
}

@theme inline {
  --color-background: var(--bg);
  --color-foreground: var(--fg);
  --font-assistant:   var(--font-assistant);
  --color-gold:       var(--gold);
  --color-fg:         var(--fg);
  --color-fg-muted:   var(--fg-muted);
  --color-card:       var(--card);
  --color-border:     var(--border);
  --color-bg:         var(--bg);
}

/* ══ Base ════════════════════════════════════════════════════ */
* { box-sizing: border-box; }

html, body { overflow-x: hidden; max-width: 100%; }

body {
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-assistant), "Assistant", Arial, sans-serif;
}

/* ══ Brand utility classes ════════════════════════════════════ */
.text-gradient-gold {
  background: var(--grad-text-gold);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.bg-gradient-gold  { background: var(--grad-gold); }
.bg-gradient-card  { background: var(--grad-card); }
.bg-gradient-hero  { background: var(--grad-hero); }

.glow-gold {
  box-shadow: 0 0 40px rgba(201,150,74,0.18), 0 0 80px rgba(201,150,74,0.08);
}

.shadow-card { box-shadow: var(--shadow-card); }

/* ══ Hero CTA button — full depth + glow + lift ══════════════ */
.btn-cta-hero {
  background: linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%);
  color: #1A1206;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 0 -2px 6px rgba(0,0,0,0.25),
    0 10px 28px rgba(0,0,0,0.35),
    0 0 40px rgba(201,150,74,0.15);
  transition: all 0.25s ease;
}
.btn-cta-hero:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #F0C35A 0%, #D1A14C 50%, #A8843C 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    inset 0 -2px 8px rgba(0,0,0,0.28),
    0 12px 30px rgba(0,0,0,0.38),
    0 0 50px rgba(201,150,74,0.18);
}
.btn-cta-hero:active {
  transform: translateY(0) scale(0.98);
}

/* ══ Primary gold CTA button ══════════════════════════════════ */
.btn-cta-gold {
  background: linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%);
  color: #1A1206;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 0 -2px 6px rgba(0,0,0,0.25),
    0 10px 28px rgba(0,0,0,0.35);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.btn-cta-gold:hover:not(:disabled) {
  background: linear-gradient(135deg, #F0C35A 0%, #D1A14C 50%, #A8843C 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.28),
    inset 0 -2px 8px rgba(0,0,0,0.28),
    0 12px 30px rgba(0,0,0,0.38);
}
.btn-cta-gold:active {
  transform: scale(0.98);
}

/* ══ Dark navy secondary button (inside light cards) ══════════ */
.btn-navy-secondary {
  background: #0F172A;
  color: #F5F1E8;
  border: 1px solid rgba(201,150,74,0.22);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),
    0 4px 14px rgba(0,0,0,0.18);
  transition: background 0.2s ease, border-color 0.15s ease;
}
.btn-navy-secondary:hover {
  background: #162033;
  border-color: rgba(201,150,74,0.35);
}

/* ══ Card hover — subtle gold rim on interaction ══════════════ */
.card-hover {
  transition: box-shadow 0.2s ease;
}
.card-hover:hover {
  box-shadow: 0 0 0 1px rgba(201,150,74,0.32), 0 8px 32px rgba(0,0,0,0.3);
}

/* ══ Gradient border animation ═══════════════════════════════ */
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.border-brand { border-color: var(--border); }

/* ══ Skip link ════════════════════════════════════════════════ */
.skip-link {
  position: fixed;
  top: -999px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 0.75rem 2rem;
  background: var(--gold);
  color: var(--bg);
  font-weight: 700;
  font-size: 1rem;
  border-radius: 0 0 0.75rem 0.75rem;
  text-decoration: none;
  white-space: nowrap;
  transition: top 0.15s;
}
.skip-link:focus {
  top: 0;
  outline: 3px solid var(--fg);
  outline-offset: -3px;
}

/* ══ Keyboard focus indicator ════════════════════════════════ */
:focus-visible {
  outline: 3px solid var(--gold) !important;
  outline-offset: 2px !important;
  border-radius: 4px;
}

/* ══ Accessibility modes ═════════════════════════════════════ */
html.a11y-high-contrast body  { background: #000 !important; color: #fff !important; }
html.a11y-high-contrast a     { color: #ffff00 !important; }
html.a11y-high-contrast button,
html.a11y-high-contrast [role="button"] { border: 2px solid #fff !important; }

html.a11y-highlight-links a {
  text-decoration: underline !important;
  text-underline-offset: 3px !important;
  outline: 2px solid currentColor !important;
  outline-offset: 2px !important;
  border-radius: 2px;
}

html.a11y-stop-animations *,
html.a11y-stop-animations *::before,
html.a11y-stop-animations *::after {
  animation-duration:      0.001ms !important;
  animation-iteration-count: 1   !important;
  transition-duration:     0.001ms !important;
  scroll-behavior:         auto   !important;
}

html.a11y-reading-mode body {
  background: #fffef5 !important;
  color: #1a1a1a  !important;
}
html.a11y-reading-mode main,
html.a11y-reading-mode [role="main"] {
  max-width:     720px      !important;
  margin-inline: auto       !important;
  padding:       2rem 1.5rem !important;
  background:    #ffffff    !important;
  box-shadow:    0 0 0 100vmax #fffef5 !important;
  font-size:     1.1rem     !important;
  line-height:   1.9        !important;
}
html.a11y-reading-mode img { max-width: 100% !important; }

/* ══ Product landing pages ═══════════════════════════════════════ */
.lp-section { padding: 56px 20px; max-width: 720px; margin: 0 auto; }
.lp-divider { height: 1px; background: var(--border); }

/* Sticky bar — bottom fixed */
.lp-sticky { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(8,12,20,0.97); backdrop-filter: blur(12px); border-top: 1px solid var(--border); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; z-index: 100; transform: translateY(100%); transition: transform 0.3s ease; }
.lp-sticky.visible { transform: translateY(0); }
.lp-sticky-text { font-size: 13px; color: var(--fg-muted); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lp-sticky-text strong { color: var(--fg); font-size: 15px; }
.lp-sticky-cta { background: var(--grad-gold); border: none; border-radius: 10px; padding: 10px 24px; font-size: 14px; font-weight: 800; color: #080C14; cursor: pointer; font-family: 'Assistant', sans-serif; white-space: nowrap; flex-shrink: 0; }

/* Content placeholders */
.content-placeholder { background: rgba(232,185,74,0.08); border: 2px dashed rgba(232,185,74,0.25); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px; }
.cp-icon { font-size: 28px; margin-bottom: 8px; }
.cp-title { font-size: 14px; font-weight: 800; color: var(--gold-light); margin-bottom: 6px; }
.cp-desc { font-size: 12px; color: var(--fg-muted); line-height: 1.6; }
.cp-action { display: inline-block; margin-top: 10px; background: rgba(232,185,74,0.15); border: 1px solid rgba(232,185,74,0.3); border-radius: 6px; padding: 5px 12px; font-size: 11px; font-weight: 700; color: var(--gold-light); letter-spacing: 0.5px; }

/* Hero */
.hero-section { background: #080C14; padding: 44px 20px 40px; text-align: center; position: relative; overflow: hidden; border-bottom: 1px solid var(--border); }
.hero-section::before { content: ''; position: absolute; top: -120px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(201,150,74,0.08) 0%, transparent 65%); pointer-events: none; }
.hero-hook { font-size: clamp(24px, 5vw, 40px); font-weight: 900; color: var(--fg); line-height: 1.15; letter-spacing: -1px; margin-bottom: 20px; max-width: 600px; margin-left: auto; margin-right: auto; }
.hero-hook em { background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-style: normal; }

/* VSL */
.vsl-wrap { max-width: 260px; margin: 0 auto 20px; }
.vsl-inner { border-radius: 16px; overflow: hidden; border: 1px solid var(--border); aspect-ratio: 9/16; background: var(--card); position: relative; }
.vsl-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; cursor: pointer; }
.vsl-play { width: 56px; height: 56px; border-radius: 50%; background: var(--grad-gold); display: flex; align-items: center; justify-content: center; font-size: 22px; color: #080C14; transition: transform 0.2s; }
.vsl-placeholder:hover .vsl-play { transform: scale(1.1); }
.vsl-label { font-size: 12px; color: var(--fg-muted); font-weight: 600; }
.vsl-time { font-size: 10px; color: rgba(158,153,144,0.5); }
.vsl-badge { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); border-radius: 5px; padding: 2px 8px; font-size: 9px; color: rgba(255,255,255,0.7); font-weight: 700; letter-spacing: 1px; }

/* Hero CTA + stats */
.hero-cta { display: inline-block; background: var(--grad-gold); border: none; border-radius: 14px; padding: 15px 36px; font-size: 17px; font-weight: 800; color: #080C14; cursor: pointer; font-family: 'Assistant', sans-serif; text-decoration: none; transition: opacity 0.2s; margin-bottom: 10px; }
.hero-cta:hover { opacity: 0.85; }
.hero-note { font-size: 12px; color: rgba(158,153,144,0.45); }
.stats-strip { margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--border); }
.hero-eyebrow { display: inline-block; background: rgba(201,150,74,0.1); border: 1px solid rgba(201,150,74,0.2); border-radius: 20px; padding: 5px 14px; font-size: 11px; font-weight: 700; color: var(--gold); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
.hero-stats { display: flex; justify-content: center; gap: 36px; flex-wrap: wrap; }
.stat-val { font-size: 28px; font-weight: 900; background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 4px; }
.stat-label { font-size: 11px; color: var(--fg-muted); }

/* Section labels */
.lp-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); margin-bottom: 8px; }
.lp-section-title { font-size: clamp(22px, 4vw, 30px); font-weight: 900; color: var(--fg); line-height: 1.2; letter-spacing: -0.5px; margin-bottom: 14px; }
.lp-section-title em { background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; font-style: normal; }
.lp-section-desc { font-size: 15px; color: var(--fg-muted); line-height: 1.75; margin-bottom: 24px; }

/* Problem */
.problem-list { display: flex; flex-direction: column; gap: 10px; }
.problem-item { display: flex; gap: 14px; align-items: flex-start; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; }
.problem-icon { font-size: 20px; flex-shrink: 0; }
.problem-text { font-size: 14px; color: var(--fg-muted); line-height: 1.65; }
.problem-text strong { color: var(--fg); font-weight: 700; }
.lp-agitation { background: rgba(224,85,85,0.1); border: 1px solid rgba(224,85,85,0.2); border-right: 3px solid #E05555; border-radius: 12px; padding: 18px 22px; margin-top: 14px; }
.lp-agitation-title { font-size: 11px; font-weight: 700; color: #E05555; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 7px; }
.lp-agitation-text { font-size: 14px; color: var(--fg-muted); line-height: 1.7; }
.lp-agitation-text strong { color: var(--fg); font-weight: 700; }

/* Modules accordion */
.modules-list { display: flex; flex-direction: column; gap: 6px; }
.module-acc { background: linear-gradient(145deg, #1D2430, #111620); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.module-acc-btn { width: 100%; background: none; border: none; padding: 16px 18px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; font-family: 'Assistant', sans-serif; }
.module-acc-left { display: flex; align-items: center; gap: 12px; }
.module-num-badge { background: rgba(201,150,74,0.12); border: 1px solid rgba(201,150,74,0.2); border-radius: 6px; padding: 3px 8px; font-size: 10px; font-weight: 700; color: var(--gold); flex-shrink: 0; }
.module-acc-title { font-size: 14px; font-weight: 800; color: var(--fg); text-align: right; }
.module-acc-icon { font-size: 16px; color: var(--gold); transition: transform 0.3s; flex-shrink: 0; display: inline-block; }
.module-acc.open .module-acc-icon { transform: rotate(45deg); }
.module-acc-body { max-height: 0; overflow: hidden; transition: max-height 0.3s ease; }
.module-acc.open .module-acc-body { max-height: 140px; }
.module-acc-desc { padding: 12px 18px 16px; font-size: 13px; color: var(--fg-muted); line-height: 1.6; border-top: 1px solid rgba(44,50,62,0.4); }

/* NFE (not for everyone) */
.nfe-box { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 26px; }
.nfe-box-title { font-size: 20px; font-weight: 900; color: var(--fg); margin-bottom: 18px; line-height: 1.3; }
.nfe-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.nfe-col-title { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
.nfe-col-title.red { color: #E05555; }
.nfe-col-title.green { color: #4CAF82; }
.nfe-item { display: flex; gap: 8px; font-size: 13px; color: var(--fg-muted); margin-bottom: 8px; line-height: 1.5; }

/* Hadar box */
.hadar-box { background: linear-gradient(145deg, #1D2430, #111620); border: 1px solid var(--border); border-radius: 16px; padding: 26px; display: flex; gap: 18px; align-items: flex-start; flex-wrap: wrap; }
.hadar-photo-wrap { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.hadar-photo-placeholder { font-size: 11px; color: var(--fg-muted); text-align: center; padding: 8px; line-height: 1.3; }
.hadar-name { font-size: 16px; font-weight: 800; color: var(--fg); margin-bottom: 2px; }
.hadar-role { font-size: 11px; color: var(--gold); font-weight: 700; letter-spacing: 0.5px; margin-bottom: 10px; }
.hadar-text { font-size: 13px; color: var(--fg-muted); line-height: 1.7; }
.hadar-text strong { color: var(--fg); font-weight: 700; }

/* Proof */
.proof-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 16px; }
.proof-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 18px; text-align: center; }
.proof-val { font-size: 24px; font-weight: 900; background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; margin-bottom: 4px; }
.proof-label { font-size: 11px; color: var(--fg-muted); line-height: 1.4; }
.testimonials-list { display: flex; flex-direction: column; gap: 10px; }
.testimonial-card { background: var(--card); border: 1px solid var(--border); border-right: 3px solid var(--gold); border-radius: 12px; padding: 18px 20px; }
.testimonial-photo { width: 40px; height: 40px; border-radius: 50%; background: var(--card-soft); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--fg-muted); text-align: center; flex-shrink: 0; margin-bottom: 10px; }
.testimonial-text { font-size: 14px; color: var(--fg-muted); line-height: 1.7; font-style: italic; margin-bottom: 10px; }
.testimonial-text strong { color: var(--fg); font-style: normal; font-weight: 700; }
.testimonial-author { font-size: 12px; font-weight: 700; color: var(--gold); }
.testimonial-role { font-size: 11px; color: var(--fg-muted); }

/* Price box */
.price-box-new { background: var(--card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 14px; }
.price-top { padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid var(--border); position: relative; }
.price-top::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A); }
.price-tag-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--fg-muted); margin-bottom: 12px; }
.price-amount { display: flex; align-items: flex-start; justify-content: center; gap: 4px; line-height: 1; margin-bottom: 8px; }
.price-currency { font-size: 24px; font-weight: 700; color: var(--gold); margin-top: 10px; }
.price-number { font-size: 72px; font-weight: 900; background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -3px; line-height: 1; }
.price-desc { font-size: 13px; color: var(--fg-muted); }
.price-includes { padding: 20px 24px; display: flex; flex-direction: column; gap: 12px; border-bottom: 1px solid var(--border); }
.include-item { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--fg-muted); }
.include-check { width: 22px; height: 22px; border-radius: 50%; background: rgba(76,175,130,0.1); border: 1px solid rgba(76,175,130,0.25); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; color: #4CAF82; }
.include-val { font-size: 13px; font-weight: 700; color: var(--gold); flex-shrink: 0; }
.daily-reframe { background: rgba(201,150,74,0.06); padding: 14px 24px; text-align: center; font-size: 14px; color: var(--fg-muted); line-height: 1.6; }
.daily-reframe strong { color: var(--gold); font-weight: 800; }

/* Micro-commitment */
.micro-wrap { margin-top: 8px; }
.progress-container { margin-bottom: 20px; }
.progress-header { display: flex; justify-content: space-between; font-size: 11px; color: var(--fg-muted); margin-bottom: 8px; }
.progress-pct { color: var(--gold); font-weight: 700; }
.progress-track { background: var(--border); border-radius: 99px; height: 5px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--grad-gold); border-radius: 99px; transition: width 0.5s ease; }
.micro-step { display: none; }
.micro-step.active { display: block; animation: stepIn 0.35s ease both; }
@keyframes stepIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin { to { transform: rotate(360deg); } }
.micro-card { background: var(--card-soft); border: 1px solid var(--border); border-radius: 14px; padding: 22px; text-align: center; }
.micro-step-label { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 10px; }
.micro-question { font-size: 16px; font-weight: 800; color: var(--fg); margin-bottom: 18px; line-height: 1.3; }
.micro-options { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 14px; }
.micro-option { background: var(--card); border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 600; color: var(--fg-muted); cursor: pointer; font-family: 'Assistant', sans-serif; transition: all 0.2s; border: none; }
.micro-option:hover, .micro-option.selected { outline: 1.5px solid var(--gold); color: var(--gold); background: rgba(201,150,74,0.08); }
.micro-next { display: none; background: var(--grad-gold); border: none; border-radius: 10px; padding: 11px 28px; font-size: 14px; font-weight: 800; color: #080C14; cursor: pointer; font-family: 'Assistant', sans-serif; }
.micro-next.show { display: inline-block; }
.micro-skip { display: block; margin-top: 12px; font-size: 12px; color: var(--fg-muted); text-decoration: underline; cursor: pointer; background: none; border: none; font-family: 'Assistant', sans-serif; width: 100%; text-align: center; }
.micro-result { background: rgba(76,175,130,0.1); border: 1px solid rgba(76,175,130,0.2); border-radius: 10px; padding: 14px 16px; text-align: center; margin-bottom: 14px; font-size: 14px; color: #4CAF82; font-weight: 700; line-height: 1.5; }

/* CTA button */
.lp-cta-btn { display: block; width: 100%; background: var(--grad-gold); border: none; border-radius: 14px; padding: 18px; font-size: 18px; font-weight: 900; color: #080C14; cursor: pointer; font-family: 'Assistant', sans-serif; text-align: center; text-decoration: none; transition: opacity 0.2s; margin-bottom: 10px; line-height: 1.3; }
.lp-cta-btn:hover { opacity: 0.85; }
.lp-cta-note { font-size: 11px; color: var(--fg-muted); text-align: center; line-height: 1.5; }

/* FAQ */
.faq-items { }
.faq-item { border-bottom: 1px solid var(--border); overflow: hidden; }
.faq-q { width: 100%; background: none; border: none; padding: 16px 0; font-size: 15px; font-weight: 700; color: var(--fg); text-align: right; cursor: pointer; font-family: 'Assistant', sans-serif; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.faq-icon { font-size: 18px; color: var(--gold); flex-shrink: 0; transition: transform 0.3s; display: inline-block; }
.faq-item.open .faq-icon { transform: rotate(45deg); }
.faq-a { font-size: 14px; color: var(--fg-muted); line-height: 1.7; max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s; }
.faq-item.open .faq-a { max-height: 300px; padding-bottom: 16px; }

/* Final + Footer */
.lp-final { background: #080C14; border-top: 1px solid var(--border); padding: 52px 20px; text-align: center; }
.lp-final-title { font-size: clamp(20px, 4vw, 28px); font-weight: 900; color: var(--fg); line-height: 1.3; margin-bottom: 10px; }
.lp-final-sub { font-size: 14px; color: var(--fg-muted); margin-bottom: 24px; }
.lp-footer { background: #060A10; border-top: 1px solid var(--border); padding: 26px 20px 60px; text-align: center; }
.lp-footer-logo { font-size: 16px; font-weight: 800; background: var(--grad-gold); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 6px; }
.lp-footer-signal { font-size: 13px; color: rgba(158,153,144,0.3); direction: ltr; }
.lp-footer-signal span { color: var(--gold); }
.lp-footer-links { display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
.lp-footer-links a { color: var(--fg-muted); font-size: 12px; text-decoration: none; }
.lp-footer-company { font-size: 11px; color: rgba(158,153,144,0.4); margin-top: 4px; }

@media (max-width: 580px) {
  .proof-grid { grid-template-columns: 1fr 1fr; }
  .nfe-grid { grid-template-columns: 1fr; }
  .hero-stats { gap: 24px; }
  .hadar-box { flex-direction: column; align-items: center; text-align: center; }
}
```

