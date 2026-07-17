import type { Metadata } from "next";
import Image from "next/image";
import { TrackedCta } from "./TrackedCta";

/**
 * /new — ISOLATED experimental homepage. Two-doors concept.
 * Does not touch the existing homepage, /kriah, /strategy, or any shared page.
 * Reuses assets (the hero photo) and copies of styles only; introduces no shared
 * behavior change. Nav is hidden for /new via LayoutShell (same mechanism as
 * /en and /kaveret) so this page carries its own local header.
 * Experiment only — noindex,nofollow.
 */
export const metadata: Metadata = {
  title: "הדר דנן",
  robots: { index: false, follow: false },
  alternates: {}, // no canonical override
};

const NAV = [
  { label: "אודות",           href: "/about" },
  { label: "בינג׳",           href: "/binge" },
  { label: "האות שלך",        href: "/kriah" },
  { label: "כל המסלולים",     href: "/" },
  { label: "האזור האישי שלי", href: "/account" },
];

const TESTIMONIALS = [
  {
    text: "הצלחתם להפוך את הנקודה שהכי קשה לי בעסק לנקודת חוזקה, ואני אפילו נהנה מזה עכשיו. אין עליכם, תודה ענקית.",
    name: "רועי מנדלמן",
  },
  {
    text: "אחרי אכזבות מחברות אחרות, סוף סוף מצאתי צוות מקצועי וקשוב. הם לקחו את העסק שלי כמה צעדים קדימה עם תוכן מדויק שהביא לי הרבה פניות.",
    name: "גל מסס",
  },
];

const PRINCIPLES = [
  { t: "אסטרטגיה קודם",            d: "לפני סרטון אחד, מבינים מי אתם, מה אתם מוכרים ולמה הקהל צריך דווקא אתכם." },
  { t: "תוכן שמגיע מבפנים",        d: "לא תסריטים גנריים ולא מרדף אחרי טרנדים. תוכן שנובע מהדרך שבה אתם באמת רואים את העולם." },
  { t: "מכירות שלא מתחילות בשכנוע", d: "כשהאות ברור, הלקוחות הנכונים מזהים את עצמם במסר." },
];

