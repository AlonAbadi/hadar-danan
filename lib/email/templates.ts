/**
 * Hebrew email templates.
 * Each function receives a context object and returns { subject, html }.
 * All emails are RTL with the Assistant font.
 * Design: dark header (#0a0a0f), white body, blue CTAs (#2563eb).
 */

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "https://hadar-danan.co.il";
const FROM_NAME = "הדר דנן";

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
    .body p  { font-size: 16px; line-height: 1.75; color: #374151; margin-bottom: 16px; }
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
      <p>קיבלת אימייל זה כי נרשמת ב-<a href="${APP_URL}">hadar-danan.co.il</a></p>
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
// SEQUENCE 1 - Welcome (USER_SIGNED_UP)
// ─────────────────────────────────────────────────────────────

// Email 1 (immediate): Welcome + free training link
function welcome(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `ברוכ/ה הבא/ה ${firstName}! ההדרכה החינמית מחכה לך 🎬`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>ברוכ/ה הבא/ה, <span class="header-accent">${firstName}</span> 🎉</h1>
        <p>ביצעת את הצעד הראשון - ועכשיו הגיע הזמן לפעולה</p>
      </div>
      <div class="body">
        <p>שלום ${firstName},</p>
        <p>שמחה שהצטרפת! קיבלת גישה חינמית להדרכה שמלמדת איך לייצר סרטונים שמביאים לקוחות - בלי ציוד יקר ובלי ניסיון קודם.</p>

        <div class="highlight-box">
          <p>📹 ההדרכה החינמית שלך מוכנה לצפייה עכשיו</p>
        </div>

        <p><strong>מה תלמד:</strong></p>
        <p>
          ✅ איך לזהות את הלקוח האידיאלי שלך ולדבר אליו ישר<br/>
          ✅ ליצור תוכן שמושך תשומת לב - בלי תקציב פרסום<br/>
          ✅ לסגור עסקאות דרך WhatsApp תוך 7 ימים
        </p>

        <br/>
        <a class="cta" href="${APP_URL}">לצפייה בהדרכה ←</a>

        <hr class="divider" />
        <p style="font-size:14px;color:#6b7280">
          מחר אשלח לך משהו שיעזור לך לקחת את זה צעד קדימה.<br/>
          בינתיים - צפה בהדרכה לפחות פעם אחת.
        </p>
      </div>
    `),
  };
}

// Email 2 (24h): Introduce the 7-day challenge ₪197
function followup24h(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `${firstName}, יש לי הצעה בשבילך - ₪197 שיכולים לשנות הכל`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>הצעד הבא שלך, <span class="header-accent">${firstName}</span></h1>
        <p>ההדרכה החינמית היא רק ההתחלה</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>אני מקווה שצפית בהדרכה. עכשיו אני רוצה להציע לך משהו שיקח אותך מידע → תוצאות.</p>

        <div class="highlight-box">
          <p>🔥 אתגר 7 הימים - ₪197 בלבד</p>
        </div>

        <p><strong>מה קורה בצ׳אלנג׳:</strong></p>
        <p>
          📹 יום 1: צולמים את הסרטון הראשון<br/>
          💬 יום 2-4: מפרסמים ומקבלים פידבק אישי ממני<br/>
          💰 יום 5-7: לקוחות אמיתיים או כסף חזרה
        </p>

        <p>250+ בעלי עסקים עשו את זה ושינו את הדרך שבה הם משווקים את עצמם.</p>

        <a class="cta" href="${APP_URL}/challenge${ep}">אני רוצה להצטרף לצ׳אלנג׳ ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          יש שאלות? פשוט השב לאימייל הזה - אני קורא הכל.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 2 - Challenge buyers (CHALLENGE_PURCHASED)
// ─────────────────────────────────────────────────────────────

// Email 1 (immediate): Access details + how to start
function challengeAccess(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName} - הגישה שלך לצ׳אלנג׳ 7 הימים מוכנה! 🚀`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן · אתגר 7 הימים</div>
        <h1>ברוכ/ה הבא/ה לצ׳אלנג׳, <span class="header-accent">${firstName}</span>!</h1>
        <p>הרכישה אושרה - הנה כל מה שצריך כדי להתחיל</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>כל הכבוד על ההחלטה! זה הצעד שמבדיל בין מי שמדבר על שיווק לבין מי שעושה אותו.</p>

        <div class="highlight-box-green">
          <p>✅ הרכישה אושרה בהצלחה</p>
        </div>

        <p><strong>איך מתחילים - 3 צעדים:</strong></p>

        <div class="step-row">
          <div class="step-num">1</div>
          <div class="step-text"><strong>הצטרף לקבוצת הוואצאפ</strong> - שם מתרחש הקסם. תקבל קישור בהודעה נפרדת.</div>
        </div>
        <div class="step-row">
          <div class="step-num">2</div>
          <div class="step-text"><strong>צפה במשימה של יום 1</strong> - זמין מיד לאחר ההצטרפות לקבוצה.</div>
        </div>
        <div class="step-row">
          <div class="step-num">3</div>
          <div class="step-text"><strong>צלם את הסרטון הראשון שלך</strong> - 60 שניות, טלפון ישר, לא צריך כלום אחר.</div>
        </div>

        <br/>
        <a class="cta" href="${APP_URL}/members">כניסה לאזור החברים ←</a>

        <hr class="divider"/>
        <div class="highlight-box-yellow">
          <p>⏱️ הצ׳אלנג׳ מתחיל מהיום - אל תדחה ליום ראשון "שיהיה נוח"</p>
        </div>
        <p style="font-size:14px;color:#6b7280">
          שאלות? השב לאימייל הזה ואחזור אליך תוך שעה.
        </p>
      </div>
    `),
  };
}

// Email 2 (day 7): Upsell to workshop ₪1,080
function challengeUpsellWorkshop(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `${firstName} - יום 7 הסתיים. מה עכשיו? 🎯`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>שבוע שלם, <span class="header-accent">${firstName}</span>! 🏆</h1>
        <p>סיימת את הצ׳אלנג׳ - הגיע הזמן לשלב הבא</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>שבוע עבר מאז שהצטרפת לצ׳אלנג׳. אני מקווה שיש לך כבר סרטונים בחוץ ואנשים שמגיבים.</p>
        <p>עכשיו השאלה הגדולה: <strong>איך הופכים את זה למערכת שרצה לבד?</strong></p>

        <div class="highlight-box">
          <p>⚡ הסדנה יום אחד - המשך ישיר מהצ׳אלנג׳</p>
        </div>

        <p><strong>מה הסדנה עושה שהצ׳אלנג׳ לא:</strong></p>
        <p>
          📐 בונה לך אסטרטגיית תוכן ל-12 חודשים קדימה<br/>
          🔄 מגדיר משפך מכירות אוטומטי מקצה לקצה<br/>
          📊 מלמד איך למדוד ולשפר - לא רק לפרסם ולקוות
        </p>

        <p style="font-size:15px;"><strong>₪1,080</strong> <span style="color:#6b7280;text-decoration:line-through">₪1,980</span> - מחיר מיוחד לבוגרי הצ׳אלנג׳</p>

        <a class="cta" href="${APP_URL}/workshop${ep}">לרכישה עם הזיכוי שלך ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          לא מוכן עדיין? גם בסדר - מחכה לך כשתהיה מוכן.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 3 - Workshop buyers (WORKSHOP_PURCHASED)
// ─────────────────────────────────────────────────────────────

// Email 1 (immediate): Confirmation + date + Zoom placeholder
function workshopConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName} - ההרשמה לסדנה אושרה! הנה כל הפרטים 📅`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן · סדנה יום אחד</div>
        <h1>ההרשמה אושרה, <span class="header-accent">${firstName}</span>!</h1>
        <p>הנה כל מה שצריך לדעת לפני הסדנה</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>כל הכבוד! קיבלת מקום בסדנה - זה ההשקעה הכי חכמה שתעשה לעסק שלך השנה.</p>

        <div class="highlight-box-green">
          <p>✅ מקומך שמור - ההרשמה אושרה בהצלחה</p>
        </div>

        <p><strong>פרטי הסדנה:</strong></p>
        <p>
          📅 <strong>תאריך:</strong> יתואם ויישלח בהודעה נפרדת<br/>
          ⏰ <strong>שעה:</strong> 09:00-15:00<br/>
          💻 <strong>פלטפורמה:</strong> Zoom (קישור יישלח יום לפני)<br/>
          📋 <strong>מה להכין:</strong> מחשב נייד, פנקס, קפה ☕
        </p>

        <div class="highlight-box">
          <p>📌 הכנה מוקדמת: חשוב על 3 האתגרים השיווקיים הכי גדולים שלך - נטפל בהם בסדנה</p>
        </div>

        <a class="cta" href="${APP_URL}/workshop">חזרה לדף הסדנה ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          שאלות לפני הסדנה? השב לאימייל הזה - אני כאן.
        </p>
      </div>
    `),
  };
}

// Email 2 (day 7): Upsell to digital course ₪1,800
function workshopUpsellStrategy(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `${firstName} - שבוע אחרי הסדנה. הצעד הבא שלך 🎓`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>שבוע עבר, <span class="header-accent">${firstName}</span></h1>
        <p>הגיע הזמן לעמיק את הידע</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>עבר שבוע מהסדנה. אני מקווה שהתחלת ליישם - אפילו דבר אחד קטן שעבד.</p>
        <p>לאלה שרוצים לקחת את הידע לעומק - יש לי בדיוק מה שצריך:</p>

        <div class="highlight-box">
          <p>🎓 קורס דיגיטלי - 16 שיעורים, 8 שעות, שיטה מלאה לשיווק דיגיטלי</p>
        </div>

        <p><strong>מה כלול בקורס:</strong></p>
        <p>
          📚 16 שיעורים מוקלטים - לומדים בקצב שלך<br/>
          🎯 4 מודולים: יסודות, תוכן, משפך מכירות, מדידה<br/>
          ♾️ גישה לנצח - חוזרים כשצריך<br/>
          📋 תרגילים מעשיים אחרי כל שיעור
        </p>

        <p style="font-size:15px;"><strong>₪1,800</strong> · גישה מיידית</p>

        <a class="cta" href="${APP_URL}/course${ep}">לרכישה עם הזיכוי שלך ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          לא בשלב הזה? גם בסדר. אשמח לשמוע מה עבד מהסדנה.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 4b - Course buyers (COURSE_PURCHASED)
// ─────────────────────────────────────────────────────────────

// Email 1 (immediate): Course access details
function courseAccess(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName} - הגישה לקורס מוכנה! 16 שיעורים מחכים לך 🎓`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>ברוכ/ה הבא/ה לקורס, <span class="header-accent">${firstName}</span>! 🎉</h1>
        <p>16 שיעורים · 8 שעות · שיטה מלאה</p>
      </div>
      <div class="body">
        <p>שלום ${firstName},</p>
        <p>תודה על הרכישה! הגישה שלך לקורס פעילה עכשיו.</p>

        <div class="highlight-box-green">
          <p>✅ גישה לנצח - חוזרים מתי שרוצים</p>
        </div>

        <p><strong>3 צעדים לתחילת הקורס:</strong></p>
        <div class="step-row">
          <div class="step-num">1</div>
          <div class="step-text">כנסו לאזור הלומדים - קישור בכפתור למטה</div>
        </div>
        <div class="step-row">
          <div class="step-num">2</div>
          <div class="step-text">התחילו מהמודול הראשון - יסודות השיווק הדיגיטלי</div>
        </div>
        <div class="step-row">
          <div class="step-num">3</div>
          <div class="step-text">השלימו את התרגיל בסוף כל שיעור - זה המפתח לתוצאות</div>
        </div>

        <a class="cta" href="${APP_URL}/course/content">כניסה לקורס ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          שאלות? השב לאימייל הזה - אני קורא הכל ועונה תוך 24 שעות.
        </p>
      </div>
    `),
  };
}

// Email 2 (day 7): Upsell to strategy session ₪4,000
function courseUpsellStrategy(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const ep = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  return {
    subject: `${firstName} - שבוע בקורס. מוכן/ה לצעד הבא? 🚀`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>שבוע בקורס, <span class="header-accent">${firstName}</span></h1>
        <p>הגיע הזמן לבנות את האסטרטגיה שלך</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>עבר שבוע מאז שהתחלת את הקורס. אם יישמת - כבר רואים תוצאות ראשונות.</p>
        <p>לאלה שמוכנים לקחת את כל מה שלמדו ולהפוך אותו לתוכנית פעולה אישית:</p>

        <div class="highlight-box">
          <p>🎯 פגישת אסטרטגיה אישית - 90 דקות, תוכנית שנה קדימה</p>
        </div>

        <p><strong>מה שונה בפגישת אסטרטגיה:</strong></p>
        <p>
          🔍 ניתוח מעמיק של העסק שלך ספציפית<br/>
          📐 בניית משפך מותאם אישית מ-A עד ת׳<br/>
          📝 יוצאים עם מסמך כתוב + תוכנית פעולה מיידית
        </p>

        <p style="font-size:15px;"><strong>₪4,000</strong> לשיחה אחת · ערבות תוצאה מלאה</p>

        <a class="cta" href="${APP_URL}/strategy${ep}">לרכישה עם הזיכוי שלך ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          לא בשלב הזה? ממשיך/ה בקורס - אני כאן אם יש שאלות.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 4 - Abandoned checkout (CHECKOUT_STARTED)
// ─────────────────────────────────────────────────────────────

// Email 1 (1h): Left something behind
function cartAbandon1h(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const product   = String(ctx.product ?? "challenge_197");
  const ep        = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  const price     = product === "workshop_1080" ? "1,080" : product === "course_1800" ? "1,800" : product === "strategy_4000" ? "4,000" : "197";
  const productName = product === "workshop_1080"
    ? "הסדנה יום אחד"
    : product === "course_1800"
    ? "הקורס הדיגיטלי"
    : product === "strategy_4000"
    ? "פגישת האסטרטגיה"
    : "הצ׳אלנג׳ 7 הימים";
  const href = (product === "workshop_1080"
    ? `${APP_URL}/workshop`
    : product === "course_1800"
    ? `${APP_URL}/course`
    : product === "strategy_4000"
    ? `${APP_URL}/strategy`
    : `${APP_URL}/challenge`) + ep;

  return {
    subject: `${firstName}, שכחת משהו... 🛒`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>העגלה שלך מחכה, <span class="header-accent">${firstName}</span></h1>
        <p>עצרת בדרך - בוא נסיים את זה</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>התחלת את תהליך ההרשמה ל<strong>${productName}</strong> אבל לא סיימת. קרה משהו?</p>
        <p>המקום שמרת עדיין שמור לך - <strong>אבל לא לנצח.</strong></p>

        <div class="highlight-box-yellow">
          <p>⏱️ המחיר ₪${price} תקף עוד 24 שעות בלבד</p>
        </div>

        <a class="cta" href="${href}">השלם את ההרשמה עכשיו ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          יש בעיה טכנית או שאלה? השב לאימייל הזה - אסדר מיד.
        </p>
      </div>
    `),
  };
}

