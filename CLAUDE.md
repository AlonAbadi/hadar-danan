# Hebrew Marketing OS — הדר דנן בע״מ

## Project overview

Full-stack automated sales funnel for Hadar Danan Ltd. Collects leads via a free training signup, nurtures them through a value ladder with automated Hebrew email sequences, and converts them to paid products. Includes a monthly membership community ("הכוורת") and a full Supabase Auth system with Google OAuth.

**Live site:** https://www.beegood.online
**Supabase project:** `rufzcpwzolitoqqhdmrx`
**Admin dashboard:** https://www.beegood.online/admin (Basic Auth — see env vars)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Email | Resend (`noreply@beegood.online` — **LIVE**, domain verified, DNS in Vercel) |
| Payments | Cardcom LowProfile API (**live** — credentials set in Vercel) |
| Deployment | Vercel (Hobby plan — GitHub auto-deploy on push) |
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

**Nav logo:** Text-only "הדר דנן" — no bee image, no external image file. Styled with gold gradient on hover. `DesktopNavServer` + `DesktopNav` and `MobileNavServer` + `MobileNav` components. Nav shows logged-in user's first name in a hollow gold capsule (server-rendered auth state).

**Stats section (homepage):** Social proof strip between hero and products. Three counters: "250+ עסקים", "4 שנים", "97% ממליצים". Gold animated numbers, muted label text. Background: `#080C14`. Do not add more stats without user approval.

**Accessibility button:** Floating bottom-left, background `#2F80ED` (blue — accessibility convention, not brand gold), `width: 56px, height: 56px, borderRadius: 14px`. Label "נגישות". Defined in `components/AccessibilityWidget.tsx`.

**TrueSignal© branding:** A proprietary method name added site-wide. Rules:
- Symbol: © (not ™)
- Position: always **suffix** — `TrueSignal©` (never `©TrueSignal`)
- Use `TrueSignal©` on first mention per page only
- Appears max 1-2 times per page
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
| `/about` | About page | - | Static |
| `/team` | Team page | - | Static |
| `/training` | Free training | Free | Lead magnet, SignupForm |
| `/training/watch` | Free training video | Free | Vimeo embed, ProductsSection (excludeTraining) |
| `/challenge` | 7-day video challenge | ₪197 | WhatsApp CTA (`ChallengeCTA`) |
| `/challenge/content` | Challenge video content | - | Auth-gated, `ChallengePlayer` |
| `/workshop` | 1-day workshop | ₪1,080 | WhatsApp CTA (`WorkshopCTA`) |
| `/course` | Digital course — 16 lessons | ₪1,800 | Cardcom checkout (`CourseCTA`) |
| `/course/content` | Course video player | - | Auth-gated, `CoursePlayer` — 8 modules, 16 lessons |
| `/strategy` | Strategy session (90 min) | ₪4,000 | Info page — CTA links to `/strategy/book` |
| `/strategy/book` | Full booking + payment flow | ₪4,000 | 2-step: BookingForm → Cardcom (`StrategyBookFlow`) |
| `/strategy/success` | Post-payment confirmation | - | Payment confirmed, Zoom link sent within 24h |
| `/premium` | Premium shoot day — 16 videos | ₪14,000 | 2-step: BookingForm → Cardcom (`PremiumBookingFlow`) |
| `/premium/success` | Post-premium-payment | - | Shared `SuccessPage` component |
| `/partnership` | Strategic partnership retainer | ₪10k-30k/mo | 2-step: lead form → BookingForm discovery call (`PartnershipBookingFlow`) |
| `/hive` | הכוורת — monthly membership community | ₪29-₪97/mo | `HivePricingSection` client component |
| `/hive/members` | Hive members area | - | Auth + hive_status=active gated, `HiveMembersClient` |
| `/hive/terms` | Hive membership legal terms | - | Static, full Hebrew legal text |
| `/quiz` | 3-question diagnostic quiz | - | Routes user to right product, saves to `quiz_results` |
| `/account` | Personal area | - | Auth-gated — purchases, hive status |
| `/account/redeem` | Credit redemption | - | ~~Credit system removed — page unused~~ |
| `/my` | Legacy personal area redirect | - | Redirects to `/account` |
| `/login` | Login page | - | Email/password + Google OAuth |
| `/signup` | Signup page | - | Email/password + Google OAuth |
| `/forgot-password` | Password reset request | - | Sends reset email via Supabase Auth |
| `/reset-password` | New password entry | - | Handles Supabase Auth reset token |
| `/auth/callback` | OAuth callback | - | Supabase Auth callback handler |
| `/thank-you` | Post-signup page | - | Upsell to `/challenge` |
| `/challenge/success` | Post-challenge-purchase | - | Upsell to `/workshop` |
| `/workshop/success` | Post-workshop-purchase | - | Upsell to `/course` |
| `/course/success` | Post-course-purchase | - | - |
| `/members` | Legacy members area | - | Secret token gate (`?t=` or cookie) — kept for backward compat |
| `/atelier` | Atelier influencer program | - | Lead capture for influencer-to-cultural-leader service; form saves to `atelier_applications` with UTM |
| `/binge` | Content binge page | - | Video/content series page |
| `/method` | TrueSignal method page | - | Explains TrueSignal© methodology |
| `/press` | Press page | - | Media / press kit |
| `/onboarding` | Client onboarding | - | Token-gated onboarding form for atelier clients |
| `/unsubscribe` | Email unsubscribe | - | Unsubscribe from email sequences |
| `/admin` | CRM dashboard | - | Basic Auth, full analytics + hive section |
| `/admin/users/[id]` | Individual user profile | - | Notes, reminders, event timeline, TrueSignal AI diagnosis |
| `/admin/atelier` | Atelier leads CRM | - | Cards with fit-score, UTM chips, status filter; links to `/admin/atelier/[id]` |
| `/admin/atelier/[id]` | Atelier onboarding workbench | - | AI analysis, content generation, ProjectManagerAgent orchestrator, deploy pipeline |
| `/admin/acquisition` | UTM acquisition analytics | - | Full utm_source → utm_medium → utm_campaign → utm_adset → utm_ad breakdown |
| `/admin/email` | Email stats | - | Send/open/click stats from `email_logs` |
| `/admin/funnel` | Funnel analytics | - | Conversion funnel visualization |
| `/admin/leads` | Leads table | - | Filterable leads list with UTM columns |
| `/admin/deals` | Deals CRM | - | Brand deals tracking from `deals` table |
| `/admin/sales` | Sales / revenue | - | Revenue bar chart |
| `/admin/products` | Products analytics | - | Per-product performance |
| `/admin/video` | Video analytics | - | Drop-off + completion stats from `video_events` |
| `/admin/training` | Training stats | - | Free training page analytics |
| `/admin/community` | Community (Hive) admin | - | Hive membership analytics (pie charts) |
| `/admin/crm` | CRM overview | - | UTM + status breakdown |
| `/admin/mmm` | MMM (Media Mix Modeling) | - | Channel attribution modeling |
| `/admin/system` | System logs | - | Error logs, cron status |
| `/admin/bookings` | Bookings (legacy Calendly) | - | Dead code — kept, not actively used |
| `/test` | ₪1 test product | ₪1 | Cardcom testing; subtle footer link from /challenge |
| `/accessibility` | Accessibility statement | - | Static, Hebrew WCAG 2.1 AA |
| `/privacy` | Privacy policy | - | Updated April 2026 — full content |
| `/terms` | General terms of service | - | Updated April 2026 — full content |
| `/call` | Strategy call redirect | - | Redirects to `/strategy` |

