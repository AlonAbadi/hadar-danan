import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Basic ")) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), "base64").toString().split(":");
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY חסר" }, { status: 500 });
  }

  const body = await req.json();
  const { app, generated, selectedPalette } = body;

  if (!app?.name || !generated) {
    return NextResponse.json({ error: "חסרים נתונים" }, { status: 400 });
  }

  const palette = generated.palettes?.find((p: { id: string }) => p.id === selectedPalette)
    ?? generated.palettes?.[0]
    ?? { bg: "#0D1018", accent: "#C9964A", text: "#EDE9E1", muted: "#9E9990" };

  const productsText = Array.isArray(app.products)
    ? app.products.filter((p: { name: string }) => p.name)
        .map((p: { name: string; price: number }) => `${p.name} — ₪${p.price}`)
        .join(", ")
    : "";

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `אתה מומחה TypeScript ו-Next.js. המשימה שלך: לכתוב קובץ \`lib/client.ts\` מלא ומוכן לשימוש עבור לקוחה חדשה של beegood.

הנחיות:
- כתוב רק את קוד TypeScript, ללא הסברים, ללא markdown fences
- כל הערכים חייבים להיות מלאים ואמיתיים — לא placeholder
- עקוב בדיוק אחרי המבנה הנתון
- השתמש בנתונים שסופקו ליצור תוכן שיווקי אמיתי ומשכנע
- כל הטקסט בעברית (פרט ל-name_en, domain)

נתוני הלקוחה:
- שם: ${app.name}
- אינסטגרם: ${app.instagram ?? "לא ידוע"}
- תחום/נישה: ${app.niche ?? ""}
- קהל יעד: ${app.target_audience ?? ""}
- WhatsApp: ${app.whatsapp ?? "972XXXXXXXXX"}
- סוג עסק: ${app.business_type ?? "עוסק מורשה"}
- ח.פ: ${app.business_id ?? "XXXXXXXXX"}
- דומיין: ${app.domain ?? "example.com"}

מוצרים: ${productsText || "לא צוינו"}
מודולים פעילים: ${Array.isArray(app.modules) ? app.modules.join(", ") : ""}

תוכן שנוצר:
- Hero כותרת: ${generated.hero?.headline ?? ""}
- Hero תת-כותרת: ${generated.hero?.sub ?? ""}
- About כותרת: ${generated.about?.title ?? ""}
- About גוף: ${generated.about?.body ?? ""}
- הדרכה חינמית: ${generated.free_training?.title ?? "הדרכה חינמית"} — ${generated.free_training?.description ?? ""}
- מייל ברוכים הבאים נושא: ${generated.emails?.welcome?.subject ?? ""}
- social proof: ${generated.social_proof?.stat1?.number ?? "250+"} ${generated.social_proof?.stat1?.label ?? "לקוחות"}, ${generated.social_proof?.stat2?.number ?? "4"} ${generated.social_proof?.stat2?.label ?? "שנים"}, ${generated.social_proof?.stat3?.number ?? "97%"} ${generated.social_proof?.stat3?.label ?? "ממליצים"}
- tagline (מתחת לסטטיסטיקות): תאר ב-5-8 מילים את הערך הייחודי של ${app.name}

פלטת צבעים שנבחרה (${palette.name ?? ""}):
- bg: ${palette.bg}
- accent: ${palette.accent}
- text: ${palette.text}
- muted: ${palette.muted}

חשב את הצבעים הנוספים (bg_dark, card, card_soft, border, accent_light, accent_dark, fg, fg_muted) על בסיס הפלטה — התאם את כל הגוונים לפלטה הנבחרה, לא להעתיק ברירות מחדל אם הפלטה שונה.

כתוב את הקובץ המלא בפורמט הזה בדיוק:

export const CLIENT = {

  // ─── Brand ───────────────────────────────────────────────
  name:          "[שם הלקוחה בעברית]",
  name_en:       "[slug באנגלית בלבד עם מקפים]",
  legal_name:    "[שם משפטי מלא]",
  company_id:    "[ח.פ]",
  domain:        "[דומיין ללא https://]",
  whatsapp:      "[מספר עם קוד מדינה ללא +]",

  // ─── Meta & SEO ──────────────────────────────────────────
  meta: {
    title:       "[שם | תיאור קצר לגוגל]",
    description: "[תיאור מלא לגוגל עד 160 תווים]",
    og_image:    "/og-image.jpg",
  },

  // ─── Colors ──────────────────────────────────────────────
  colors: {
    bg:           "[צבע רקע ראשי]",
    bg_dark:      "[צבע רקע כהה יותר]",
    card:         "[צבע קארד]",
    card_soft:    "[צבע קארד רך]",
    border:       "[צבע מסגרת]",
    accent:       "[צבע הדגשה ראשי]",
    accent_light: "[גרסה בהירה יותר של ה-accent]",
    accent_dark:  "[גרסה כהה יותר של ה-accent]",
    fg:           "[צבע טקסט ראשי]",
    fg_muted:     "[צבע טקסט משני]",
  },

  // ─── Hero ────────────────────────────────────────────────
  hero: {
    image:       "/hero.jpg",
    image_alt:   "[שם הלקוחה]",
    headline_a:  "[כותרת גרסה A — שמה דגש על הכאב/בעיה]",
    headline_b:  "[כותרת גרסה B — שמה דגש על הפתרון/תוצאה]",
    desc_a:      "[תיאור גרסה A — 2-3 משפטים]",
    desc_b:      "[תיאור גרסה B — 2-3 משפטים]",
    cta_a:       "[טקסט כפתור A ←]",
    cta_b:       "[טקסט כפתור B ←]",
  },

  // ─── Social proof ────────────────────────────────────────
  social_proof: {
    stat1: { number: "[מספר+]", label: "[תווית]" },
    stat2: { number: "[מספר]",  label: "[תווית]" },
    stat3: { number: "[אחוז%]", label: "[תווית]" },
    tagline: "[משפט קצר מתחת לסטטיסטיקות]",
  },

  // ─── Products ────────────────────────────────────────────
  products: {
    training:    { title: "[שם הדרכה חינמית]",    slug: "/training",    price: 0,     description: "[תיאור 1 משפט]", image: "/training.png"    },
    challenge:   { title: "[שם האתגר]",            slug: "/challenge",   price: 197,   description: "[תיאור 1 משפט]", image: "/challenge.png"   },
    workshop:    { title: "[שם הסדנה]",            slug: "/workshop",    price: 1080,  description: "[תיאור 1 משפט]", image: "/workshop.png"    },
    course:      { title: "[שם הקורס]",            slug: "/course",      price: 1800,  description: "[תיאור 1 משפט]", image: "/course.png"      },
    strategy:    { title: "[שם פגישת האסטרטגיה]", slug: "/strategy",    price: 4000,  description: "[תיאור 1 משפט]", image: "/strategy.png"    },
    premium:     { title: "[שם יום הפרמיום]",      slug: "/premium",     price: 14000, description: "[תיאור 1 משפט]", image: "/premium.png"     },
    partnership: { title: "[שם השותפות]",          slug: "/partnership", price: 10000, description: "[תיאור 1 משפט]", image: "/partnership.png" },
    hive:        { title: "[שם הקהילה]",           slug: "/hive",        price_basic: 97, price_disc: 29, description: "[תיאור 1 משפט]", image: "/hive.png" },
  },

  // ─── About ───────────────────────────────────────────────
  about: {
    title:   "[כותרת עמוד About]",
    tagline: "[תפקיד / התמחות — 4-6 מילים]",
    body:    "[פסקת אודות — 3-4 משפטים]",
    image:   "/about.jpg",
  },

  // ─── Email ───────────────────────────────────────────────
  email: {
    from_name:  "[שם הלקוחה]",
    from_email: "noreply@[דומיין]",
    signature:  "[שם משפטי] · ישראל",
  },

  // ─── Modules — הפעלה/כיבוי של פיצ'רים ──────────────────
  modules: {
    quiz:            [האם quiz מופעל?],
    hive:            [האם hive מופעל?],
    challenge:       [האם challenge מופעל?],
    course:          [האם course מופעל?],
    workshop:        [האם workshop מופעל?],
    strategy:        [האם strategy מופעל?],
    premium:         [האם premium_day מופעל?],
    partnership:     [האם partnership מופעל?],
    deals:           false,
    ab_testing:      true,
    video_analytics: [האם video_analytics מופעל?],
  },

} as const;`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = raw.replace(/^```typescript\s*/i, "").replace(/^```ts\s*/i, "").replace(/\s*```$/i, "").trim();

    return NextResponse.json({ code: cleaned });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[generate-client] error:", msg);
    return NextResponse.json({ error: `שגיאה: ${msg}` }, { status: 500 });
  }
}
