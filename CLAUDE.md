# Hebrew Marketing OS — הדר דנן בע״מ

## Project overview

Full-stack automated sales funnel for Hadar Danan Ltd. Collects leads via a free training signup, nurtures them through a value ladder with automated Hebrew email sequences, and converts them to paid products. Includes a monthly membership community ("הכוורת").

**Live site:** https://hadar-danan.vercel.app
**Supabase project:** `rufzcpwzolitoqqhdmrx`
**Admin dashboard:** https://hadar-danan.vercel.app/admin (Basic Auth — see env vars)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Email | Resend (`onboarding@resend.dev` currently — pending domain verification) |
| Payments | Cardcom LowProfile API (**live** — credentials set in Vercel) |
| Deployment | Vercel (Hobby plan — one daily cron) |
| External cron | cron-job.org → `/api/cron/jobs` every 5 minutes |

---

## Design system — Santosha palette

**All pages use the Santosha dark palette.** Do not introduce new color systems.

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#0D1018` | Page background (darkest sections: `#080C14`) |
| `--card` | `#141820` | Card backgrounds |
| `--card-soft` | `#1D2430` | Softer card / input backgrounds |
| `--border` | `#2C323E` | Borders, dividers |
| `--gold` | `#C9964A` | Primary accent, CTAs, gold elements |
| `--gold-light` | `#E8B94A` | High-emphasis gold highlights |
| `--gold-dark` | `#9E7C3A` | Gold gradient end |
| `--fg` | `#EDE9E1` | Primary text |
| `--fg-muted` | `#9E9990` | Secondary / muted text |
| `--grad-gold` | `linear-gradient(135deg, #E8B94A, #C9964A, #9E7C3A)` | CTA buttons, badges |
| `--grad-card` | `linear-gradient(145deg, #1D2430, #111620)` | Feature cards |

**Brand gold scale:**
- `--brand-gold-1: #E8B94A` — high-emphasis (hover states, active badges)
- `--brand-gold-2: #C9964A` — base gold (default CTAs, borders, text accents)
- `--brand-gold-3: #9E7C3A` — dark gold (gradient ends, shadows)

**Old colors `#F0960D` and `#C07010` are fully removed — do not use.**

**CSS utility classes** (defined in `app/globals.css`):
- `.text-gradient-gold` — gold gradient text fill
- `.bg-gradient-gold` — gold gradient background
- `.bg-gradient-card` — card gradient background
- `.glow-gold` — gold box-shadow glow
- `.shadow-card` — standard card shadow

**Exception — homepage** (`/`): The entire page (including products + social proof sections) uses `#080C14` dark background. No light sections remain. The nav and footer stay dark.

**Font:** `Assistant` (Google Fonts) — the only font. Imported in `app/layout.tsx` as `--font-assistant`. Always use `font-assistant` class on page wrappers. No other fonts. The Cormorant Garamond / DM Sans experiment was fully reverted.

**Nav logo:** Text-only "הדר דנן" — no bee image, no external image file. Styled with gold gradient on hover. `DesktopNav` and `MobileNav` components.

**Stats section (homepage):** Social proof strip between hero and products. Three counters: "250+ עסקים", "4 שנים", "97% ממליצים". Gold animated numbers, muted label text. Background: `#080C14`. Do not add more stats without user approval.

**Accessibility button:** Floating bottom-left, background `#2F80ED` (blue — accessibility convention, not brand gold), `width: 56px, height: 56px, borderRadius: 14px`. Label "נגישות". Defined in `components/AccessibilityWidget.tsx`.

**TrueSignal© branding:** A proprietary method name added site-wide. Rules:
- Symbol: © (not ™)
- Position: always **suffix** — `TrueSignal©` (never `©TrueSignal`)
- Use `TrueSignal©` on first mention per page only
- Appears max 1–2 times per page
- Always wrap in: `<span dir="ltr" style="unicode-bidi:embed">TrueSignal©</span>` to prevent RTL reversal
- Added to: homepage hero + philosophy section, strategy hero, premium hero, partnership philosophy, challenge/workshop/course hero descriptions
- Footer microcopy on all pages: `"אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | TrueSignal©"`

---

## Language conventions

