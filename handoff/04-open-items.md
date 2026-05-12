# 04 — Open Items & Known Gaps
## beegood.online · הדר דנן בע״מ

---

## A — פעולות טכניות שממתינות לביצוע

### ~~A1. הרצת Migration 030~~ ✅ בוצע
`030_whatsapp_logs.sql` הורץ ב-Supabase.

---

### ~~A2. הגדרת UChat API Key~~ ✅ בוצע
`UCHAT_API_KEY` מוגדר ב-Vercel.

---

### ~~A3. יצירת WhatsApp Templates ב-UChat~~ ✅ בוצע
Templates `hadar_cart_1h` + `hadar_cart_24h` נוצרו. יש לוודא שאישור Meta הושלם לפני הפעלת cart-abandon.

---

### A4. הגדרת Cardcom Recurring לכוורת
**תיאור:** מנוי הכוורת (הכוורת) כרגע stubbed — לא גובה חיוב חודשי אמיתי  
**פעולה:** לפתוח Cardcom recurring billing בתיאום עם Cardcom  
**תלות:** אישור Cardcom + הגדרות נוספות  
**סטטוס:** ממתין לאחר שתשלומי one-time מאושרים לגמרי

---

## B — תוכן שהצוות צריך לספק

### B1. Zoom URL — Day 8 של האתגר
**קובץ:** `lib/challenge-config.ts` — day 8, שדה `videoId`  
**תיאור:** יום 8 הוא מפגש לייב ב-Zoom (לא סרטון). מתקיים ב-15 לחודש  
**פעולה:** לעדכן את ה-URL לפני כל מפגש  
**חישוב תאריך:** `computeNextLiveMeetingDate()` — 15 לחודש, מדלג שבת/שישי לראשון

### B2. סרטוני קורס דיגיטלי
**קובץ:** `components/CoursePlayer.tsx` (או שם דומה)  
**תיאור:** 8 מודולים, 16 שיעורים — חלק מה-Vimeo IDs הם placeholder  
**פעולה:** להחליף IDs אמיתיים כשהתוכן מוכן

### B3. תוכן לכוורת (hive_content)
**טבלה:** `hive_content` ב-Supabase  
**תיאור:** טבלה ריקה — אין תוכן לחברי הכוורת  
**פעולה:** להוסיף rows ישירות ב-Supabase Dashboard (articles/PDFs/videos)  
**שדות:** `title`, `url`, `content_type`, `tier_required` (starter/pro/elite)

### B4. Zoom Link לסדנה
**קובץ:** `lib/email/templates.ts` → template `workshop_confirmation`  
**תיאור:** מכיל placeholder לזום  
**פעולה:** לעדכן ל-URL אמיתי

### B5. WhatsApp Group URL לכוורת
**קובץ:** `lib/email/templates.ts` → template `hive_welcome`  
**תיאור:** מכיל placeholder לקבוצת WhatsApp  
**פעולה:** לעדכן ל-URL אמיתי

---

## C — פיצ׳רים מתוכננים (לא מפותחים עדיין)

### C1. Hive AI Matching
**תיאור:** מערכת matching בין חברי הכוורת — מוצג כ-"בקרוב" בדף `/hive`  
**סטטוס:** UI placeholder בלבד, אין backend

### C2. WhatsApp Cart-Abandon
**תיאור:** תזכורת WhatsApp למי שהתחיל תשלום ולא סיים  
**תלות:** A2 + A3 + A4 (UChat key + templates + migration 030)  
**סטטוס:** הקוד מוכן (`SEND_WHATSAPP` job), ממתין לאישור templates

---

## D — Dead Code ידוע (לא למחוק)

| קובץ / מסלול | סיבה לשמור |
|---|---|
| `lib/credit.ts` | נשאר לbackward compat, לא נקרא |
| `/api/user/credit` | dead endpoint, לא פעיל |
| `app/admin/bookings/` | legacy Calendly — הוסר מ-UI |
| `lib/admin/queries.ts` (Calendly functions) | dead code, לא מזיק |
| `/account/redeem` | credit system הוסר, עמוד לא פעיל |

---

## E — A/B Test פעיל

**ניסוי:** `landing_headline` — כותרת hero בדף הבית  
**Variant A:** "השיווק שלך לא נכשל בגלל הסרטונים"  
**Variant B:** "תוכן שמוכר מגיע מבהירות - לא מעוד סרטונים"  

**לא לשנות** את תוכן ה-hero בלי לאפס את מונה הניסוי:
```sql
UPDATE experiments
SET visitors_a=0, visitors_b=0, conversions_a=0, conversions_b=0
WHERE name='landing_headline';
```

---

## F — מה שעובד ולא דורש כלום

הכל הבא **live ופעיל** — אין צורך בפעולה:

- ✅ Supabase Auth (email/password + Google OAuth)
- ✅ Cardcom payments (₪197 / ₪1,080 / ₪4,000 / ₪14,000)
- ✅ Resend emails (14 sequences פעילות)
- ✅ WhatsApp שליחה ידנית (UChat)
- ✅ Video analytics (Vimeo events → `video_events`)
- ✅ CRM admin dashboard (`/admin`)
- ✅ Atelier pipeline (AI analysis + deploy)
- ✅ UTM tracking מלא
- ✅ Challenge days 0-7 (כולל unlock logic לפי calendar day ישראל)
- ✅ Course content player (8 מודולים, 16 שיעורים)
- ✅ Hive membership flow (join, cancel, 14-day refund)
- ✅ cron-job.org (כל 5 דקות)
