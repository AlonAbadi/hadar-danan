// The visitor (locked) state of the kaveret — what a fresh lead lands on
// after the diagnostic, and the page every email points back to. Same design
// system as the member state; the conversion layer swaps by routing:
//   hive      — open the hive, ₪590 one-time
//   strategy  — the 90-minute strategy meeting with Hadar (hive included)
//   sensitive — no sale layer at all; warm "Hadar will reach out" + WhatsApp
// Open on the page: the signal board, the public card, the full reading,
// the challenge opening session, one real designed asset, and the
// teleprompter demo with the lead's actual first script hook.
"use client";

import { useEffect, useRef, useState } from "react";
import sty from "./kaveret.module.css";
import { KAVERET_SEASONS, type KaveretSeason } from "@/lib/kaveret-seasons";

export interface VisitorData {
  firstName: string;
  gender: "m" | "f" | null;
  signalText: string;
  element: string;
  promise: string;
  tool: string;
  people: string;
  directions: string[];
  publicSentence: string | null;
  firstScriptHook: string | null;
  extractionId: string;
  offer: "hive" | "strategy" | "sensitive";
  day0VideoId: string;
  waPhone: string;
  token: string;
  firstReelEnabled: boolean;
  firstReelReady: boolean;
  firstReelUrl: string | null;
}