- **All UI text is Hebrew RTL.** Every page has `dir="rtl"` or `lang="he"`.
- **Never use English text in UI**, error messages, or button labels.
- **Inline styles for brand colors** — use `style={{}}` for hex values not in Tailwind config.

---

## All pages

| URL | Purpose | Price | Notes |
|---|---|---|---|
| `/` | Homepage — value ladder entry | Free signup | Fully dark (`#080C14`), Ladder+Netflix products section |
| `/about` | About page | — | Static |
| `/team` | Team page | — | Static |
| `/training` | Free training | Free | Lead magnet, SignupForm |
| `/challenge` | 7-day video challenge | ₪197 | WhatsApp CTA (`ChallengeCTA`) |
| `/workshop` | 1-day workshop | ₪1,080 | WhatsApp CTA (`WorkshopCTA`) |
| `/course` | Digital course — 16 lessons | ₪1,800 | Cardcom checkout (`CourseCTA`) |
| `/strategy` | Strategy session (90 min) | ₪4,000 | Info page — CTA links to `/strategy/book` |
| `/strategy/book` | Full booking + payment flow | ₪4,000 | 2-step: BookingForm → Cardcom (`StrategyBookFlow`) |
| `/strategy/success` | Post-payment confirmation | — | Payment confirmed, Zoom link sent within 24h |
| `/premium` | Premium shoot day — 16 videos | ₪14,000 | 2-step: BookingForm → Cardcom (`PremiumBookingFlow`) |
| `/premium/success` | Post-premium-payment | — | Shared `SuccessPage` component |
| `/partnership` | Strategic partnership retainer | ₪10k–30k/mo | 2-step: lead form → BookingForm discovery call (`PartnershipBookingFlow`) |
| `/hive` | הכוורת — monthly membership community | ₪29–₪97/mo | `HivePricingSection` client component |
| `/hive/terms` | Hive membership legal terms | — | Static, full Hebrew legal text |
| `/quiz` | 3-question diagnostic quiz | — | Routes user to right product |
| `/my` | Personal area | — | Credit checker + hive cancel button |
| `/thank-you` | Post-signup page | — | Upsell to `/challenge` |
| `/challenge/success` | Post-challenge-purchase | — | Upsell to `/workshop` |
| `/workshop/success` | Post-workshop-purchase | — | Upsell to `/course` |
| `/course/success` | Post-course-purchase | — | — |
| `/course/content` | Members-only course content | — | Placeholder — needs real links |
| `/members` | Members area | — | Secret token gate (`?t=` or cookie) |
| `/admin` | CRM dashboard | — | Basic Auth, full analytics + hive section |
| `/admin/users/[id]` | Individual user profile | — | — |
| `/accessibility` | Accessibility statement | — | Static, Hebrew WCAG 2.1 AA |
| `/privacy` | Privacy policy | — | Static |
| `/terms` | General terms of service | — | Static |
| `/call` | Strategy call redirect | — | Redirects to `/strategy` |

---

## Database — migrations applied

| Migration | File | Status |
|---|---|---|
| 001 | `schema.sql` | ✅ Applied — core tables |
| 002 | `002_email_sequences.sql` | ✅ Applied — email automation |
| 003 | `003_bookings.sql` | ✅ Applied — strategy booking |
| 004 | `004_course.sql` | ✅ Applied — course product |
| 005 | `005_partnership.sql` | ✅ Applied — partnership leads |
| 006 | `006_consent.sql` | ✅ Applied — marketing consent |
| 007 | `007_hive.sql` | ✅ Applied — hive columns live |

### Tables (9 core)

| Table | Purpose |
|---|---|
| `users` | Core CRM. `status` state machine, UTM params, A/B variant, hive fields (tier/status/started_at/cancelled_at/next_billing_date) |
| `identities` | Links anonymous `anon_id` cookies to identified users |
| `purchases` | One row per payment attempt. `cardcom_ref` UNIQUE. `is_recurring` for hive. Status: `pending → completed / failed / refunded` |
| `events` | Immutable event log — drives state machine + A/B counters |
| `experiments` | A/B test registry — atomic visitor/conversion counters |
| `jobs` | Outbox/job queue — processed by cron every 5 min |
| `email_sequences` | Drip email definitions — trigger_event, delay_hours, template_key |
| `email_logs` | One per sent email. UNIQUE `(user_id, sequence_id)` prevents doubles |
| `error_logs` | Server error log — visible in `/admin` |

