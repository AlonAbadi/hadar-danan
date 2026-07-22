"use client";

/**
 * BroadcastShowcase — homepage section for חדר השידור / יום הצילום, the
 * digital product (Alon 2026-07-22: "זה המוצר הדיגיטלי שלנו שממנו תהיה
 * צמיחה"). Sits right after the System section: the diagram says "האות
 * מניע הכל", this section shows what that looks like in practice.
 *
 * Presentation: a phone mock with the teleprompter actually running
 * (looping script lines behind the reading line + REC dot), the 4-step
 * pipeline from free diagnosis to a captioned reel, and a compact tease
 * of the canonical season roadmap (lib/kaveret-seasons — same data the
 * product renders). One CTA, to the free diagnosis, because the room is
 * derived from the signal.
 */

import { KAVERET_SEASONS } from "@/lib/kaveret-seasons";
import { TrackedCta } from "@/app/new/TrackedCta";

// Sample script lines in the seasons' formats — generic, so the demo reads
// as "this is what runs on your camera", not as anyone's actual script.
const SCRIPT_LINES = [
  "אני רוצה לעשות איתכם גילוי נאות.",
  "כולם בתחום שלכם מבטיחים בדיוק אותו דבר.",
  "ההבדל הוא לא מה אתם עושים.",
  "אלא מה שרק אתם רואים.",
  "ואת זה אי אפשר להעתיק.",
  "לזה אנחנו קוראים האות שלכם.",
];