---

## Database — migrations applied

| Migration | File | Status |
|---|---|---|
| 001 | `schema.sql` | Applied — core tables |
| 002 | `002_email_sequences.sql` | Applied — email automation |
| 003 | `003_bookings.sql` | Applied — strategy booking |
| 004 | `004_course.sql` | Applied — course product |
| 005 | `005_partnership.sql` | Applied — partnership leads |
| 006 | `006_consent.sql` | Applied — marketing consent |
| 007 | `007_hive.sql` | Applied — hive columns on users |
| 008 | `008_product_enum.sql` | Applied — course_1800, premium_14000, test_1 added to enum |
| 009 | `009_video_analytics.sql` | Applied — video_events table |
| 010 | `010_ab_proposals.sql` | Applied — ab_proposals table + seed data |
| 011 | `011_video_events.sql` | Applied — video_events safe re-create with full indexes |
| 012 | `012_quiz_results.sql` | Applied — quiz_results table |
| 013 | `013_crm.sql` | Applied — notes, reminders tables; last_activity_at on users |
| 014 | `014_auth.sql` | Applied — auth_id + email_verified on users; RLS policies |
| 015 | `015_hive_content.sql` | Applied — hive_content table (tier-gated curated content) |
| 016 | `016_amount_paid.sql` | Applied — amount_paid column on purchases |
| 017a | `017_user_insights.sql` | Applied — user_insights table for TrueSignal AI diagnosis caching |
| 017b | `017_remove_cart_abandon.sql` | Applied — removed cart_abandon email sequences |
| 018 | `018_invoice_number.sql` | Applied — invoice_number column on purchases |
| 019 | `019_invoice_link.sql` | Applied — invoice_link (PDF URL) column on purchases |
| 020 | `020_atelier_applications.sql` | Applied — atelier_applications table with source_utm JSONB |
| 021 | `021_atelier_onboarding.sql` | Applied — onboarding fields on atelier_applications (niche, audience, tone, products…) |
| 022 | `022_atelier_modules.sql` | Applied — modules text[] on atelier_applications |
| 023 | `023_atelier_onboarding_token.sql` | Applied — email + onboarding_token for client self-fill flow |
| 024 | `024_deals.sql` | Applied — deals table for brand deals CRM |
| 025 | `025_atelier_deploy.sql` | Applied — preview_url + deploy metadata on atelier_applications |
| 026 | `026_atelier_og_image.sql` | Applied — og_image_url on atelier_applications |
| 027 | `027_orchestration.sql` | Applied — pipeline_status, generated_client_ts, orchestration_log on atelier_applications |
| 028 | `028_user_status_archive.sql` | Applied — `handled` + `not_relevant` values added to user_status enum |
| 029 | `029_utm_extended.sql` | Applied — utm_medium, utm_content, utm_term columns on users |
| 030 | `030_whatsapp_logs.sql` | **Run in Supabase** — whatsapp_logs table for dedup |

### Tables (20 total)