**Key DB patterns:**
- All server-side DB access: `createServerClient()` from `lib/supabase/server.ts` (service-role key, bypasses RLS)
- Anon key never used — no client-side DB access
- Optimistic locking on jobs: `UPDATE WHERE status='pending'`

---

## User state machine

```
lead → engaged → high_intent → buyer → booked
```

| Event | Transition |
|---|---|
| `EMAIL_OPENED` / `LINK_CLICKED` | lead → engaged |
| `CHECKOUT_STARTED` | engaged → high_intent |
| `PURCHASE_COMPLETED` | high_intent → buyer |
| `CALL_BOOKED` | buyer → booked |

Special statuses (set directly, not via state machine): `premium_lead`, `partnership_lead`

Hive membership is tracked via separate `hive_status` column (`active` / `cancelled` / `expired`) — independent of main funnel status.

---

## Event types

| Event | Fired by | Purpose |
|---|---|---|
| `PAGE_VIEW` | `PageTracker` component | A/B visitor count |
| `USER_SIGNED_UP` | `/api/signup` | Triggers welcome sequence |
| `EMAIL_OPENED` | Email tracking pixel | State machine |
| `LINK_CLICKED` | Email CTA click | State machine |
| `CHECKOUT_STARTED` | CTAs + forms | Triggers cart-abandon sequence |
| `PURCHASE_COMPLETED` | Cardcom webhook | State machine → buyer |
| `CHALLENGE_PURCHASED` | Cardcom webhook | Triggers challenge sequence |
| `WORKSHOP_PURCHASED` | Cardcom webhook | Triggers workshop sequence |
| `COURSE_PURCHASED` | Cardcom webhook | Triggers course sequence |
| `CALL_BOOKED` | Manual / future | State machine → booked |
| `INACTIVE_3_DAYS` | Job runner | Triggers re-engagement email |
| `PREMIUM_LEAD` | `/api/premium-lead` | Sets status=premium_lead |
| `PARTNERSHIP_LEAD` | `/api/partnership-lead` | Sets status=partnership_lead |
| `HIVE_JOINED` | `/api/hive/join` | Triggers hive welcome sequence |
| `HIVE_CANCELLED` | `/api/hive/cancel` | Triggers hive cancellation email |

---

## Email sequences — 16 emails total

| Trigger event | Delay | Template key | Content |
|---|---|---|---|
| `USER_SIGNED_UP` | 0h | `welcome` | Welcome + free training link |
| `USER_SIGNED_UP` | 24h | `followup_24h` | Introduce challenge ₪197 |
| `CHALLENGE_PURCHASED` | 0h | `challenge_access` | Access details |
| `CHALLENGE_PURCHASED` | 168h | `challenge_upsell_workshop` | Day-7 upsell to workshop |
| `WORKSHOP_PURCHASED` | 0h | `workshop_confirmation` | Confirmation + Zoom |
| `WORKSHOP_PURCHASED` | 168h | `workshop_upsell_course` | Week-1 upsell to course |
| `COURSE_PURCHASED` | 0h | `course_access` | Course access details |
| `COURSE_PURCHASED` | 168h | `course_upsell_strategy` | Week-1 upsell to strategy |
| `CHECKOUT_STARTED` | 1h | `cart_abandon_1h` | "You left something behind" |
| `CHECKOUT_STARTED` | 24h | `cart_abandon_24h` | + coupon **HADAR10** (10% off) |
| `INACTIVE_3_DAYS` | 0h | `reengagement` | "We miss you" |
| `PREMIUM_LEAD` | 0h | `premium_lead_confirmation` | Confirmation |
| `PARTNERSHIP_LEAD` | 0h | `partnership_confirmation` | Confirmation |
| `HIVE_JOINED` | 0h | `hive_welcome` | Welcome to הכוורת + onboarding |
| `HIVE_JOINED` | 168h | `hive_day7` | Week-1 check-in |
| `HIVE_CANCELLED` | 0h | `hive_cancelled` | Cancellation confirmation + refund info |

All templates: `lib/email/templates.ts` → `TEMPLATES` map.