export function BroadcastShowcase({ showCta = true }: { showCta?: boolean } = {}) {
  const teased = KAVERET_SEASONS.slice(0, 4);
  const rest = KAVERET_SEASONS.length - teased.length;
  const totalEpisodes = KAVERET_SEASONS.reduce((n, s) => n + s.episodes, 0);

  return (
    <section className="nh-br-sec">
      <div className="nh-eyebrow2">המוצר הדיגיטלי · כוורת האות</div>
      <h2 className="nh-h2">
        חדר השידור שלכם. <span className="nh-gd">יום צילום, בטלפון.</span>
      </h2>
      <p className="nh-br-lead">
        מהאבחון נכתבים שבעה תסריטים בקול שלכם, והם כבר טעונים בטלפרומפטר.
        הטקסט רץ על המצלמה הקדמית בקצב שלכם, הבמאית חותכת, מוסיפה כתוביות
        ומחזירה רילס מוכן לפרסום. מצולם, לא מיוצר.
      </p>

      <div className="nh-br-grid">
        {/* Phone: the teleprompter, running (iPhone-style frame) */}
        <div className="nh-br-phonewrap">
          <div className="nh-br-phone" aria-hidden>
            <div className="nh-br-screen">
              <div className="nh-br-cam" />
              <div className="nh-br-island" />
              <div className="nh-br-strip">
                <div className="nh-br-roll">
                  {[...SCRIPT_LINES, ...SCRIPT_LINES].map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                </div>
              </div>
              <div className="nh-br-line" />
              <div className="nh-br-rec" />
              <div className="nh-br-home" />
            </div>
          </div>
          <p className="nh-br-cap">הטלפרומפטר עם התסריט שלכם, על המצלמה הקדמית</p>
        </div>

        {/* The pipeline */}
        <ol className="nh-br-steps">
          <li>
            <span className="nh-br-n">1</span>
            <span className="nh-br-txt"><b>מגלים את האות</b><span>אבחון חינם. שש שאלות, כמה דקות.</span></span>
          </li>
          <li>
            <span className="nh-br-n">2</span>
            <span className="nh-br-txt"><b>שבעה תסריטים נכתבים מהאות</b><span>בקול שלכם. לא תבנית, לא השראה מאינסטגרם.</span></span>
          </li>
          <li>
            <span className="nh-br-n">3</span>
            <span className="nh-br-txt"><b>מצלמים מול הטקסט הרץ</b><span>בטלפון שלכם, בקצב שלכם. בלי לשנן כלום.</span></span>
          </li>
          <li>
            <span className="nh-br-n">4</span>
            <span className="nh-br-txt"><b>מקבלים רילס עם כתוביות</b><span>הבמאית חותכת, מסנכרנת ומחזירה סרטון מוכן לפרסום.</span></span>
          </li>
        </ol>
      </div>

      {/* Seasons tease — the growth engine */}
      <div className="nh-br-seasons">
        <p className="nh-br-seasons-t">
          וזה לא נגמר בשבעה סרטונים. {KAVERET_SEASONS.length} עונות, {totalEpisodes} פרקים,
          כל חודש עונה חדשה. אותו אות, זווית אחרת:
        </p>
        <div className="nh-br-sroll" dir="rtl">
          {teased.map((s) => (
            <div className={`nh-br-scard${s.number === 1 ? " first" : ""}`} key={s.number}>
              <span className="nh-br-sno">עונה {String(s.number).padStart(2, "0")}</span>
              <b>{s.title}</b>
              <span className="nh-br-sep">{s.episodes} פרקים</span>
            </div>
          ))}
          <div className="nh-br-scard more">
            <b>+ עוד {rest} עונות</b>
            <span className="nh-br-sep">בהמשך</span>
          </div>
        </div>
      </div>

      {showCta ? (
        <div className="nh-br-ctawrap">
          <TrackedCta dest="kriah" placement="broadcast" className="nh-gold nh-gold-hero">
            לגלות את האות שלי בחינם
          </TrackedCta>
          <p className="nh-br-ctasub">מתחילים באבחון חינם. חדר השידור נבנה מהאות שלכם.</p>
        </div>
      ) : null}

      <style>{BR_CSS}</style>
    </section>
  );
}

const BR_CSS = `
.nh-br-sec{max-width:1080px;margin:0 auto;padding:64px 22px;text-align:center}
.nh-br-sec .nh-eyebrow2{font-size:11px;letter-spacing:3px;font-weight:800;color:#C9964A;text-transform:uppercase;margin-bottom:14px;text-align:center}
.nh-br-sec .nh-h2{font-size:clamp(25px,5.4vw,33px);font-weight:800;line-height:1.28;letter-spacing:-.3px;text-align:center;margin:0 0 26px;text-wrap:balance;color:#EDE9E1}
.nh-br-sec .nh-gd{color:#E8B94A}
.nh-br-sec .nh-gold{background:linear-gradient(180deg,#f4d27a 0%,#e8b942 52%,#d59b1f 100%);color:#2a1d05;font-weight:800;text-decoration:none;border-radius:9999px;display:inline-flex;align-items:center;justify-content:center;line-height:1.2;box-shadow:0 1px 0 rgba(255,255,255,.55) inset,0 -10px 22px rgba(157,110,12,.35) inset,0 18px 34px -12px rgba(214,155,31,.55),0 6px 14px -6px rgba(0,0,0,.55)}
.nh-br-sec .nh-gold-hero{padding:16px 40px;font-size:1.05rem}
@media(max-width:430px){.nh-br-sec{padding:48px 18px}}
.nh-br-lead{max-width:640px;margin:14px auto 0;color:var(--muted,#9E9990);font-size:16px;line-height:1.8}
.nh-br-grid{display:grid;grid-template-columns:auto 1fr;gap:40px;align-items:center;max-width:760px;margin:36px auto 0;text-align:right}
.nh-br-phonewrap{justify-self:center;margin-inline:auto;text-align:center}
.nh-br-phone{width:190px;aspect-ratio:9/18.6;border-radius:32px;position:relative;margin:0 auto;padding:6px;background:linear-gradient(160deg,#3d4149 0%,#23262d 45%,#4a4e57 100%);box-shadow:0 0 0 1px rgba(0,0,0,0.85),inset 0 0 2px rgba(255,255,255,0.25),0 22px 48px -18px rgba(0,0,0,0.75)}
.nh-br-phone::before{content:"";position:absolute;inset-inline-start:-2.5px;top:21%;width:2.5px;height:16%;border-radius:2px;background:linear-gradient(180deg,#2b2e35 0 38%,transparent 38% 62%,#2b2e35 62% 100%)}
.nh-br-phone::after{content:"";position:absolute;inset-inline-end:-2.5px;top:28%;width:2.5px;height:13%;border-radius:0 2px 2px 0;background:#2b2e35}
.nh-br-screen{position:absolute;inset:6px;border-radius:26px;overflow:hidden;background:#0A0E16;border:2px solid #000}
.nh-br-island{position:absolute;top:9px;left:50%;transform:translateX(-50%);width:52px;height:15px;border-radius:99px;background:#000;z-index:5;box-shadow:inset 0 0 2px rgba(255,255,255,0.12)}
.nh-br-island::after{content:"";position:absolute;top:4.5px;inset-inline-end:7px;width:6px;height:6px;border-radius:50%;background:#101823;box-shadow:inset 0 0 2px rgba(80,120,200,0.6)}
.nh-br-cam{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 110%, rgba(232,185,74,0.10), transparent 55%),linear-gradient(180deg,#10141d 0%,#0A0E16 100%)}
.nh-br-home{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);width:64px;height:4px;border-radius:99px;background:rgba(237,233,225,0.55);z-index:5}
.nh-br-strip{position:absolute;top:0;left:0;right:0;height:46%;z-index:2;background:linear-gradient(180deg,rgba(8,12,20,0.94) 62%,transparent);padding:32px 14px 0;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,#000 70%,transparent);mask-image:linear-gradient(180deg,#000 70%,transparent)}
.nh-br-roll{animation:nh-br-scroll 16s linear infinite}
.nh-br-roll p{margin:0 0 10px;font-size:12.5px;font-weight:700;line-height:1.6;color:#EDE9E1;text-align:right}
.nh-br-roll p:nth-child(6n+1){color:#E8B94A}
@keyframes nh-br-scroll{from{transform:translateY(0)}to{transform:translateY(-50%)}}
@media (prefers-reduced-motion: reduce){.nh-br-roll{animation:none}}
.nh-br-line{position:absolute;top:34%;left:8px;right:8px;height:2px;z-index:3;background:linear-gradient(90deg,transparent,rgba(232,185,74,0.75),transparent)}
.nh-br-rec{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:3;width:30px;height:30px;border-radius:50%;border:2px solid rgba(237,233,225,0.8)}
.nh-br-rec::after{content:"";position:absolute;inset:5px;border-radius:50%;background:#E8B94A;animation:nh-br-pulse 2.2s ease-in-out infinite}
@keyframes nh-br-pulse{0%,100%{opacity:1}50%{opacity:0.45}}
.nh-br-cap{text-align:center;color:var(--muted,#9E9990);font-size:12px;margin-top:10px}
.nh-br-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:18px}
.nh-br-steps li{display:flex;gap:14px;align-items:flex-start}
.nh-br-n{flex:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13.5px;font-weight:800;color:#E8B94A;border:1px solid rgba(232,185,74,0.45);background:rgba(232,185,74,0.07)}
.nh-br-txt{display:flex;flex-direction:column;gap:3px}
.nh-br-txt b{font-size:15.5px;color:var(--fg,#EDE9E1)}
.nh-br-txt span{font-size:13.5px;color:var(--muted,#9E9990);line-height:1.6}
.nh-br-seasons{max-width:760px;margin:40px auto 0}
.nh-br-seasons-t{font-size:14.5px;color:var(--muted,#9E9990);margin:0 0 16px;line-height:1.7}
.nh-br-sroll{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;scroll-snap-type:x mandatory;justify-content:flex-start}
.nh-br-sroll::-webkit-scrollbar{display:none}
.nh-br-scard{flex:0 0 150px;scroll-snap-align:start;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:4px;text-align:right;background:#141820;border:1px solid #2C323E}
.nh-br-scard.first{background:linear-gradient(160deg,rgba(232,185,74,0.14),rgba(232,185,74,0.04) 65%,transparent);border-color:rgba(232,185,74,0.55)}
.nh-br-scard.more{justify-content:center;text-align:center;background:#10141c;border-style:dashed;border-color:rgba(232,185,74,0.3)}
.nh-br-sno{font-size:11px;font-weight:800;letter-spacing:1.5px;color:#C9964A}
.nh-br-scard b{font-size:14.5px;color:var(--fg,#EDE9E1);line-height:1.3}
.nh-br-sep{font-size:11.5px;color:var(--muted,#9E9990)}
.nh-br-ctawrap{margin-top:36px;display:flex;flex-direction:column;align-items:center;gap:10px}
.nh-br-ctasub{font-size:13px;color:var(--muted,#9E9990);margin:0}
@media(max-width:700px){
  .nh-br-grid{grid-template-columns:1fr;gap:28px;justify-items:center}
  .nh-br-steps{max-width:340px}
}
`;