| Table | Purpose |
|---|---|
| `users` | Core CRM. `status` state machine (`lead/engaged/high_intent/buyer/booked/handled/not_relevant`), UTM params (source/medium/campaign/adset/ad/content/term), A/B variant, hive fields, `auth_id` (FK to auth.users), `email_verified`, `last_activity_at` |
| `identities` | Links anonymous `anon_id` cookies to identified users |
| `purchases` | One row per payment attempt. `cardcom_ref` UNIQUE. `is_recurring` for hive. `amount_paid` for actual amount. `invoice_number` + `invoice_link` from Cardcom. Status: `pending → completed / failed / refunded` |
| `events` | Immutable event log — drives state machine + A/B counters |
| `experiments` | A/B test registry — atomic visitor/conversion counters |
| `jobs` | Outbox/job queue — processed by cron every 5 min |
| `email_sequences` | Drip email definitions — trigger_event, delay_hours, template_key |
| `email_logs` | One per sent email. UNIQUE `(user_id, sequence_id)` prevents doubles. status: sent/opened (updated on first CTA click) |
| `error_logs` | Server error log — visible in `/admin/system` |
| `video_events` | Vimeo video analytics — watch_progress, drop_off, completed events per video_id |
| `ab_proposals` | AI-generated A/B test proposals — category, hypothesis, variants, status, live counters |
| `quiz_results` | Quiz answers + scores + recommended product per session/user |
| `notes` | CRM admin notes on users — author, content, created_at |
| `reminders` | CRM task reminders — assigned_to, due_at, completed_at |
| `hive_content` | Curated content for hive members — tier_required (starter/pro/elite), content_type (article/pdf/video) |
| `user_insights` | TrueSignal AI diagnosis cache per user — avoids re-calling Claude API on every `/admin/users/[id]` load |
| `atelier_applications` | Atelier lead applications — full onboarding pipeline state: `status` (lead funnel), `pipeline_status` (site creation), `source_utm` JSONB, AI analysis, generated content, deploy metadata |
| `deals` | Brand deals CRM — brand_name, logo, category, deal value, status |

**Key DB patterns:**
- All server-side DB access: `createServerClient()` from `lib/supabase/server.ts` (service-role key, bypasses RLS)
- Auth pages only (`/login`, `/signup`, `/forgot-password`, `/reset-password`): use `createBrowserClient()` from `lib/supabase/browser.ts` for session management — this is the only exception
- Optimistic locking on jobs: `UPDATE WHERE status='pending'`
- RLS enabled on `users` and `purchases` tables (migration 014) — users can read/update their own rows via `auth_id = auth.uid()`

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

Special statuses (set directly, not via state machine): `premium_lead`, `partnership_lead`, `handled`, `not_relevant`

Hive membership is tracked via separate `hive_status` column (`active` / `cancelled` / `expired`) — independent of main funnel status.

---

## Event types

| Event | Fired by | Purpose |
|---|---|---|
| `PAGE_VIEW` | `PageTracker` component | A/B visitor count |
| `USER_SIGNED_UP` | `/api/signup` | Triggers welcome sequence |
| `EMAIL_OPENED` | Email CTA click (click implies open — no pixel) | State machine |
| `LINK_CLICKED` | Email CTA click via `/api/email/click` tracker | State machine |
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

All templates: `lib/email/templates.ts` → `TEMPLATES` map. Style: Ben Settle (short `<p>` lines, personal voice, signed "צוות beegood"). No "השב על המייל הזה" — all reply CTAs link to WhatsApp (`wa.me/972539566961`).

**Click tracking:** All CTA `href` links in sent emails are wrapped through `/api/email/click?uid=&sid=&url=` by `lib/jobs/handlers/send-email.ts`. On first click: updates `email_logs.status` to `opened` + fires `EMAIL_OPENED` event. Always fires `LINK_CLICKED` event. Excluded from wrapping: `/unsubscribe`, `wa.me`, `mailto:`. Pixel tracking NOT used (emails are text-only — Apple Mail Privacy Protection pre-fetches pixels).