---

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/signup` | POST | Upsert user, fire `USER_SIGNED_UP`, enqueue welcome |
| `/api/events` | POST | Log event, run state machine, trigger sequences |
| `/api/cron/jobs` | GET | Process pending jobs (`CRON_SECRET` bearer) |
| `/api/checkout` | POST | Create Cardcom payment page (503 until credentials) |
| `/api/cardcom/webhook` | POST | Idempotent payment confirmation |
| `/api/book` | POST | Book session slot (strategy / premium / partnership). Returns `{ booking_id, user_id }` |
| `/api/premium-lead` | POST | Save premium lead (still used by `PartnershipBookingFlow` step 1 equivalent) |
| `/api/partnership-lead` | POST | Save partnership lead (step 1 of `PartnershipBookingFlow`) |
| `/api/user/credit` | GET | Fetch accumulated credit for email |
| `/api/hive/check` | POST | Check ₪29 tier eligibility (has completed purchase?) |
| `/api/hive/join` | POST | Join hive — sets hive fields, enqueues emails, stubs Cardcom recurring |
| `/api/hive/cancel` | POST | Cancel hive — sets cancelled_at, detects 14-day refund window |
| `/api/hive/status` | GET | Get hive status for email (used by /my) |

---

## Hive (הכוורת) — membership system

Two tiers:
- **₪97/month** — open to everyone (`basic_97`)
- **₪29/month** — existing customers only (`discounted_29`) — verified server-side via completed purchases

Join flow: click CTA → email check (₪29 only) → legal disclosure modal → consent checkbox (required) → submit → Cardcom recurring (stubbed until credentials)

**Cancellation:** Via `/my` page → "בטל מנוי כוורת" button → confirmation modal → `POST /api/hive/cancel`

**14-day refund window:** Auto-detected on cancellation. `refund_eligible: true` in cancellation email payload.

**Admin section:** "כוורת 🐝" section in `/admin` shows total active, tier breakdown, MRR, new this month, cancellations, early-cancel refund alerts, upcoming billing dates.

**DB migration 007:** Applied — hive columns live on `users` table.

---

## Job types

Processed by `lib/jobs/runner.ts` via `/api/cron/jobs`.

| Type | Handler | Payload |
|---|---|---|
| `SEND_EMAIL` | `lib/jobs/handlers/send-email.ts` | `{ user_id, email, name, sequence_id, subject, template_key, ...ctx }` |
| `NOTIFY_ADMIN` | `lib/jobs/handlers/notify-admin.ts` | `{ job_id, job_type, error, attempts }` |

Max 3 attempts. After 3 failures → `failed_permanently = true` + admin alert.

---

## A/B testing

- Variant assigned in `proxy.ts` (middleware) on first visit — stored in `ab_variant` cookie
- Current experiment: `landing_headline` (variants A and B)
- Content per variant: `lib/ab.ts` (`AB_CONTENT`)
- Visitor/conversion counts: `experiments` table via `increment_experiment` RPC

---

## Authentication & security

- **Admin:** Basic Auth in `proxy.ts` for `/admin/*`. `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars.
- **Members area:** Secret token `?t=` or `members_access` cookie vs `MEMBERS_SECRET` env var.
- **Cron:** `Authorization: Bearer <CRON_SECRET>`
- **Rate limiting:** In-memory sliding window (`lib/rate-limit.ts`). Signup: 5/min per IP. Events: 20/min per anon_id.
- **No client-side DB access** — anon Supabase key not exposed to browser.

---

## Environment variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # not used client-side — kept for SDK compat
SUPABASE_SERVICE_ROLE_KEY=        # all server DB access

# Resend
RESEND_API_KEY=                   # re_UKo76Jxb_...
RESEND_FROM=                      # onboarding@resend.dev (temporary)

# Cardcom (live — credentials set in Vercel)
CARDCOM_TERMINAL=                 # 143422
CARDCOM_API_NAME=                 # set in Vercel

# App
NEXT_PUBLIC_APP_URL=https://hadar-danan.vercel.app
NEXT_PUBLIC_PRICE_CHALLENGE=197
NEXT_PUBLIC_PRICE_WORKSHOP=1080
NEXT_PUBLIC_PRICE_CALL=4000

# Auth / secrets
ADMIN_USERNAME=
ADMIN_PASSWORD=
CRON_SECRET=
MEMBERS_SECRET=

# WhatsApp (live)
WHATSAPP_PHONE=972539566961       # set in Vercel
NEXT_PUBLIC_WHATSAPP_PHONE=972539566961  # set in Vercel
WHATSAPP_GROUP_URL=
```

---

## Deployment

- **Platform:** Vercel (Hobby plan)
- **Deploy command:** `npx vercel --prod` from project root
- **Always run:** `npx tsc --noEmit` before deploying
- **Vercel cron** (`vercel.json`): `0 22 * * *` — daily at 22:00 UTC
- **External cron:** cron-job.org hits `GET /api/cron/jobs` every 5 min with `Authorization: Bearer <CRON_SECRET>`

**Last deployed:** April 2026 — A/B testing activated with real variant content; UTM tracking fixed for quiz path; OG meta tags fixed; CRM user timeline humanized in Hebrew; admin abtesting page shows live experiments.

**Current status (April 2026):** Site fully live. Cardcom payments active (CARDCOM_TERMINAL=143422). WhatsApp active (972539566961). All DB migrations (001–008) applied. A/B test `landing_headline` running live with real variant content. Blockers remaining: real Resend domain, WhatsApp group URL for Hive welcome email, Hive Zoom link, course content page, WhatsApp API for cart abandonment.

---

## What's done ✅

- All landing pages fully designed and deployed: /, /about, /team, /challenge, /workshop, /course, /strategy, /premium, /partnership, /hive, /hive/terms
- Full Santosha dark palette applied site-wide — gold tokens: #E8B94A / #C9964A / #9E7C3A
- Homepage: fully dark (#080C14), Ladder+Netflix products section with per-card thumbnail images
- Hero: full-screen image overlay (hadar.png), CSS mask right fade, text floats right (desktop) / pinned at 52svh (mobile)
- Products section: 5-step zigzag ladder + premium 2-col grid + hive card; each card 420px, image fills card, text overlay at bottom
- Nav: logo-only (no bee image), DesktopNav dropdown for מסלולים, MobileNav drawer
- Font: Assistant only (Cormorant/DM Sans experiment fully reverted)
- TrueSignal© branding integrated site-wide (hero sections + all footers); always wrapped in `<span dir="ltr">`
- Complete backend: signup, events, job queue, 16 email sequences, admin dashboard
- **Cardcom payments LIVE** — LowProfile API, `POST` to `https://secure.cardcom.solutions/Interface/LowProfile.aspx` with URLSearchParams (not JSON). Fields: `TerminalNumber`, `UserName` (not ApiName), `SumToBill`, `SuccessRedirectUrl`, `ErrorRedirectUrl`, `IndicatorUrl`. Response is text/URLSearchParams — parse `ResponseCode` ("0"=success) + `LowProfileCode`
- A/B testing infrastructure
- Anonymous identity tracking
- Members gated area
- Privacy policy + Terms of service + Hive terms (/hive/terms)
- /thank-you page with challenge upsell
- External cron via cron-job.org (5 min)
- /course digital product with full checkout flow
- /quiz diagnostic flow — scoring via SCORES matrix (not RESULT_MAP)
- **Quiz/session persistence** — `lib/quiz-session.ts` exports `getSessionUser()` + `saveUserDetails()`. Any product page reads from localStorage (quiz session or direct signup). All CTAs pre-fill forms and bypass re-registration if user is known.
- **`lib/products.ts`** — single source of truth for product config, prices, and scheduled dates (`CHALLENGE_DATES`, `WORKSHOP_DATES`, `PRODUCT_MAP`). Import from here — never hardcode prices.
- **Booking + payment flow — fully integrated (no Calendly):**
  - `/strategy/book` — `StrategyBookFlow`: BookingForm (date/time) → `/api/book` → Cardcom ₪4,000 → `/strategy/success`. Guarantee: "לא פיצחנו בפגישה הראשונה? פגישה נוספת עלינו"
  - `/premium` — `PremiumBookingFlow`: BookingForm (filming day) → `/api/book` → Cardcom ₪14,000 → `/premium/success`
  - `/partnership` — `PartnershipBookingFlow`: lead form → `/api/partnership-lead` → BookingForm (discovery call) → success (no payment)
  - `/challenge` — `NextChallengeBadge`: dynamic countdown to next date from `CHALLENGE_DATES`
  - `/workshop` — `NextWorkshopBadge`: dynamic countdown from `WORKSHOP_DATES`
- **`BookingForm` (`app/strategy/book/BookingForm.tsx`)** — supports `onSuccess` callback (returns `{ bookingId, userId, date, time }`) and `initialForm` prop for pre-fill. Used by strategy, premium, and partnership flows.
- **`/api/book`** — returns `user_id` in response (needed for downstream Cardcom checkout)
- **Calendly** — fully removed from all user-facing pages. Legacy code remains in `app/admin/bookings/` and `lib/admin/queries.ts` (dead code, harmless, keep for now).
- /strategy/book calendar booking
- Israeli accessibility compliance: floating widget (bottom-left, blue #2F80ED, 56×56px, borderRadius 14px), WCAG 2.1 AA, skip link, /accessibility page
- הכוורת (Hive) monthly membership: full join flow, 2-tier pricing, eligibility check, legal disclosure, cancellation via /my, admin section
- All footers include: TrueSignal© microcopy + תנאי מנוי הכוורת link
- **Shared SuccessPage component** (`components/SuccessPage.tsx`) — used by /challenge/success, /workshop/success, /course/success, /strategy/success, /test/success
- **ProductsSection component** (`components/ProductsSection.tsx`) — used by homepage + /training/watch (with `excludeTraining` prop)
- **/training/watch** — free training watch page, Vimeo embed (VIMEO_ID_PLACEHOLDER), PageViewTracker, ProductsSection without step 1
- **/test** — ₪1 test product for Cardcom testing; subtle footer link from /challenge; product_type `test_1` in DB
- **DB migration 008** — added `course_1800`, `premium_14000`, `test_1` to `product_type` enum
- **Stats section** — homepage social proof strip ("250+ עסקים", "4 שנים", "97% ממליצים") with gold animated counters, positioned between hero and products
- **Quiz spacing** — improved padding and visual hierarchy in `/quiz` flow; result card layout fixed
- **Hero brightness** — homepage hero image overlay opacity tuned; text legibility improved on mobile
- **Bee Good logo** — nav logo is text-based "הדר דנן" (no bee image). Nav: `DesktopNav` + `MobileNav`, logo-only, no external image dependency
- **Vimeo CC** — training watch page (`/training/watch`) embeds Vimeo with `?cc=1` param for closed captions
- **/training/watch** — free training watch page with Vimeo embed, PageViewTracker, ProductsSection (excludeTraining=true)
- **Product card contrast** — gradient overlay on product cards deepened for better text readability over images
- **Section headers** — "המסלולים שלנו" and premium section headers styled with gold accent + consistent spacing
- **PREMIUM badge** — gold "PREMIUM" label on premium product cards in ProductsSection
- **Accessibility button restyle** — floating widget bottom-left, blue `#2F80ED`, `56×56px`, `borderRadius: 14px`, "נגישות" label; replaced old style
- **OG image** — static `/public/og-image.jpg` (1200×630) used as the OG image. No dynamic route.
- **OG meta tags fixed** — removed page-level `openGraph` block from `app/page.tsx` that was silently overriding (and dropping) the layout-level `og:image`. Now `app/layout.tsx` is the single source of OG metadata for homepage.
- **A/B testing activated** — `app/page.tsx` hero now renders `AB_CONTENT[variant]` for headline, description, and CTA. Both mobile and desktop sections use variant content. `lib/ab.ts` has meaningful content differences (variant A: "השיווק שלך לא נכשל בגלל הסרטונים"; variant B: "תוכן שמוכר מגיע מבהירות").
- **Admin A/B page shows live tests** — `/admin/abtesting` fetches both `experiments` table (live counters) and `ab_proposals` (AI proposals). `LiveTestCard` shows actual variant text, CVR, uplift, and Bayesian confidence.
- **UTM tracking fixed** — `QuizClient.handleLeadSubmit` now reads UTM cookies (`utm_source`, `utm_campaign`, `utm_adset`, `utm_ad`, `fbclid`, `gclid`) and includes them in the signup POST. Previously the quiz path (primary paid traffic flow) silently dropped all UTM data.
- **CRM user timeline humanized** — `/admin/users/[id]` event timeline shows Hebrew icons + readable descriptions instead of raw event type codes and JSON metadata. Event types map to Hebrew titles with context-aware detail lines.

