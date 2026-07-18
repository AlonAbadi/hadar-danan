import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { getUserActivityReport, summarizeForInsights } from '@/lib/admin/activity';

export const maxDuration = 120;

function isAdminAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!auth?.startsWith('Basic ')) return false;
  try {
    const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString().split(':');
    return user === process.env.ADMIN_USERNAME && pass === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}

const SYSTEM_PROMPT = `אתה אנליסט צמיחה בכיר של beegood.online (הדר דנן בע"מ) — משפך מכירות לעסקים קטנים בישראל:
שיעור חינמי → אתגר 7 ימים (197₪) → סדנה (1,080₪) → קורס (1,800₪) → פגישת אסטרטגיה (4,000₪), לצד מנוע האות (אבחון TrueSignal חינמי ב-/signal) וכוורת האות.

תקבל JSON מצרפי על הפעילות של משתמשים רשומים באתר: ביקורים חוזרים, זמן באתר, מקורות הגעה, צפייה בשיעור החינמי, התקדמות באתגר, אבחוני אות וחדר השידור.

כתוב דוח ניתוח ולמידה בעברית, מעשי וחד, במבנה הבא:

## מה הנתונים מספרים
3-5 תובנות מרכזיות, כל אחת במשפט-שניים עם המספרים התומכים.

## דפוסים וסגמנטים
אילו קבוצות משתמשים בולטות (למשל: פעילים דרך אימייל, צפו בשיעור אך לא נרשמו לאתגר, נרשמו לאתגר ונטשו ביום מסוים, עשו אבחון אות ונעלמו). לכל סגמנט: גודל משוער והזדמנות.

## איפה המשפך דולף
נקודות הנטישה הגדולות ביותר לפי הנתונים.

## 5 המלצות לשיפור
ממוקדות, ניתנות לביצוע השבוע, מבוססות על הנתונים בלבד. לכל המלצה: מה עושים, למי, ולמה זה אמור לעבוד.

כללים: בלי סופרלטיבים ריקים, בלי המלצות גנריות שלא נשענות על הנתונים. אל תשתמש בקו מפריד ארוך, השתמש בפסיק או נקודה במקום. כתוב לקהל של מייסד שמכיר את המוצר לעומק.`;

// POST /api/admin/activity/insights — AI analysis of the activity report
export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 401 });
  }

  const supabase = createServerClient();
  try {
    const report = await getUserActivityReport(180);
    const summary = summarizeForInsights(report);

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `נתוני הפעילות המצרפיים (חלון של ${summary.window_days} ימים, חשבונות פנימיים הוחרגו):\n\n${JSON.stringify(summary, null, 1)}`,
        },
      ],
    });

    const insights = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    if (!insights) {
      throw new Error(`empty insights response (stop_reason: ${response.stop_reason})`);
    }

    return NextResponse.json({ insights, generatedAt: new Date().toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from('error_logs').insert({
      context: 'api/admin/activity/insights',
      error: message,
    });
    return NextResponse.json({ error: 'הניתוח נכשל, נסה שוב' }, { status: 500 });
  }
}