---

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/signup` | POST | Upsert user, fire `USER_SIGNED_UP`, enqueue welcome |
| `/api/events` | POST | Log event, run state machine, trigger sequences |
| `/api/cron/jobs` | GET | Process pending jobs (`CRON_SECRET` bearer) |
| `/api/checkout` | POST | Create Cardcom payment page |
| `/api/cardcom/webhook` | POST | Idempotent payment confirmation |
| `/api/book` | POST | Book session slot (strategy / premium / partnership). Returns `{ booking_id, user_id }` |
| `/api/premium-lead` | POST | Save premium lead |
| `/api/partnership-lead` | POST | Save partnership lead (step 1 of `PartnershipBookingFlow`) |
| `/api/user/credit` | GET | ~~Fetch accumulated credit for email~~ — credit system removed, endpoint unused |
| `/api/hive/check` | POST | Check ₪29 tier eligibility (has completed purchase?) |
| `/api/hive/join` | POST | Join hive — sets hive fields, enqueues emails, stubs Cardcom recurring |
| `/api/hive/cancel` | POST | Cancel hive — sets cancelled_at, detects 14-day refund window |
| `/api/hive/status` | GET | Get hive status for email |
| `/api/video-event` | POST | Record Vimeo video analytics event into `video_events` |
| `/api/quiz-result` | POST | Save quiz answers + scores + recommendation into `quiz_results` |
| `/api/quiz-result` | PATCH | Update existing quiz_result row with user_id after lead form submit |
| `/api/user/update-profile` | POST | Partial-update user profile — only fields present in body are updated (name / phone / marketing_consent + consent_at) |
| `/api/purchases/[id]/cancel` | POST | Cancel a pending purchase (sets status=failed). Auth-gated — ownership verified against public.users.id |
| `/api/auth/*` | - | Handled by Supabase Auth (callback at `/auth/callback`) |

---

## Hive (הכוורת) — membership system

Three tiers (stored in `hive_tier` column):
- **`discounted_29`** — ₪29/mo — existing customers only (Starter label)
- **`basic_97`** — ₪97/mo — open to everyone (Pro label)
- **`elite`** — ₪197/mo — premium tier (Elite label)

Public-facing pricing page (`/hive`) shows two price options: ₪29 (for existing customers) and ₪97 (everyone).

Join flow: click CTA → email check (₪29 only) → legal disclosure modal → consent checkbox (required) → submit → Cardcom recurring (stubbed until credentials)

**Members area:** `/hive/members` — gated by Supabase Auth session + `hive_status=active`. Shows tier-appropriate content from `hive_content` table. `HiveMembersClient` handles tier display and upgrade prompts.

**Cancellation:** Via `/account` page → "בטל מנוי כוורת" button → confirmation modal → `POST /api/hive/cancel`

**14-day refund window:** Auto-detected on cancellation. `refund_eligible: true` in cancellation email payload.

**Admin section:** "כוורת" section in `/admin` shows total active, tier breakdown, MRR, new this month, cancellations, early-cancel refund alerts, upcoming billing dates.

**Hive content:** Curated articles/PDFs/videos in `hive_content` table — `tier_required` field controls access (starter = all tiers, pro = pro+elite, elite = elite only).

---

## Auth system — Supabase Auth (April 2026)

Full authentication system using Supabase Auth with email/password and Google OAuth.

**Pages:** `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`

**Flow:**
1. User signs in via `/login` or `/signup` (email/password or Google)
2. Supabase creates an `auth.users` record
3. `lib/auth/link-user.ts` links the auth user to the `public.users` row via `auth_id`
4. Session stored in cookies via `@supabase/ssr`
5. Nav (DesktopNavServer/MobileNavServer) reads session server-side and shows user first name in a hollow gold capsule

**Server components reading auth state:**
- `DesktopNavServer` (`components/DesktopNavServer.tsx`) — reads session, passes `userInitial` to client `DesktopNav`
- `MobileNavServer` (`components/MobileNavServer.tsx`) — same pattern

**Auth-gated pages** use this pattern:
```ts
const supabase = createSSRClient(URL, ANON_KEY, { cookies: { getAll, setAll } });
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");
```

**IMPORTANT:** Auth pages use `createBrowserClient()` from `lib/supabase/browser.ts` (anon key) — this is the ONLY exception to the "no client-side DB" rule. All data queries still use `createServerClient()` (service-role).

**Google OAuth & Domain Verification:**
- Domain `beegood.online` verified in Google Search Console via TXT record in Vercel DNS
- TXT value: `google-site-verification=HSet3dAP698p3AYskyPH__2yb1H3zNNKqlcczjn8dqI`
- CRITICAL: DO NOT delete this TXT record — breaks both Search Console and Google OAuth
- DNS is managed in Vercel, NOT in Hover (Hover shows third-party nameservers warning — expected)
- OAuth app name: `הדר דנן` (matches site title / og:site_name)
- OAuth logo: clean bee icon, no text
- Authorized domains: `beegood.online` + Supabase project URL
- After domain verification passes, MUST publish app to production (OAuth consent screen > Publish App) or only test users can sign in
- Known issue: automated branding check may false-positive on "app name mismatch" even when name matches — wait or request manual review

---

## CRITICAL: Two distinct user IDs

**This is the most common source of bugs in this codebase.** There are two separate UUIDs for a user:

| ID | Where | How to access | Used for |
|---|---|---|---|
| `auth.users.id` | Supabase Auth schema | `user.id` (from `supabase.auth.getUser()`) | Auth/session verification only |
| `public.users.id` | Public users table | `userData.id` (from DB query on `users` table) | All FK references — `purchases.user_id`, `events.user_id`, `bookings.user_id`, etc. |

**Rule:** Always use `userData.id` (public UUID) for any DB operation. The `authUser.id` is only for verifying who is logged in.

**Example of the bug:** Passing `authUser.id` as `user_id` to `/api/checkout` causes a FK violation because `purchases.user_id` references `public.users.id`, not `auth.users.id`.

**How `auth_id` links them:** The `users` table has an `auth_id` column (FK → `auth.users.id`). To get `userData`, always query: `.from("users").eq("auth_id", user.id)`. The result's `.id` field is the `public.users.id`.

---

## Email sending — beegood.online (April 2026)

Transactional email is sent via Resend from `noreply@beegood.online`. This is a send-only address — no inbox.

**DNS records (configured in Vercel DNS, NOT Hover):**
- MX record: `feedback-smtp.us-east-1.amazonses.com` (priority 10) — required by Resend
- SPF TXT: `v=spf1 include:amazonses.com ~all`
- DKIM CNAME: Resend-provided CNAME records (3 entries)
- DMARC TXT: `v=DMARC1; p=none; rua=mailto:noreply@beegood.online`

**CRITICAL: Do NOT delete these DNS records** — will break email delivery for all users.

**Resend configuration:** Domain `beegood.online` verified in Resend dashboard. Sender: `הדר דנן <noreply@beegood.online>`. `NEXT_PUBLIC_FROM_EMAIL=noreply@beegood.online` set in Vercel environment variables.

---

## Credit system

**REMOVED (April 2026).** The credit system has been fully disabled. Customers are always charged the full list price. `lib/credit.ts` and `/api/user/credit` still exist in the codebase but are no longer called from any product page or checkout route. `PERMANENT_DISCOUNTS` map removed from `/api/checkout`. `AbandonCheckoutPopup` removed from all product pages. Do not re-introduce discounts without explicit instruction.

---

## Job types

Processed by `lib/jobs/runner.ts` via `/api/cron/jobs`.

| Type | Handler | Payload |
|---|---|---|
| `SEND_EMAIL` | `lib/jobs/handlers/send-email.ts` | `{ user_id, email, name, sequence_id, subject, template_key, ...ctx }` |
| `NOTIFY_ADMIN` | `lib/jobs/handlers/notify-admin.ts` | `{ job_id, job_type, error, attempts }` |

Max 3 attempts. After 3 failures → `failed_permanently = true` + admin alert.

---

## Video analytics

Vimeo player fires events to `/api/video-event` → stored in `video_events` table.

Event types: `watch_progress` (with `percent_watched`), `drop_off` (with `drop_off_second`), `completed`

Used on: `/training/watch`, `/course/content` (CoursePlayer), `/challenge/content` (ChallengePlayer)

Admin can view per-video completion rates and drop-off points in user profile timeline.

---

## A/B testing

- Variant assigned in `proxy.ts` (middleware) on first visit — stored in `ab_variant` cookie
- Current experiment: `landing_headline` (variants A and B)
- Content per variant: `lib/ab.ts` (`AB_CONTENT`)
- Visitor/conversion counts: `experiments` table via `increment_experiment` RPC
- AI proposals stored in `ab_proposals` table (seeded in migration 010)

---

## Authentication & security

- **User auth:** Supabase Auth (session cookies via `@supabase/ssr`) — see Auth system section above
- **Admin:** Basic Auth in `proxy.ts` for `/admin/*`. `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars.
- **Members area (legacy):** Secret token `?t=` or `members_access` cookie vs `MEMBERS_SECRET` env var.
- **Cron:** `Authorization: Bearer <CRON_SECRET>`
- **Rate limiting:** In-memory sliding window (`lib/rate-limit.ts`). Signup: 5/min per IP. Events: 20/min per anon_id.
- **No client-side DB access** — service-role key only server-side. Exception: auth pages use anon key for session management only (no DB queries).

---

## Environment variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # used by auth pages (@supabase/ssr session management)
SUPABASE_SERVICE_ROLE_KEY=        # all server DB access

# Resend
RESEND_API_KEY=                   # re_UKo76Jxb_...
NEXT_PUBLIC_FROM_EMAIL=           # noreply@beegood.online (LIVE — set in Vercel, domain verified)

# Cardcom (live — credentials set in Vercel)
CARDCOM_TERMINAL=                 # 143422
CARDCOM_API_NAME=                 # set in Vercel

# App
NEXT_PUBLIC_APP_URL=https://www.beegood.online
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
UCHAT_API_KEY=                    # UChat Settings → API Keys → create new key for beegood
```

---

## Deployment

- **Platform:** Vercel (Hobby plan)
- **Trigger:** GitHub push to `main` auto-deploys (AlonAbadi/hadar-danan repo connected to Vercel)
- **No manual deploy needed** — `npx vercel --prod` is no longer used
- **Before committing:** `npx tsc --noEmit 2>&1 | grep "error TS" | grep -v ".next"`
- **Commit + push:** `git add . && git commit -m "message" && git push` from `~/hadar-danan`
- **Vercel cron** (`vercel.json`): `0 22 * * *` — daily at 22:00 UTC
- **External cron:** cron-job.org hits `GET /api/cron/jobs` every 5 min with `Authorization: Bearer <CRON_SECRET>`

**Current status (May 2026):** Site live at beegood.online. Supabase Auth live with Google OAuth. Cardcom payments active (CARDCOM_TERMINAL=143422). WhatsApp active (972539566961). All DB migrations (001-029) applied. Migration 030 (whatsapp_logs) written — pending Supabase run. WhatsApp cart-abandon infrastructure built (SEND_WHATSAPP job type) — pending template approval + env vars in Vercel. A/B test `landing_headline` running live. Course content player built. Challenge content (days 0–7 live, day 8 PLACEHOLDER). Hive members area live. Email sending live from `noreply@beegood.online` with click-based open tracking. Full UTM chain (source/medium/campaign/adset/ad) tracked and displayed in admin. Atelier influencer program live with full AI onboarding pipeline + orchestrator. Deals CRM live.

---

## What's done

- All landing pages fully designed and deployed: /, /about, /team, /challenge, /workshop, /course, /strategy, /premium, /partnership, /hive, /hive/terms
- Full Santosha dark palette applied site-wide — gold tokens: #E8B94A / #C9964A / #9E7C3A
- Homepage: fully dark (#080C14), Ladder+Netflix products section with per-card thumbnail images
- Hero: full-screen image (`/hadar1.png`), CSS mask right fade, text floats right (desktop) / pinned at 52svh (mobile)
- Products section: 5-step zigzag ladder + premium 2-col grid + hive card; each card 420px, image fills card, text overlay at bottom
- Nav: server-rendered auth state (DesktopNavServer / MobileNavServer), logged-in user shown as hollow gold capsule with first name
- Font: Assistant only (Cormorant/DM Sans experiment fully reverted)
- TrueSignal© branding integrated site-wide (hero sections + all footers); always wrapped in `<span dir="ltr">`
- Complete backend: signup, events, job queue, 16 email sequences, admin dashboard
- **Cardcom payments LIVE** — LowProfile API, `POST` to `https://secure.cardcom.solutions/Interface/LowProfile.aspx` with URLSearchParams (not JSON). Fields: `TerminalNumber`, `UserName` (not ApiName), `SumToBill`, `SuccessRedirectUrl`, `ErrorRedirectUrl`, `IndicatorUrl`. Response is text/URLSearchParams — parse `ResponseCode` ("0"=success) + `LowProfileCode`
- **Supabase Auth LIVE** — email/password + Google OAuth. Pages: /login, /signup, /forgot-password, /reset-password. Session via `@supabase/ssr` cookies. `lib/auth/link-user.ts` links auth.users to public.users
- A/B testing infrastructure + AI proposals in `ab_proposals` table
- Anonymous identity tracking
- Members gated area (legacy token-based)
- Privacy policy + Terms of service updated April 2026 + Hive terms (/hive/terms)
- /thank-you page with challenge upsell
- External cron via cron-job.org (5 min)
- /quiz diagnostic flow — scoring via SCORES matrix (not RESULT_MAP), results saved to `quiz_results` table
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
- Israeli accessibility compliance: floating widget (bottom-left, blue #2F80ED, 56×56px, borderRadius 14px), WCAG 2.1 AA, skip link, /accessibility page
- הכוורת (Hive) monthly membership: full join flow, 3-tier pricing (₪29/₪97/₪197), eligibility check, legal disclosure, cancellation via /account, admin section, members area
- All footers include: TrueSignal© microcopy + תנאי מנוי הכוורת link
- **Shared SuccessPage component** (`components/SuccessPage.tsx`) — used by /challenge/success, /workshop/success, /course/success, /strategy/success, /test/success
- **ProductsSection component** (`components/ProductsSection.tsx`) — used by homepage + /training/watch (with `excludeTraining` prop)
- **/training/watch** — free training watch page with Vimeo embed, PageViewTracker, ProductsSection (excludeTraining=true)
- **/test** — ₪1 test product for Cardcom testing; subtle footer link from /challenge; product_type `test_1` in DB
- **Course content page** — `/course/content` fully implemented with `CoursePlayer` — 8 modules, 16 lessons, Vimeo embed, video event tracking, auth-gated
- **Challenge content page** — `/challenge/content` implemented with `ChallengePlayer` — 7-day Reels content, auth-gated. Days 1–7 have real Vimeo IDs in `lib/challenge-config.ts`; day 0 (opening) and day 8 (closing) are still PLACEHOLDER.
- **Account page** — `/account` replaces `/my` (which now redirects). Shows purchases, hive status. Auth-gated via Supabase session.
- **Hive members area** — `/hive/members` gated by auth + `hive_status=active`. Tier-appropriate content from `hive_content` table. Upgrade prompts for lower tiers.
- **Stats section** — homepage social proof strip ("250+ עסקים", "4 שנים", "97% ממליצים") with gold animated counters
- **OG image** — static `/public/og-image.jpg` (1200×630). OG metadata lives exclusively in `app/layout.tsx`.
- **A/B testing activated** — variant A: "השיווק שלך לא נכשל בגלל הסרטונים"; variant B: "תוכן שמוכר מגיע מבהירות - לא מעוד סרטונים"
- **Admin A/B page** — `/admin/abtesting` shows live tests + AI proposals. `LiveTestCard` shows variant text, CVR, uplift, Bayesian confidence.
- **UTM tracking** — `QuizClient.handleLeadSubmit` reads UTM cookies and includes in signup POST.
- **CRM user timeline** — `/admin/users/[id]` shows Hebrew event descriptions, notes, reminders.
- **Favicon** — updated to beegood logo (bee icon)
- **Domain** — all references updated to beegood.online
- **Email sending LIVE** — `noreply@beegood.online` via Resend. DNS records (MX, SPF, DKIM, DMARC) configured in Vercel DNS. `NEXT_PUBLIC_FROM_EMAIL` set in Vercel. Send-only domain (no inbox). Do not delete DNS records.
- **Quiz form skip logic** — logged-in users with name + phone skip step 6 entirely and go straight to results. Partial profile (missing phone) shows mini-form with only missing fields. Soft marketing consent banner shown on result page when `isLoggedIn && !hasConsent`. `app/quiz/page.tsx` is an async server component that fetches `initialUser` and passes to `QuizClient`.
- **Account page redesign (April 8, 2026)** — tabs: Profile, Purchases, Hive. Completed purchases in dedicated tab. `PendingPaymentCallout` banner shows pending purchases with "השלם תשלום" resume button + "בטל" cancel link. Quiz recommendation shown in Profile tab via `QuizRecommendationCard` from `lib/quiz-config.ts`.
- **Resume payment + cancel pending purchase** — `PendingPaymentCallout` (`app/account/AccountClient.tsx`) calls `/api/checkout` to resume, or `/api/purchases/[id]/cancel` to cancel. **CRITICAL:** passes `userData.id` (public.users UUID), NOT `authUser.id` (Supabase Auth UUID) — these are different.
- **Communication preferences in Profile tab** — `/account` Profile tab has separate "העדפות תקשורת" card with phone field + iOS-style marketing consent toggle. Phone was moved OUT of "פרטים אישיים". Save is disabled until dirty. Uses `POST /api/user/update-profile` with partial-update pattern.
- **Discounts + popups fully removed (April 2026)** — `AbandonCheckoutPopup` removed from all product pages (/challenge, /workshop, /course, /strategy). `PERMANENT_DISCOUNTS` map removed from `/api/checkout`. Credit system disabled sitewide — all checkouts charge full list price. `lib/credit.ts` still exists but is unused.
- **`vimeoId` prop on `ProductLandingPage`** — optional `vimeoId?: string` prop renders a 9:16 portrait Vimeo embed (maxWidth: 260px) in the VSL slot. Used on: /strategy (`1183710499`), /challenge (`1183365127`), /training (`1182657741`).
- **Mobile navbar logo** — `beegoodtxt.png` centered in mobile top bar (`MobileNav.tsx`) with gold glow filter. Desktop nav has no logo image.
- **Challenge day videos (0–7) live** — day 0 (`1185862328`) + days 1–7 all have real Vimeo IDs in `lib/challenge-config.ts`. Only day 8 (closing session) is still PLACEHOLDER. Portrait 9:16 sizing for days 1–7, 16:9 for days 0 + 8.
- **Email templates rewritten (Ben Settle style)** — all 12 active templates in `lib/email/templates.ts` rewritten: short `<p>` lines, personal Hebrew voice, signed "צוות beegood". All reply CTAs link to WhatsApp, not email. Dynamic workshop date via `getNextWorkshopDate()`.
- **Click-based email open tracking** — `/api/email/click` endpoint wraps all CTA links; records `EMAIL_OPENED` + `LINK_CLICKED` events and updates `email_logs.status`. No pixel tracking.
- **Full UTM chain in admin** — `/admin/users/[id]` shows utm_source/medium/campaign/adset/ad/content + click_id. `/admin/acquisition` campaign table shows 6-column breakdown including אד-סט and אד (קריאייטיב) in gold.
- **Atelier influencer program** — `/atelier` landing page with application form. Full CRM at `/admin/atelier` with fit-score algorithm, UTM chips, status filter. Detail view at `/admin/atelier/[id]` with AI analysis (Claude), content generation, ProjectManagerAgent orchestrator, preview deploy pipeline.
- **Atelier UTM tracking** — form reads all UTM cookies and saves as `source_utm` JSONB in `atelier_applications`. Admin list + detail view display the full chain.
- **TrueSignal AI diagnosis** — `/admin/users/[id]` has `TrueSignalCard` component that calls Claude API to generate per-user business diagnosis. Results cached in `user_insights` table.
- **Invoice tracking** — Cardcom webhook saves `invoice_number` + `invoice_link` (PDF URL) on `purchases` rows.
- **User status archive** — `handled` and `not_relevant` added to user_status enum (migration 028) for CRM cleanup.
- **Deals CRM** — `deals` table (migration 024) + `/admin/deals` page for tracking brand deals.