const LOCK = (
  <svg viewBox="0 0 24 24">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const HIVE_PRICE = { now: 590, was: 980, pct: 40 };

function LockBand({ text }: { text: string }) {
  return (
    <div className={sty.vLockBand}>
      <span className={sty.vLockIc}>{LOCK}</span>
      <span className={sty.vLockT}>{text}</span>
    </div>
  );
}

function ChipLock() {
  return <span className={sty.vChipLock}>{LOCK}כוורת</span>;
}

export function KaveretVisitorClient({ data }: { data: VisitorData }) {
  const f = data.gender === "f";
  const sale = data.offer !== "sensitive";
  const [assetOk, setAssetOk] = useState(true);
  // הקריאה המלאה renders as an accordion - headers only, tap to read
  const [openReading, setOpenReading] = useState<string | null>(null);
  // The offer bar breathes like every floating bar on the site (scroll down
  // shrinks it, scroll up expands it) and never disappears.
  const [mini, setMini] = useState(false);
  const lastY = useRef(0);
  const acc = useRef(0);
  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      lastY.current = y;
      if (y < 90) { setMini(false); acc.current = 0; return; }
      if ((dy > 0 && acc.current < 0) || (dy < 0 && acc.current > 0)) acc.current = 0;
      acc.current += dy;
      if (acc.current > 24) setMini(true);
      else if (acc.current < -24) setMini(false);
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // presence beacon — one row per view, the unification's success metric
    try {
      navigator.sendBeacon?.(
        "/api/events",
        new Blob(
          [JSON.stringify({ type: "KAVERET_LOCKED_VIEW", metadata: { offer: data.offer, extraction_id: data.extractionId } })],
          { type: "application/json" }
        )
      );
    } catch {
      /* observability only */
    }
  }, [data.offer, data.extractionId]);

  // Pre-purchase artifacts carry the beegood branding (the logo comes off
  // everywhere once she is a member).
  const assetUrl = `/api/signal/${data.extractionId}/asset?type=quote-signal&style=editorial&bg=color&v=12`;
  const shareCardUrl = `/api/signal/${data.extractionId}/share-card?style=editorial&bg=color&v=12`;
  const hiveHref = "/signal-hive";
  const strategyHref = "/strategy/book";
  const waHref = `https://wa.me/${data.waPhone}`;

  return (
    <div className={sty.page} dir="rtl">
      {/* pixel parity with the member state: same hosted font */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700;800&display=swap" rel="stylesheet" />
      <div className={sty.bgfix} aria-hidden="true" />
      <div className={sty.glow} aria-hidden="true" />
      <main className={sty.wrap} style={{ paddingBottom: sale ? 120 : 60 }}>
        {/* ── hero: the open signal (site nav renders above via LayoutShell) ── */}
        <div className={sty.hero} id="top">
          <div className={sty.ghost} aria-hidden="true">הכוורת</div>
          <div className={sty.k}>כוורת האות · כל זה כבר נוצר מהאות שלך</div>
          <h1>
            <span className={sty.thin}>האות שלך,</span>
            <br />
            <span className={sty.goldTxt}>ארוז לפעולה.</span>
          </h1>
        </div>

        <div className={sty.board}>
          <span className={sty.seal}>לוח האות שלך</span>
          <span className={sty.bigq} aria-hidden="true">"</span>
          <div className={sty.txt} style={{ fontSize: 20, lineHeight: 1.75, fontWeight: 600 }}>
            {data.signalText}
          </div>
        </div>

        <p className={sty.vOwnLine}>זה האות שלך. הוא שלך לתמיד, ושמרנו לך אותו.</p>

        {/* ── public card (open, saveable) ── */}
        {data.publicSentence ? (
          <div className={sty.vCard}>
            <div className={sty.vCardFrame}>
              <span className={`${sty.vCorner} ${sty.vC1}`} /><span className={`${sty.vCorner} ${sty.vC2}`} />
              <span className={`${sty.vCorner} ${sty.vC3}`} /><span className={`${sty.vCorner} ${sty.vC4}`} />
              <div className={sty.vCardQ}>"</div>
              <div className={sty.vCardTxt}>{data.publicSentence}</div>
              <div className={sty.vCardBee}>BEEGOOD · TRUESIGNAL</div>
            </div>
            <a className={sty.vSave} href={shareCardUrl} target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>
              שמירת כרטיס האות
            </a>
          </div>
        ) : null}

        {/* ── the full reading (open) ── */}
        <section className={sty.zone}>
          <div className={sty.zhead}>
            <span className={sty.zt}>
              <h2>הקריאה המלאה</h2>
              <span className={sty.hint}>העומק של האות. נשלח גם למייל שלך</span>
            </span>
          </div>
          <div className={sty.zrule} />
          {[
            ["האלמנט שלך", f ? "איפה את פועלת באפס מאמץ" : "איפה אתה פועל באפס מאמץ", data.element],
            ["מה האות מבטיח", "הכיוון שנפתח כאן", data.promise],
            ["הכלי המרכזי שלך", f ? "מה שרק את יוצרת" : "מה שרק אתה יוצר", data.tool],
            ["הקהל שלך", "למי האות הזה מדבר", data.people],
          ]
            .filter(([, , v]) => v)
            .map(([t, p, v]) => {
              const open = openReading === t;
              return (
                <div className={sty.trow} key={t as string}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenReading(open ? null : (t as string))}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", background: "none", border: "none", padding: 0,
                      cursor: "pointer", fontFamily: "inherit", textAlign: "right", gap: 10,
                    }}
                  >
                    <span className={sty.head} style={{ flex: 1 }}>
                      <span className={sty.plat}>{t}</span>
                      <span className={sty.check}>{p}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      style={{
                        color: "#C9964A", fontSize: 15, flexShrink: 0,
                        transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s",
                      }}
                    >
                      ▾
                    </span>
                  </button>
                  {open ? <p className={sty.txt}>{v}</p> : null}
                </div>
              );
            })}
        </section>

        {/* ── broadcast room: teleprompter demo with the real hook ── */}
        <section className={sty.zone}>
          <div className={sty.zhead}>
            <span className={sty.zn}>01</span>
            <span className={sty.zt}>
              <h2>יום הצילום</h2>
              <span className={sty.hint}>חדר השידור, עם התסריטים שלך בפנים</span>
            </span>
            {sale ? <ChipLock /> : null}
          </div>
          <div className={sty.zrule} />
          <div className={sty.trow}>
            <div className={sty.head}>
              <span className={sty.plat}>חדר השידור שלך</span>
              <span className={sty.check} style={{ color: "#7FD49B" }}>
                {data.firstScriptHook ? "7 סרטונים שלך · הראשון כבר טעון" : "7 סרטונים שלך"}
              </span>
            </div>
            {!data.firstReelUrl ? (<>
            <div className={sty.vPhone}>
              <div className={sty.vPcam} />
              <div className={sty.vPstrip}>
                <div className={sty.vPtxt}>
                  {data.firstScriptHook ? (
                    <>
                      <em>{data.firstScriptHook.split(" ").slice(0, 4).join(" ")}</em>{" "}
                      {data.firstScriptHook.split(" ").slice(4).join(" ")}
                    </>
                  ) : (
                    <em>התסריט הראשון שלך נכתב ממש עכשיו</em>
                  )}
                </div>
              </div>
              <div className={sty.vPline} />
              <div className={sty.vPrec} />
            </div>
            <p className={sty.vPcap}>הטלפרומפטר עם התסריט שלך, על המצלמה הקדמית</p>
            </>) : null}
            {data.firstReelUrl ? (
              <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 4px" }}>
                <div style={{ position: "relative", width: "min(280px, 78vw)", aspectRatio: "9/16", borderRadius: 16, overflow: "hidden", background: "#000", border: "1px solid rgba(232,185,74,0.35)" }}>
                  <video src={data.firstReelUrl} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <span style={{ position: "absolute", top: 10, insetInlineStart: 10, background: "rgba(8,12,20,0.75)", border: "1px solid rgba(232,185,74,0.4)", borderRadius: 8, padding: "4px 10px", fontSize: 12.5, color: "#E8B94A", fontWeight: 700, pointerEvents: "none" }}>
                    הרילס הראשון שלך · עם כתוביות
                  </span>
                </div>
              </div>
            ) : null}
            {data.firstReelEnabled ? (
              <div style={{ textAlign: "center", margin: "14px 0 4px" }}>
                <a
                  href={`/kaveret/first-reel?t=${encodeURIComponent(data.token)}`}
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
                    color: "#0D1018", fontWeight: 800, fontSize: 15,
                    borderRadius: 12, padding: "13px 30px", textDecoration: "none",
                  }}
                >
                  {data.firstReelReady ? "הרילס הראשון שלך מוכן, לצפייה 🎉" : "לצלם את הסרטון הראשון עכשיו, חינם 🎬"}
                </a>
                <p style={{ color: "#D6D2C9", fontSize: 14, marginTop: 8 }}>
                  {data.firstReelReady
                    ? "עם כתוביות מסונכרנות. שמור לך כאן, אפשר גם לצלם מחדש"
                    : "15 שניות, התסריט שלך על המסך, הסרטון נשאר אצלך"}
                </p>
              </div>
            ) : null}
            <p className={sty.txt} style={{ fontSize: 14.5, textAlign: "center" }}>
              {f
                ? "שבעה תסריטים בקול שלך. הטקסט רץ בקצב שלך, הבמאית חותכת, מוסיפה כתוביות ומחזירה רילס. מצולם, לא מיוצר."
                : "שבעה תסריטים בקול שלך. הטקסט רץ בקצב שלך, הבמאית חותכת, מוסיפה כתוביות ומחזירה רילס. מצולם, לא מיוצר."}
            </p>
          </div>
          <SeasonsTease offer={data.offer} sale={sale} />
        </section>

        {/* ── challenge: opening session open ── */}
        <section className={sty.zone}>
          <div className={sty.zhead}>
            <span className={sty.zn}>02</span>
            <span className={sty.zt}>
              <h2>אתגר האות</h2>
              <span className={sty.hint}>שבעה ימים, צעד ביום, עם הדר</span>
            </span>
            <span className={sty.vChipOk}>מפגש הפתיחה פתוח</span>
          </div>
          <div className={sty.zrule} />
          <div className={sty.trow}>
            <div className={sty.head}>
              <span className={sty.plat}>מפגש הפתיחה עם הדר</span>
              <span className={sty.check} style={{ color: "#7FD49B" }}>
                {f ? "פתוח לך עכשיו, בלי תשלום" : "פתוח לך עכשיו, בלי תשלום"}
              </span>
            </div>
            <div className={sty.vVidrow}>
              <iframe
                src={`https://player.vimeo.com/video/${data.day0VideoId}?loop=0&title=0&byline=0&portrait=0`}
                allow="autoplay; fullscreen; picture-in-picture"
                title="מפגש הפתיחה עם הדר"
              />
            </div>
            <div className={sty.vDays}>
              <span className={`${sty.vDay} ${sty.vDayOn}`}>0</span>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <span className={sty.vDay} key={n}>
                  {n}
                  {LOCK}
                </span>
              ))}
            </div>
            <p className={sty.txt} style={{ fontSize: 14, marginTop: 12, color: "#D6D2C9" }}>
              {sale
                ? data.offer === "strategy"
                  ? "שבעת הימים המלאים, סרטון ומשימה ביום, כלולים בליווי."
                  : "שבעת הימים המלאים, סרטון ומשימה ביום, נפתחים בכוורת."
                : "שבעת הימים המלאים שמורים לך כאן."}
            </p>
          </div>
        </section>

        {/* ── content directions + visual: what to say, how it looks — merged
            per Alon 2026-07-22 (both are raw material derived from the signal) ── */}
        <section className={sty.zone}>
          <div className={sty.zhead}>
            <span className={sty.zn}>03</span>
            <span className={sty.zt}>
              <h2>כיווני תוכן וויזואל</h2>
              <span className={sty.hint}>מה אומרים, ואיך זה נראה. הכול מהאות שלך</span>
            </span>
            {sale ? <ChipLock /> : null}
          </div>
          <div className={sty.zrule} />
          {data.directions.length ? (
            <div className={sty.trow}>
              <div className={sty.head}>
                <span className={sty.plat}>3 כיווני תוכן מהאות שלך</span>
                <span className={sty.check} style={{ color: "#7FD49B" }}>הראשון חשוף במלואו</span>
              </div>
              <div className={sty.vScriptRow}>
                <span className={sty.vScriptN}>1</span>
                <span className={sty.vScriptT}>{data.directions[0]}</span>
              </div>
              {data.directions.length > 1 ? (
                <div className={sty.vLock}>
                  <div className={sty.vLockContent}>
                    {data.directions.slice(1, 3).map((d, i) => (
                      <div className={sty.vScriptRow} key={i}>
                        <span className={sty.vScriptN}>{i + 2}</span>
                        <span className={sty.vScriptT}>{d}</span>
                      </div>
                    ))}
                  </div>
                  <LockBand
                    text={
                      data.offer === "strategy"
                        ? "עוד שני כיוונים, כלולים בליווי"
                        : sale
                          ? "עוד שני כיוונים נפתחים בכוורת"
                          : "עוד שני כיוונים שמורים לך כאן"
                    }
                  />
                </div>
              ) : null}
              {sale ? (
                <p className={sty.txt} style={{ fontSize: 14, marginTop: 12, color: "#D6D2C9" }}>
                  {data.offer === "strategy"
                    ? "בליווי שלושת הכיוונים האלה הופכים לתסריטים מוכנים ולתוכנית שלמה."
                    : "בכוורת שלושת הכיוונים האלה הופכים לתסריטים מוכנים, טעונים בטלפרומפטר."}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className={sty.trow}>
            <div className={sty.head}>
              <span className={sty.plat}>הכרטיס המעוצב שלך</span>
              <span className={sty.check}>מוכן לשמירה ולפרסום</span>
            </div>
            {assetOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={sty.vAssetImg}
                src={assetUrl}
                alt="כרטיס האות המעוצב שלך"
                onError={() => setAssetOk(false)}
              />
            ) : null}
            {sale ? (
              <div className={sty.vLock} style={{ marginTop: 14 }}>
                <div className={sty.vLockContent}>
                  <div className={sty.vMini}>
                    {[0, 1, 2].map((i) => (
                      <div className={sty.vMiniCard} key={i}>
                        <div className={sty.vMiniQ}>"</div>
                        <div className={sty.vMiniB1} />
                        <div className={sty.vMiniB2} />
                      </div>
                    ))}
                  </div>
                </div>
                <LockBand text={data.offer === "strategy" ? "כל פורמט, מהאות שלך. כלול בליווי" : "כל פורמט, מהאות שלך. נפתח בכוורת"} />
              </div>
            ) : null}
          </div>
        </section>

        {/* ── conversion layer ── */}
        {data.offer === "hive" ? (
          <div className={sty.vUnlock} id="kaveret-offer">
            <div className={sty.vUnlockK}>כוורת האות</div>
            <h2>
              הכול כבר נוצר מהאות שלך.
              <br />
              נשאר רק לפתוח.
            </h2>
            <p className={sty.vUnlockP}>
              האתגר המלא, חדר השידור עם שבעת התסריטים שלך, הכרטיסים והתכנים. הכול אישי, נגזר מהתשובות שלך.
            </p>
            <div className={sty.vPrice}>
              <span className={sty.vWas} dir="ltr">₪{HIVE_PRICE.was}</span>
              <b dir="ltr">₪{HIVE_PRICE.now}</b>
            </div>
            <div>
              <span className={sty.vPct}>{HIVE_PRICE.pct}% הנחה</span>
            </div>
            <div className={sty.vPnote} style={{ lineHeight: 1.8 }}>
              <strong style={{ color: "#EDE9E1" }}>מה מקבלים עכשיו, בתשלום אחד:</strong> כל העונה הראשונה. בלי התחייבות נוספת.
              <br />
              <strong style={{ color: "#EDE9E1" }}>ומה בהמשך, רק אם תרצו:</strong> <span dir="ltr">₪99</span> לחודש להמשך ייצור תוכן, פוסטים וסרטונים. מפסיקים מתי שרוצים.
            </div>
            <a className={sty.vGo} href={hiveHref}>
              פותחים את הכוורת
            </a>
          </div>
        ) : null}

        {data.offer === "strategy" ? (
          <div className={sty.vUnlock} id="kaveret-offer">
            <div className={sty.vUnlockK}>ליווי אסטרטגי</div>
            <h2>
              האות שלך מצביע על עסק שמוכן לזוז.
              <br />
              עכשיו צריך מפה.
            </h2>
            <p className={sty.vUnlockP}>
              90 דקות אחד על אחד עם הדר. יוצאים מהאות שלך ובונים עליו את המפה: המסר, ההצעה, והדרך להגיד את זה לעולם. כל מה
              {f ? " שראית" : " שראית"} בעמוד הזה, הכוורת כולה, כלול בליווי.
            </p>
            <div className={sty.vPrice}>
              <b dir="ltr">₪4,000</b>
            </div>
            <div>
              <span className={sty.vPct}>לא פיצחנו בפגישה הראשונה? פגישה נוספת עלינו</span>
            </div>
            <a className={sty.vGo} href={strategyHref}>
              לקבוע את הפגישה עם הדר
            </a>
            <div className={sty.vSec}>
              {f ? "רוצה להתחיל לבד?" : "רוצה להתחיל לבד?"} <a href={hiveHref}>הכוורת ב-<span dir="ltr">₪{HIVE_PRICE.now}</span></a>
            </div>
          </div>
        ) : null}

        {data.offer === "sensitive" ? (
          <div className={sty.vWarm}>
            <h2>{data.firstName ? `${data.firstName}, ` : ""}האות שלך נגע במשהו אמיתי.</h2>
            <p className={sty.vWarmP}>
              הקריאה הזו שמורה לך כאן, והיא לא הולכת לשום מקום. הדר תעבור עליה אישית ותחזור {f ? "אלייך" : "אליך"} בהמשך.
              {f ? " ואם בא לך לדבר עכשיו, אנחנו כאן." : " ואם בא לך לדבר עכשיו, אנחנו כאן."}
            </p>
            <a className={sty.vGo} href={waHref} target="_blank" rel="noopener" style={{ maxWidth: 320, margin: "20px auto 0" }}>
              לדבר עם הצוות בוואטסאפ
            </a>
          </div>
        ) : null}

        <footer style={{ marginTop: 48, padding: "28px 8px 10px", borderTop: "1px solid #2C323E", textAlign: "center", fontSize: 13, color: "#C9CEDA", lineHeight: 2 }}>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/privacy" style={{ color: "#C3C8D2", textDecoration: "none" }}>מדיניות פרטיות</a>
            <a href="/terms" style={{ color: "#C3C8D2", textDecoration: "none" }}>תנאי שימוש</a>
            <a href="/accessibility" style={{ color: "#C3C8D2", textDecoration: "none" }}>הצהרת נגישות</a>
            <a href="/hive/terms" style={{ color: "#C3C8D2", textDecoration: "none" }}>תנאי מנוי הכוורת</a>
          </div>
          <p style={{ fontWeight: 600, marginTop: 6 }}>
            אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | <span dir="ltr" style={{ unicodeBidi: "embed" }}>TrueSignal©</span>
          </p>
          <p>© 2026 הדר דנן בע״מ | ח.פ. 516791555 · כל הזכויות שמורות</p>
          <p>החילזון 5, רמת גן | 053-9566961</p>
          <p>
            <a href="/unsubscribe" style={{ color: "#C3C8D2" }}>לביטול הסכמה לדיוור</a>
          </p>
        </footer>
      </main>

      {/* sticky conversion bar */}
      {data.offer === "hive" ? (
        <nav className={`${sty.tabbar} ${mini ? sty.mini : ""}`} aria-label="ההצעה שלך" dir="rtl">
          <a
            href={hiveHref}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              textDecoration: "none", color: "#EDE9E1", padding: "8px 10px", minHeight: 52,
            }}
          >
            <span style={{ textAlign: "right", minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>
                כוורת האות · <span dir="ltr">₪{HIVE_PRICE.now}</span>{" "}
                <span dir="ltr" style={{ textDecoration: "line-through", color: "#D6D2C9", fontWeight: 400, fontSize: 13 }}>₪{HIVE_PRICE.was}</span>
              </span>
              <span style={{ display: "block", fontSize: 13, color: "#D6D2C9", lineHeight: 1.35 }}>
                תשלום אחד, כל העונה הראשונה · בלי התחייבות
              </span>
            </span>
            <span style={{
              flexShrink: 0, background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
              color: "#0D1018", fontWeight: 800, fontSize: 14, borderRadius: 999, padding: "9px 17px", whiteSpace: "nowrap",
            }}>
              לפתוח ←
            </span>
          </a>
        </nav>
      ) : null}
      {data.offer === "strategy" ? (
        <nav className={`${sty.tabbar} ${mini ? sty.mini : ""}`} aria-label="ההצעה שלך" dir="rtl">
          <a
            href={strategyHref}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              textDecoration: "none", color: "#EDE9E1", padding: "8px 10px", minHeight: 52,
            }}
          >
            <span style={{ textAlign: "right", minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>פגישת אסטרטגיה עם הדר</span>
              <span style={{ display: "block", fontSize: 13, color: "#D6D2C9", lineHeight: 1.35 }}>הכוורת כולה כלולה בליווי</span>
            </span>
            <span style={{
              flexShrink: 0, background: "linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)",
              color: "#0D1018", fontWeight: 800, fontSize: 14, borderRadius: 999, padding: "9px 17px", whiteSpace: "nowrap",
            }}>
              לקבוע ←
            </span>
          </a>
        </nav>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SeasonsTease — the locked continuation under the broadcast room. Same
// canonical season data + card design as the member SeasonsRoadmap
// (KaveretClient) so the tease IS the product, only the status labels
// change: nothing here is open yet — the strip exists so a lead sees
// that the kaveret keeps going past season one. Click = the same
// Netflix-style detail row (the רמיזה).
// ─────────────────────────────────────────────────────────────────────
function SeasonsTease({ offer, sale }: { offer: VisitorData["offer"]; sale: boolean }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const seasons = KAVERET_SEASONS;
  const visible = showAll ? seasons : seasons.slice(0, 5);
  const openSeason = openIdx !== null ? seasons.find((s) => s.number === openIdx) ?? null : null;

  const statusLabel = (st: KaveretSeason["status"]): string =>
    st === "live"
      ? offer === "strategy" ? "כלולה בליווי" : sale ? "נפתחת בכוורת" : "שמורה לך כאן"
      : st === "next" ? "העונה הבאה" : st === "coming" ? "בקרוב" : "בהמשך";

  return (
    <div className={sty.roadWrap}>
      <div className={sty.roadHead}>
        <span className={sty.roadTitle}>עוד פרקים ועונות מחכים</span>
      </div>
      <p className={sty.roadIntro}>
        הכוורת לא נגמרת בעונה הראשונה. כל חודש עונה חדשה, אותו אות, זווית אחרת. הצצה למה שמחכה.
      </p>
      <div className={sty.roadStrip}>
        {visible.map((sn) => (
          <button
            key={sn.number}
            type="button"
            onClick={() => setOpenIdx(openIdx === sn.number ? null : sn.number)}
            className={`${sty.roadCard} ${sty[sn.status]}`}
            style={{ textAlign: "start", fontFamily: "inherit", cursor: "pointer" }}
          >
            <div className={sty.roadTop}>
              <span className={sty.roadNo}>עונה {String(sn.number).padStart(2, "0")}</span>
              <span className={sty.roadPill}>{statusLabel(sn.status)}</span>
            </div>
            <div className={sty.roadCardTitle}>{sn.title}</div>
            <p className={sty.roadTag}>{sn.tagline}</p>
            <div className={sty.roadMeta}>{sn.episodes} פרקים</div>
          </button>
        ))}
      </div>
      {!showAll && seasons.length > visible.length ? (
        <button type="button" className={sty.roadExpand} onClick={() => setShowAll(true)}>
          עוד {seasons.length - visible.length} עונות ←
        </button>
      ) : null}
      {openSeason ? (
        <div className={sty.roadDetail}>
          <h4>עונה {openSeason.number} · {openSeason.title}</h4>
          <p>{openSeason.what}</p>
          <p className="why">{openSeason.why}</p>
        </div>
      ) : null}
      <p className={sty.txt} style={{ fontSize: 14, marginTop: 12, color: "#D6D2C9", textAlign: "center" }}>
        {offer === "strategy"
          ? "העונה הראשונה, שבעת הפרקים, כלולה בליווי. משם כל חודש עונה חדשה מהאות שלך."
          : sale
            ? "העונה הראשונה, שבעת הפרקים, נפתחת בכוורת. ההמשך, רק אם תרצו."
            : "העונות האלה שמורות לך כאן."}
      </p>
    </div>
  );
}