## What's pending ⏳

| Item | Blocker | How to activate |
|---|---|---|
| ~~DB migration 007~~ | ✅ Done | Applied March 2026 |
| ~~WhatsApp CTAs~~ | ✅ Done | `WHATSAPP_PHONE=972539566961` set in Vercel |
| Real email domain | DNS verification on Resend | Add DNS TXT/MX records, update `RESEND_FROM` |
| ~~Cardcom payments~~ | ✅ Done | `CARDCOM_TERMINAL=143422` + `CARDCOM_API_NAME` set in Vercel |
| Cardcom recurring (Hive) | Need Cardcom recurring setup | Configure recurring billing once standard payments confirmed |
| WhatsApp group link for Hive | Need group URL | Update placeholder in hive_welcome email template |
| Hive Zoom link | Content | Update placeholder in hive_welcome email template |
| Course content page | Content production | Replace `app/course/content/page.tsx` placeholder with real lesson links |
| Hive AI matching system | Future feature | Designed as "בקרוב" placeholder on /hive page |
| WhatsApp API for cart abandonment | Provider selection needed | Choose from: Twilio, Green API, Infobip, or Meta direct. Connect to `CHECKOUT_STARTED` event sequence. |

---

## CRM System

Admin dashboard at `/admin` and individual user profiles at `/admin/users/[id]`.