---

## What's pending

| Item | Blocker | How to activate |
|---|---|---|
| Cardcom recurring (Hive) | Need Cardcom recurring setup | Configure recurring billing once standard payments confirmed |
| WhatsApp group link for Hive | Need group URL | Update placeholder in `hive_welcome` email template |
| Hive Zoom link | Content | Update placeholder in `hive_welcome` email template |
| Real course video links | Content production | Replace Vimeo placeholders in `CoursePlayer` with real lesson IDs |
| Challenge day 8 video | Content production | Replace PLACEHOLDER in `lib/challenge-config.ts` day 8 entry |
| Real hive_content rows | Content | Insert rows into `hive_content` table via Supabase dashboard |
| Hive AI matching system | Future feature | Designed as "בקרוב" placeholder on /hive page |
| WhatsApp cart-abandon templates | Require UChat template approval | 1) Run migration 030 in Supabase. 2) Create API key in UChat → Settings → API Keys → save as `UCHAT_API_KEY` in Vercel. 3) Create templates `hadar_cart_1h` + `hadar_cart_24h` in UChat → Templates → WhatsApp Templates (both take `{{1}}` = first name, language `he`). |

---

## CRM System

Admin dashboard at `/admin` and individual user profiles at `/admin/users/[id]`.

**Admin dashboard sections:**
- Overview stats + user table: `/admin` — filterable by status, search by name/email
- A/B testing: `/admin/abtesting` — live experiments + AI proposals
- Acquisition: `/admin/acquisition` — full UTM breakdown (source → medium → campaign → adset → ad)
- Atelier CRM: `/admin/atelier` + `/admin/atelier/[id]` — lead pipeline + AI onboarding workbench
- Email stats: `/admin/email` — send/open/click rates from `email_logs`
- Funnel: `/admin/funnel` — conversion funnel
- Leads: `/admin/leads` — filterable leads list with UTM columns
- Community (Hive): `/admin/community` — membership analytics
- Deals: `/admin/deals` — brand deals CRM
- Sales: `/admin/sales` — revenue bar chart
- Products: `/admin/products` — per-product performance
- Video: `/admin/video` — Vimeo drop-off + completion stats
- MMM: `/admin/mmm` — media mix modeling
- CRM: `/admin/crm` — status + UTM breakdown
- System: `/admin/system` — error logs, cron status

