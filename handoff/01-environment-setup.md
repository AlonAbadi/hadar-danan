# 01 — Environment Setup Guide
## beegood.online · הדר דנן בע״מ

---

## Prerequisites

| כלי | גרסה מינימלית | בדיקה |
|---|---|---|
| Node.js | 20+ | `node -v` |
| npm | 10+ | `npm -v` |
| Git | כל גרסה | `git --version` |

---

## Clone & Install

```bash
git clone https://github.com/AlonAbadi/hadar-danan.git
cd hadar-danan
npm install
```

---

## Environment Variables

צור קובץ `.env.local` בתיקיית הרוט עם המשתנים הבאים.  
**הערכים האמיתיים יועברו בנפרד — לא נמצאים ב-repo.**

```env
# ── Supabase ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://rufzcpwzolitoqqhdmrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=          # anon key — לניהול session בלבד
SUPABASE_SERVICE_ROLE_KEY=              # service role — כל DB access מהשרת

# ── Resend (email) ────────────────────────────────────────
RESEND_API_KEY=                         # re_UKo76Jxb_...
NEXT_PUBLIC_FROM_EMAIL=noreply@beegood.online

# ── Cardcom (payments) ────────────────────────────────────
CARDCOM_TERMINAL=143422
CARDCOM_API_NAME=                       # מ-Vercel

# ── App ───────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://www.beegood.online
NEXT_PUBLIC_PRICE_CHALLENGE=197
NEXT_PUBLIC_PRICE_WORKSHOP=1080
NEXT_PUBLIC_PRICE_CALL=4000

# ── Auth / Secrets ────────────────────────────────────────
ADMIN_USERNAME=                         # Basic Auth ל-/admin
ADMIN_PASSWORD=
CRON_SECRET=                            # Bearer token ל-/api/cron/jobs
MEMBERS_SECRET=                         # token ל-/members (legacy)

# ── WhatsApp / UChat ──────────────────────────────────────
WHATSAPP_PHONE=972539566961
NEXT_PUBLIC_WHATSAPP_PHONE=972539566961
WHATSAPP_GROUP_URL=                     # placeholder — לא מוגדר עדיין
UCHAT_API_KEY=                          # pending — ראה Open Items

# ── Meta Pixel (אופציונלי) ────────────────────────────────
NEXT_PUBLIC_META_PIXEL_ID=              # אם קיים
```

---

## Run Locally

```bash
npm run dev
```

האתר עולה על `http://localhost:3000`.

> **שים לב:** Cardcom payments ו-Resend emails פועלים על credentials חיים — לא יש sandbox. בסביבת dev, השתמש ב-`/test` (מוצר של ₪1) לבדיקת תשלומים, ובדוא"ל שיש לך גישה אליו לבדיקת emails.

---

## Before Committing

```bash
# בדיקת TypeScript — חובה לפני כל commit
npx tsc --noEmit 2>&1 | grep "error TS" | grep -v ".next"
```

אם אין output — הכל תקין.

```bash
git add <files>
git commit -m "תיאור השינוי"
git push
```

Push ל-`main` מפעיל auto-deploy בוורסל — אין צורך ב-`vercel --prod`.

---

## Verify Setup

| בדיקה | URL / פקודה | ציפייה |
|---|---|---|
| האתר עולה | `localhost:3000` | Homepage נטענת |
| Admin פועל | `localhost:3000/admin` | מבקש Basic Auth |
| DB מחובר | `localhost:3000/api/cron/jobs` עם `Authorization: Bearer <CRON_SECRET>` | `{ processed: 0 }` |
| TypeScript נקי | `npx tsc --noEmit` | ללא errors |

---

## Stack Reference

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Email | Resend — `noreply@beegood.online` |
| Payments | Cardcom LowProfile API |
| Deployment | Vercel — GitHub push to `main` → auto-deploy |
| Cron | cron-job.org → `GET /api/cron/jobs` כל 5 דקות |
| Videos | Vimeo embed |
| WhatsApp | UChat API |
| AI | Anthropic Claude API (TrueSignal diagnosis + Atelier pipeline) |