**Admin dashboard sections:**
- Overview stats: total users, buyers, revenue, conversion rate
- User table: filterable by status, sortable, search by name/email
- A/B testing: `/admin/abtesting` — live experiments + AI proposals
- Hive section: active members, tier breakdown, MRR, refund alerts
- Error logs: recent server errors from `error_logs` table

**User profile (`/admin/users/[id]`):**
- Header: name, email, status badge, UTM source, A/B variant, signup date
- Purchase history table with amounts and status
- Event timeline — **human-readable Hebrew** with icons, translated page names, contextual details
  - `PAGE_VIEW` → "👁️ צפה/ת בעמוד: [שם עמוד בעברית]"
  - `USER_SIGNED_UP` → "🎉 נרשם/ה לאתר"
  - `PURCHASE_COMPLETED` → "✅ רכישה הושלמה" (green highlight)
  - `CALL_BOOKED` → "📅 שיחה נקבעה" (gold highlight)
  - `CHECKOUT_STARTED` → "🛒 התחיל/ה תהליך רכישה"
  - `EMAIL_OPENED` / `LINK_CLICKED` → engagement events with subject/URL detail
- `PAGE_LABELS` map in `app/admin/users/[id]/page.tsx` translates URL paths to Hebrew names
- `relativeTime()` returns "עכשיו", "לפני X דקות", "אתמול", or absolute date