**User profile (`/admin/users/[id]`):**
- Header: name, email, status badge, UTM source, A/B variant, signup date
- Purchase history table with amounts and status
- Event timeline — human-readable Hebrew with icons, translated page names, contextual details
  - `PAGE_VIEW` → "צפה/ת בעמוד: [שם עמוד בעברית]"
  - `USER_SIGNED_UP` → "נרשם/ה לאתר"
  - `PURCHASE_COMPLETED` → "רכישה הושלמה" (green highlight)
  - `CALL_BOOKED` → "שיחה נקבעה" (gold highlight)
  - `CHECKOUT_STARTED` → "התחיל/ה תהליך רכישה"
  - `EMAIL_OPENED` / `LINK_CLICKED` → engagement events with subject/URL detail
- Admin notes (from `notes` table) — add/view notes per user
- Reminders (from `reminders` table) — task reminders with due dates
- `PAGE_LABELS` map translates URL paths to Hebrew names
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

## Mockups status (April 2026)

Approved screens pending implementation. Location: `/mnt/user-data/outputs/` (in Claude chat, not in repo).

| Area | Screens | Status |
|---|---|---|
| Auth | 28 screens + 19 edge cases | Approved — implemented April 2026 |
| Course content | 14 screens + 8 edge cases | Approved — implemented April 2026 |
| Challenge content | 16 screens + 8 edge cases | Approved — implemented April 2026 |
| Account page | - | Approved — implemented April 2026 |
| Hive members area | - | Approved — implemented April 2026 |

