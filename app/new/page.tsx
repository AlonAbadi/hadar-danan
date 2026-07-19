import type { Metadata } from "next";
import Image from "next/image";
import dynamic from "next/dynamic";
import { TrackedCta } from "./TrackedCta";
import { ChevronDown } from "lucide-react";
import { SignalCanvas } from "./SignalCanvas";
import { HexDefs, HoneyHex, IcAI, IcCopy, IcLost, IcSignal, IcStrategy, IcContent, IcData, IcHuman, IcLasting, IcSoul } from "./glyphs";

// Reused ORIGINAL homepage elements (rendered as-is; their behavior is not
// changed for any other page). This restores the exact existing design.
const StatsSection     = dynamic(() => import("@/components/landing/StatsSection").then(m => ({ default: m.StatsSection })));
const SocialProofStrip = dynamic(() => import("@/components/SocialProofStrip"));

/**
 * /new — ISOLATED experimental homepage (two-doors concept).
 * Restores the ORIGINAL homepage design for every reused element: the hero
 * treatment of Hadar's photo (full-bleed + mask fade, mobile + desktop), the
 * gold button style, and the real StatsSection / SocialProofStrip / Philosophy
 * components. Only the layout intent (two doors) is new. Does not touch the
 * existing homepage, /kriah, /strategy, or any shared behavior. noindex.
 */
export const metadata: Metadata = {
  title: "הדר דנן",
  robots: { index: false, follow: false },
  alternates: {},
};

const TESTIMONIALS = [
  { text: "הצלחתם להפוך את הנקודה שהכי קשה לי בעסק לנקודת חוזקה, ואני אפילו נהנה מזה עכשיו. אין עליכם, תודה ענקית.", name: "רועי מנדלמן" },
  { text: "אחרי אכזבות מחברות אחרות, סוף סוף מצאתי צוות מקצועי וקשוב. הם לקחו את העסק שלי כמה צעדים קדימה עם תוכן מדויק שהביא לי הרבה פניות.", name: "גל מסס" },
];

const HEADLINE = "אם כולם אומרים את מה שאתה אומר, למה שיבחרו בך?";
const LEDE = "מצא את המסר שאי אפשר להעתיק, והפוך אותו לעסק שגדל, ללקוחות הנכונים ולתחושה טובה בעשייה.";

type LadderItem = { title: string; price: string; original?: string; save?: string; tag?: string; href: string; img: string; pos: string; desc: string };
const LADDER: LadderItem[] = [
  {
    title: "כוורת האות", price: "590 ₪", original: "980 ₪", save: "40% הנחה", tag: "כולל את אתגר 7 הימים",
    href: "/signal-hive", img: "/hive.jpg", pos: "center 26%",
    desc: "שכבת ההפעלה: אתגר 7 הימים, ערכת תוכן וערכת ויזואל, ו-7 בימויים אישיים. הכל נגזר מהאות שלכם.",
  },
  {
    title: "הסדנה", price: "1,080 ₪", original: "1,800 ₪", save: "40% הנחה",
    href: "/workshop", img: "/sadna.jpg", pos: "center 20%",
    desc: "יום אחד בקבוצה קטנה. הופכים את האות לתוכן שמייצר תוצאות. סכום הכוורת מתקזז מהסדנה.",
  },
  {
    title: "יום צילום פרימיום", price: "14,000 ₪",
    href: "/premium", img: "/shooting.jpg", pos: "center 28%",
    desc: "יום צילום מלא, אחד על אחד. 14 סרטונים מוכנים לפרסום, בנויים כולם סביב האות שלכם.",
  },
];