**Key queries:** `lib/admin/queries.ts` — `getUser()`, `getUserEvents()`, `getUserPurchases()`, `getABTests()`

---

## A/B Testing — Current Status

**Active experiment:** `landing_headline` — homepage hero headline, description, and CTA button text.

| | Variant A | Variant B |
|---|---|---|
| Headline | "השיווק שלך לא נכשל בגלל הסרטונים" | "תוכן שמוכר מגיע מבהירות - לא מעוד סרטונים" |
| Description | "אנחנו עוזרים לעסקים לאתר איפה הם חזקים באמת..." | "250+ עסקים כבר גילו מה באמת מייחד אותם..." |
| CTA | "איפה אתה נמצא עכשיו? ←" | "גלה את הבהירות שלך ←" |

**How it works:**
1. `proxy.ts` assigns variant on first visit → `ab_variant` cookie (30 days)
2. `app/page.tsx` reads cookie server-side via `cookies()` → `parseVariant()`
3. `AB_CONTENT[variant]` renders in both mobile and desktop hero sections
4. `PageTracker` fires `PAGE_VIEW` → `increment_experiment` RPC increments visitor count
5. `USER_SIGNED_UP` event → increments conversion count

**Files:** `lib/ab.ts` (content + types), `app/page.tsx` (rendering), `lib/admin/ab-agent.ts` (Bayesian stats), `app/admin/abtesting/` (admin UI)

**Admin UI:** `/admin/abtesting` shows two tabs — "ניסויים פעילים" (live + proposals) and "ניסויים מוצעים". Live tests show real variant text, CVR per variant, uplift %, and Bayesian confidence meter.

