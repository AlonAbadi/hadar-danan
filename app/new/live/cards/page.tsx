import type { Metadata } from "next";
import { TrackedCta } from "../../TrackedCta";
import { SignalCanvas } from "../SignalCanvas";
import { HexDefs, HoneyHex, IcSignal, IcStrategy } from "../../glyphs";

/**
 * /new/live/cards — ISOLATED lab: several designs for the two "path" cards
 * (discover your signal → /kriah, work with Hadar → /strategy). Reuses the
 * honey-cell hexagons, custom icons, living signal, gold buttons and brand
 * green for "חינם". noindex. Touches nothing else.
 */
export const metadata: Metadata = {
  title: "עיצובי כרטיסים — /new",
  robots: { index: false, follow: false },
  alternates: {},
};

const FREE_BULLETS = ["כמה שאלות קצרות על העסק", "קריאה אישית שמנסחת את האות במילים", "מה שרק אתם יכולים להביא"];
const PAID_BULLETS = ["חשיבה יצירתית בלייב, אחד על אחד", "אסטרטגיה עסקית לפני שיווקית", "מפת דרכים ונכסים לצאת איתם"];

function Chk() {
  return (
    <svg viewBox="0 0 20 20" className="cl-chk" aria-hidden>
      <path d="M4 10.6l3.6 3.6L16 5.4" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CardsLab() {
  return (
    <div dir="rtl" className="cl-root">
      <style>{CL_CSS}</style>
      <HexDefs />

      <header className="cl-hero">
        <div className="cl-eyebrow">מעבדת עיצוב · כרטיסי הבחירה</div>
        <h1>שלוש אופציות לשתי הדלתות</h1>
        <p>אותו תוכן, שלוש שפות עיצוב. גלול, השווה, ותגיד לי מה מדויק.</p>
      </header>

      {/* ═══ OPTION 1 — tiered honey badges ═══ */}
      <Divider n="1" name="דלתות עם תגי-בהירות" desc="משושי-דבש · טירים · הפרמיום מוגבה" />
      <div className="cl-wrap">
        <div className="cl-grid">
          <article className="c1 c1-free">
            <div className="c1-top">
              <HoneyHex size="md"><IcSignal /></HoneyHex>
              <span className="c1-tag c1-tag-free">חינם</span>
            </div>
            <h3 className="c1-title">גלו את האות שלכם</h3>
            <p className="c1-desc">כמה שאלות קצרות על העסק, ואז קריאה אישית שמנסחת במילים מה אנשים מקבלים דווקא מכם.</p>
            <ul className="c1-list">{FREE_BULLETS.map((b) => <li key={b}><span className="cl-chk-wrap cl-green"><Chk /></span>{b}</li>)}</ul>
            <TrackedCta dest="kriah" placement="path_card" className="cl-out c1-cta">להתחיל את הקריאה</TrackedCta>
          </article>
          <article className="c1 c1-paid">
            <div className="c1-top">
              <HoneyHex gold size="md"><IcStrategy /></HoneyHex>
              <span className="c1-tag c1-tag-paid">מ־4,000 ₪</span>
            </div>
            <h3 className="c1-title">אחד על אחד עם הדר</h3>
            <p className="c1-desc">חשיבה יצירתית בלייב שהופכת ניסיון ומסר לאסטרטגיה ולנכסים שאפשר לצאת איתם החוצה.</p>
            <ul className="c1-list">{PAID_BULLETS.map((b) => <li key={b}><span className="cl-chk-wrap cl-gold-c"><Chk /></span>{b}</li>)}</ul>
            <TrackedCta dest="strategy" placement="path_card" className="cl-gold c1-cta">לראות איך עובדים עם הדר</TrackedCta>
          </article>
        </div>
      </div>

      {/* ═══ OPTION 2 — editorial numbered ═══ */}
      <Divider n="2" name="עריכתי ממוספר" desc="טיפוגרפי · מספרים · קווי-אור · מרווח" />
      <div className="cl-wrap cl-wrap-dark">
        <div className="cl-grid">
          <article className="c2 c2-free">
            <div className="c2-head"><span className="c2-num">01</span><span className="c2-tag cl-green">חינם</span></div>
            <h3 className="c2-title">גלו את האות שלכם</h3>
            <p className="c2-desc">קריאה אישית שמנסחת במילים מי אתם ומה רק אתם יכולים להביא.</p>
            <span className="c2-rule" aria-hidden />
            <TrackedCta dest="kriah" placement="path_card" className="cl-out c2-cta">להתחיל את הקריאה</TrackedCta>
          </article>
          <article className="c2 c2-paid">
            <div className="c2-head"><span className="c2-num c2-num-gold">02</span><span className="c2-tag c2-tag-gold">מ־4,000 ₪</span></div>
            <h3 className="c2-title">אחד על אחד עם הדר</h3>
            <p className="c2-desc">חשיבה יצירתית בלייב שהופכת מסר לאסטרטגיה ולנכסים לצאת איתם החוצה.</p>
            <span className="c2-rule c2-rule-gold" aria-hidden />
            <TrackedCta dest="strategy" placement="path_card" className="cl-gold c2-cta">לראות איך עובדים עם הדר</TrackedCta>
          </article>
        </div>
      </div>

      {/* ═══ OPTION 3 — living signal + mentor photo ═══ */}
      <Divider n="3" name="אות חי + מנטור אישי" desc="האות החי לחינמי · תמונת הדר לפרמיום" />
      <div className="cl-wrap">
        <div className="cl-grid">
          <article className="c3 c3-free">
            <div className="c3-media"><SignalCanvas trigger="inview" className="c3-band" /></div>
            <div className="c3-body">
              <span className="c3-tag cl-green">חינם</span>
              <h3 className="c3-title">גלו את האות שלכם</h3>
              <p className="c3-desc">כמה שאלות קצרות, ואז קריאה אישית שמנסחת מי אתם במילים.</p>
              <TrackedCta dest="kriah" placement="path_card" className="cl-out c3-cta">להתחיל את הקריאה</TrackedCta>
            </div>
          </article>
          <article className="c3 c3-paid">
            <div className="c3-media c3-photo"><img src="/hadarprotrait.jpg" alt="הדר דנן" /><span className="c3-badge">מ־4,000 ₪</span></div>
            <div className="c3-body">
              <span className="c3-role">עם הדר · אחד על אחד</span>
              <h3 className="c3-title">חשיבה יצירתית בלייב</h3>
              <p className="c3-desc">הופכים ניסיון ומסר לאסטרטגיה ולנכסים שאפשר לצאת איתם החוצה.</p>
              <TrackedCta dest="strategy" placement="path_card" className="cl-gold c3-cta">לראות איך עובדים עם הדר</TrackedCta>
            </div>
          </article>
        </div>
      </div>

      <footer className="cl-foot">שלוש האופציות מבודדות ל-/new/live/cards בלבד · noindex</footer>
    </div>
  );
}

function Divider({ n, name, desc }: { n: string; name: string; desc: string }) {
  return (
    <div className="cl-divider">
      <div className="cl-divider-in">
        <span className="cl-badge">אופציה {n}</span>
        <span className="cl-dname">{name}</span>
        <span className="cl-ddesc">{desc}</span>
      </div>
    </div>
  );
}

const CL_CSS = `
.cl-root{--bg:#080C14;--bg2:#0D1018;--card:#141820;--soft:#1D2430;--border:#2C323E;--line:#232936;--gold:#C9964A;--gold-l:#E8B94A;--gold-d:#9E7C3A;--fg:#EDE9E1;--muted:#AAB0BD;--green:#7FD49B;background:var(--bg);color:var(--fg);min-height:100vh;overflow-x:hidden}
.cl-root *{box-sizing:border-box}
.cl-green{color:var(--green)}
.cl-gold-c{color:var(--gold-l)}

.cl-hero{text-align:center;padding:52px 22px 8px}
.cl-eyebrow{font-size:11px;letter-spacing:3px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:14px}
.cl-hero h1{font-size:clamp(24px,5.4vw,32px);font-weight:900;margin:0 0 10px}
.cl-hero p{color:var(--muted);font-size:15px;margin:0 auto;max-width:44ch;line-height:1.7}

.cl-divider{position:sticky;top:64px;z-index:20;background:rgba(8,12,20,.9);backdrop-filter:blur(10px);border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-top:40px}
.cl-divider-in{max-width:1080px;margin:0 auto;padding:12px 22px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.cl-badge{background:linear-gradient(180deg,#f4d27a,#d59b1f);color:#2a1d05;font-weight:800;font-size:12px;border-radius:9999px;padding:4px 12px;flex:none}
.cl-dname{font-weight:800;font-size:16px;color:var(--gold-l)}
.cl-ddesc{font-size:12.5px;color:var(--muted)}
.cl-foot{text-align:center;color:var(--muted);font-size:12px;padding:44px 22px;opacity:.7}

.cl-wrap{padding:44px 20px}
.cl-wrap-dark{background:#0B0F17;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.cl-grid{max-width:820px;margin:0 auto;display:grid;grid-template-columns:1fr;gap:18px}

/* shared buttons */
.cl-gold,.cl-out{width:100%;padding:15px 20px;border-radius:9999px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.2;text-decoration:none;font-size:15.5px;min-height:52px;margin-top:auto}
.cl-gold{background:linear-gradient(180deg,#f4d27a 0%,#e8b942 52%,#d59b1f 100%);color:#2a1d05;font-weight:800;box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 14px 30px -14px rgba(214,155,31,.6)}
.cl-out{background:transparent;color:var(--gold-l);font-weight:700;border:1px solid rgba(201,150,74,.55)}
.cl-chk-wrap{flex:none;display:grid;place-items:center;width:20px;height:20px;margin-top:1px}
.cl-chk{width:18px;height:18px}

/* soft honey-cell hexagon (shared with /new) */
.nh-hx{position:relative;flex:none;display:inline-grid;place-items:center;filter:drop-shadow(0 8px 18px rgba(201,150,74,.32))}
.nh-hx-bg{position:absolute;inset:0;width:100%;height:100%;display:block}
.nh-hx-ico{position:relative;z-index:1;display:grid;place-items:center;color:var(--gold-l)}
.nh-hx-gold .nh-hx-ico{color:#221704}
.nh-ic{width:62%;height:62%;display:block}
.nh-hx-sm{width:54px;height:58px}
.nh-hx-md{width:62px;height:67px}
.nh-hx-lg{width:92px;height:99px}

/* ── OPTION 1 — tiered honey badges ── */
.c1{position:relative;display:flex;flex-direction:column;border:1px solid var(--border);background:linear-gradient(180deg,var(--card),#0F131C);border-radius:22px;padding:26px 24px}
.c1-paid{border-color:rgba(201,150,74,.55);background:linear-gradient(170deg,rgba(201,150,74,.13),var(--card) 60%);box-shadow:0 24px 60px -34px rgba(201,150,74,.5)}
.c1-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.c1-tag{font-size:14px;font-weight:800;border-radius:9999px;padding:6px 14px}
.c1-tag-free{color:var(--green);background:rgba(127,212,155,.12);border:1px solid rgba(127,212,155,.35)}
.c1-tag-paid{color:var(--gold-l);background:rgba(201,150,74,.12);border:1px solid rgba(201,150,74,.4)}
.c1-title{font-size:23px;font-weight:800;margin:0 0 10px;color:var(--fg)}
.c1-desc{font-size:15px;line-height:1.68;color:var(--muted);margin:0 0 18px}
.c1-list{list-style:none;margin:0 0 22px;padding:0;display:flex;flex-direction:column;gap:11px}
.c1-list li{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;color:var(--fg);line-height:1.4}
.c1-cta{margin-top:0}

/* ── OPTION 2 — editorial numbered ── */
.c2{position:relative;display:flex;flex-direction:column;border:1px solid var(--border);background:var(--card);border-radius:20px;padding:30px 26px 26px}
.c2-paid{border-color:rgba(201,150,74,.45);background:linear-gradient(175deg,rgba(201,150,74,.07),var(--card) 55%)}
.c2-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.c2-num{font-size:40px;font-weight:900;line-height:1;color:transparent;-webkit-text-stroke:1.5px var(--muted);letter-spacing:1px}
.c2-num-gold{-webkit-text-stroke:1.5px var(--gold)}
.c2-tag{font-size:13px;font-weight:800;letter-spacing:1px}
.c2-tag-gold{color:var(--gold-l)}
.c2-title{font-size:24px;font-weight:800;margin:0 0 12px;color:var(--fg)}
.c2-desc{font-size:15px;line-height:1.7;color:var(--muted);margin:0 0 22px;max-width:34ch}
.c2-rule{display:block;height:1px;width:100%;background:linear-gradient(90deg,var(--border),transparent);margin:0 0 22px}
.c2-rule-gold{background:linear-gradient(90deg,rgba(201,150,74,.6),transparent)}

/* ── OPTION 3 — living signal + mentor photo ── */
.c3{display:flex;flex-direction:column;border:1px solid var(--border);background:var(--card);border-radius:22px;overflow:hidden}
.c3-paid{border-color:rgba(201,150,74,.5)}
.c3-media{position:relative}
.c3-band{height:150px;border:0;border-radius:0}
.c3-photo{aspect-ratio:16/11;overflow:hidden}
.c3-photo img{width:100%;height:100%;object-fit:cover;object-position:center 22%;display:block}
.c3-badge{position:absolute;bottom:12px;inset-inline-start:14px;font-size:14px;font-weight:800;color:#2a1d05;background:linear-gradient(180deg,#f4d27a,#d59b1f);border-radius:9999px;padding:6px 14px;box-shadow:0 8px 20px -8px rgba(0,0,0,.6)}
.c3-body{display:flex;flex-direction:column;padding:22px 24px 24px;flex:1}
.c3-tag{align-self:flex-start;font-size:13px;font-weight:800;border-radius:9999px;padding:5px 13px;background:rgba(127,212,155,.12);border:1px solid rgba(127,212,155,.35);margin-bottom:12px}
.c3-role{font-size:12px;letter-spacing:2px;font-weight:800;color:var(--gold);text-transform:uppercase;margin-bottom:10px}
.c3-title{font-size:22px;font-weight:800;margin:0 0 10px;color:var(--fg)}
.c3-desc{font-size:14.5px;line-height:1.68;color:var(--muted);margin:0 0 20px}
.c3-cta{margin-top:auto}

@media(min-width:760px){
  .cl-wrap{padding:56px 22px}
  .cl-grid{grid-template-columns:1fr 1fr;gap:22px;align-items:stretch}
  .c1,.c2,.c3{height:100%}
}
`;
