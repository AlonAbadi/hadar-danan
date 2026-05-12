# 03 — Critical "Don't Touch" List
## beegood.online · הדר דנן בע״מ

---

> דברים שאם נוגעים בהם — נשבר הכל, לרוב בשקט ורק בפרודקשן.

---

## DNS Records ב-Vercel

### ❌ אין למחוק את ה-TXT record של Google
```
google-site-verification=HSet3dAP698p3AYskyPH__2yb1H3zNNKqlcczjn8dqI
```
**למה:** מחיקה מנתקת גם את Google Search Console **וגם את Google OAuth** — משתמשים לא יוכלו להתחבר עם Google.

### ❌ אין למחוק את ה-DNS records של Resend
(MX, SPF TXT, DKIM CNAMEs x3, DMARC TXT)  
**למה:** מחיקה שוברת את כל שליחת המיילים לכל המשתמשים — welcome, purchase confirmation, everything.

### ⚠️ DNS מנוהל ב-Vercel, לא ב-Hover
Hover מראה "third-party nameservers" — זה **מכוון ונכון**. אין לשנות nameservers ב-Hover.

---

## Database

### ❌ אין לשנות את `schema.sql`
קובץ `supabase/migrations/schema.sql` הוא migration ראשוני שכבר רץ. כל שינוי DB חייב להיות migration file חדש עם מספר עוקב (`031_...`).

### ❌ אין להריץ migrations ב-Supabase ללא בדיקה
ה-schema.sql קיים — לא מריצים אותו שוב. רק migration files חדשים.

### ⚠️ Migration 030 ממתין — חשוב לדעת
`030_whatsapp_logs.sql` נכתב אבל **טרם הורץ** ב-Supabase. WhatsApp cart-abandon לא יעבוד כראוי בלעדיו.

---

## Two User ID Trap (הבאג הנפוץ ביותר בcodebase)

```
auth.users.id   ≠   public.users.id
```

יש **שני UUID נפרדים** לכל משתמש:
- `authUser.id` — מ-Supabase Auth, לbodying session בלבד
- `userData.id` — מ-`public.users` table, לכל FK references

**הדרך הנכונה:**
```ts
// ✅ נכון
const { data: userData } = await supabase
  .from("users")
  .eq("auth_id", authUser.id)  // ← מקשר בין השניים
  .single();

// userData.id ← זה ה-UUID שמשתמשים בו בכל מקום אחר
```

**העברת `authUser.id` ל-`/api/checkout` גורמת FK violation** — הבאג קרה, יקרה שוב אם לא שמים לב.

---

## Google OAuth — אל תפרסם מחדש ללא בדיקה

אם נדרש לפרסם מחדש את ה-OAuth app ב-Google Cloud Console:
1. וודא שה-app name תואם ל-`הדר דנן`
2. ה-automated branding check עשוי להחזיר false-positive — לחכות או לבקש manual review
3. לא לפרסם כ-"test" — רק production, אחרת רק test users יכולים להתחבר

---

## קוד שנראה שגוי אבל הוא מכוון

### `lib/credit.ts` ו-`/api/user/credit`
קיימים ב-codebase אבל **לא נקראים מאף מקום**. מערכת הקרדיט הוסרה (אפריל 2026). אין למחוק — פשוט לא להשתמש.

### `app/admin/bookings/`
Dead code של Calendly — הוסר מממשק המשתמש אבל הקוד נשאר. לא לגעת.

### `public/` — תמונות
תמונות ב-`/public` (hero, products, team) הן assets מוכנים. אין להחליף ללא אישור מפורש.

### Cardcom webhook — idempotent by design
`/api/cardcom/webhook` מתעלם בכוונה מ-duplicate calls (UNIQUE constraint על `cardcom_ref`). זה לא באג.

### Email click tracking
כל קישורי CTA במיילים עוברים דרך `/api/email/click` — זה intentional. אין לשלוח links ישירים במיילים.

---

## פונט וצבעים — עקביות מוחלטת

| ❌ אסור | ✅ מותר |
|---|---|
| Cormorant Garamond, DM Sans, כל פונט אחר | `Assistant` בלבד |
| `#F0960D`, `#C07010` (צבעים ישנים) | `#E8B94A`, `#C9964A`, `#9E7C3A` בלבד |
| `og:image` ב-page-level metadata ללא `images` field | OG metadata רק ב-`app/layout.tsx` |

---

## Cardcom — format קריטי

```ts
// ✅ נכון — URLSearchParams, לא JSON
const body = new URLSearchParams({
  TerminalNumber: "143422",
  UserName: "...",        // ← לא "ApiName"
  SumToBill: "197",
  // ...
});

// response הוא text/URLSearchParams
// ResponseCode === "0" → success
```

---

## Vimeo — Day 8 של האתגר

ה-`videoId` של day 8 ב-`lib/challenge-config.ts` מכיל **Zoom URL**, לא Vimeo ID.  
זהו מפגש לייב שמתקיים ב-15 לחודש. `computeNextLiveMeetingDate()` מחשב את התאריך.  
הצוות מעדכן את ה-URL לפני כל מפגש — זה מכוון ונורמלי.

---

## Cron Secret

`CRON_SECRET` חייב להתאים בין:
1. cron-job.org (header שנשלח)
2. Vercel env var (שרת מאמת)

שינוי באחד בלי השני → כל ה-job queue מפסיק לרוץ בשקט.
