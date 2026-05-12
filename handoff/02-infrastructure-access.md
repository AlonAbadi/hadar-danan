# 02 — Infrastructure & Access Map
## beegood.online · הדר דנן בע״מ

---

## שירותים חיצוניים — רשימה מלאה

### 1. Vercel — Hosting & Deployment
- **Plan:** Hobby
- **Project:** `hadar-danan` (מחובר ל-GitHub repo)
- **Trigger:** Push ל-`main` → auto-deploy (ללא פעולה ידנית)
- **Environment Variables:** כל ה-secrets מוגדרים כאן — לא ב-`.env.local` בפרודקשן
- **DNS:** כל ה-DNS records של `beegood.online` מנוהלים דרך Vercel DNS
- **Cron (Vercel):** `0 22 * * *` — daily 22:00 UTC (ראה `vercel.json`)
- **גישה:** דרך חשבון GitHub של AlonAbadi

---

### 2. GitHub — Source Control
- **Repo:** `AlonAbadi/hadar-danan` (private)
- **Branch:** `main` — הענף היחיד, deploy ישיר לפרודקשן
- **גישה:** להוסיף collaborator דרך Settings → Collaborators

---

### 3. Supabase — Database & Auth
- **Project ID:** `rufzcpwzolitoqqhdmrx`
- **URL:** `https://rufzcpwzolitoqqhdmrx.supabase.co`
- **Region:** EU West (Ireland) — בדוק מול הגדרות הפרויקט
- **מה רץ שם:**
  - PostgreSQL DB עם 20 טבלאות
  - Supabase Auth (email/password + Google OAuth)
  - RLS (Row Level Security) על `users` ו-`purchases`
- **גישה:** Dashboard ב-`supabase.com` — דרך חשבון הפרויקט
- **מיגרציות:** מנוהלות ידנית דרך SQL Editor ב-Dashboard (אין migration runner)
- **Migration ממתין:** `030_whatsapp_logs.sql` — קובץ קיים ב-`supabase/migrations/` אך טרם הורץ

---

### 4. Resend — Email
- **Domain:** `beegood.online` — verified
- **Sender:** `הדר דנן <noreply@beegood.online>` (send-only, אין inbox)
- **API Key:** מוגדר ב-Vercel כ-`RESEND_API_KEY`
- **גישה:** `resend.com` — דרך חשבון הפרויקט
- **⚠️ חשוב:** DNS records של Resend (MX, SPF, DKIM, DMARC) חיים ב-Vercel DNS — אין למחוק

---

### 5. Cardcom — Payment Gateway
- **Terminal:** `143422`
- **API:** LowProfile (`POST` ל-`https://secure.cardcom.solutions/Interface/LowProfile.aspx`)
- **Format:** `URLSearchParams` (לא JSON) — שים לב
- **Webhook:** `POST /api/cardcom/webhook` — מאשר תשלומים, idempotent
- **Status:** **LIVE** — transactions אמיתיים
- **גישה:** `cardcom.solutions` — דרך חשבון הלקוח (הדר דנן)

---

### 6. UChat — WhatsApp Business
- **מספר:** `972539566961`
- **מה עובד:** שליחת הודעות WhatsApp ידניות ו-sequence messages
- **API Endpoint:** `send-whatsapp-template-by-user-id`
- **API Key:** `UCHAT_API_KEY` — **עדיין לא מוגדר ב-Vercel** (ראה Open Items)
- **גישה:** `uchat.io` — דרך חשבון הפרויקט
- **⚠️ הערה:** API מחזיר HTTP 200 גם כשההודעה לא נשלחה — לבדוק `status` בתגובה

---

### 7. cron-job.org — External Cron
- **Job:** `GET https://www.beegood.online/api/cron/jobs` כל 5 דקות
- **Auth:** `Authorization: Bearer <CRON_SECRET>`
- **תפקיד:** מעבד job queue (emails, WhatsApp, admin alerts)
- **גישה:** `cron-job.org` — דרך חשבון הפרויקט

---

### 8. Google — OAuth & Search Console
- **OAuth App:** `הדר דנן` — מורשה ל-`beegood.online`
- **Search Console:** Domain verified — TXT record ב-Vercel DNS
- **גישה:** Google Cloud Console — דרך חשבון Google של הפרויקט

---

### 9. Vimeo — Video Hosting
- **שימוש:** כל הסרטונים (training, challenge, course, strategy VSL, premium VSL)
- **IDs:** מוגדרים ב-`lib/challenge-config.ts` ו-`components/landing/ProductLandingPage.tsx`
- **גישה:** `vimeo.com` — דרך חשבון הפרויקט

---

## DNS Records — Vercel DNS (חשוב!)

כל ה-DNS של `beegood.online` מנוהל ב-**Vercel** (לא ב-Hover — Hover מצביע ל-nameservers של Vercel).

| Record | Type | Value | Purpose |
|---|---|---|---|
| `@` | A | Vercel IP | האתר הראשי |
| `www` | CNAME | `cname.vercel-dns.com` | redirect |
| `google-site-verification=...` | TXT | (ראה CLAUDE.md) | Google OAuth + Search Console |
| `v=spf1 include:amazonses.com ~all` | TXT | — | Resend SPF |
| (3x DKIM CNAMEs) | CNAME | Resend values | Resend DKIM |
| `v=DMARC1; p=none;...` | TXT | — | Resend DMARC |
| `feedback-smtp.us-east-1.amazonses.com` | MX (priority 10) | — | Resend MX |

---

## Credentials Location Summary

| Secret | איפה נמצא |
|---|---|
| Supabase keys | Vercel env vars + יש להעביר ל-`.env.local` |
| Resend API key | Vercel env vars |
| Cardcom credentials | Vercel env vars |
| UChat API key | **טרם הוגדר ב-Vercel** |
| Admin username/password | Vercel env vars |
| CRON_SECRET | Vercel env vars |
| MEMBERS_SECRET | Vercel env vars |
| Claude API key | Vercel env vars (לatelier pipeline) |