**Implementation order (completed):** Auth > Course > Challenge > Account > Hive Members > Cardcom integration (pending)

---

## Homepage — key sections

### Hero
- **Mobile:** `height: 100svh`, content `position: absolute, top: 52svh`, full-width CTA button
- **Desktop:** `<img src="/hadar1.png">` positioned left with CSS mask (`-webkit-mask-image: linear-gradient(to right, black 55%, transparent 100%)`); text panel `position: absolute, right: 0, top: 50%, width: 45%`; top gradient overlay blends into navbar

### Products — Ladder+Netflix
Vertical zigzag layout, cards alternate right/left. All cards: `height: 420px`, `position: relative`, `overflow: hidden`. Image fills card (`position: absolute, inset: 0`), gradient overlay from bottom (`linear-gradient(to top, rgba(10,14,24,1) 0%, ... transparent 78%)`), text body `position: absolute, bottom: 0`.

| Step | Product | Image | Card side |
|---|---|---|---|
| 1 | הדרכה חינמית | `/hadarlesson.png` | RIGHT |
| 2 | אתגר 7 ימים | `/etgar.png` | LEFT |
| 3 | סדנה יום אחד | `/sadna.png` | RIGHT |
| 4 | קורס דיגיטלי | `/coursehadar.png` | LEFT |
| 5 | פגישת אסטרטגיה | `/strategymeeting.png` | RIGHT |
| P1 | יום צילום פרמיום | `/shooting.png` | 2-col grid |
| P2 | שותפות אסטרטגית | `/partnership.png` | 2-col grid |
| H | הכוורת | `/hive.png` | Wide centered |

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
- Use `createServerClient()` for all DB access — never the anon client (exception: auth pages use `createBrowserClient()` from `lib/supabase/browser.ts` for session handling only)