export default function NewHome() {
  return (
    <div dir="rtl" className="nh-root">
      <style>{NH_CSS}</style>

      {/* ── Local header (isolated to /new) ── */}
      <header className="nh-header">
        <div className="nh-hwrap">
          <a href="/new" className="nh-logo">הדר דנן</a>
          <nav className="nh-nav">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="nh-navlink">{n.label}</a>
            ))}
          </nav>
          <div className="nh-hcta">
            <a href="/login" className="nh-quiet">התחבר</a>
            <TrackedCta dest="strategy" placement="header" className="nh-goldbtn nh-goldbtn-sm">
              לעבוד עם הדר
            </TrackedCta>
          </div>
        </div>
      </header>

      <main>
        {/* ── 2. HERO ── */}
        <section className="nh-hero">
          <div className="nh-hero-media">
            <Image src="/hadar1.jpg" alt="הדר דנן" fill priority sizes="(max-width:768px) 100vw, 50vw"
              style={{ objectFit: "cover", objectPosition: "center 12%" }} />
            <div className="nh-hero-scrim" />
          </div>
          <div className="nh-hero-body">
            <div className="nh-eyebrow"><span dir="ltr">TrueSignal©</span> · השיטה</div>
            <h1 className="nh-h1">לא צריך עוד תוכן.<br />צריך לדעת למה שיבחרו דווקא בכם.</h1>
            <p className="nh-lede">גלו את האות שלכם בקריאה אישית ללא עלות, או עבדו ישירות עם הדר כדי להפוך אותו למסר ולנכסים שעובדים.</p>
            <div className="nh-hero-ctas">
              <TrackedCta dest="kriah" placement="hero" className="nh-goldbtn nh-goldbtn-lg">
                לגלות את האות שלי — חינם
              </TrackedCta>
              <div className="nh-sec-wrap">
                <TrackedCta dest="strategy" placement="hero" className="nh-outbtn nh-outbtn-lg">
                  לעבוד ישירות עם הדר
                </TrackedCta>
                <div className="nh-priceline">פגישת אסטרטגיה אישית החל מ־4,000 ₪</div>
              </div>
            </div>
            <div className="nh-trust">קריאה אישית · ללא עלות · ללא כרטיס אשראי</div>
          </div>
        </section>

        {/* ── 3. Proof strip (existing numbers only) ── */}
        <section className="nh-proof">
          <div className="nh-proof-item"><b>5.0</b><span>בגוגל</span></div>
          <div className="nh-proof-dot" />
          <div className="nh-proof-item"><b>55</b><span>ביקורות</span></div>
          <div className="nh-proof-dot" />
          <div className="nh-proof-item"><b>3,500+</b><span>עסקים</span></div>
        </section>

        {/* ── 4. Two paths ── */}
        <section className="nh-section">
          <h2 className="nh-h2">שתי דרכים. אותה מטרה: מסר שאנשים מזהים וזוכרים.</h2>
          <div className="nh-cards">
            <article className="nh-card">
              <h3 className="nh-card-t">אני צריך להבין מה האות שלי</h3>
              <p className="nh-card-d">מתחילים בכמה שאלות קצרות על העסק, ממשיכים לקריאה האישית ומגלים מה אנשים מקבלים דווקא מכם.</p>
              <p className="nh-card-note">האבחון הקיים נשאר בדיוק כפי שהוא.</p>
              <TrackedCta dest="kriah" placement="path_card" className="nh-outbtn nh-card-cta">
                לקריאת האות — ללא עלות
              </TrackedCta>
            </article>
            <article className="nh-card nh-card-gold">
              <h3 className="nh-card-t">אני כבר רוצה לעבוד עם הדר</h3>
              <p className="nh-card-d">למי שכבר רוצה להפוך ניסיון, מסר ורעיונות לאסטרטגיה ולנכסים שאפשר לצאת איתם החוצה.</p>
              <p className="nh-card-note nh-gold-note">פגישת אסטרטגיה אישית: 4,000 ₪</p>
              <TrackedCta dest="strategy" placement="path_card" className="nh-goldbtn nh-card-cta">
                לראות איך עובדים עם הדר
              </TrackedCta>
            </article>
          </div>
        </section>

        {/* ── 5. TrueSignal approach ── */}
        <section className="nh-section nh-approach">
          <h2 className="nh-h2">הגישה שלנו</h2>
          <p className="nh-approach-lede">כי אפשר למכור רק את מה שאתם באמת — זה הבסיס של <span dir="ltr">TrueSignal©</span>.</p>
          <div className="nh-principles">
            {PRINCIPLES.map((p) => (
              <div key={p.t} className="nh-principle">
                <h4 className="nh-principle-t">{p.t}</h4>
                <p className="nh-principle-d">{p.d}</p>
              </div>
            ))}
          </div>
          <p className="nh-approach-punch">אנחנו לא מוכרים סרטונים.<br />אנחנו בונים את הבהירות שגורמת לתוכן לעבוד.</p>
        </section>

        {/* ── 6. Testimonials ── */}
        <section className="nh-section">
          <div className="nh-tgrid">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="nh-testi">
                <div className="nh-stars">★★★★★</div>
                <blockquote className="nh-testi-q">{t.text}</blockquote>
                <figcaption className="nh-testi-n">{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── 7. Final CTA ── */}
        <section className="nh-section nh-final">
          <h2 className="nh-h2">איך נכון לכם להתקדם עכשיו?</h2>
          <div className="nh-final-grid">
            <div className="nh-final-opt">
              <div className="nh-final-lbl">אני רוצה לגלות את האות שלי</div>
              <TrackedCta dest="kriah" placement="final_cta" className="nh-goldbtn nh-final-cta">
                להתחיל את הקריאה — חינם
              </TrackedCta>
            </div>
            <div className="nh-final-opt">
              <div className="nh-final-lbl">אני רוצה לעבוד ישירות עם הדר</div>
              <TrackedCta dest="strategy" placement="final_cta" className="nh-outbtn nh-final-cta">
                לראות את פגישת האסטרטגיה
              </TrackedCta>
              <div className="nh-priceline nh-priceline-center">4,000 ₪</div>
            </div>
          </div>
        </section>
      </main>

      {/* ── 8. Local minimal footer ── */}
      <footer className="nh-footer">
        <div className="nh-footer-brand">הדר דנן</div>
        <div className="nh-footer-micro">אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr">TrueSignal©</span></div>
        <div className="nh-footer-links">
          <a href="/about">אודות</a><span>·</span>
          <a href="/kriah">האות שלך</a><span>·</span>
          <a href="/strategy">עבודה עם הדר</a><span>·</span>
          <a href="/privacy">פרטיות</a>
        </div>
      </footer>
    </div>
  );
}