function Chk() {
  return (
    <svg viewBox="0 0 20 20" className="nh-chk" aria-hidden>
      <path d="M4 10.6l3.6 3.6L16 5.4" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function NewHome() {
  return (
    <div dir="rtl" className="nh-root">
      <style>{NH_CSS}</style>
      <HexDefs />

      {/* Top banner (global nav) + footer are the site's originals — restored
          per Alon. Nav comes from the global layout (LayoutShell no longer hides
          /new); the footer below mirrors the existing homepage footer. */}

      <main>
        {/* ══ HERO — original treatment restored ══ */}
        <section style={{ overflow: "hidden", background: "#0B1220" }}>

          {/* MOBILE: full-bleed photo, bottom-anchored content (original design) */}
          <div className="md:hidden" style={{ position: "relative", height: "88svh" }}>
            <Image src="/hadar1.jpg" alt="הדר דנן" fill priority sizes="100vw"
              style={{ objectFit: "cover", objectPosition: "center 10%" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #080C14 0%, rgba(8,12,20,0.95) 22%, rgba(8,12,20,0.85) 38%, rgba(8,12,20,0.6) 56%, rgba(8,12,20,0.3) 70%, transparent 85%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, #080C14 0%, rgba(8,12,20,0.6) 25%, transparent 55%)" }} />
            <div style={{ position: "absolute", bottom: "40px", left: 0, right: 0, padding: "0 24px", direction: "rtl", textAlign: "right" }}>
              <div className="nh-eyebrow"><span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span> · הדרך</div>
              <h1 style={{ color: "#EDE9E1", fontWeight: 900, fontSize: "clamp(1.8rem, 7vw, 2.7rem)", lineHeight: 1.14, letterSpacing: "-0.02em", marginBottom: 12, whiteSpace: "pre-line" }}>{HEADLINE}</h1>
              <p style={{ color: "#AAB0BD", fontSize: "clamp(0.95rem, 2.2vw, 1.05rem)", lineHeight: 1.65, marginBottom: 16 }}>{LEDE}</p>
              <TrackedCta dest="kriah" placement="hero" className="nh-gold nh-gold-hero" style={{ width: "100%", marginBottom: 10 }}>לגלות את ה־TrueSignal שלי — בחינם</TrackedCta>
              <TrackedCta dest="strategy" placement="hero" className="nh-out nh-out-hero" style={{ width: "100%" }}>לעבוד ישירות עם הדר</TrackedCta>
              <div className="nh-priceline" style={{ textAlign: "center", marginTop: 7 }}>פגישת אסטרטגיה אישית החל מ־4,000 ₪</div>
              <div className="nh-trust">קריאה אישית · ללא עלות · ללא כרטיס אשראי</div>
            </div>
          </div>

          {/* DESKTOP: full-bleed photo left with mask fade, text panel right (original design) */}
          <div className="hidden md:block" style={{ position: "relative", minHeight: "100vh" }}>
            <div style={{ position: "absolute", top: 0, left: "-5%", height: "163%", width: "auto", display: "inline-block" }}>
              <Image src="/hadar1.jpg" alt="הדר דנן" width={842} height={1264} priority sizes="50vw" quality={80}
                style={{ height: "100%", width: "auto", maxWidth: "none", display: "block",
                  WebkitMaskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)",
                  maskImage: "linear-gradient(to right, black 0%, black 55%, transparent 100%)" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(13,16,24,0.4) 0%, transparent 30%)" }} />
            <div style={{ position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)", width: "46%", padding: "0 72px 0 0", direction: "rtl", textAlign: "right" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(201,150,74,0.12)", border: "1px solid rgba(201,150,74,0.32)", borderRadius: 9999, padding: "5px 14px", marginBottom: 22 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9964A", flexShrink: 0 }} />
                <span style={{ color: "#E8B94A", fontSize: 10, letterSpacing: "0.12em", fontWeight: 700 }}>הדרך של <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></span>
              </div>
              <h1 style={{ color: "#EDE9E1", fontWeight: 800, fontSize: "clamp(2rem, 2.6vw, 3rem)", lineHeight: 1.2, marginBottom: 18, whiteSpace: "pre-line" }}>{HEADLINE}</h1>
              <p style={{ color: "#AAB0BD", fontSize: "1rem", lineHeight: 1.78, marginBottom: 30, maxWidth: "42ch" }}>{LEDE}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
                <TrackedCta dest="kriah" placement="hero" className="nh-gold nh-gold-hero">לגלות את ה־TrueSignal שלי — בחינם</TrackedCta>
                <TrackedCta dest="strategy" placement="hero" className="nh-out nh-out-hero">לעבוד ישירות עם הדר</TrackedCta>
                <div className="nh-priceline" style={{ textAlign: "center" }}>פגישת אסטרטגיה אישית החל מ־4,000 ₪</div>
              </div>
              <div className="nh-trust">קריאה אישית · ללא עלות · ללא כרטיס אשראי</div>
            </div>
          </div>
        </section>

        {/* ══ Proof — reused original components ══ */}
        <StatsSection />
        <SocialProofStrip />

        {/* ══ Two paths ══ */}
        <section className="nh-section">
          <h2 className="nh-h2 nh-h2-tight">שתי דרכים. אותה מטרה: הלקוחות הנכונים, ומכירה שנעשית כמעט לבד.</h2>
          <p className="nh-section-sub">כשברור מי אתם, אתם מפסיקים לרדוף אחרי כל עצה. הלקוחות הנכונים מגיעים דווקא אליכם, והמכירה כבר קלה.</p>
          <div className="nh-cards">
            <article className="nh-pc nh-pc-free">
              <div className="nh-pc-top">
                <HoneyHex size="md"><IcSignal /></HoneyHex>
                <span className="nh-pc-tag nh-pc-tag-free">חינם</span>
              </div>
              <h3 className="nh-pc-title">גלו את האות שלכם</h3>
              <p className="nh-pc-desc">כמה שאלות קצרות על העסק, ואז קריאה אישית שמנסחת במילים מה אנשים מקבלים דווקא מכם.</p>
              <ul className="nh-pc-list">
                {["כמה שאלות קצרות על העסק", "קריאה אישית שמנסחת את האות במילים", "מה שרק אתם יכולים להביא"].map((b) => (
                  <li key={b}><span className="nh-pc-chk nh-pc-green"><Chk /></span>{b}</li>
                ))}
              </ul>
              <TrackedCta dest="kriah" placement="path_card" className="nh-out nh-pc-cta">להתחיל את הקריאה</TrackedCta>
            </article>
            <article className="nh-pc nh-pc-paid">
              <div className="nh-pc-top">
                <HoneyHex gold size="md"><IcStrategy /></HoneyHex>
                <span className="nh-pc-tag nh-pc-tag-paid">מ־4,000 ₪</span>
              </div>
              <h3 className="nh-pc-title">אחד על אחד עם הדר</h3>
              <p className="nh-pc-desc">חשיבה יצירתית בלייב שהופכת ניסיון ומסר לאסטרטגיה ולנכסים שאפשר לצאת איתם החוצה.</p>
              <ul className="nh-pc-list">
                {["חשיבה יצירתית בלייב, אחד על אחד", "אסטרטגיה עסקית לפני שיווקית", "מפת דרכים ונכסים לצאת איתם"].map((b) => (
                  <li key={b}><span className="nh-pc-chk nh-pc-gold-c"><Chk /></span>{b}</li>
                ))}
              </ul>
              <TrackedCta dest="strategy" placement="path_card" className="nh-gold nh-pc-cta">לראות איך עובדים עם הדר</TrackedCta>
            </article>
          </div>
        </section>

        {/* ══ Recognition — you tried everything ══ */}
        <section className="nh-recog">
          <span className="nh-bee-wm nh-bee-wm-r" aria-hidden>
            <Image src="/beegood_logo.png" alt="" width={266} height={210} />
          </span>
          <div className="nh-recog-inner">
            <div className="nh-eyebrow2">הכרה</div>
            <h2 className="nh-h2">עדיין לא בטוח <span className="nh-gd">מה הצעד הבא?</span></h2>
            <p className="nh-recog-sub">ניסית כבר הרבה. אולי מה שחסר הוא בסיס אחד ברור.</p>
            <div className="nh-recog-items">
              <div className="nh-recog-item"><HoneyHex size="md"><IcAI /></HoneyHex><span className="nh-recog-txt">שאלת את ה-AI.</span></div>
              <div className="nh-recog-item"><HoneyHex size="md"><IcCopy /></HoneyHex><span className="nh-recog-txt">חשבת להעתיק מהמתחרים.</span></div>
              <div className="nh-recog-item"><HoneyHex size="md"><IcLost /></HoneyHex><span className="nh-recog-txt">כבר לא יודע איזה תוכן להעלות.</span></div>
            </div>
          </div>
        </section>

        {/* ══ Noise → Signal — the living signal (from /new/live) ══ */}
        <section className="nh-journey">
          <div className="nh-journey-in">
            <div className="nh-eyebrow2">מרעש לסיגנל</div>
            <div className="nh-beats">
              {[
                { t: "רעש", on: false }, { t: "דפוסים", on: false },
                { t: "סיגנל", on: true }, { t: "צמיחה", on: true },
              ].map((b, i, arr) => (
                <span className="nh-beat-wrap" key={b.t}>
                  <span className={`nh-beat${b.on ? " on" : ""}`}>{b.t}</span>
                  {i < arr.length - 1 && <span className="nh-beat-sep" aria-hidden />}
                </span>
              ))}
            </div>
            <SignalCanvas trigger="inview" className="nh-journey-band" />
            <p className="nh-journey-line">הרעש הוא של כולם. <span className="nh-gd">האות הוא רק שלך.</span></p>
          </div>
        </section>

        {/* ══ System — the signal drives everything ══ */}
        <section className="nh-sys-sec">
          <div className="nh-sys-grid">
            <div className="nh-sys-copy">
              <div className="nh-eyebrow2">בהירות הופכת למערכת</div>
              <h2 className="nh-h2">הסיגנל שלך <span className="nh-gd">מניע הכל.</span></h2>
              <p>כשהסיגנל שלך ברור, כל מה שאתה בונה מיושר לאותו כיוון. לא עוד רעיונות מפוזרים, אלא מערכת אחת שמושכת לאותו מקום.</p>
            </div>
            <div className="nh-sys-diagram">
              <div className="nh-sys-node">
                <span className="nh-sys-glow" aria-hidden />
                <HoneyHex gold size="lg"><IcSignal /></HoneyHex>
                <b>הסיגנל שלך</b>
                <span className="nh-sys-node-sub">מי אתה, ומה רק אתה יכול להציע</span>
              </div>
              <div className="nh-sys-down" aria-hidden><ChevronDown size={22} /></div>
              <div className="nh-sys-kids">
                <div className="nh-sys-kid"><HoneyHex size="md"><IcStrategy /></HoneyHex><span className="nh-kid-txt"><b>אסטרטגיה</b><span>על מה להתמקד. מה חשוב עכשיו.</span></span></div>
                <div className="nh-sys-kid"><HoneyHex size="md"><IcContent /></HoneyHex><span className="nh-kid-txt"><b>תוכן</b><span>איך הסיגנל הופך לתקשורת.</span></span></div>
                <div className="nh-sys-kid"><HoneyHex size="md"><IcData /></HoneyHex><span className="nh-kid-txt"><b>דאטה</b><span>מה עובד. מה מצטבר.</span></span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Principles + punch ══ */}
        <section className="nh-princ-sec">
          <span className="nh-bee-wm nh-bee-wm-c" aria-hidden>
            <Image src="/beegood_logo.png" alt="" width={456} height={360} />
          </span>
          <div className="nh-princ">
            <div className="nh-princ-item"><HoneyHex size="lg"><IcHuman /></HoneyHex><div className="nh-princ-txt"><h4>האדם במרכז</h4><p>אנחנו מאמינים באנשים. הטכנולוגיה כאן כדי לשרת אותם, לא להפך.</p></div></div>
            <div className="nh-princ-item"><HoneyHex size="lg"><IcLasting /></HoneyHex><div className="nh-princ-txt"><h4>נבנה להחזיק</h4><p>בהירות היום, צמיחה מחר. השפעה שנשארת, לא טרנד שחולף.</p></div></div>
            <div className="nh-princ-item"><HoneyHex size="lg"><IcSoul /></HoneyHex><div className="nh-princ-txt"><h4>מדע ונשמה</h4><p>דאטה ופסיכולוגיה. אסטרטגיה ואינטואיציה. ביחד, לא בנפרד.</p></div></div>
          </div>
          <figure className="nh-quote">
            <div className="nh-quote-mark" aria-hidden>”</div>
            <blockquote className="nh-quote-text">אנחנו לא מוכרים סרטונים.<br />אנחנו בונים את <span className="nh-gd">הבהירות</span> שגורמת לתוכן לעבוד.</blockquote>
            <div className="nh-quote-sig">
              <span className="nh-quote-line" aria-hidden />
              <span className="nh-quote-brand"><span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></span>
              <span className="nh-quote-line" aria-hidden />
            </div>
          </figure>
        </section>

        {/* ══ Testimonials ══ */}
        <section className="nh-section nh-testi-sec">
          <div className="nh-eyebrow2">מה אומרים</div>
          <h2 className="nh-h2">עסקים שכבר מצאו את האות שלהם</h2>
          <div className="nh-tgrid">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="nh-testi">
                <div className="nh-testi-mark" aria-hidden>”</div>
                <div className="nh-stars" aria-hidden>★★★★★</div>
                <blockquote className="nh-testi-q">{t.text}</blockquote>
                <figcaption className="nh-testi-n"><span className="nh-testi-dot" aria-hidden />{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ══ Final CTA ══ */}
        <section className="nh-section nh-final">
          <div className="nh-eyebrow2">הצעד הבא</div>
          <h2 className="nh-h2">איך נכון לכם להתקדם עכשיו?</h2>
          <div className="nh-final-grid">
            <div className="nh-final-opt nh-final-free">
              <span className="nh-pc-tag nh-pc-tag-free">חינם</span>
              <div className="nh-final-lbl">לגלות את האות שלי</div>
              <TrackedCta dest="kriah" placement="final_cta" className="nh-out nh-final-cta">להתחיל את הקריאה</TrackedCta>
            </div>
            <div className="nh-final-opt nh-final-paid">
              <span className="nh-pc-tag nh-pc-tag-paid">מ־4,000 ₪</span>
              <div className="nh-final-lbl">לעבוד ישירות עם הדר</div>
              <TrackedCta dest="strategy" placement="final_cta" className="nh-gold nh-final-cta">לראות את פגישת האסטרטגיה</TrackedCta>
            </div>
          </div>
          <div className="nh-trust">קריאה אישית · ללא עלות · ללא כרטיס אשראי</div>
        </section>

        {/* ══ Value ladder — deeper offerings ══ */}
        <section className="nh-ladder-sec">
          <div className="nh-eyebrow2">המשך הדרך</div>
          <h2 className="nh-h2">אחרי שהאות ברור, ממשיכים לבנות</h2>
          <p className="nh-section-sub">כל שלב נגזר מאותו אות אחד. אתם בוחרים עד לאן.</p>
          <div className="nh-ladder">
            {LADDER.map((p) => (
              <a key={p.href} href={p.href} className="nh-lcard">
                <div className="nh-lcard-media">
                  <img src={p.img} alt={p.title} loading="lazy" style={{ objectPosition: p.pos }} />
                  <div className="nh-lcard-pricewrap">
                    <span className="nh-lcard-price">{p.price}</span>
                    {p.original && <span className="nh-lcard-was">{p.original}</span>}
                  </div>
                  {p.tag ? <span className="nh-lcard-tag">{p.tag}</span> : p.save ? <span className="nh-lcard-save">{p.save}</span> : null}
                </div>
                <div className="nh-lcard-body">
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <span className="nh-lcard-cta">לפרטים ←</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      {/* ══ Footer — mirrors the existing homepage footer ══ */}
      <footer className="px-6 py-12" style={{ background: "#101520", paddingBottom: "48px" }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" style={{ color: "#AAB0BD" }}>
            {[
              { label: "בית",        href: "/" },
              { label: "הדרכה",      href: "/training" },
              { label: "אתגר",       href: "/challenge" },
              { label: "כוורת האות", href: "/signal-hive" },
              { label: "סדנה",       href: "/workshop" },
              { label: "אסטרטגיה",   href: "/strategy" },
              { label: "פרימיום",    href: "/premium" },
              { label: "שותפות",     href: "/partnership" },
              { label: "אזור אישי",  href: "/my" },
            ].map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white transition" style={{ color: "#E8B94A" }}>{link.label}</a>
            ))}
          </nav>
          <div className="flex flex-col items-center gap-2 text-xs" style={{ color: "#AAB0BD" }}>
            <div className="flex gap-4">
              <a href="/privacy" className="hover:text-white transition">מדיניות פרטיות</a>
              <a href="/terms" className="hover:text-white transition">תנאי שימוש</a>
              <a href="/accessibility" className="hover:text-white transition">הצהרת נגישות</a>
            </div>
            <p className="font-medium">אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span></p>
            <p>© 2026 הדר דנן בע״מ | ח.פ. 516791555 · כל הזכויות שמורות</p>
            <p>החילזון 5, רמת גן | 053-9566961</p>
            <p className="mt-1"><a href="/unsubscribe" className="hover:text-white transition">לביטול הסכמה לדיוור</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Scoped under .nh-* — used ONLY on /new. Gold button matches the original homepage exactly.
const NH_CSS = `
.nh-root{--bg:#080C14;--bg2:#0D1018;--card:#141820;--soft:#1D2430;--border:#2C323E;--line:#232936;--gold:#C9964A;--gold-l:#E8B94A;--green:#7FD49B;--fg:#EDE9E1;--muted:#AAB0BD;background:var(--bg);color:var(--fg);min-height:100vh;overflow-x:hidden}
.nh-root *{box-sizing:border-box}
.nh-gold{background:linear-gradient(180deg,#f4d27a 0%,#e8b942 52%,#d59b1f 100%);color:#2a1d05;font-weight:800;text-decoration:none;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;line-height:1.2;box-shadow:0 1px 0 rgba(255,255,255,.55) inset,0 -10px 22px rgba(157,110,12,.35) inset,0 18px 34px -12px rgba(214,155,31,.55),0 6px 14px -6px rgba(0,0,0,.55)}
.nh-gold-sm{padding:9px 18px;font-size:14px}
.nh-gold-hero{padding:16px 40px;font-size:1.05rem}
.nh-out{background:transparent;color:var(--gold-l);font-weight:700;text-decoration:none;border:1px solid rgba(201,150,74,.55);border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;line-height:1.2}
.nh-out-hero{padding:15px 40px;font-size:1rem}

.nh-header{position:sticky;top:0;z-index:50;background:rgba(8,12,20,.86);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nh-hwrap{max-width:1200px;margin:0 auto;height:64px;padding:0 22px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nh-logo{font-size:19px;font-weight:800;color:var(--fg);text-decoration:none;letter-spacing:-.3px;white-space:nowrap}
.nh-nav{display:flex;gap:22px}
.nh-navlink{color:var(--muted);font-size:14.5px;text-decoration:none}
.nh-navlink:hover{color:var(--fg)}
.nh-hcta{display:flex;align-items:center;gap:16px}
.nh-quiet{color:var(--muted);font-size:14px;text-decoration:none}
.nh-quiet:hover{color:var(--fg)}

.nh-eyebrow{font-size:11px;letter-spacing:2px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:12px}
.nh-priceline{font-size:12.5px;color:var(--muted)}
.nh-trust{margin-top:16px;font-size:12px;color:var(--muted);opacity:.85;text-align:center}

.nh-section{max-width:1080px;margin:0 auto;padding:64px 22px}
.nh-h2{font-size:clamp(25px,5.4vw,33px);font-weight:800;line-height:1.28;letter-spacing:-.3px;text-align:center;margin:0 0 26px;text-wrap:balance;color:var(--fg)}

.nh-h2-tight{margin-bottom:14px}
.nh-section-sub{color:var(--muted);font-size:clamp(15.5px,2.4vw,17px);line-height:1.72;text-align:center;max-width:48ch;margin:0 auto 30px}
.nh-cards{display:grid;grid-template-columns:1fr 1fr;gap:18px}

/* two path cards (Option 1 — tiered honey badges) */
.nh-pc{position:relative;display:flex;flex-direction:column;border:1px solid var(--border);background:linear-gradient(180deg,var(--card),#0F131C);border-radius:22px;padding:26px 24px}
.nh-pc-paid{border-color:rgba(201,150,74,.55);background:linear-gradient(170deg,rgba(201,150,74,.13),var(--card) 60%);box-shadow:0 24px 60px -34px rgba(201,150,74,.5)}
.nh-pc-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.nh-pc-tag{font-size:14px;font-weight:800;border-radius:9999px;padding:6px 14px}
.nh-pc-tag-free{color:var(--green);background:rgba(127,212,155,.12);border:1px solid rgba(127,212,155,.35)}
.nh-pc-tag-paid{color:var(--gold-l);background:rgba(201,150,74,.12);border:1px solid rgba(201,150,74,.4)}
.nh-pc-title{font-size:23px;font-weight:800;margin:0 0 10px;color:var(--fg)}
.nh-pc-desc{font-size:15px;line-height:1.68;color:var(--muted);margin:0 0 18px}
.nh-pc-list{list-style:none;margin:0 0 22px;padding:0;display:flex;flex-direction:column;gap:11px}
.nh-pc-list li{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--fg);line-height:1.4}
.nh-pc-chk{flex:none;display:grid;place-items:center;width:20px;height:20px;margin-top:1px}
.nh-chk{width:18px;height:18px}
.nh-pc-green{color:var(--green)}
.nh-pc-gold-c{color:var(--gold-l)}
.nh-pc-cta{width:100%;padding:14px;font-size:15.5px;margin-top:auto}
.nh-card{border:1px solid var(--border);background:var(--card);border-radius:16px;padding:26px 24px;display:flex;flex-direction:column}
.nh-card-gold{border-color:rgba(201,150,74,.55);background:linear-gradient(160deg,rgba(201,150,74,.08),var(--card) 55%)}
.nh-card-t{font-size:20px;font-weight:800;margin:0 0 10px;color:var(--fg)}
.nh-card-d{font-size:14.5px;line-height:1.7;color:var(--muted);margin:0 0 14px;flex:1}
.nh-card-note{font-size:13px;color:var(--fg);margin:0 0 18px;opacity:.9}
.nh-gold-note{color:var(--gold-l);font-weight:700;opacity:1}
.nh-card-cta{width:100%;padding:13px;font-size:15px}

.nh-gd{color:var(--gold-l)}
.nh-eyebrow2{font-size:11px;letter-spacing:3px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:14px;text-align:center}

/* ── soft rounded "honey cell" holders (rounded corners = bee's soft language) ── */
.nh-hx{position:relative;flex:none;display:inline-grid;place-items:center;filter:drop-shadow(0 8px 18px rgba(201,150,74,.32))}
.nh-hx-bg{position:absolute;inset:0;width:100%;height:100%;display:block}
.nh-hx-ico{position:relative;z-index:1;display:grid;place-items:center;color:var(--gold-l)}
.nh-hx-gold .nh-hx-ico{color:#221704}
.nh-ic{width:62%;height:62%;display:block}
.nh-hx-sm{width:54px;height:58px}
.nh-hx-md{width:66px;height:71px}
.nh-hx-lg{width:92px;height:99px}

/* ── faint bee watermark (brand texture behind sections) ── */
.nh-bee-wm{position:absolute;pointer-events:none;z-index:0;opacity:.05}
.nh-bee-wm img{display:block;width:100%;height:auto}
.nh-bee-wm-r{top:20px;right:-44px;width:230px}
.nh-bee-wm-c{top:6px;left:50%;transform:translateX(-50%);width:440px;opacity:.04}

/* recognition */
.nh-recog{position:relative;overflow:hidden;max-width:1000px;margin:0 auto;padding:62px 20px;text-align:center}
.nh-recog-inner{position:relative;z-index:1}
.nh-recog-sub{color:var(--muted);font-size:17px;margin:0 auto 32px;max-width:46ch;line-height:1.75}
.nh-recog-items{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:860px;margin:0 auto}
.nh-recog-item{display:flex;flex-direction:column;align-items:center;gap:18px;padding:30px 18px;border:1px solid var(--border);background:linear-gradient(180deg,var(--card),#0F131C);border-radius:20px;font-size:18px;color:var(--fg);font-weight:700}
.nh-recog-txt{line-height:1.4}

/* journey — branded timeline with a flowing gold signal line */
.nh-journey{position:relative;overflow:hidden;background:#0B0F17;padding:72px 22px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.nh-journey-in{position:relative;z-index:1;max-width:1060px;margin:0 auto;text-align:center}
.nh-beats{display:flex;align-items:center;justify-content:center;gap:0;margin:0 0 22px;flex-wrap:wrap}
.nh-beat-wrap{display:inline-flex;align-items:center}
.nh-beat{font-size:clamp(12px,3.2vw,15px);letter-spacing:2px;font-weight:700;color:var(--muted);text-transform:uppercase}
.nh-beat.on{color:var(--gold-l)}
.nh-beat-sep{width:clamp(16px,6vw,44px);height:1px;background:linear-gradient(90deg,rgba(201,150,74,.15),rgba(201,150,74,.6),rgba(201,150,74,.15));margin:0 10px}
.nh-journey-band{height:clamp(200px,34svh,340px)}
.nh-journey-line{font-size:clamp(19px,3.4vw,28px);font-weight:600;line-height:1.4;margin:26px auto 0;max-width:34ch;color:var(--fg)}
.sig-band{position:relative;width:100%;overflow:hidden;border:1px solid var(--line);border-radius:18px;background:#080C14}
.sig-canvas{display:block;width:100%}

/* system — text + signal tree */
.nh-sys-sec{max-width:1080px;margin:0 auto;padding:76px 22px}
.nh-sys-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.nh-sys-copy{text-align:right}
.nh-sys-copy .nh-eyebrow2,.nh-sys-copy .nh-h2{text-align:right;margin-right:0}
.nh-sys-copy .nh-h2{text-align:right;margin-bottom:14px}
.nh-sys-copy p{color:var(--muted);font-size:16.5px;line-height:1.75;max-width:46ch;margin:0}
.nh-sys-diagram{display:flex;flex-direction:column;align-items:center}
.nh-sys-node{position:relative;width:100%;max-width:340px;border:1px solid rgba(201,150,74,.5);background:linear-gradient(160deg,rgba(201,150,74,.14),var(--card));border-radius:20px;padding:24px 18px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px}
.nh-sys-glow{position:absolute;inset:-34% 6%;background:radial-gradient(circle,rgba(201,150,74,.3),transparent 68%);z-index:0;pointer-events:none}
.nh-sys-node .nh-hex{margin-bottom:8px}
.nh-sys-node b{position:relative;z-index:1;color:var(--gold-l);font-size:18px}
.nh-sys-node-sub{position:relative;z-index:1;font-size:13.5px;color:var(--muted)}
.nh-sys-down{color:var(--gold);margin:12px 0}
.nh-sys-kids{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%;max-width:540px}
.nh-sys-kid{display:flex;flex-direction:column;align-items:center;gap:10px;border:1px solid var(--border);background:var(--card);border-radius:16px;padding:22px 12px 18px;text-align:center}
.nh-kid-txt{display:flex;flex-direction:column;gap:4px;align-items:center}
.nh-sys-kid b{font-size:16px;color:var(--fg)}
.nh-sys-kid span{font-size:13px;color:var(--muted);line-height:1.55}

/* principles + punch */
.nh-princ-sec{position:relative;overflow:hidden;background:#101520;padding:72px 22px;border-top:1px solid var(--line)}
.nh-princ{position:relative;z-index:1;max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.nh-princ-item{display:flex;flex-direction:column;align-items:center;text-align:center;padding:8px}
.nh-princ-item .nh-hex{margin-bottom:18px}
.nh-princ-txt{display:flex;flex-direction:column;align-items:center}
.nh-princ-item h4{font-size:19.5px;font-weight:800;color:var(--fg);margin:0 0 8px}
.nh-princ-item p{font-size:15px;color:var(--muted);line-height:1.66;margin:0}
.nh-approach-punch{position:relative;z-index:1;font-size:clamp(18px,2.6vw,24px);font-weight:800;line-height:1.5;margin:48px auto 0;color:var(--fg);text-align:center;max-width:40ch}
.nh-quote{position:relative;z-index:1;max-width:640px;margin:48px auto 0;border:1px solid var(--border);background:linear-gradient(160deg,#161b25,#0F131C);border-radius:26px;padding:14px 30px 34px;text-align:center;box-shadow:0 26px 60px -32px rgba(0,0,0,.75)}
.nh-quote-mark{font-family:Georgia,'Times New Roman',serif;font-size:74px;line-height:.9;color:var(--gold-l);height:42px;font-weight:700}
.nh-quote-text{font-size:clamp(21px,4.8vw,29px);font-weight:700;line-height:1.46;color:var(--fg);margin:0 0 28px;text-wrap:balance}
.nh-quote-sig{display:flex;align-items:center;justify-content:center;gap:16px}
.nh-quote-line{height:1px;width:clamp(28px,12vw,64px);background:linear-gradient(90deg,transparent,rgba(201,150,74,.7))}
.nh-quote-line:last-child{background:linear-gradient(90deg,rgba(201,150,74,.7),transparent)}
.nh-quote-brand{font-size:12.5px;letter-spacing:3px;color:var(--gold-l);font-weight:700}

/* ── new-section mobile ── */
@media(max-width:760px){
  .nh-recog{padding:52px 18px}
  .nh-recog-items{grid-template-columns:1fr;gap:12px}
  .nh-recog-item{flex-direction:row;justify-content:flex-start;text-align:right;padding:18px 18px;gap:16px}
  .nh-journey{padding:54px 18px}
  .nh-jhead{margin-bottom:36px}
  .nh-flow{flex-direction:column;align-items:stretch;gap:24px;max-width:430px}
  .nh-flow-line{top:30px;bottom:30px;left:auto;right:29px;width:2px;height:auto;background:linear-gradient(180deg,transparent,var(--gold) 10%,var(--gold-l) 50%,var(--gold) 90%,transparent)}
  .nh-flow-step{max-width:none;flex-direction:row;align-items:center;text-align:right;gap:20px}
  .nh-flow-txt{align-items:flex-start}
  .nh-sys-sec{padding:56px 18px}
  .nh-sys-grid{grid-template-columns:1fr;gap:32px}
  .nh-sys-copy,.nh-sys-copy .nh-eyebrow2,.nh-sys-copy .nh-h2{text-align:center}
  .nh-sys-copy p{margin:0 auto}
  .nh-sys-kids{grid-template-columns:1fr;max-width:390px;gap:12px}
  .nh-sys-kid{flex-direction:row;text-align:right;align-items:center;gap:16px;padding:16px 18px}
  .nh-princ-sec{padding:56px 18px}
  .nh-princ{grid-template-columns:1fr;gap:32px}
  .nh-princ-item{flex-direction:row;text-align:right;align-items:center;gap:20px}
  .nh-princ-item .nh-hex{margin-bottom:0}
  .nh-kid-txt,.nh-princ-txt{align-items:flex-start;text-align:right}
  .nh-bee-wm-c{width:340px}
}

.nh-testi-sec .nh-h2{margin-bottom:34px}
.nh-tgrid{display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:900px;margin:0 auto}
.nh-testi{position:relative;display:flex;flex-direction:column;border:1px solid var(--border);background:linear-gradient(160deg,var(--card),#0F131C);border-radius:20px;padding:30px 26px 26px;margin:0}
.nh-testi-mark{font-family:Georgia,'Times New Roman',serif;font-size:54px;line-height:.7;color:var(--gold-l);height:26px}
.nh-stars{color:var(--gold-l);font-size:15px;letter-spacing:3px;margin:8px 0 14px}
.nh-testi-q{font-size:16.5px;line-height:1.75;margin:0 0 18px;color:var(--fg);flex:1}
.nh-testi-n{display:flex;align-items:center;gap:9px;font-size:15px;font-weight:800;color:var(--fg)}
.nh-testi-dot{flex:none;width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px 1px rgba(232,185,74,.55)}

.nh-final .nh-h2{margin-bottom:30px}
.nh-final-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:720px;margin:0 auto 20px}
.nh-final-opt{display:flex;flex-direction:column;align-items:center;gap:16px;border:1px solid var(--border);background:linear-gradient(180deg,var(--card),#0F131C);border-radius:20px;padding:28px 22px;text-align:center}
.nh-final-paid{border-color:rgba(201,150,74,.5);background:linear-gradient(170deg,rgba(201,150,74,.12),var(--card) 60%);box-shadow:0 24px 60px -34px rgba(201,150,74,.45)}
.nh-final-lbl{font-size:18px;font-weight:800;color:var(--fg)}
.nh-final-cta{width:100%;padding:14px;font-size:15.5px;margin-top:auto}

/* value ladder */
.nh-ladder-sec{max-width:1080px;margin:0 auto;padding:66px 22px}
.nh-ladder-sec .nh-h2{margin-bottom:12px}
.nh-ladder{display:grid;grid-template-columns:1fr;gap:18px;margin-top:32px}
.nh-lcard{display:flex;flex-direction:column;border:1px solid var(--border);background:var(--card);border-radius:20px;overflow:hidden;text-decoration:none;transition:border-color .2s ease,transform .2s ease,box-shadow .2s ease}
.nh-lcard:hover{border-color:rgba(201,150,74,.5);transform:translateY(-3px);box-shadow:0 26px 50px -30px rgba(201,150,74,.4)}
.nh-lcard-media{position:relative;aspect-ratio:4/3;overflow:hidden}
.nh-lcard-media img{width:100%;height:100%;object-fit:cover;object-position:center 26%;display:block}
.nh-lcard-media::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(8,12,20,.92),rgba(8,12,20,.12) 50%,transparent 74%)}
.nh-lcard-pricewrap{position:absolute;bottom:13px;inset-inline-start:14px;z-index:1;display:flex;align-items:center;gap:9px}
.nh-lcard-price{font-size:15.5px;font-weight:800;color:#2a1d05;background:linear-gradient(180deg,#f4d27a,#d59b1f);border-radius:9999px;padding:5px 14px;box-shadow:0 8px 20px -8px rgba(0,0,0,.6)}
.nh-lcard-was{font-size:13.5px;font-weight:700;color:#EDE9E1;text-decoration:line-through;text-decoration-color:rgba(232,185,74,.9);opacity:.72}
.nh-lcard-save{position:absolute;top:12px;inset-inline-end:14px;z-index:1;font-size:12px;font-weight:800;color:var(--green);background:rgba(127,212,155,.16);border:1px solid rgba(127,212,155,.42);border-radius:9999px;padding:4px 11px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.nh-lcard-tag{position:absolute;top:12px;inset-inline-end:14px;z-index:1;font-size:11.5px;font-weight:800;color:var(--green);background:rgba(127,212,155,.16);border:1px solid rgba(127,212,155,.42);border-radius:9999px;padding:4px 11px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}
.nh-lcard-body{display:flex;flex-direction:column;flex:1;padding:20px 22px 22px}
.nh-lcard-body h3{font-size:19.5px;font-weight:800;color:var(--fg);margin:0 0 8px}
.nh-lcard-body p{font-size:14px;line-height:1.62;color:var(--muted);margin:0 0 16px;flex:1}
.nh-lcard-cta{font-size:14.5px;font-weight:800;color:var(--gold-l)}
@media(min-width:760px){.nh-ladder{grid-template-columns:repeat(3,1fr)}}

.nh-footer{border-top:1px solid var(--line);background:var(--bg2);padding:34px 22px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}
.nh-footer-brand{font-size:17px;font-weight:800;color:var(--fg)}
.nh-footer-micro{font-size:12.5px;color:var(--muted)}
.nh-footer-links{display:flex;gap:9px;flex-wrap:wrap;justify-content:center;font-size:12.5px}
.nh-footer-links a{color:var(--gold-l);text-decoration:none}
.nh-footer-links span{color:var(--border)}

@media(max-width:900px){
  .nh-nav{display:none}
  .nh-cards,.nh-tgrid,.nh-final-grid{grid-template-columns:1fr}
}
@media(max-width:430px){
  .nh-hwrap{padding:0 16px;gap:10px}
  .nh-logo{font-size:17px}
  .nh-section{padding:48px 18px}
  .nh-approach-sec{padding:56px 18px}
}
`;