**Never:**
- Use English text in the UI
- Access the database from client-side components (auth session management is the only exception)
- Skip error logging in API routes
- Use `--no-verify` or bypass TypeScript checks before deploying
- Commit `.env.local` or any file with secrets
- Introduce new fonts (Assistant only)
- Introduce new color palettes (Santosha only)
- Delete the Google Search Console TXT record from Vercel DNS

**Email templates:**
- Add new templates to `lib/email/templates.ts` and register in `TEMPLATES` map
- New sequence rows go in a migration file under `supabase/migrations/`
- Always verify `renderTemplate(key, ctx)` returns non-null before assuming key exists

**Database migrations:**
- Never modify `schema.sql` after initial setup — create numbered migration files
- Pattern: `supabase/migrations/NNN_description.sql`
- Run manually in Supabase SQL Editor (no migration runner configured)
- Next migration number: 031

**OG images:**
- Always use static files from `/public/` — never dynamic `opengraph-image.tsx` routes
- OG metadata lives exclusively in `app/layout.tsx` — do NOT add `openGraph` blocks to individual `page.tsx` files unless you also include the `images` field, or `og:image` will be silently dropped (Next.js page-level openGraph replaces, not merges, the layout-level one)
- Current OG image: `https://www.beegood.online/og-image.jpg` (1200×630, static in `/public/og-image.jpg`)

**UTM tracking:**
- Every signup path must read UTM cookies and include them in the POST body to `/api/signup`
- Affected components: `SignupForm`, `QuizClient` (`handleLeadSubmit`), any future lead capture form
- UTM keys to capture: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_adset`, `utm_ad`, `fbclid`, `gclid`
- Read via `document.cookie` parsing (helper: `getCookie(key)`) — cookies are set by `proxy.ts` on first page load
- Map `fbclid`/`gclid` → `click_id` field in signup payload