// All styles scoped under `.nh-*` classes — used ONLY on /new, no global bleed.
const NH_CSS = `
.nh-root{--bg:#080C14;--bg2:#0D1018;--card:#141820;--soft:#1D2430;--border:#2C323E;--line:#232936;--gold:#C9964A;--gold-l:#E8B94A;--fg:#EDE9E1;--muted:#9E9990;--grad:linear-gradient(180deg,#f4d27a 0%,#e8b942 52%,#d59b1f 100%);background:var(--bg);color:var(--fg);min-height:100vh;overflow-x:hidden}
.nh-root *{box-sizing:border-box}
.nh-goldbtn{display:inline-flex;align-items:center;justify-content:center;background:var(--grad);color:#2a1d05;font-weight:800;text-decoration:none;border-radius:999px;line-height:1.2}
.nh-goldbtn-sm{padding:9px 18px;font-size:14px}
.nh-goldbtn-lg{padding:15px 28px;font-size:16.5px;width:100%}
.nh-outbtn{display:inline-flex;align-items:center;justify-content:center;background:transparent;color:var(--gold-l);font-weight:700;text-decoration:none;border:1px solid var(--gold);border-radius:999px;line-height:1.2}
.nh-outbtn-lg{padding:14px 26px;font-size:15.5px;width:100%}

/* header */
.nh-header{position:sticky;top:0;z-index:50;background:rgba(8,12,20,.86);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.nh-hwrap{max-width:1200px;margin:0 auto;height:64px;padding:0 22px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nh-logo{font-size:19px;font-weight:800;color:var(--fg);text-decoration:none;letter-spacing:-.3px;white-space:nowrap}
.nh-nav{display:flex;gap:22px}
.nh-navlink{color:var(--muted);font-size:14.5px;text-decoration:none}
.nh-navlink:hover{color:var(--fg)}
.nh-hcta{display:flex;align-items:center;gap:16px}
.nh-quiet{color:var(--muted);font-size:14px;text-decoration:none}
.nh-quiet:hover{color:var(--fg)}

/* hero */
.nh-hero{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:28px;align-items:center;padding:46px 22px 40px;min-height:520px}
.nh-hero-media{position:relative;height:460px;border-radius:18px;overflow:hidden;border:1px solid var(--border)}
.nh-hero-scrim{position:absolute;inset:0;background:linear-gradient(to left,rgba(8,12,20,.55),transparent 55%)}
.nh-hero-body{padding:6px 0}
.nh-eyebrow{font-size:12px;letter-spacing:2px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:16px}
.nh-h1{font-size:clamp(30px,4.4vw,48px);font-weight:800;line-height:1.14;letter-spacing:-.6px;margin:0 0 18px;text-wrap:balance}
.nh-lede{font-size:clamp(15px,2vw,18px);line-height:1.7;color:var(--muted);margin:0 0 26px;max-width:52ch}
.nh-lede,.nh-h1{max-width:56ch}
.nh-hero-ctas{display:flex;flex-direction:column;gap:14px;max-width:400px}
.nh-sec-wrap{display:flex;flex-direction:column;gap:7px}
.nh-priceline{font-size:12.5px;color:var(--muted);text-align:center}
.nh-priceline-center{text-align:center}
.nh-trust{margin-top:20px;font-size:12.5px;color:var(--muted);opacity:.85}

/* proof */
.nh-proof{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;padding:16px 22px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--bg2)}
.nh-proof-item{display:flex;align-items:baseline;gap:7px}
.nh-proof-item b{font-size:19px;font-weight:800;color:var(--gold-l)}
.nh-proof-item span{font-size:13px;color:var(--muted)}
.nh-proof-dot{width:4px;height:4px;border-radius:50%;background:var(--border)}

/* generic section */
.nh-section{max-width:1080px;margin:0 auto;padding:56px 22px}
.nh-h2{font-size:clamp(22px,3.2vw,30px);font-weight:800;line-height:1.3;letter-spacing:-.3px;text-align:center;margin:0 0 30px;text-wrap:balance}

/* two cards */
.nh-cards{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.nh-card{border:1px solid var(--border);background:var(--card);border-radius:16px;padding:26px 24px;display:flex;flex-direction:column}
.nh-card-gold{border-color:rgba(201,150,74,.55);background:linear-gradient(160deg,rgba(201,150,74,.08),var(--card) 55%)}
.nh-card-t{font-size:20px;font-weight:800;margin:0 0 10px}
.nh-card-d{font-size:14.5px;line-height:1.7;color:var(--muted);margin:0 0 14px;flex:1}
.nh-card-note{font-size:13px;color:var(--fg);margin:0 0 18px;opacity:.9}
.nh-gold-note{color:var(--gold-l);font-weight:700;opacity:1}
.nh-card-cta{width:100%;padding:13px;font-size:15px}

/* approach */
.nh-approach{text-align:center}
.nh-approach-lede{font-size:16px;color:var(--muted);max-width:60ch;margin:0 auto 30px;line-height:1.7}
.nh-principles{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;text-align:right;margin-bottom:32px}
.nh-principle{border:1px solid var(--border);background:var(--card);border-radius:14px;padding:22px 20px}
.nh-principle-t{font-size:16.5px;font-weight:800;color:var(--gold-l);margin:0 0 8px}
.nh-principle-d{font-size:14px;line-height:1.65;color:var(--muted);margin:0}
.nh-approach-punch{font-size:clamp(18px,2.6vw,24px);font-weight:800;line-height:1.5;margin:0;color:var(--fg)}

/* testimonials */
.nh-tgrid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.nh-testi{border:1px solid var(--border);background:var(--card);border-radius:14px;padding:24px;margin:0}
.nh-stars{color:var(--gold-l);font-size:15px;letter-spacing:2px;margin-bottom:12px}
.nh-testi-q{font-size:15.5px;line-height:1.75;margin:0 0 14px;color:var(--fg)}
.nh-testi-n{font-size:13.5px;font-weight:700;color:var(--muted)}

/* final */
.nh-final-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;max-width:760px;margin:0 auto}
.nh-final-opt{border:1px solid var(--border);background:var(--card);border-radius:16px;padding:24px;text-align:center;display:flex;flex-direction:column;gap:14px}
.nh-final-lbl{font-size:16px;font-weight:700}
.nh-final-cta{width:100%;padding:13px;font-size:15px}

/* footer */
.nh-footer{border-top:1px solid var(--line);background:var(--bg2);padding:34px 22px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}
.nh-footer-brand{font-size:17px;font-weight:800}
.nh-footer-micro{font-size:12.5px;color:var(--muted)}
.nh-footer-links{display:flex;gap:9px;flex-wrap:wrap;justify-content:center;font-size:12.5px}
.nh-footer-links a{color:var(--gold-l);text-decoration:none}
.nh-footer-links span{color:var(--border)}

/* ── TABLET ≤900 ── */
@media(max-width:900px){
  .nh-nav{display:none}
  .nh-hero{grid-template-columns:1fr;gap:0;min-height:0;padding:0 0 34px}
  .nh-hero-media{order:-1;height:44svh;min-height:280px;border-radius:0;border:none;border-bottom:1px solid var(--border)}
  .nh-hero-scrim{background:linear-gradient(to top,rgba(8,12,20,.9),transparent 55%)}
  .nh-hero-body{padding:26px 22px 0}
  .nh-hero-ctas{max-width:none}
  .nh-principles{grid-template-columns:1fr}
  .nh-cards,.nh-tgrid,.nh-final-grid{grid-template-columns:1fr}
}
/* ── MOBILE ≤430 ── */
@media(max-width:430px){
  .nh-hwrap{padding:0 16px;gap:10px}
  .nh-logo{font-size:17px}
  .nh-section{padding:44px 18px}
  .nh-hero-media{height:38svh;min-height:240px}
  .nh-hero-body{padding:24px 18px 0}
  .nh-h1{font-size:27px}
}
`;