// Email 2 (24h): Same offer + 10% coupon
function cartAbandon24h(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const product   = String(ctx.product ?? "challenge_197");
  const ep        = ctx.email ? `?email=${encodeURIComponent(String(ctx.email))}` : "";
  const productName = product === "workshop_1080"
    ? "הסדנה יום אחד"
    : product === "course_1800"
    ? "הקורס הדיגיטלי"
    : product === "strategy_4000"
    ? "פגישת האסטרטגיה"
    : "הצ׳אלנג׳ 7 הימים";
  const href = (product === "workshop_1080"
    ? `${APP_URL}/workshop`
    : product === "course_1800"
    ? `${APP_URL}/course`
    : product === "strategy_4000"
    ? `${APP_URL}/strategy`
    : `${APP_URL}/challenge`) + ep;

  return {
    subject: `${firstName} - אחרון. קוד הנחה 10% בפנים 🎁`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>ההזדמנות הזאת נסגרת הלילה</h1>
        <p>אחרון אחרון - יש לי מתנה בשבילך</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>זה האימייל האחרון שאני שולח על <strong>${productName}</strong>.</p>
        <p>כיוון שהתחלת את התהליך - אני רוצה לתת לך דחיפה קטנה:</p>

        <div class="coupon-box">
          <p>קוד הנחה 10% - בתוקף עד חצות:</p>
          <p class="coupon-code">HADAR10</p>
        </div>

        <p>הזן את הקוד בהרשמה וקבל 10% הנחה מיידית.</p>

        <a class="cta" href="${href}">מממש את ההנחה עכשיו ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          לא מעניין בכלל? אין בעיה - אשמח לדעת מה מנע ממך. השב לאימייל.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 5 - Re-engagement (INACTIVE_3_DAYS)
// ─────────────────────────────────────────────────────────────

function reengagement(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName}, התגעגענו אליך 👋`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>היי <span class="header-accent">${firstName}</span>, הכל בסדר?</h1>
        <p>שלושה ימים עברו מאז ההרשמה - בדקנו מה קרה</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>עברו כמה ימים מאז שנרשמת, ואני רוצה לבדוק - <strong>הגעת לצפות בהדרכה?</strong></p>
        <p>אם לא, אני מבין לגמרי. החיים עמוסים. אבל בדיוק בגלל זה ההדרכה קצרה ומעשית.</p>

        <div class="highlight-box">
          <p>🎬 ההדרכה החינמית עדיין מחכה לך - לוקחת פחות מ-20 דקות</p>
        </div>

        <p><strong>מה תרוויח מ-20 דקות:</strong></p>
        <p>
          ✅ בהירות מוחלטת על מי הלקוח שלך<br/>
          ✅ שיטה ליצור תוכן שעובד - ללא עריכה וציוד<br/>
          ✅ הצעד הראשון שאפשר לעשות כבר היום
        </p>

        <a class="cta" href="${APP_URL}">חזרה להדרכה ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          אם ברגע זה זה לא רלוונטי - אין בעיה בכלל.<br/>
          אבל אם יש משהו שעוצר אותך, השב לאימייל הזה ואעזור.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Legacy / generic templates (kept for backward compat)
// ─────────────────────────────────────────────────────────────

function followup72h(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `3 ימים ואתה עדיין כאן, ${firstName} - זה אומר משהו`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>אתה לא כמו כולם, <span class="header-accent">${firstName}</span></h1>
        <p>רוב האנשים נרשמים ונעלמים. אתה נשארת.</p>
      </div>
      <div class="body">
        <p>היי ${firstName},</p>
        <p>עברו 3 ימים מאז שנרשמת. זה הזמן שבו רוב האנשים מפסיקים לפתוח אימיילים.</p>
        <p>אז אני רוצה לתת לך עוד משהו - <strong>בחינם</strong>.</p>
        <div class="highlight-box">
          <p>🎯 הצ׳אלנג׳ של 7 הימים - ₪197 בלבד</p>
        </div>
        <p>7 משימות יומיות. קהילה תומכת. פידבק אישי. תוצאות אמיתיות.</p>
        <a class="cta" href="${APP_URL}/challenge">הצטרף לצ׳אלנג׳ ←</a>
        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">יש שאלות? השב לאימייל הזה - אני קורא הכל.</p>
      </div>
    `),
  };
}

function purchaseConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const amount    = ctx.amount as number | undefined;
  return {
    subject: `✅ הרכישה אושרה - ברוכ/ה הבא/ה, ${firstName}!`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>הרכישה אושרה! 🎉</h1>
        <p>תודה ${firstName} - ביצעת השקעה חכמה</p>
      </div>
      <div class="body">
        ${amount ? `<p><strong>סכום שולם:</strong> ₪${amount}</p>` : ""}
        <div class="highlight-box-green">
          <p>✅ הגישה שלך פעילה</p>
        </div>
        <a class="cta" href="${APP_URL}/members">כניסה לאזור החברים ←</a>
        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          שמור אימייל זה כאסמכתא לרכישתך.
        </p>
      </div>
    `),
  };
}

function postPurchase48h(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName}, יומיים אחרי - איך מתקדמים? + בונוס בפנים`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
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
        <p style="font-size:14px;color:#6b7280">השב לאימייל עם השאלות שלך - אני עונה לכולם.</p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Booking confirmation (CALL_BOOKED)
// ─────────────────────────────────────────────────────────────
function bookingConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName      = ctx.name.split(" ")[0];
  const slotDate       = String(ctx.slot_date ?? "");
  const slotTime       = String(ctx.slot_time ?? "");
  const slotFormatted  = slotDate
    ? new Intl.DateTimeFormat("he-IL", {
        weekday: "long",
        year:    "numeric",
        month:   "long",
        day:     "numeric",
      }).format(new Date(slotDate + "T12:00:00"))
    : slotDate;

  return {
    subject: `✅ הפגישה נקבעה! ${slotFormatted} בשעה ${slotTime}`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
        <h1>הפגישה קבועה, <span class="header-accent">${firstName}</span>! 🎯</h1>
        <p>פגישת אסטרטגיה אישית · 90 דקות</p>
      </div>
      <div class="body">
        <p>שלום ${firstName},</p>
        <p>אישרתי את הפגישה שלך. הנה הפרטים:</p>

        <div class="highlight-box-green">
          <p>📅 ${slotFormatted}</p>
          <p>🕙 ${slotTime} - ${slotTime.replace(/(\d+):00/, (_, h) => `${Number(h)+1}:30`)} (90 דקות)</p>
        </div>

        <p><strong>איך להתחבר:</strong></p>
        <div class="step-row">
          <div class="step-num">1</div>
          <div class="step-text">קישור ל-Zoom ישלח אליך 24 שעות לפני הפגישה</div>
        </div>
        <div class="step-row">
          <div class="step-num">2</div>
          <div class="step-text">הכן/י 2-3 שאלות מרכזיות על העסק שלך</div>
        </div>
        <div class="step-row">
          <div class="step-num">3</div>
          <div class="step-text">הביא/י מספרים בסיסיים: כמה לקוחות יש לך, מה מחיר הממוצע, מה עיקר ההכנסה</div>
        </div>

        <hr class="divider"/>

        <p><strong>צריך לשנות מועד?</strong></p>
        <p>ניתן לבטל או לשנות מועד עד 24 שעות לפני הפגישה.</p>

        <a class="cta" href="${APP_URL}/strategy/book">שנה מועד ←</a>

        <hr class="divider"/>
        <p style="font-size:14px;color:#6b7280">
          יש שאלה לפני הפגישה? השב לאימייל הזה - אני קורא ועונה.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Premium lead confirmation (PREMIUM_LEAD)
// ─────────────────────────────────────────────────────────────
function premiumLeadConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: `${firstName}, קיבלנו את הבקשה - ניצור קשר תוך 24 שעות`,
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן</div>
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
          <div class="step-text">נתאם יום צילום שמניב 16 סרטונים שמוכרים</div>
        </div>

        <hr class="divider"/>

        <div class="highlight-box-yellow">
          <p>📋 מה כלול ביום הצילום הפרמיום:<br/>
          • אסטרטגיית תוכן מקצועית<br/>
          • יום צילום מלא עם צוות<br/>
          • 16 סרטונים ערוכים ומוכנים לפרסום<br/>
          • 3 חודשי ליווי לאחר הצילום
          </p>
        </div>

        <p style="font-size:14px;color:#6b7280">
          מחיר: ₪14,000 + מע״מ · 3,500+ עסקים כבר צמחו עם השיטה הזו.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// Partnership lead confirmation (PARTNERSHIP_LEAD)
// ─────────────────────────────────────────────────────────────
function partnershipConfirmation(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const business  = String(ctx.business ?? "");
  return {
    subject: `${firstName}, קיבלנו את הבקשה שלך - הדר תחזור אליך בקרוב`,
    html: base(`
      <div class="header" style="background:#080808;border-bottom:2px solid rgba(201,168,76,0.4)">
        <div class="header-logo" style="color:#C9A84C">הדר דנן · שותפות אסטרטגית</div>
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
          יש משהו שרצית להוסיף? השב לאימייל הזה - אני קוראת הכל.
        </p>
      </div>
    `),
  };
}

// ─────────────────────────────────────────────────────────────
// SEQUENCE 6 - Hive membership (HIVE_JOINED / HIVE_CANCELLED)
// ─────────────────────────────────────────────────────────────

// Email 1 (immediate): Welcome to the Hive
function hiveWelcome(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  const tier      = String(ctx.tier ?? "basic_97");
  const price     = tier === "discounted_29" ? "29" : "97";
  return {
    subject: "ברוך הבא לכוורת 🐝",
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן · הכוורת</div>
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
          לביטול מנוי: <a href="mailto:hive@hadar-danan.co.il" style="color:#6b7280">hive@hadar-danan.co.il</a> או דרך האזור האישי
        </p>
      </div>
    `),
  };
}

// Email 2 (day 7): One-week check-in
function hiveDay7(ctx: EmailTemplateContext): RenderedEmail {
  const firstName = ctx.name.split(" ")[0];
  return {
    subject: "שבוע בכוורת - איך הולך? 🐝",
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן · הכוורת</div>
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
          יש שאלות? השב לאימייל הזה - אני קורא הכל.
        </p>
      </div>
    `),
  };
}

// Email 3 (immediate): Cancellation confirmation
function hiveCancelled(ctx: EmailTemplateContext): RenderedEmail {
  const firstName      = ctx.name.split(" ")[0];
  const refundEligible = Boolean(ctx.refund_eligible);
  return {
    subject: "אישור ביטול מנוי הכוורת",
    html: base(`
      <div class="header">
        <div class="header-logo">הדר דנן · הכוורת</div>
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
          יש שאלות? השב לאימייל הזה - אנחנו כאן.
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
        <div class="header-logo" style="color:#fca5a5">הדר דנן · Admin Alert</div>
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

// ── Template registry ─────────────────────────────────────────
type TemplateFn = (ctx: EmailTemplateContext) => RenderedEmail;

const TEMPLATES: Record<string, TemplateFn> = {
  // Sequence 1 - welcome
  welcome,
  followup_24h:                followup24h,
  followup_72h:                followup72h,
  // Sequence 2 - challenge buyers
  challenge_access:            challengeAccess,
  challenge_upsell_workshop:   challengeUpsellWorkshop,
  // Sequence 3 - workshop buyers
  workshop_confirmation:       workshopConfirmation,
  workshop_upsell_strategy:    workshopUpsellStrategy,
  // Sequence 4 - abandoned checkout
  cart_abandon_1h:             cartAbandon1h,
  cart_abandon_24h:            cartAbandon24h,
  // Sequence 5 - re-engagement
  reengagement,
  // Sequence 4b - course buyers
  course_access:               courseAccess,
  course_upsell_strategy:      courseUpsellStrategy,
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
  // Legacy / generic
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

export { FROM_NAME };