**Note:** Reset experiment counters in Supabase SQL Editor after activating real variant content:
```sql
UPDATE experiments SET visitors_a=0, visitors_b=0, conversions_a=0, conversions_b=0 WHERE name='landing_headline';
```

---

## Homepage — key sections

### Hero
- **Mobile:** `height: 100svh`, content `position: absolute, top: 52svh`, full-width CTA button
- **Desktop:** plain `<img src="/hadar.png">` positioned left with CSS mask (`-webkit-mask-image: linear-gradient(to right, black 55%, transparent 100%)`); text panel `position: absolute, right: 0, top: 50%, width: 45%`; top gradient overlay blends into navbar

### Products — Ladder+Netflix
Vertical zigzag layout, cards alternate right/left. All cards: `height: 420px`, `position: relative`, `overflow: hidden`. Image fills card (`position: absolute, inset: 0`), gradient overlay from bottom (`linear-gradient(to top, rgba(10,14,24,1) 0%, … transparent 78%)`), text body `position: absolute, bottom: 0`.

| Step | Product | Image | Card side |
|---|---|---|---|
| 1 | הדרכה חינמית | `/hadarlesson.png` | RIGHT |
| 2 | אתגר 7 ימים | `/etgar.png` | LEFT |
| 3 | סדנה יום אחד | `/sadna.png` | RIGHT |
| 4 | קורס דיגיטלי | `/course.png` | LEFT |
| 5 | פגישת אסטרטגיה | `/strategy.png` | RIGHT |
| P1 | יום צילום פרמיום | `/shooting.png` | 2-col grid |
| P2 | שותפות אסטרטגית | `/hadar.png` | 2-col grid |
| H | הכוורת | `/hadar.png` | Wide centered |

CSS classes used: `.nf-row`, `.nf-node`, `.nf-node-gold`, `.nf-card`, `.nf-connector`, `.nf-empty`, `.nf-premium-grid` — all defined in inline `<style>` block at bottom of homepage section.

---

## Coding conventions

**Always:**
- Use Hebrew for all user-facing text — buttons, labels, error messages, email content
- Add `dir="rtl"` on page wrappers or root element
- Use `font-assistant` class on page wrappers
- Apply Santosha palette (dark bg, gold CTAs) — no new color schemes
- Fire the relevant event to `/api/events` whenever a user takes an action
- Log errors to `error_logs` table in every `catch` block in API routes
- Use `createServerClient()` for all DB access — never the anon client

**Never:**
- Use English text in the UI
- Access Supabase from client-side components (no `createBrowserClient`)
- Skip error logging in API routes
- Use `--no-verify` or bypass TypeScript checks before deploying
- Commit `.env.local` or any file with secrets
- Introduce new fonts (Assistant only)
- Introduce new color palettes (Santosha only)

**Email templates:**
- Add new templates to `lib/email/templates.ts` and register in `TEMPLATES` map
- New sequence rows go in a migration file under `supabase/migrations/`
- Always verify `renderTemplate(key, ctx)` returns non-null before assuming key exists

**Database migrations:**
- Never modify `schema.sql` after initial setup — create numbered migration files
- Pattern: `supabase/migrations/NNN_description.sql`
- Run manually in Supabase SQL Editor (no migration runner configured)

**OG images:**
- Always use static files from `/public/` — never dynamic `opengraph-image.tsx` routes
- OG metadata lives exclusively in `app/layout.tsx` — do NOT add `openGraph` blocks to individual `page.tsx` files unless you also include the `images` field, or `og:image` will be silently dropped (Next.js page-level openGraph replaces, not merges, the layout-level one)
- Current OG image: `https://hadar-danan.vercel.app/og-image.jpg` (1200×630, static in `/public/og-image.jpg`)

**UTM tracking:**
- Every signup path must read UTM cookies and include them in the POST body to `/api/signup`
- Affected components: `SignupForm`, `QuizClient` (`handleLeadSubmit`), any future lead capture form
- UTM keys to capture: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_adset`, `utm_ad`, `fbclid`, `gclid`
- Read via `document.cookie` parsing (helper: `getCookie(key)`) — cookies are set by `proxy.ts` on first page load
- Map `fbclid`/`gclid` → `click_id` field in signup payload
