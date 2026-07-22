/**
 * Hebrew email templates.
 * Each function receives a context object and returns { subject, html }.
 * All emails are RTL with the Assistant font.
 * Design: warm cream letter (#FBF8F2 on #EBE4D8), gold CTAs (#C9964A), RTL
 * right-aligned, signed by Hadar. Shared base() shell + signalLetter() shell.
 */

import { getNextWorkshopDate, formatHebrew } from "@/lib/products";

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "https://beegood.online";
const FROM_NAME = "הדר דנן";
const FROM_NAME_EN = "Hadar & Alon · beegood";

// English templates use a Latin From-line so English recipients don't see
// Hebrew in their inbox. Identified by `_en` template-key suffix.
export function fromNameFor(templateKey: string): string {
  return templateKey.endsWith("_en") ? FROM_NAME_EN : FROM_NAME;
}

// ── Base layout ───────────────────────────────────────────────
function base(content: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Frank+Ruhl+Libre:wght@500;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #EBE4D8;
      font-family: 'Assistant', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      color: #2A2520;
    }
    .wrapper { max-width: 600px; margin: 26px auto; padding: 0 14px 40px; direction: rtl; text-align: right; }
    .card { background: #FBF8F2; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 18px rgba(60,45,20,0.10); direction: rtl; text-align: right; }
    .header {
      background: #FBF8F2;
      padding: 30px 32px 8px;
      color: #2A2520;
      text-align: right;
      border-bottom: 1px solid rgba(194,151,63,0.18);
    }
    .header-logo {
      font-size: 13px;
      font-weight: 800;
      color: #9A7526;
      letter-spacing: 0.03em;
      margin-bottom: 14px;
    }
    .header h1 { font-size: 24px; font-weight: 800; color: #1c1812; line-height: 1.3; }
    .header p  { font-size: 14px; color: #6B6256; margin-top: 6px; }
    .header-accent { color: #C9964A; }
    .body { padding: 28px 32px; text-align: right; direction: rtl; }
    .body p  { font-size: 16px; line-height: 1.75; color: #2A2520; margin-bottom: 14px; text-align: right; }
    .body h2 { font-size: 20px; font-weight: 800; color: #1c1812; margin-bottom: 12px; text-align: right; }
    .cta {
      display: inline-block;
      background: #C9964A;
      color: #241a08 !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
      padding: 14px 32px;
      border-radius: 10px;
      margin: 8px 0 16px;
    }
    .cta:hover { background: #E8B94A; }
    .cta-dark {
      display: inline-block;
      background: #1c1812;
      color: #F5E9CE !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
      padding: 14px 32px;
      border-radius: 10px;
      margin: 8px 0 16px;
    }
    .cta-green {
      display: inline-block;
      background: #C9964A;
      color: #241a08 !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
      padding: 14px 32px;
      border-radius: 10px;
      margin: 8px 0 16px;
    }
    .divider { border: none; border-top: 1px solid rgba(194,151,63,0.18); margin: 24px 0; }
    .highlight-box {
      background: rgba(194,151,63,0.10);
      border-right: 4px solid #C9964A;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
      text-align: right;
    }
    .highlight-box p { margin: 0; color: #4a4236; font-weight: 600; font-size: 15px; text-align: right; }
    .highlight-box-green {
      background: rgba(127,212,155,0.12);
      border-right: 4px solid #5CA878;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
      text-align: right;
    }
    .highlight-box-green p { margin: 0; color: #2f6e4a; font-weight: 600; font-size: 15px; text-align: right; }
    .highlight-box-yellow {
      background: rgba(194,151,63,0.14);
      border-right: 4px solid #9A7526;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
      text-align: right;
    }
    .highlight-box-yellow p { margin: 0; color: #6e571f; font-weight: 600; font-size: 15px; text-align: right; }
    .coupon-box {
      background: #1c1812;
      border-radius: 10px;
      padding: 18px 24px;
      margin: 16px 0;
      text-align: center;
    }
    .coupon-box p { color: #C9B898; font-size: 13px; margin: 0 0 6px; }
    .coupon-code { color: #E8B94A !important; font-size: 28px !important; font-weight: 800 !important; letter-spacing: 0.1em; }
    .step-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
    .step-num {
      background: #C9964A;
      color: #241a08;
      font-weight: 800;
      font-size: 14px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .step-text { font-size: 15px; color: #4a4236; line-height: 1.5; text-align: right; }
    .ssig { font-family: 'Frank Ruhl Libre', Georgia, serif; font-size: 19px; color: #1c1812; margin-top: 20px; }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #8A8073;
      margin-top: 22px;
      line-height: 1.8;
    }
    .footer a { color: #9A7526; text-decoration: underline; }
    .product-tag {
      display: inline-block;
      background: rgba(194,151,63,0.14);
      color: #6e571f;
      font-size: 13px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 100px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>קיבלת אימייל זה כי נרשמת ב-<a href="${APP_URL}">beegood.online</a></p>
      <p>הדר דנן בע״מ · ישראל</p>
      <p style="margin-top:8px">
        <a href="${APP_URL}/unsubscribe">הסר אותי מרשימת התפוצה</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────

export interface EmailTemplateContext {
  name:    string;
  email?:  string;
  [key: string]: unknown;
}

export interface RenderedEmail {
  subject: string;
  html:    string;
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 1 - Welcome (USER_SIGNED_UP · 0h)
// ─────────────────────────────────────────────────────────────

function welcome(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `ברוכ/ה הבא/ה, ${firstName}`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן · beegood</div>
        <h1>ברוכ/ה הבא/ה, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>ברוכ/ה הבא/ה לעולם של <span dir="ltr" style="unicode-bidi:embed">TrueSignal©</span>.</p>
        <p>שמי הדר דנן.</p>
        <p>אני עובדת עם בעלי עסקים שיש להם משהו אמיתי לתת לעולם,</p>
        <p>אבל השיווק שלהם לא משקף את זה.</p>
        <p>מאז 2023 אני עוזרת לעסקים לא רק לשווק,</p>
        <p>אלא לבנות מערכת שיווק שעובדת בשבילם.</p>
        <p>מ-197 שקל ועד 14,000 שקל,</p>
        <p>מאות עסקים כבר עשו את המסע.</p>
        <p>חלקם הגיעו אליי בלי ניסיון בשיווק.</p>
        <p>חלקם הגיעו עם ניסיון, אבל בלי כיוון.</p>
        <p>כולם יצאו עם משהו שלא היה להם לפני.</p>
        <p>ואת/ה עכשיו חלק מזה.</p>
        <p>בימים הקרובים תקבל/י ממני עוד תוכן.</p>
        <p>בינתיים, אם יש שאלה, <a href="https://wa.me/972539566961" style="color:#9A7526">דברו איתי בוואטסאפ</a>.</p>
        <p>אני כאן.</p>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Manual send — full signal result delivered to the user's inbox.
// Triggered by the "שלח לי את כל האות באימייל" button on /signal result page.
// Not part of any sequence — fired on demand via /api/signal/[id]/email-result.
// ─────────────────────────────────────────────────────────────

function signalResultFull(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  // The signal payload is passed in as ctx.signal — defensive defaults so a
  // missing field doesn't render an empty <p>.
  const sig = (ctx.signal as Record<string, unknown> | undefined) ?? {};
  const get = (k: string) => {
    const v = sig[k];
    return typeof v === "string" ? v : "";
  };
  const dirs = Array.isArray(sig.content_directions)
    ? (sig.content_directions as unknown[]).filter((d): d is string => typeof d === "string")
    : [];

  const signalSentence = get("signal");
  const signalPromise  = get("signal_promise");
  const painSource     = get("pain_source");
  const element        = get("element");
  const centralTool    = get("central_tool");
  const people         = get("people");
  const warmNote       = get("warm_note");

  return {
    subject: `${firstName}, האות שלך — מלא, לארכיון`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · TrueSignal©</div>
        <h1>${firstName}, האות שלך</h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>הנה האות שלך, מלא, לקריאה חוזרת ושמירה.</p>

        ${signalSentence ? `
        <div class="highlight-box-yellow" style="text-align:center;padding:24px 18px;">
          <div style="font-size:11px;letter-spacing:1.4px;color:#9E7C3A;margin-bottom:8px;text-transform:uppercase;">האות</div>
          <p style="font-size:18px;font-weight:600;line-height:1.5;margin:0;color:#1a1a1a;">${signalSentence}</p>
        </div>
        ` : ""}

        ${signalPromise ? `
        <p style="font-size:11px;letter-spacing:1px;color:#C9964A;text-transform:uppercase;margin:24px 0 6px;">↗ מה שהאות שלך מבטיח</p>
        <p style="line-height:1.7;">${signalPromise}</p>
        ` : ""}

        ${warmNote ? `
        <p style="font-size:11px;letter-spacing:1px;color:#C9964A;text-transform:uppercase;margin:24px 0 6px;">הערה אישית</p>
        <p style="line-height:1.7;">${warmNote}</p>
        ` : ""}

        ${painSource ? `
        <p style="font-size:11px;letter-spacing:1px;color:#C9964A;text-transform:uppercase;margin:24px 0 6px;">מקור הכאב</p>
        <p style="line-height:1.7;">${painSource}</p>
        ` : ""}

        ${element ? `
        <p style="font-size:11px;letter-spacing:1px;color:#C9964A;text-transform:uppercase;margin:24px 0 6px;">האלמנט</p>
        <p style="line-height:1.7;">${element}</p>
        ` : ""}

        ${centralTool ? `
        <p style="font-size:11px;letter-spacing:1px;color:#C9964A;text-transform:uppercase;margin:24px 0 6px;">הכלי המרכזי</p>
        <p style="line-height:1.7;">${centralTool}</p>
        ` : ""}

        ${people ? `
        <p style="font-size:11px;letter-spacing:1px;color:#C9964A;text-transform:uppercase;margin:24px 0 6px;">האנשים שלך</p>
        <p style="line-height:1.7;">${people}</p>
        ` : ""}

        ${dirs.length ? `
        <p style="font-size:11px;letter-spacing:1px;color:#C9964A;text-transform:uppercase;margin:24px 0 6px;">שלושה כיווני תוכן להתחיל מהם</p>
        <ol style="line-height:1.75;padding-inline-start:22px;">
          ${dirs.map((d) => `<li style="margin-bottom:6px;">${d}</li>`).join("")}
        </ol>
        ` : ""}

        <hr class="divider"/>

        <p>האות שלך תמיד נשמר באזור האישי:</p>
        <a class="cta" href="${APP_URL}/account">פתח את האזור האישי ←</a>

        <p>חברי הכוורת מקבלים כל חודש שני רעיונות תוכן מותאמים אישית לאות שלהם.</p>
        <a class="cta" href="${APP_URL}/hive">לראות את מסלולי הכוורת ←</a>

        <p>אם יש שאלה, <a href="https://wa.me/972539566961" style="color:#9A7526">הוואטסאפ פתוח</a>.</p>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SIGNAL_EXTRACTED · 0h - dedicated welcome for /signal leads.
// Fired by /api/signal/extract on every successful extraction. Replaces
// the generic welcome for this funnel — references the diagnostic they
// just took and points to the Hive as the natural next step.
// ─────────────────────────────────────────────────────────────

function hiveMonthlyDrop(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const month = String((ctx as any).year_month ?? "");
  return {
    subject: `${firstName}, 10 רעיונות חדשים מהאות שלך`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · הכוורת</div>
        <h1>${firstName}, החודש שלך מוכן</h1>
      </div>
      <div class="body">
        <p>10 רעיונות תוכן חדשים מחכים לך במערכת.</p>
        <p>כל אחד מהם נגזר מהאות הספציפי שלך — לא רעיונות גנריים שכל אחד בתחום שלך יכול לכתוב, אלא דווקא דברים שרק את/ה יכול/ה.</p>
        <p>הם נשמרים אצלך, אפשר לחזור אליהם כל החודש:</p>
        <a class="cta" href="${APP_URL}/kaveret">לראות את הרעיונות שלי ←</a>
        <p style="margin-top:24px">תזכורת קטנה: עבור כל רעיון יש לך בדף גם כפתור "בדוק טיוטה" ש-AI יקרא את הפוסט שלך ויגיד אם זה במדויק האות שלך או שיש דרך לחדד.</p>
        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">${month ? "החודש: " + month : ""} · אם יש שאלה, <a href="https://wa.me/972539566961" style="color:#6b7280">הוואטסאפ פתוח</a>.</p>
      </div>
    `),
  };
}

// ── Signal nurture chain helpers ─────────────────────────────
// The funnel offers whatever the diagnostic routed the lead to. The Hive is
// paused (being redefined), so strategy-fit → the strategy session, everyone
// else → the 7-day challenge (the entry product). Templates read ctx.bucket.
const SIGNAL_WA = "https://wa.me/972539566961";

function signalOffer(ctx: EmailTemplateContext): { isStrategy: boolean; href: string; cta: string } {
  const isStrategy = ctx.bucket === "strategy";
  // Unified home: when the send handler resolved a kaveret link (switchover
  // on), every nurture CTA leads there — the offer matching the lead's
  // routing already lives on that page.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kaveretUrl = (ctx as any).kaveretUrl;
  if (typeof kaveretUrl === "string" && kaveretUrl) {
    return { isStrategy, href: kaveretUrl, cta: "לכניסה לכוורת שלך ←" };
  }
  return isStrategy
    ? { isStrategy, href: `${APP_URL}/strategy`, cta: "לקבוע פגישת אסטרטגיה ←" }
    : { isStrategy, href: `${APP_URL}/challenge`, cta: "להצטרף לאתגר ←" };
}

// Signal-takers usually never set a password, so /account is a wall they can't
// pass. The send-email handler passes a magic link in ctx.magicLink — a one-tap
// passwordless login. Fall back to /account for anyone already authenticated.
function signalAccountHref(ctx: EmailTemplateContext): string {
  return typeof ctx.magicLink === "string" && ctx.magicLink ? ctx.magicLink : `${APP_URL}/account`;
}

// Warm personal-letter wrapper for the signal nurture chain. Replaces the
// corporate dark-header + blue-button look with a signed letter from Hadar (the
// design the world's top email marketers use). RTL-correct: each line is its own
// <p>, gold brand CTA, no neutral-char bullets. Body is short-line copy.
function signalLetter(subject: string, body: string): RenderedEmail {
  return {
    subject,
    html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&family=Frank+Ruhl+Libre:wght@500;700&display=swap" rel="stylesheet" />
  <style>
    body { margin:0; background:#EBE4D8; font-family:'Assistant',Arial,sans-serif; direction:rtl; text-align:right; color:#2A2520; }
    .swrap { max-width:600px; margin:0 auto; padding:26px 14px 40px; direction:rtl; text-align:right; }
    .sletter { background:#FBF8F2; border-radius:16px; padding:34px 30px 28px; direction:rtl; text-align:right; }
    .smark { font-size:13px; font-weight:800; letter-spacing:.3px; color:#9A7526; margin:0 0 22px; }
    .smark span { color:#8A8073; font-weight:400; }
    .sletter p { font-size:16.5px; line-height:1.5; color:#2A2520; margin:0 0 11px; text-align:right; }
    .sbeat { height:13px; line-height:13px; font-size:1px; }
    .scta { display:inline-block; background:#C9964A; color:#241a08; font-weight:800; font-size:15.5px; text-decoration:none; border-radius:10px; padding:13px 30px; margin:12px 0 10px; }
    .sloop { background:rgba(194,151,63,0.10); border-right:3px solid #C9964A; border-radius:8px; padding:13px 16px; font-size:15.5px; line-height:1.6; color:#4a4236; margin:10px 0; text-align:right; }
    .ssmall { font-size:14px; color:#6B6256; }
    .ssig { font-family:'Frank Ruhl Libre',Georgia,serif; font-size:19px; color:#1c1812; margin-top:20px; }
    .sletter a:not(.scta) { color:#9A7526; }
    .sfoot { max-width:600px; margin:14px auto 0; padding:0 18px; text-align:center; font-size:12px; line-height:1.8; color:#8A8073; direction:rtl; }
    .sfoot a { color:#9A7526; text-decoration:underline; }
  </style>
</head>
<body>
  <div class="swrap">
    <div class="sletter">
      <div class="smark">הדר דנן <span>· beegood</span></div>
      ${body}
    </div>
    <div class="sfoot">
      <p>קיבלת אימייל זה כי נרשמת ב-<a href="${APP_URL}">beegood.online</a></p>
      <p>הדר דנן בע״מ · ישראל</p>
      <p style="margin-top:6px"><a href="${APP_URL}/unsubscribe">הסר אותי מרשימת התפוצה</a></p>
    </div>
  </div>
</body>
</html>`,
  };
}

const SB = `<div class="sbeat">&nbsp;</div>`; // visual beat (blank line)

// EMAIL 1 · 0h — deliver + set the stage + open loop.
function signalWelcome(ctx: EmailTemplateContext): RenderedEmail {
  const n = ctx.name.split(" ")[0];
  return signalLetter(`${n}, ראיתי אותך. עכשיו תורי לספר לך מה ראיתי`, `
      <p>${n},</p>
      <p>לפני רגע קראתי את חמש התשובות שלך.</p>
      <p>מילה במילה.</p>
      <p>לא דילגתי על אף שורה.</p>
      ${SB}
      <p>וזה לא מובן מאליו.</p>
      <p>כי רוב האנשים בכלל לא עוצרים.</p>
      <p>הם רצים מלקוח ללקוח, מפוסט לפוסט,</p>
      <p>ולא שואלים את עצמם פעם אחת מה הם באמת באים לתת.</p>
      ${SB}
      <p>את/ה עצרת.</p>
      <p>ויש בתשובות שלך פרט אחד קטן</p>
      <p>שאדם אחר בתחום שלך כנראה לא היה שם לב אליו בכלל.</p>
      <p>הוא הפך לאות שלך.</p>
      <p>והוא שמור לך כאן:</p>
      <a class="scta" href="${signalAccountHref(ctx)}">האות שלי ←</a>
      ${SB}
      <p>עכשיו תקשיב/י טוב.</p>
      <p>אות הוא לא סוף הדרך.</p>
      <p>הוא ההתחלה שלה.</p>
      ${SB}
      <p>כי השאלה האמיתית היא לא "מה האות שלי".</p>
      <p>אלא מה את/ה עושה איתו.</p>
      <p>איך הוא הופך ממשפט יפה</p>
      <p>לדרך שבה הלקוחות הנכונים בוחרים בך,</p>
      <p>עוד לפני שדיברתם.</p>
      ${SB}
      <p>בימים הקרובים אשלח לך כמה דברים מהשטח.</p>
      <p>דברים שלמדתי ממאות בעלי עסקים שישבו בדיוק במקום שאת/ה נמצא בו עכשיו.</p>
      <div class="sloop">ומחר אכתוב לך על הטעות האחת<br>שאני רואה כמעט אצל כולם<br>בדיוק ברגע הזה, אחרי שהם מקבלים בהירות.<br>היא עולה הרבה כסף.<br>ורובם אפילו לא מרגישים אותה.</div>
      <p class="ssig">עד מחר,<br>הדר</p>`);
}

// EMAIL 2 · +1d — value (the mistake story) + exercise + open loop.
function signalDay1(ctx: EmailTemplateContext): RenderedEmail {
  const n = ctx.name.split(" ")[0];
  return signalLetter(`${n}, הטעות ששווה הרבה כסף (ועושים אותה כשמתחילים)`, `
      <p>${n},</p>
      <p>הבטחתי לך אתמול לספר על הטעות.</p>
      <p>אז הנה היא.</p>
      ${SB}
      <p>הרגע שבו אדם מקבל בהירות על מי שהוא,</p>
      <p>הוא בדיוק הרגע שבו הוא הכי מפחד לצאת איתה החוצה.</p>
      ${SB}
      <p>"אחכה שזה יהיה מנוסח מושלם."</p>
      <p>"אחכה שיהיה לי זמן."</p>
      <p>"אחכה שאהיה בטוח/ה."</p>
      ${SB}
      <p>וככה האות הכי חד בעולם</p>
      <p>נשאר משפט יפה ששוכב במגירה.</p>
      ${SB}
      <p>ראיתי את זה מקרוב.</p>
      <p>בעלת עסק מבריקה ישבה מולי.</p>
      <p>היה לה אות מדויק כמו סכין.</p>
      <p>והיא לא פרסמה אותו חודשיים.</p>
      <p>"עוד לא הרגשתי מוכנה," היא אמרה.</p>
      ${SB}
      <p>בינתיים, התחרות שלה,</p>
      <p>הרבה פחות מוכשרת ממנה,</p>
      <p>פשוט דיברה.</p>
      <p>וקטפה את הלקוחות שהיו אמורים להיות שלה.</p>
      ${SB}
      <p>אז הנה תרגיל. להיום. לא למחר.</p>
      <p>קח/י את האות שלך.</p>
      <p>כתוב/כתבי פוסט אחד שמתחיל ממנו.</p>
      <p>לא על מה שאת/ה עושה.</p>
      <p>על מה שאת/ה רואה שאחרים לא.</p>
      ${SB}
      <p>שורה אחת של אמת בחוץ</p>
      <p>עדיפה על עמוד מושלם במגירה.</p>
      <div class="sloop">מחרתיים אספר לך משהו שגיליתי אחרי מאות בעלי עסקים.<br>למה דווקא הכי מוכשרים<br>הם הכי בלתי-נראים.</div>
      <p class="ssig">הדר</p>`);
}

// EMAIL 3 · +3d — the drama / the big story + open loop to the offer.
function signalDay3(ctx: EmailTemplateContext): RenderedEmail {
  const n = ctx.name.split(" ")[0];
  return signalLetter(`${n}, למה דווקא הכי מוכשרים נשארים הסוד הכי שמור`, `
      <p>${n},</p>
      <p>יש דבר אחד שאני רואה שוב ושוב מאז 2023.</p>
      <p>אצל מאות בעלי עסקים.</p>
      <p>והוא עדיין עוצר לי את הנשימה.</p>
      ${SB}
      <p>האנשים הכי עמוקים שאני פוגשת,</p>
      <p>הכי מדויקים,</p>
      <p>הכי טובים במה שהם עושים,</p>
      <p>הם בדיוק אלה שהשוק לא רואה.</p>
      ${SB}
      <p>לא כי הם לא מספיק טובים.</p>
      <p>להפך.</p>
      ${SB}
      <p>אלא כי הם משווקים את הכישורים שלהם.</p>
      <p>ולא את האות שלהם.</p>
      <p>את מה שהם עושים.</p>
      <p>ולא את מה שרק הם רואים.</p>
      ${SB}
      <p>וזה החלק שהכי כואב לי:</p>
      <p>בזמן שהם מחכים להיות מוכנים,</p>
      <p>מישהו אחר לוקח את הלקוחות.</p>
      ${SB}
      <p>לא מישהו יותר טוב מהם.</p>
      <p>מישהו יותר ברור מהם.</p>
      ${SB}
      <p>כי בסוף, השוק לא בוחר את הכי טוב.</p>
      <p>הוא בוחר את מי שהוא מבין הכי מהר.</p>
      ${SB}
      <p>בניתי את כל מה שאני עושה</p>
      <p>בדיוק בשביל הרגע הזה.</p>
      <p>שתפסיק/י להיות הסוד הכי שמור בתחום שלך.</p>
      ${SB}
      <p>והאות שכבר יש לך ביד,</p>
      <p>הוא ההתחלה של זה.</p>
      <div class="sloop">בעוד יומיים אכתוב לך על החלק שאף אחד לא אוהב לשמוע.<br>לדעת את האות, זה הקל.<br>החלק הקשה הוא אחר לגמרי.<br>ושם רוב האנשים נופלים.</div>
      <p class="ssig">הדר</p>`);
}

// EMAIL 4 · +5d — THE OFFER. Branches by bucket (strategy / challenge).
function signalDay5(ctx: EmailTemplateContext): RenderedEmail {
  const n = ctx.name.split(" ")[0];
  const offer = signalOffer(ctx);
  const strat = `
      <p>${n},</p>
      <p>אז כמו שהבטחתי.</p>
      <p>החלק הקשה.</p>
      ${SB}
      <p>לדעת את האות שלך, זה הקל.</p>
      ${SB}
      <p>לתרגם אותו למיצוב,</p>
      <p>כזה שמביא את הלקוחות הנכונים,</p>
      <p>במחיר הנכון,</p>
      <p>ושמסביר למה דווקא את/ה,</p>
      <p>ולא עוד עשרה שעושים אותו דבר,</p>
      <p>זה החלק הקשה.</p>
      ${SB}
      <p>ושם, כמעט תמיד לבד,</p>
      <p>רוב האנשים נתקעים.</p>
      ${SB}
      <p>האות שלך יצא חד.</p>
      <p>זה אומר משהו.</p>
      <p>זה אומר שאת/ה כבר לא במקום של "עוד תוכן".</p>
      ${SB}
      <p>את/ה במקום שבו</p>
      <p>שיחה אחת ממוקדת</p>
      <p>שווה יותר ממאה פוסטים.</p>
      ${SB}
      <p>בפגישת האסטרטגיה אנחנו עושים בדיוק את זה.</p>
      <p>לוקחים את האות שלך.</p>
      <p>ובונים ממנו את המיצוב.</p>
      <p>מי הלקוח.</p>
      <p>מה ההצעה.</p>
      <p>ולמה את/ה.</p>
      ${SB}
      <p>תשעים דקות. אחד על אחד.</p>
      <p>ויוצאים עם כיוון אחד ברור,</p>
      <p>כזה שאפשר להתחיל לפעול לפיו כבר מחר בבוקר.</p>
      ${SB}
      <p>ואם לא פיצחנו בפגישה הראשונה,</p>
      <p>הפגישה הבאה עליי. בלי סיכון.</p>
      <a class="scta" href="${offer.href}">לקבוע פגישת אסטרטגיה ←</a>
      <div class="sloop">בעוד כמה ימים אראה לך בדיוק מה קורה בחדר.<br>ולמה זו לא עוד שיחת מכירה.<br>אם את/ה מתלבט/ת, חכה/י לזה.</div>`;
  const chal = `
      <p>${n},</p>
      <p>אז כמו שהבטחתי.</p>
      <p>החלק הקשה.</p>
      ${SB}
      <p>לדעת את האות שלך, זה הקל.</p>
      ${SB}
      <p>לקום ולהופיע איתו,</p>
      <p>שבוע אחרי שבוע,</p>
      <p>עד שהוא הופך לדמות שאנשים בוחרים בה,</p>
      <p>זה החלק הקשה.</p>
      ${SB}
      <p>האות הוא חומר הגלם.</p>
      <p>האתגר הוא איפה שהוא הופך לסיפור.</p>
      ${SB}
      <p>שבעה ימים.</p>
      <p>שבעה סרטונים.</p>
      <p>כל אחד חושף שכבה נוספת של מי שאת/ה,</p>
      <p>עד שמצטברת דמות שלמה</p>
      <p>שלקוחות מתאהבים בה לפני שדיברתם.</p>
      ${SB}
      <p>חמש מאות עסקים כבר עברו את זה.</p>
      <p>במאה תשעים ושבעה שקלים.</p>
      <a class="scta" href="${offer.href}">להצטרף לאתגר ←</a>
      <div class="sloop">בעוד כמה ימים אראה לך בדיוק מה קורה ב-7 הימים.<br>אם את/ה מתלבט/ת, חכה/י לזה.</div>`;
  return signalLetter(`${n}, לדעת את האות זה הקל. עכשיו אספר לך מה קשה`,
    (offer.isStrategy ? strat : chal) + `<p class="ssig">הדר</p>`);
}

// EMAIL 5 · +8d — proof + objection handling. Branches by bucket.
function signalDay8(ctx: EmailTemplateContext): RenderedEmail {
  const n = ctx.name.split(" ")[0];
  const offer = signalOffer(ctx);
  const strat = `
      <p>${n},</p>
      <p>אולי את/ה שואל/ת את עצמך</p>
      <p>אם פגישה אחת באמת מזיזה משהו.</p>
      ${SB}
      <p>שאלה הוגנת.</p>
      <p>אז במקום להבטיח לך, אספר לך מה קורה בחדר.</p>
      ${SB}
      <p>אנחנו פותחים מהאות שלך.</p>
      <p>לא מדף ריק.</p>
      ${SB}
      <p>לוקחים אותו, ומפרקים אותו למיצוב:</p>
      <p>מי בדיוק הלקוח שלך.</p>
      <p>מה ההצעה שתגרום לו לבחור בך.</p>
      <p>ומה המחיר שמשקף את הערך האמיתי.</p>
      ${SB}
      <p>ואז, ביחד,</p>
      <p>בוחרים כיוון אחד.</p>
      <p>כזה שאפשר להתחיל לפעול לפיו כבר למחרת בבוקר.</p>
      ${SB}
      <p>אישה אחת ישבה מולי</p>
      <p>בטוחה שהיא "עוד מאמנת".</p>
      ${SB}
      <p>יצאנו מהפגישה</p>
      <p>עם משפט מיצוב אחד</p>
      <p>שאף מאמנת אחרת בארץ לא יכלה להגיד.</p>
      ${SB}
      <p>שבוע אחר כך</p>
      <p>היא העלתה את המחיר.</p>
      <p>ולא איבדה לקוח אחד.</p>
      ${SB}
      <p>זו לא הרצאה.</p>
      <p>זו לא תבנית.</p>
      <p>זו עבודה על העסק שלך,</p>
      <p>מתוך האות שכבר יש לך ביד.</p>
      ${SB}
      <p>ואם לא פיצחנו בפגישה הראשונה, הבאה עליי.</p>
      <a class="scta" href="${offer.href}">לקבוע פגישה ←</a>`;
  const chal = `
      <p>${n},</p>
      <p>אולי את/ה שואל/ת אם האתגר באמת מתאים לך.</p>
      ${SB}
      <p>שאלה הוגנת.</p>
      <p>אז הנה מה שמחכה לך בפנים:</p>
      ${SB}
      <p>שבעה סרטונים קצרים.</p>
      <p>יום אחרי יום.</p>
      <p>כל אחד חושף שכבה נוספת של הדמות שלך.</p>
      ${SB}
      <p>לא טיפים גנריים.</p>
      <p>תרגול אמיתי של להופיע עם האות שלך.</p>
      ${SB}
      <p>ובסוף השבוע</p>
      <p>יש לך סיפור שלם.</p>
      <p>לא עוד פוסט בודד.</p>
      ${SB}
      <p>זה לא קורס תיאוריה.</p>
      <p>זה אימון להופיע כמי שאת/ה,</p>
      <p>עד שזה הופך טבעי.</p>
      ${SB}
      <p>חמש מאות עסקים כבר עברו את זה.</p>
      <p>פחות מארוחה בחוץ.</p>
      <a class="scta" href="${offer.href}">להצטרף לאתגר ←</a>`;
  return signalLetter(`${n}, מה באמת קורה (וזו לא שיחת מכירה)`,
    (offer.isStrategy ? strat : chal) +
    `<p class="ssmall">ואם יש לך שאלה לפני, אני כאן. פשוט תכתוב/כתבי לי <a href="${SIGNAL_WA}">בוואטסאפ</a>.</p><p class="ssig">הדר</p>`);
}

// EMAIL 6 · +12d — soft close + human escalation.
function signalDay12(ctx: EmailTemplateContext): RenderedEmail {
  const n = ctx.name.split(" ")[0];
  const offer = signalOffer(ctx);
  return signalLetter(`${n}, הדלת עדיין פתוחה (מייל אחרון)`, `
      <p>${n},</p>
      <p>מייל אחרון.</p>
      <p>בלי לחץ.</p>
      ${SB}
      <p>האות שלך עדיין שמור אצלך.</p>
      <p>הוא לא הולך לשום מקום.</p>
      ${SB}
      <p>וגם אם לא תעשה/י איתו כלום עכשיו,</p>
      <p>הוא יחכה.</p>
      ${SB}
      <p>אבל אם משהו בתוכך כבר יודע</p>
      <p>שהגיע הזמן לקחת אותו צעד קדימה,</p>
      <p>ולהפוך אותו ממשפט</p>
      <p>לדרך שאנשים בוחרים בה,</p>
      ${SB}
      <p>הדלת פתוחה.</p>
      <a class="scta" href="${offer.href}">${offer.cta}</a>
      ${SB}
      <p>ואם את/ה פשוט רוצה לחשוב בקול,</p>
      <p>עם מישהי שרואה את כל התמונה,</p>
      <p>בלי שום התחייבות,</p>
      <p>תכתוב/כתבי לי מילה <a href="${SIGNAL_WA}">בוואטסאפ</a>.</p>
      <p>אני קוראת כל הודעה בעצמי.</p>
      ${SB}
      <p>האות שלך הוא ההתחלה.</p>
      <p>מה תעשה/י איתו,</p>
      <p>זה כבר את/ה.</p>
      <p class="ssig">הדר</p>`);
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 1 cont. - Followup 24h (USER_SIGNED_UP · 24h)
// ─────────────────────────────────────────────────────────────

function followup24h(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `${firstName}, מה שמייחד אותך — זה לא מה שאתה חושב`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>הבידול שלך, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>רוב בעלי העסקים משווקים את הכישורים שלהם.</p>
        <p>אבל זה לא מה שגורם ללקוחות לבחור בהם.</p>
        <p>מה שגורם ללקוחות לבחור —</p>
        <p>זה הסיפור.</p>
        <p>הדמות.</p>
        <p>האדם שמאחורי השירות.</p>
        <p>האתגר 7 הימים בנוי בדיוק לזה.</p>
        <p>7 סרטונים.</p>
        <p>כל אחד חושף שכבה נוספת של מי שאתה.</p>
        <p>ביחד הם יוצרים סיפור שלם —</p>
        <p>שגורם ללקוחות להתאהב בך לפני שדיברתם.</p>
        <p>זה לא שיווק.</p>
        <p>זה בניית דמות עגולה שאנשים בוחרים בה.</p>
        <p>500+ עסקים כבר עשו את זה.</p>
        <p style="font-size: 17px;"><span style="text-decoration: line-through; color: #9E9990;">₪297</span> <strong style="color: #C9964A;">₪197 בלבד</strong> (במבצע, 34% הנחה).</p>
        <a class="cta" href="${APP_URL}/challenge${ep}">להצטרפות לאתגר ←</a>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 1 cont. - Followup 72h (USER_SIGNED_UP · 72h)
// ─────────────────────────────────────────────────────────────

function followup72h(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `${firstName}, בזמן שאתה מחכה לרגע המתאים`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>הרגע המתאים, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>"אני אתחיל כשיהיה לי זמן."</p>
        <p>"אני אתחיל כשיהיה לי מה להגיד."</p>
        <p>"אני אתחיל כשאני מוכן."</p>
        <p>בינתיים —</p>
        <p>המתחרים שלך לא מחכים.</p>
        <p>הם בונים נוכחות.</p>
        <p>הם מספרים את הסיפור שלהם.</p>
        <p>הם תופסים את הקהל שמחפש בדיוק מה שיש לך להציע.</p>
        <p>האתגר 7 הימים הוא 7 ימים.</p>
        <p>לא 7 חודשים.</p>
        <p>לא 7 שעות ביום.</p>
        <p>7 ימים של תוכן שבונה את הבידול שלך.</p>
        <p>מחר — מישהו אחר יחליט להתחיל.</p>
        <p>השאלה היא אם זה יהיה אתה.</p>
        <a class="cta" href="${APP_URL}/challenge${ep}">להצטרפות לאתגר ←</a>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 2 - Challenge access (CHALLENGE_PURCHASED · 0h)
// ─────────────────────────────────────────────────────────────

function signalHiveWelcome(ctx: EmailTemplateContext): RenderedEmail {
  const firstName  = ctx.name.split(" ")[0];
  const accessLink = (ctx.access_link as string | undefined) ?? `${APP_URL}/kaveret`;
  const isMagic    = accessLink.includes("token=") || accessLink.includes("supabase");
  const m          = ctx.gender === "m";   // default stays feminine
  // Manual grants to members who haven't done the diagnosis yet: the kit
  // routes them to signal discovery on entry — the email must not claim
  // "גילית את האות שלך" before it happened.
  const preSignal  = ctx.needs_signal === true;
  return {
    subject: `${firstName} — נכנסת לכוורת האות`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · כוורת האות</div>
        <h1>${m ? "ברוך הבא" : "ברוכה הבאה"}, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        ${preSignal
          ? `<p>הכוורת שלך פתוחה.</p>
        <p>הצעד הראשון בפנים: גילוי האות שלך — כמה דקות של שאלות, ומהתשובות נבנה הכל.</p>
        <p>מה מחכה לך אחרי הגילוי:</p>`
          : `<p>גילית את האות שלך.</p>
        <p>עכשיו מתחילים להוציא אותו לעולם.</p>
        <p>הכל מחכה לך במקום אחד:</p>`}
        <p>· לוח האות — האות, הכאב, ההבטחה והקהל שלך.</p>
        <p>· אתגר האות — 7 ימים, ממוסגרים סביב האות שלך.</p>
        <p>· ערכת תוכן — כיווני-תוכן ופתיחות שנגזרים מהאות.</p>
        <p>· ערכת ויזואל — הכרטיסים שלך + כיווני-צילום.</p>
        <p>· הבמאית — 7 בימויים אישיים מול המצלמה.</p>
        <a class="cta" href="${accessLink}">כניסה לכוורת האות ←</a>
        ${isMagic ? `<p style="font-size:13px;color:#6b7280;margin-top:8px;">הלינק מחבר אותך ישירות — ללא צורך בסיסמה. תקף ל-24 שעות.</p>` : ""}
        <p>${m ? "קח" : "קחי"} את זה יום-יום. אין למהר.</p>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// English twin of signalHiveWelcome — fired by SIGNAL_HIVE_PURCHASED_EN for
// USD buyers (currency is the EN marker on the purchase row). The access
// link defaults to the ENGLISH member home.
function signalHiveWelcomeEn(ctx: EmailTemplateContext): RenderedEmail {
  const firstName  = ctx.name.split(" ")[0] || "there";
  const accessLink = (ctx.access_link as string | undefined) ?? `${APP_URL}/en/kaveret`;
  const isMagic    = accessLink.includes("token=") || accessLink.includes("supabase");
  return {
    subject: `${firstName} - you're in The Signal Hive`,
    html: enBase(`
      <div class="header">
        <div class="header-logo">beegood · The Signal Hive</div>
        <h1>Welcome in, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>You found your signal.</p>
        <p>Now we start putting it into the world.</p>
        <p>Everything is waiting in one place:</p>
        <p>· Your signal board - the signal, the ground, the promise, your people.</p>
        <p>· Your episodes - seven scripts, directed around your signal.</p>
        <p>· The broadcast room - film with a teleprompter, captions burned in.</p>
        <p>· Your texts - bio, about, manifesto, written and ready.</p>
        <p>· Your visuals - designed cards that carry your signal.</p>
        <a class="cta" href="${accessLink}">Enter your Hive</a>
        ${isMagic ? `<p style="font-size:13px;color:#6b7280;margin-top:8px;">This link signs you in directly - no password needed. Valid for 24 hours.</p>` : ""}
        <p>Take it one day at a time. There is no rush.</p>
        <p class="ssig">Be good,<br/>the beegood team</p>
      </div>
    `),
  };
}

// Day-3 fallback for a boiling (strategy-bucket) lead who hasn't booked a
// meeting yet. Re-opens the conversation and carries the self-serve fallback
// (כוורת האות) so the concierge promise never leaves the lead with nothing
// to buy. Suppressed at send time by lib/jobs/handlers/send-email.ts if the
// lead booked / was dismissed / already purchased.
function signalStrategyFallback(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName}, האות שלכם עדיין כאן`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · TrueSignal</div>
        <h1>האות שלכם עדיין כאן, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>לפני שלושה ימים האות שלכם נוסח.</p>
        <p>הדר קראה אותו, והשיחה איתה עדיין פתוחה.</p>
        <p>שיחת היכרות קצרה, בלי עלות ובלי התחייבות: עוברים יחד על האות ועל הצעד שנגזר ממנו.</p>
        <a class="cta" href="https://wa.me/972539566961?text=${encodeURIComponent("היי, קיבלתי את האות שלי ואשמח לתאם את השיחה עם הדר")}">לתאם את השיחה בוואטסאפ ←</a>
        <p>ואם אתם מסוג האנשים שמעדיפים להתחיל לבד, בקצב שלכם:</p>
        <p><strong>כוורת האות.</strong> ערכת ההפעלה המלאה שנגזרת מהאות שלכם: לוח האות, אתגר 7 הימים, ערכת תוכן, ערכת ויזואל והבמאית.</p>
        <p>₪590, גישה מיידית. ואם תמשיכו לסדנה, כל הסכום מתקזז.</p>
        <a class="cta" href="${APP_URL}/signal-hive">להפעיל את האות ←</a>
        <p>שני המסלולים מתחילים מאותו מקום: האות שכבר יש לכם.</p>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// /kriah day-2 offer (KRIAH_CORE_LEAD, 40h): the ₪590 offer moved OFF the
// ending screen (Alon's decision) — the sentence gets a day to prove itself,
// then this email carries כוורת האות. Suppressed at send time if the lead
// already purchased anything (see send-email.ts guard).
function kriahHiveOffer(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const sentence  = typeof ctx.signal_sentence === "string" && ctx.signal_sentence.trim()
    ? ctx.signal_sentence.trim() : null;
  return {
    subject: "המשפט שלכם עדיין מחזיק?",
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · TrueSignal</div>
        <h1>המשפט שלכם עדיין מחזיק, <span class="header-accent">${firstName}</span>?</h1>
      </div>
      <div class="body">
        ${sentence ? `<p style="background:#F3EDE2;border-radius:10px;padding:12px 16px;font-weight:600">"${sentence}"</p>` : ""}
        <p>יומיים עברו. אם המשפט הזה עוד מסתובב לכם בראש, זה בדיוק הסימן שחיכינו לו: אות אמיתי לא מרפה.</p>
        <p>עכשיו החלק שהופך אותו מתובנה לעסק: האות הוא הבסיס, וממנו נגזר כל השאר. המסר, כיווני התוכן, הסרטונים, והדרך שהלקוחות הנכונים מוצאים אתכם. בלי זה, כל תוכן חדש מתחיל שוב מאפס ונשמע כמו כולם.</p>
        <p>לזה בנינו את <strong>כוורת האות</strong>: המקום שבו האות הופך לתוכנית עבודה שלמה. מסר אחד, כיווני תוכן שנגזרים ממנו, מסלול ברור, בקצב שאפשר לעמוד בו.</p>
        <p>תשלום אחד של <span dir="ltr">₪590</span>, גישה מיידית. בלי לחץ, נכנסים כשמרגישים שזה הזמן. ואם תמשיכו משם לסדנת העבודה עם הדר, יום אחד שבו בונים את התוכנית יחד, כל ה-<span dir="ltr">₪590</span> נזקפים במלואם.</p>
        <a class="cta" href="${APP_URL}/signal-hive">להפוך את האות לתוכנית ←</a>
        <p>תהיו טובים.</p>
        <p class="ssig">צוות beegood</p>
      </div>
    `),
  };
}

function challengeAccess(ctx: EmailTemplateContext): RenderedEmail {
  const firstName  = ctx.name.split(" ")[0];
  const accessLink = (ctx.access_link as string | undefined) ?? `${APP_URL}/challenge/content`;
  const isMagic    = accessLink.includes("token=") || accessLink.includes("supabase");
  return {
    subject: `${firstName} — הגישה שלך לאתגר מוכנה`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · אתגר 7 הימים</div>
        <h1>הגישה מוכנה, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>קיבלנו.</p>
        <p>האתגר 7 הימים שלך מוכן.</p>
        <p>כמה דברים שחשוב לדעת:</p>
        <p>האתגר דיגיטלי לחלוטין.</p>
        <p>הסרטונים נפתחים יום אחרי יום —</p>
        <p>כי ככה זה עובד.</p>
        <p>לא מדלגים.</p>
        <p>לא צופים מראש.</p>
        <p>יום 0 פתוח עכשיו — התחל שם.</p>
        <p>הוא מסביר את כל השיטה לפני שמתחילים.</p>
        <a class="cta" href="${accessLink}">כניסה לאתגר ←</a>
        ${isMagic ? `<p style="font-size:13px;color:#6b7280;margin-top:8px;">הלינק מחבר אותך ישירות — ללא צורך בסיסמה. תקף ל-24 שעות.</p>` : ""}
        <p>מחר ייפתח יום 1.</p>
        <p>אנחנו מחכים לראות אותך מתחיל.</p>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 2 cont. - Challenge upsell workshop (CHALLENGE_PURCHASED · 168h)
// ─────────────────────────────────────────────────────────────

function challengeUpsellWorkshop(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `${firstName}, שבוע עבר. מה עכשיו?`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>שבוע עבר, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>עבר שבוע מאז שהתחלת את האתגר.</p>
        <p>7 ימים.</p>
        <p>7 סרטונים.</p>
        <p>7 שכבות של הסיפור שלך.</p>
        <p>עכשיו השאלה האמיתית:</p>
        <p>מה אתה עושה עם זה?</p>
        <p>כי תוכן בלי מערכת —</p>
        <p>זה כמו מנוע בלי מכונית.</p>
        <p>הסדנה יום אחד היא המערכת.</p>
        <p>5 שעות שבונות את תשתית השיווק של העסק שלך —</p>
        <p>מאסטרטגיה ועד אוטומציה.</p>
        <p>יוצאים עם לוח שנה מלא ל-12 חודשים.</p>
        <p>עם משפך שעובד בשבילך.</p>
        <p>עם מסר שברור לשוק.</p>
        <p>₪1,080.</p>
        <a class="cta" href="${APP_URL}/workshop${ep}">לסדנה ←</a>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 3 - Workshop confirmation (WORKSHOP_PURCHASED · 0h)
// ─────────────────────────────────────────────────────────────

function workshopConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  // Pull the next workshop date dynamically so the confirmation email
  // never shows a stale month after the floor in lib/products.ts moves.
  const next         = getNextWorkshopDate();
  const dateStrong   = next
    ? `${formatHebrew(next)} ${next.slice(0, 4)}, יום חמישי`
    : "המועד הבא של הסדנה";

  return {
    subject: `${firstName} — ההרשמה לסדנה אושרה`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · סדנה יום אחד</div>
        <h1>זה קבוע, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>הסדנה יום אחד — מקומך שמור.</p>
        <p><strong>${dateStrong}</strong></p>
        <p>10:00–15:00</p>
        <p>משרדי הדר דנן, רחוב החילזון 5, רמת גן</p>
        <p>כדי להגיע מוכן/ת — חשוב/י על 3 לקוחות אידיאליים שלך:<br/>
        מי הם? מה קיבלו ממך? ומה אמרו עליך?</p>
        <p>מחכים לך.</p>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 3 cont. - Workshop upsell course (WORKSHOP_PURCHASED · 168h)
// ─────────────────────────────────────────────────────────────

function workshopUpsellStrategy(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `${firstName}, מה עשית עם מה שיצאת ממנו?`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>שבוע אחרי הסדנה, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>עבר שבוע מאז הסדנה.</p>
        <p>שאלה אחת ישירה:</p>
        <p>יישמת משהו?</p>
        <p>אפילו דבר אחד קטן שהפעלת —</p>
        <p>זה מספיק להתחיל לראות תוצאות.</p>
        <p>אבל אם אתה רוצה ללכת עמוק יותר —</p>
        <p>הצעד הבא הוא פגישת אסטרטגיה עם הדר.</p>
        <p>90 דקות. אחד על אחד.</p>
        <p>לא עוד תיאוריה —</p>
        <p>מפת דרכים מדויקת לעסק שלך.</p>
        <p>מה אומרים, איפה, ולמי.</p>
        <p>₪4,000.</p>
        <a class="cta" href="${APP_URL}/strategy${ep}">לקביעת פגישה ←</a>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 4 - Course access (COURSE_PURCHASED · 0h)
// ─────────────────────────────────────────────────────────────

function courseAccess(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName} — הקורס שלך מוכן`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · קורס דיגיטלי</div>
        <h1>הקורס מוכן, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>קיבלנו.</p>
        <p>הקורס הדיגיטלי שלך פעיל.</p>
        <p>16 שיעורים.</p>
        <p>8 שעות של שיטה מלאה.</p>
        <p>גישה לנצח — חוזרים מתי שרוצים.</p>
        <p>לומדים בקצב שלך.</p>
        <p>אין לחץ.</p>
        <p>אין מועד אחרון.</p>
        <p>רק אתה, השיטה, והעסק שלך.</p>
        <p>תתחיל מהשיעור הראשון.</p>
        <p>לא מדלגים —</p>
        <p>כל שיעור בנוי על הקודם.</p>
        <a class="cta" href="${APP_URL}/course/content">לקורס ←</a>
        <p>מחכים לשמוע מה אתה לוקח ממנו.</p>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 4 cont. - Course upsell strategy (COURSE_PURCHASED · 168h)
// ─────────────────────────────────────────────────────────────

function courseUpsellStrategy(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `${firstName}, שבוע בקורס. הגיע הזמן לדבר.`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>שבוע בקורס, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>עבר שבוע מאז שהתחלת את הקורס.</p>
        <p>בשלב הזה יש לך כבר כלים.</p>
        <p>יש לך שפה.</p>
        <p>יש לך הבנה של מה צריך לקרות.</p>
        <p>יש רק דבר אחד שהקורס לא יכול לעשות בשבילך:</p>
        <p>להסתכל על העסק שלך ספציפית.</p>
        <p>לשאול את השאלות שרק מישהו שמכיר אותך יכול לשאול.</p>
        <p>לבנות איתך מפה שמותאמת לך — לא לאדם ממוצע.</p>
        <p>לזה יש פגישת אסטרטגיה.</p>
        <p>90 דקות עם הדר.</p>
        <p>1 על 1.</p>
        <p>יוצאים עם תוכנית.</p>
        <p>לא מושגים.</p>
        <p>תוכנית.</p>
        <p>ואם לא פיצחנו בפגישה הראשונה —</p>
        <p>יש פגישה שנייה. עלינו.</p>
        <p>₪4,000.</p>
        <a class="cta" href="${APP_URL}/strategy${ep}">לפגישת אסטרטגיה ←</a>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 5 - Re-engagement (INACTIVE_3_DAYS · 0h)
// ─────────────────────────────────────────────────────────────

function reengagement(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `לא ראינו אותך 3 ימים`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>היי <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>3 ימים עברו מאז שנרשמת.</p>
        <p>לא שמנו לב?</p>
        <p>שמנו לב.</p>
        <p>זה קורה לכולם —</p>
        <p>החיים מתערבים,</p>
        <p>העסק לא מחכה,</p>
        <p>האימייל יורד.</p>
        <p>אבל אנחנו רוצים שתדע:</p>
        <p>הדרך שלך ל-Signal עדיין כאן.</p>
        <p>7 ימים.</p>
        <p>7 סרטונים.</p>
        <p>מערכת שיווק שבנויה סביב מי שאתה.</p>
        <p>לא סביב האלגוריתם.</p>
        <p>לא סביב הטרנד.</p>
        <p>סביב הבידול שלך.</p>
        <p>500+ עסקים כבר עשו את זה.</p>
        <p>חלקם היססו 3 שבועות לפני שהתחילו.</p>
        <p>חלקם התחילו ביום השני אחרי ההרשמה.</p>
        <p>אלה שהתחילו מוקדם?</p>
        <p>הם כבר מרגישים את זה.</p>
        <a class="cta" href="${APP_URL}/challenge${ep}">להצטרפות לאתגר ←</a>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Booking confirmation (CALL_BOOKED · 0h)
// ─────────────────────────────────────────────────────────────

function bookingConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `זו לא עוד פגישה`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · פגישת אסטרטגיה</div>
        <h1>הבקשה התקבלה, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>רוב בעלי העסקים לא יעשו מה שעשית עכשיו.</p>
        <p>הם ימשיכו להסתדר.</p>
        <p>לנחש.</p>
        <p>לעבוד קשה ולקוות שמשהו ישתנה.</p>
        <p>אתה החלטת אחרת.</p>
        <p>90 דקות עם הדר —</p>
        <p>לא כדי לשמוע עוד טיפים.</p>
        <p>כדי לפצח.</p>
        <p>את הבידול האמיתי שלך.</p>
        <p>את המסר שגורם לאנשים הנכונים לרצות אותך.</p>
        <p>את המערכת שתגרום לעסק לעבוד בשבילך.</p>
        <p>הדר עובדת עם עסקים מכל הגדלים.</p>
        <p>היא ראתה הכל.</p>
        <p>היא יודעת לשאול את השאלות שאתה לא שואל את עצמך.</p>
        <p>ובסוף ה-90 דקות —</p>
        <p>תצא עם מפה.</p>
        <p>לא מושגים כלליים.</p>
        <p>לא "תחשוב על זה".</p>
        <p>מפה.</p>
        <p>בימים הקרובים יחזרו אליך לתאם תאריך.</p>
        <p>הפגישה מתקיימת פנים אל פנים במשרד של הדר ברחוב החילזון 5, רמת גן.</p>
        <p>תהיה מוכן.</p>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Purchase confirmation — generic fallback
// ─────────────────────────────────────────────────────────────

function purchaseConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `הרכישה אושרה`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>הרכישה אושרה, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>זה עבר.</p>
        <p>הרכישה שלך אושרה ואנחנו שמחים שאתה איתנו.</p>
        <p>מה שקנית —</p>
        <p>זה לא עוד קורס שנשכח בתיקיה.</p>
        <p>זו החלטה לבנות משהו אמיתי.</p>
        <p>כמעט 4,000 בעלי עסקים כבר עשו את הצעד הזה.</p>
        <p>חלקם הגיעו עם ספקות.</p>
        <p>חלקם לא ידעו מה לצפות.</p>
        <p>כולם יצאו עם משהו שלא היה להם לפני.</p>
        <p>אם יש שאלות,</p>
        <p>אני כאן.</p>
        <p><a href="https://wa.me/972539566961" style="color:#9A7526">כתבו לי בוואטסאפ</a>, אני עונה.</p>
        <p class="ssig">הדר</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Post-purchase 48h check-in
// ─────────────────────────────────────────────────────────────

function postPurchase48h(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName}, יומיים אחרי - איך מתקדמים? + בונוס בפנים`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>יומיים אחרי - מה קרה? 💪</h1>
        <p>בדיקת מצב + בונוס בלעדי</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>עברו יומיים. <strong>מה הדבר הראשון שיישמת?</strong></p>
        <div class="highlight-box">
          <p>🎁 גישה לוובינר הבא ב-50% הנחה - רק לחברים פעילים</p>
        </div>
        <a class="cta" href="${APP_URL}/members">לממש את הבונוס ←</a>
        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">שאלות? <a href="https://wa.me/972539566961" style="color:#6b7280">כתבו לנו בוואטסאפ</a>.</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Premium lead confirmation (PREMIUM_LEAD · 0h)
// ─────────────────────────────────────────────────────────────

function premiumLeadConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName}, קיבלנו את הבקשה - ניצור קשר תוך 24 שעות`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>הבקשה שלך התקבלה, <span class="header-accent">${firstName}</span> ✨</h1>
        <p>יום צילום מקצועי + אסטרטגיה תוכן</p>
      </div>
      <div class="body">
        <p>שלום ${firstName},</p>
        <p>תודה על הפנייה ל<strong>יום הצילום הפרמיום</strong>. קיבלתי את הפרטים שלך ואחזור אליך תוך 24 שעות לתיאום פגישת היכרות קצרה.</p>

        <div class="highlight-box-green">
          <p>✅ הבקשה שלך במערכת - מה הצפוי</p>
        </div>

        <div class="step-row">
          <div class="step-num">1</div>
          <div class="step-text">אחזור אליך בשיחה קצרה (15 דקות) להבין את הצרכים שלך</div>
        </div>
        <div class="step-row">
          <div class="step-num">2</div>
          <div class="step-text">נבנה יחד אסטרטגיית תוכן מותאמת לעסק שלך</div>
        </div>
        <div class="step-row">
          <div class="step-num">3</div>
          <div class="step-text">נתאם יום צילום שמניב 14 סרטונים שמוכרים</div>
        </div>

        <hr class="divider"/>

        <div class="highlight-box-yellow">
          <p>📋 מה כלול ביום הצילום הפרמיום:<br/>
          • אסטרטגיית תוכן מקצועית<br/>
          • יום צילום מלא עם צוות<br/>
          • 14 סרטונים ערוכים ומוכנים לפרסום<br/>
          • 3 חודשי ליווי לאחר הצילום
          </p>
        </div>

        <p style="font-size:14px;color:#6b7280">
          מחיר: ₪14,000 + מע״מ · כמעט 4,000 עסקים כבר צמחו עם השיטה הזו.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Partnership lead confirmation (PARTNERSHIP_LEAD · 0h)
// ─────────────────────────────────────────────────────────────

function partnershipConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const business  = String(ctx.business ?? "");
  return {
    subject: `${firstName}, קיבלנו את הבקשה שלך - הדר תחזור אליך בקרוב`,
    html: base(`
      <div class="header" style="background:#080808;border-bottom:2px solid rgba(201,168,76,0.4)">
        <div class="header-logo" style="color:#C9A84C">beegood · שותפות אסטרטגית</div>
        <h1 style="color:#ffffff">קיבלנו, <span style="color:#C9A84C">${firstName}</span> ✨</h1>
        <p style="color:rgba(255,255,255,0.6)">הדר תקרא את זה אישית ותחזור אליך</p>
      </div>
      <div class="body">
        <p>שלום ${firstName},</p>
        ${business ? `<p>קיבלתי את הבקשה שלך עבור <strong>${business}</strong>.</p>` : "<p>קיבלתי את הבקשה שלך לשותפות אסטרטגית.</p>"}
        <p>אני קוראת כל בקשה בעצמי - לא צוות, לא עוזרת. אחזור אליך תוך יום עסקים לשיחת היכרות קצרה.</p>

        <div class="highlight-box">
          <p>📞 מה הצפוי - שיחת היכרות של 20 דקות</p>
        </div>

        <div class="step-row">
          <div class="step-num">1</div>
          <div class="step-text">שיחה כנה על העסק שלך - בלי מצגת מכירה</div>
        </div>
        <div class="step-row">
          <div class="step-num">2</div>
          <div class="step-text">אבדוק יחד אתך אם יש התאמה אמיתית</div>
        </div>
        <div class="step-row">
          <div class="step-num">3</div>
          <div class="step-text">גם אם לא נעבוד יחד - תצא מהשיחה עם בהירות</div>
        </div>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          יש משהו שרצית להוסיף? <a href="https://wa.me/972539566961" style="color:#6b7280">כתוב לנו בוואטסאפ</a>.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 6 - Hive membership (HIVE_JOINED / HIVE_CANCELLED)
// ─────────────────────────────────────────────────────────────

function hiveWelcome(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const tier      = String(ctx.tier ?? "basic_59");
  // The hive/join API now passes price explicitly in ctx; fall back to known
  // tier → price mapping for backward-compat with any older queued jobs.
  const TIER_PRICE: Record<string, string> = {
    basic_59:      "59",
    full_149:      "149",
    basic_97:      "97",
    discounted_29: "29",
  };
  const price = typeof ctx.price === "string" ? ctx.price : (TIER_PRICE[tier] ?? "59");
  return {
    subject: "ברוך הבא לכוורת 🐝",
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · הכוורת</div>
        <h1>🐝 ברוך הבא לכוורת, <span class="header-accent">${firstName}</span></h1>
        <p>אתה עכשיו חלק ממשהו מיוחד</p>
      </div>
      <div class="body">
        <p>שלום ${firstName},</p>
        <p>ברוך הבא לכוורת. אתה עכשיו חלק ממשהו מיוחד.</p>

        <div class="highlight-box-yellow">
          <p>🐝 המנוי שלך: ₪${price}/חודש - חיוב חודשי אוטומטי</p>
        </div>

        <p><strong>כך מתחילים - 3 צעדים:</strong></p>

        <div class="step-row">
          <div class="step-num">1</div>
          <div class="step-text"><strong>קבוצת הוואטסאפ:</strong> קישור יתווסף בקרוב - תקבל עדכון</div>
        </div>
        <div class="step-row">
          <div class="step-num">2</div>
          <div class="step-text"><strong>המפגש החודשי הבא עם הדר:</strong> תאריך ופרטים יישלחו בנפרד</div>
        </div>
        <div class="step-row">
          <div class="step-num">3</div>
          <div class="step-text"><strong>תוכן בלעדי לחברי הכוורת</strong> - יגיע לאימייל שלך בימים הקרובים</div>
        </div>

        <br/>
        <a class="cta" href="${APP_URL}/hive">לאתר הכוורת ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          לביטול מנוי: <a href="mailto:hive@beegood.online" style="color:#6b7280">hive@beegood.online</a> או דרך האזור האישי
        </p>
      </div>
    `),
  };
}

function hiveDay7(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: "שבוע בכוורת - איך הולך? 🐝",
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · הכוורת</div>
        <h1>🐝 שבוע בכוורת, <span class="header-accent">${firstName}</span></h1>
        <p>מקווים שאתה נהנה</p>
      </div>
      <div class="body">
        <p>שלום ${firstName},</p>
        <p>עבר שבוע מאז שהצטרפת לכוורת. מקווים שאתה נהנה.</p>
        <p>תוכן בלעדי חדש מחכה לך: <strong>[פרטים יתווספו בקרוב]</strong></p>

        <div class="highlight-box">
          <p>🐝 זכור - המפגש החודשי עם הדר פתוח לכל חברי הכוורת</p>
        </div>

        <a class="cta" href="${APP_URL}/hive">לכוורת ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          שאלות? <a href="https://wa.me/972539566961" style="color:#6b7280">כתוב לנו בוואטסאפ</a>.
        </p>
      </div>
    `),
  };
}

function hiveCancelled(ctx: EmailTemplateContext): RenderedEmail {
  const firstName      = ctx.name.split(" ")[0];
  const refundEligible = Boolean(ctx.refund_eligible);
  return {
    subject: "אישור ביטול מנוי הכוורת",
    html: base(`
      <div class="header">
        <div class="header-logo">beegood · הכוורת</div>
        <h1>אישור ביטול מנוי הכוורת</h1>
        <p>שלום ${firstName}, קיבלנו את בקשתך</p>
      </div>
      <div class="body">
        <p>שלום ${firstName},</p>
        <p>המנוי שלך בוטל.</p>

        ${refundEligible
          ? `<div class="highlight-box-green">
               <p>✅ זכאי להחזר מלא - ביצעת ביטול תוך 14 יום מההצטרפות. נחזור אליך בהקדם.</p>
             </div>`
          : `<p>תוכל ליהנות מהכוורת עד סוף החודש הנוכחי.</p>`
        }

        <p>נשמח לראותך חוזר בכל עת.</p>

        <a class="cta" href="${APP_URL}/hive">הצטרף מחדש ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          שאלות? <a href="https://wa.me/972539566961" style="color:#6b7280">כתבו לנו בוואטסאפ</a>.
        </p>
      </div>
    `),
  };
}

// ── Admin alert ───────────────────────────────────────────────
export function adminAlert(ctx: {
  jobId:    string;
  jobType:  string;
  error:    string;
  attempts: number;
}): RenderedEmail {
  return {
    subject: `🚨 [Marketing OS] Job failed permanently - ${ctx.jobType}`,
    html: base(`
      <div class="header" style="background:#7f1d1d">
        <div class="header-logo" style="color:#fca5a5">beegood · Admin Alert</div>
        <h1>⚠️ Job Failed Permanently</h1>
        <p>דרושה בדיקה ידנית</p>
      </div>
      <div class="body">
        <p><strong>Job ID:</strong> ${ctx.jobId}</p>
        <p><strong>Type:</strong> ${ctx.jobType}</p>
        <p><strong>Attempts:</strong> ${ctx.attempts}</p>
        <p><strong>Error:</strong></p>
        <pre style="background:#f3f4f6;padding:12px;border-radius:8px;font-size:12px;overflow:auto;direction:ltr;text-align:left;white-space:pre-wrap">${ctx.error}</pre>
        <a class="cta-dark" href="https://supabase.com/dashboard">פתח Supabase ←</a>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// EN signal welcome (SIGNAL_EXTRACTED_EN · 0h)
// Editorial Daylight aesthetic to mirror /en/signal/result/[id].
// ─────────────────────────────────────────────────────────────

function enBase(content: string): string {
  return `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #F4EFE4;
      font-family: Georgia, 'Times New Roman', serif;
      color: #211B12;
    }
    .en-wrap { max-width: 600px; margin: 32px auto; padding: 0 16px 40px; }
    .en-card { background: #FCFAF3; border: 1px solid rgba(33,27,18,0.10); border-radius: 6px; overflow: hidden; }
    .en-header { background: #211B12; color: #F4EFE4; padding: 32px 36px 36px; }
    .en-eyebrow { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: #BE9540; margin-bottom: 16px; }
    .en-header h1 { font-family: Georgia, serif; font-style: italic; font-size: 28px; font-weight: 400; line-height: 1.25; letter-spacing: -0.01em; color: #F4EFE4; }
    .en-body { padding: 36px; }
    .en-body p { font-size: 16px; line-height: 1.7; color: #211B12; margin-bottom: 16px; }
    .en-body p.lede { font-family: Georgia, serif; font-style: italic; font-size: 17px; color: #594F41; }
    .en-cta {
      display: inline-block;
      background: #211B12;
      color: #F4EFE4 !important;
      text-decoration: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 12.5px;
      font-weight: 500;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      padding: 14px 28px;
      border-radius: 4px;
      margin: 6px 0 22px;
    }
    .en-rule { width: 34px; height: 1px; background: #BE9540; margin: 24px 0; }
    .en-signoff { font-family: Georgia, serif; font-size: 16px; color: #211B12; margin-top: 6px; }
    .en-signoff-line { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; letter-spacing: 0.06em; color: #988D7B; margin-top: 4px; }
    .en-footer { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 11px; letter-spacing: 0.06em; color: #988D7B; text-align: center; padding: 24px 16px 0; }
    a { color: #6F521A; }
  </style>
</head>
<body>
  <div class="en-wrap">
    <div class="en-card">
${content}
    </div>
    <div class="en-footer">The TrueSignal© Method · Wherever you are, in every language</div>
  </div>
</body>
</html>`;
}

// Unified home (English): when the send handler resolved a kaveret link
// (switchover on), CTAs lead to the lead's locked /en/kaveret/i page —
// mirrors how the Hebrew signalOffer() prefers ctx.kaveretUrl.
function enKaveretUrl(ctx: EmailTemplateContext): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kaveretUrl = (ctx as any).kaveretUrl;
  return typeof kaveretUrl === "string" && kaveretUrl ? kaveretUrl : null;
}

function signalWelcomeEn(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = (ctx.name ?? "").split(" ")[0] || "friend";
  const extractionId = typeof ctx.extraction_id === "string" ? ctx.extraction_id : "";
  const kaveretUrl = enKaveretUrl(ctx);
  const resultUrl =
    kaveretUrl ?? (extractionId ? `${APP_URL}/en/signal/result/${extractionId}` : `${APP_URL}/en`);
  return {
    subject: `${firstName}, your signal`,
    html: enBase(`
      <div class="en-header">
        <div class="en-eyebrow">TrueSignal©</div>
        <h1>${firstName}, we read every answer ourselves.</h1>
      </div>
      <div class="en-body">
        <p class="lede">What you wrote was worth saying back to you.</p>
        <p>Your signal is saved. Yours for life, returnable any time. The page is set up the way a letter is - slow, signed, and meant for one reader.</p>
        <a class="en-cta" href="${resultUrl}">${kaveretUrl ? "Your reading is saved here" : "Open your signal"} &rarr;</a>

        <div class="en-rule"></div>

        <p>One thing we ask: read it once out loud before you change a word. The shape of the sentence carries more than the content of it.</p>
        <p>When you are ready to build a body of work from it - the posts, the rhythm, the reach - we will make the rest with you, in your voice. That part is coming. We will write back when it opens.</p>

        <div class="en-signoff">Hadar &amp; Alon</div>
        <div class="en-signoff-line">Founders of beegood</div>
      </div>
    `),
  };
}

// ── English signal nurture chain (premium audience: meeting + shoot day) ──
// No /en product pages for these high-ticket consultative offers, so the CTA is
// a conversation (WhatsApp). Offer copy branches on bucket: premium → the full
// shoot-day production, else → a strategy session.
const SIGNAL_WA_EN = "https://wa.me/972539566961";

function isPremiumEn(ctx: EmailTemplateContext): boolean {
  return ctx.bucket === "premium";
}

function signalDay1En(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = (ctx.name ?? "").split(" ")[0] || "friend";
  return {
    subject: `${firstName}, a signal you don't act on is just a nice sentence`,
    html: enBase(`
      <div class="en-header"><div class="en-eyebrow">TrueSignal©</div><h1>${firstName}, what you do with it</h1></div>
      <div class="en-body">
        <p class="lede">You have your signal. The only question that matters now is what you do with it.</p>
        <p>Here is one exercise for this week.</p>
        <p>Take your signal. Write one post that starts from that sentence. Not about what you do - about what you see that others miss.</p>
        <p>That is it. One post. Not a campaign, not a strategy. One line of truth, out in the open.</p>
        <p>Because differentiation is not what you know. It is what you see, and say out loud.</p>
        <a class="en-cta" href="${SIGNAL_WA_EN}">Tell Hadar how it went &rarr;</a>
        <div class="en-signoff">Hadar</div>
      </div>
    `),
  };
}

function signalDay3En(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = (ctx.name ?? "").split(" ")[0] || "friend";
  return {
    subject: `${firstName}, the most talented people I know are invisible`,
    html: enBase(`
      <div class="en-header"><div class="en-eyebrow">TrueSignal©</div><h1>${firstName}, what I see again and again</h1></div>
      <div class="en-body">
        <p>${firstName},</p>
        <p>There is one thing I have seen over and over, across hundreds of business owners.</p>
        <p>The most talented, the deepest, the best at what they do - they are exactly the ones the market does not see.</p>
        <p>Not because they are not good enough. Because they market their skills, not their signal. What they do, instead of what only they see.</p>
        <p>Your signal is the start. What happens after it - how it becomes a consistent presence the right people choose - that is what we build with you.</p>
        <p>More on that soon.</p>
        <div class="en-signoff">Hadar</div>
      </div>
    `),
  };
}

function signalDay5En(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = (ctx.name ?? "").split(" ")[0] || "friend";
  const premium = isPremiumEn(ctx);
  const body = premium ? `
        <p>${firstName},</p>
        <p>Knowing your signal is the easy part. Turning it into a body of work the market cannot ignore is the hard part.</p>
        <p>Your signal came through sharp. That usually means you are past "more content" - you are at the point where one strong production is worth a year of posts.</p>
        <p>That is the premium shoot day: a full content production built entirely from your signal - the message pillars, the videos, the visual direction. We build the whole thing with you, in your voice.</p>` : `
        <p>${firstName},</p>
        <p>Knowing your signal is the easy part. Turning it into the way the market positions you is the hard part.</p>
        <p>That is the strategy session: 90 minutes, one on one, where we take your signal and build your positioning from it - who the client is, what the offer is, why you.</p>
        <p>You leave with one clear direction you can act on the next morning.</p>`;
  return {
    subject: `${firstName}, knowing your signal is the easy part`,
    html: enBase(`
      <div class="en-header"><div class="en-eyebrow">TrueSignal©</div><h1>${firstName}, the hard part</h1></div>
      <div class="en-body">
        ${body}
        <a class="en-cta" href="${premium ? SIGNAL_WA_EN : enKaveretUrl(ctx) ?? `${APP_URL}/en/strategy`}">${premium ? "Talk to Hadar about a shoot day" : "Book a strategy session"} &rarr;</a>
        <div class="en-signoff">Hadar</div>
      </div>
    `),
  };
}

function signalDay8En(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = (ctx.name ?? "").split(" ")[0] || "friend";
  const premium = isPremiumEn(ctx);
  const body = premium ? `
        <p>${firstName},</p>
        <p>Maybe you are wondering what a shoot day actually produces. Fair. Here is what you walk away with:</p>
        <p>- A full set of videos, each one a layer of who you are, drawn from your signal.<br>
        - A visual direction that makes you unmistakable in your category.<br>
        - A body of work you can publish for months, not a single post.</p>
        <p>It is not a photo shoot. It is your signal, produced.</p>` : `
        <p>${firstName},</p>
        <p>Maybe you are wondering whether one session really moves anything. Fair. Here is what happens in it:</p>
        <p>- We take your signal and break it into positioning - the client, the offer, the price.<br>
        - You leave with one clear direction to act on the next morning.<br>
        - 90 minutes, one on one, focused only on you.</p>
        <p>It is not a lecture or a template. It is work on your business, from the signal you already have.</p>`;
  return {
    subject: `${firstName}, what actually happens (and what you walk away with)`,
    html: enBase(`
      <div class="en-header"><div class="en-eyebrow">TrueSignal©</div><h1>${firstName}, what you walk away with</h1></div>
      <div class="en-body">
        ${body}
        <a class="en-cta" href="${premium ? SIGNAL_WA_EN : enKaveretUrl(ctx) ?? `${APP_URL}/en/strategy`}">${premium ? "Talk to Hadar about a shoot day" : "Book a strategy session"} &rarr;</a>
        <div class="en-signoff">Hadar</div>
      </div>
    `),
  };
}

function signalDay12En(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = (ctx.name ?? "").split(" ")[0] || "friend";
  const premium = isPremiumEn(ctx);
  return {
    subject: `${firstName}, your signal is still here`,
    html: enBase(`
      <div class="en-header"><div class="en-eyebrow">TrueSignal©</div><h1>${firstName}, no pressure</h1></div>
      <div class="en-body">
        <p>${firstName},</p>
        <p>Last note, no pressure.</p>
        <p>Your signal is still saved. It is not going anywhere.</p>
        <p>If you want to take it a step forward - ${premium ? "into a full production built from it" : "into a session that turns it into your positioning"} - the door is open.</p>
        <p>And if you simply want to think out loud with someone who sees the whole picture, talk to me directly. Send me a line on WhatsApp, I read every one.</p>
        <a class="en-cta" href="${SIGNAL_WA_EN}">Talk to Hadar &rarr;</a>
        <p>Your signal is the start. What you do with it is yours.</p>
        <div class="en-signoff">Hadar</div>
      </div>
    `),
  };
}

// /en/kriah day-2 offer (KRIAH_CORE_LEAD_EN · ~40h): mirrors the Hebrew
// kriahHiveOffer (EN) — FREE launch model: the sentence gets a day to prove
// itself, then this email invites the lead to open their hive and film the
// first episode free. Nothing is sold in English yet.
// Suppressed at send time if the lead already purchased (send-email.ts guard).
function kriahHiveOfferEn(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = (ctx.name ?? "").split(" ")[0] || "friend";
  const sentence  = typeof ctx.signal_sentence === "string" && ctx.signal_sentence.trim()
    ? ctx.signal_sentence.trim() : null;
  const hiveUrl = enKaveretUrl(ctx) ?? `${APP_URL}/en/hive`;
  return {
    subject: "Does your sentence still hold?",
    html: enBase(`
      <div class="en-header">
        <div class="en-eyebrow">TrueSignal©</div>
        <h1>${firstName}, does your sentence still hold?</h1>
      </div>
      <div class="en-body">
        ${sentence ? `<p class="lede" style="background:#F4EFE4;border:1px solid rgba(33,27,18,0.10);border-radius:4px;padding:14px 18px;">"${sentence}"</p>` : ""}
        <p>Two days have passed.</p>
        <p>If that sentence is still circling in your head, that is the sign we wait for. A real signal does not let go.</p>
        <p>Now the part that turns it from an insight into a business.</p>
        <p>Your signal is the base, and everything else is drawn from it - the message, the content, the way the right people find you. Without it, every new post starts from zero and sounds like everyone else.</p>
        <p>That is what we built <strong>The Signal Hive</strong> for. Inside:</p>
        <p>Your signal system - the message and the map, built from your reading.<br>
        Scripted episodes you film with a teleprompter in the broadcast room.<br>
        Captions burned in, ready to publish.<br>
        Your bio, about page, and manifesto - written.<br>
        Designed visual assets that make you unmistakable.</p>
        <p>Your first episode is free. No card, no subscription - you open the hive and film.</p>
        <a class="en-cta" href="${hiveUrl}">Enter your hive &rarr;</a>
        <div class="en-rule"></div>
        <p>Be good,</p>
        <div class="en-signoff">the beegood team</div>
      </div>
    `),
  };
}

// Day-3 fallback for an English concierge-lane lead who hasn't booked the
// meeting yet (SIGNAL_STRATEGY_LEAD_EN · 72h). Re-opens the conversation and
// carries The Signal Hive as the start-on-your-own path, so the concierge
// promise never leaves the lead with nothing to act on. Suppressed at send
// time by send-email.ts if the lead booked / was dismissed / purchased.
function signalStrategyFallbackEn(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = (ctx.name ?? "").split(" ")[0] || "friend";
  const hiveUrl = enKaveretUrl(ctx) ?? `${APP_URL}/en/hive`;
  return {
    subject: "Still here, still yours",
    html: enBase(`
      <div class="en-header">
        <div class="en-eyebrow">TrueSignal©</div>
        <h1>${firstName}, your signal is still here</h1>
      </div>
      <div class="en-body">
        <p>${firstName},</p>
        <p>Three days ago your signal was put into words.</p>
        <p>Hadar read it herself. No meeting happened yet, and that is fine.</p>
        <p>The door is still open: a short call, no cost, no commitment. You go over your signal together and the one step that follows from it.</p>
        <a class="en-cta" href="${SIGNAL_WA_EN}">Set up the call on WhatsApp &rarr;</a>
        <div class="en-rule"></div>
        <p>And if you are the kind of person who prefers to start alone, at your own pace:</p>
        <p><strong>The Signal Hive.</strong> Your signal system, scripted episodes you film in the broadcast room, captions burned in, your bio and manifesto written, designed visual assets.</p>
        <p>Your first episode is free.</p>
        <a class="en-cta" href="${hiveUrl}">Enter your hive &rarr;</a>
        <p>Both paths start from the same place: the signal you already have.</p>
        <div class="en-signoff">Hadar &amp; Alon</div>
        <div class="en-signoff-line">Founders of beegood</div>
      </div>
    `),
  };
}

// ── Template registry ─────────────────────────────────────────
type TemplateFn = (ctx: EmailTemplateContext) => RenderedEmail;

const TEMPLATES: Record<string, TemplateFn> = {
  // Sequence 1 - welcome
  welcome,
  followup_24h:                followup24h,
  followup_72h:                followup72h,
  // SIGNAL_EXTRACTED welcome
  signal_welcome:              signalWelcome,
  signal_day1:                 signalDay1,
  signal_day3:                 signalDay3,
  signal_day5:                 signalDay5,
  signal_day8:                 signalDay8,
  signal_day12:                signalDay12,
  // SIGNAL_EXTRACTED_EN welcome (English /en/signal flow)
  signal_welcome_en:           signalWelcomeEn,
  signal_day1_en:              signalDay1En,
  signal_day3_en:              signalDay3En,
  signal_day5_en:              signalDay5En,
  signal_day8_en:              signalDay8En,
  signal_day12_en:             signalDay12En,
  // Legacy pre-rename day keys — kept ONLY so already-queued jobs still
  // render. fromNameFor() and the kaveret injection key off the `_en`
  // suffix, so all new enqueues must use the signal_dayN_en keys above.
  en_signal_day1:              signalDay1En,
  en_signal_day3:              signalDay3En,
  en_signal_day5:              signalDay5En,
  en_signal_day8:              signalDay8En,
  en_signal_day12:             signalDay12En,
  // English v2 funnel (KRIAH_CORE_LEAD_EN / SIGNAL_STRATEGY_LEAD_EN)
  kriah_hive_offer_en:         kriahHiveOfferEn,
  signal_strategy_fallback_en: signalStrategyFallbackEn,
  // Manual on-demand full result email
  signal_result_full:          signalResultFull,
  // Hive monthly content drop announcement
  hive_monthly_drop:           hiveMonthlyDrop,
  // Sequence 2 - challenge buyers
  challenge_access:            challengeAccess,
  signal_hive_welcome:         signalHiveWelcome,
  signal_hive_welcome_en:      signalHiveWelcomeEn,
  signal_strategy_fallback:    signalStrategyFallback,
  kriah_hive_offer:            kriahHiveOffer,
  challenge_upsell_workshop:   challengeUpsellWorkshop,
  // Sequence 3 - workshop buyers
  workshop_confirmation:       workshopConfirmation,
  workshop_upsell_strategy:    workshopUpsellStrategy,
  workshop_upsell_course:      workshopUpsellStrategy,
  // Sequence 4 - course buyers
  course_access:               courseAccess,
  course_upsell_strategy:      courseUpsellStrategy,
  // Sequence 5 - re-engagement
  reengagement,
  // Booking
  booking_confirmation:        bookingConfirmation,
  // Premium
  premium_lead_confirmation:   premiumLeadConfirmation,
  // Partnership
  partnership_confirmation:    partnershipConfirmation,
  // Sequence 6 - Hive membership
  hive_welcome:                hiveWelcome,
  hive_day7:                   hiveDay7,
  hive_cancelled:              hiveCancelled,
  // Generic fallback
  purchase_confirmation:       purchaseConfirmation,
  post_purchase_48h:           postPurchase48h,
};

export function renderTemplate(
  key: string,
  ctx: EmailTemplateContext
): RenderedEmail | null {
  const fn = TEMPLATES[key];
  if (!fn) return null;
  return fn(ctx);
}

export { FROM_NAME, FROM_NAME_EN };
