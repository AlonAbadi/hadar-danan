/**
 * Hebrew email templates.
 * Each function receives a context object and returns { subject, html }.
 * All emails are RTL with the Assistant font.
 * Design: dark header (#0a0a0f), white body, blue CTAs (#2563eb).
 */


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
  <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f4f7fb;
      font-family: 'Assistant', Arial, sans-serif;
      direction: rtl;
      text-align: right;
      color: #1f2937;
    }
    .wrapper { max-width: 600px; margin: 32px auto; padding: 0 16px 40px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.08); }
    .header {
      background: #0a0a0f;
      padding: 28px 32px;
      color: #fff;
    }
    .header-logo {
      font-size: 13px;
      font-weight: 700;
      color: #6b7280;
      letter-spacing: 0.05em;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    .header h1 { font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.3; }
    .header p  { font-size: 14px; color: #9ca3af; margin-top: 6px; }
    .header-accent { color: #4ade80; }
    .body { padding: 32px; }
    .body p  { font-size: 16px; line-height: 1.75; color: #374151; margin-bottom: 14px; }
    .body h2 { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 12px; }
    .cta {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
      padding: 14px 32px;
      border-radius: 10px;
      margin: 8px 0 16px;
    }
    .cta:hover { background: #1d4ed8; }
    .cta-dark {
      display: inline-block;
      background: #0a0a0f;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
      padding: 14px 32px;
      border-radius: 10px;
      margin: 8px 0 16px;
    }
    .cta-green {
      display: inline-block;
      background: #16a34a;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 16px;
      padding: 14px 32px;
      border-radius: 10px;
      margin: 8px 0 16px;
    }
    .divider { border: none; border-top: 1px solid #f3f4f6; margin: 24px 0; }
    .highlight-box {
      background: #eff6ff;
      border-right: 4px solid #2563eb;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .highlight-box p { margin: 0; color: #1e40af; font-weight: 600; font-size: 15px; }
    .highlight-box-green {
      background: #f0fdf4;
      border-right: 4px solid #16a34a;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .highlight-box-green p { margin: 0; color: #166534; font-weight: 600; font-size: 15px; }
    .highlight-box-yellow {
      background: #fffbeb;
      border-right: 4px solid #d97706;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 16px 0;
    }
    .highlight-box-yellow p { margin: 0; color: #92400e; font-weight: 600; font-size: 15px; }
    .coupon-box {
      background: #0a0a0f;
      border-radius: 10px;
      padding: 18px 24px;
      margin: 16px 0;
      text-align: center;
    }
    .coupon-box p { color: #9ca3af; font-size: 13px; margin: 0 0 6px; }
    .coupon-code { color: #4ade80 !important; font-size: 28px !important; font-weight: 800 !important; letter-spacing: 0.1em; }
    .step-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
    .step-num {
      background: #2563eb;
      color: #fff;
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
    .step-text { font-size: 15px; color: #374151; line-height: 1.5; }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 24px;
      line-height: 1.8;
    }
    .footer a { color: #6b7280; text-decoration: underline; }
    .product-tag {
      display: inline-block;
      background: #f3f4f6;
      color: #374151;
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
        <div class="header-logo">beegood</div>
        <h1>ברוכ/ה הבא/ה, <span class="header-accent">${firstName}</span></h1>
      </div>
      <div class="body">
        <p>${firstName},</p>
        <p>ברוכ/ה הבא/ה לעולם של TrueSignal©.</p>
        <p>שמי הדר דנן.</p>
        <p>אני עובדת עם בעלי עסקים שיש להם משהו אמיתי לתת לעולם —</p>
        <p>אבל השיווק שלהם לא משקף את זה.</p>
        <p>כבר 4 שנים אני עוזרת לעסקים לא רק לשווק —</p>
        <p>אלא לבנות מערכת שיווק שעובדת בשבילם.</p>
        <p>מ-197 שקל ועד 14,000 שקל —</p>
        <p>כמעט 4,000 עסקים כבר עשו את המסע.</p>
        <p>חלקם הגיעו אלינו בלי ניסיון בשיווק.</p>
        <p>חלקם הגיעו עם ניסיון — אבל בלי כיוון.</p>
        <p>כולם יצאו עם משהו שלא היה להם לפני.</p>
        <p>ואת/ה עכשיו חלק מזה.</p>
        <p>בימים הקרובים תקבל/י ממני עוד תוכן.</p>
        <p>בינתיים — אם יש שאלה, <a href="https://wa.me/972539566961" style="color:#2563eb">צרו קשר בוואטסאפ</a>.</p>
        <p>אנחנו כאן.</p>
        <p>צוות beegood</p>
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

        <p>אם יש שאלה, <a href="https://wa.me/972539566961" style="color:#2563eb">הוואטסאפ פתוח</a>.</p>
        <p>הדר</p>
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
        <a class="cta" href="${APP_URL}/hive/signal-kit">לראות את הרעיונות שלי ←</a>
        <p style="margin-top:24px">תזכורת קטנה: עבור כל רעיון יש לך בדף גם כפתור "בדוק טיוטה" ש-AI יקרא את הפוסט שלך ויגיד אם זה במדויק האות שלך או שיש דרך לחדד.</p>
        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">${month ? "החודש: " + month : ""} · אם יש שאלה, <a href="https://wa.me/972539566961" style="color:#6b7280">הוואטסאפ פתוח</a>.</p>
      </div>
    `),
  };
}

function signalWelcome(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName}, האות שלך כאן`,
    html: base(`
      <div class="header">
        <div class="header-logo">beegood</div>
        <h1>${firstName}, ראיתי אותך</h1>
      </div>
      <div class="body">
        <p>שלום ${firstName},</p>
        <p>עברת את האבחון. זה לא טריוויאלי.</p>
        <p>הרוב לא עוצרים לחמש דקות לשאול את עצמם מה הם באמת באים לתת לעולם.</p>
        <p>האות שלך נשמר אצלך — תוכל/י לחזור אליו בכל רגע פה:</p>
        <a class="cta" href="${APP_URL}/account">לאזור האישי שלי ←</a>

        <p>מה הלאה?</p>
        <p>חברי הכוורת מקבלים כל חודש שני רעיונות תוכן מותאמים אישית לאות שלהם.</p>
        <p>לא רעיונות כלליים. לא עוד מאה קווים. שניים שעובדים בדיוק לך.</p>
        <p>אם זה מרגיש כמו הצעד הבא הנכון —</p>
        <a class="cta" href="${APP_URL}/hive">לראות את מסלולי הכוורת ←</a>

        <p>בכל מקרה, האות שלך אצלך. עכשיו זה רק עניין של מה אתה/את עושה איתו.</p>
        <p>אם יש שאלה, <a href="https://wa.me/972539566961" style="color:#2563eb">הוואטסאפ פתוח</a>.</p>
        <p>הדר</p>
      </div>
    `),
  };
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
        <p style="font-size: 17px;"><span style="text-decoration: line-through; color: #9E9990;">₪297</span> <strong style="color: #C9964A;">₪197 בלבד</strong> (במבצע, חוסכים ₪100).</p>
        <a class="cta" href="${APP_URL}/challenge${ep}">להצטרפות לאתגר ←</a>
        <p>צוות beegood</p>
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
        <p>צוות beegood</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 2 - Challenge access (CHALLENGE_PURCHASED · 0h)
// ─────────────────────────────────────────────────────────────

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
        <p>צוות beegood</p>
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
        <p>צוות beegood</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 3 - Workshop confirmation (WORKSHOP_PURCHASED · 0h)
// ─────────────────────────────────────────────────────────────

function workshopConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
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
        <p><strong>25 ביוני 2026, יום חמישי</strong></p>
        <p>10:00–15:00</p>
        <p>בית ציוני אמריקה, תל אביב</p>
        <p>כדי להגיע מוכן/ת — חשוב/י על 3 לקוחות אידיאליים שלך:<br/>
        מי הם? מה קיבלו ממך? ומה אמרו עליך?</p>
        <p>מחכים לך.</p>
        <p>צוות beegood</p>
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
        <p>הקורס הדיגיטלי הוא הצעד הבא.</p>
        <p>16 שיעורים.</p>
        <p>8 שעות.</p>
        <p>אותה שיטה —</p>
        <p>רק עמוק יותר, מפורט יותר, עם תרגול.</p>
        <p>לומדים בקצב שלך.</p>
        <p>חוזרים כשצריך.</p>
        <p>גישה לנצח.</p>
        <p>₪1,800.</p>
        <a class="cta" href="${APP_URL}/course${ep}">לקורס ←</a>
        <p>צוות beegood</p>
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
        <p>צוות beegood</p>
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
        <p>צוות beegood</p>
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
        <p>צוות beegood</p>
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
        <p>תהיה מוכן.</p>
        <p>צוות beegood</p>
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
        <p>אם יש שאלות —</p>
        <p>אנחנו כאן.</p>
        <p><a href="https://wa.me/972539566961" style="color:#2563eb">כתבו לנו בוואטסאפ</a> — אנחנו עונים.</p>
        <p>צוות beegood</p>
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

function signalWelcomeEn(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = (ctx.name ?? "").split(" ")[0] || "friend";
  const extractionId = typeof ctx.extraction_id === "string" ? ctx.extraction_id : "";
  const resultUrl = extractionId ? `${APP_URL}/en/signal/result/${extractionId}` : `${APP_URL}/en`;
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
        <a class="en-cta" href="${resultUrl}">Open your signal &rarr;</a>

        <div class="en-rule"></div>

        <p>One thing we ask: read it once out loud before you change a word. The shape of the sentence carries more than the content of it.</p>
        <p>When you are ready to build a body of work from it - the posts, the rhythm, the reach - we will make the rest with you, in your voice. That part is coming. We will write back when it opens.</p>

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
  // SIGNAL_EXTRACTED_EN welcome (English /en/signal flow)
  signal_welcome_en:           signalWelcomeEn,
  // Manual on-demand full result email
  signal_result_full:          signalResultFull,
  // Hive monthly content drop announcement
  hive_monthly_drop:           hiveMonthlyDrop,
  // Sequence 2 - challenge buyers
  challenge_access:            challengeAccess,
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
