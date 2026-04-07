# Admin Dashboard — Implementation Guide

## File Structure

```
app/admin/
├── layout.tsx              ← Admin shell with sidebar nav (RTL)
├── page.tsx                ← Overview (server component)
├── client.tsx              ← Overview (client component)
├── funnel/
│   ├── page.tsx            ← Sales Funnel (server)
│   └── client.tsx          ← Sales Funnel (client)
├── products/
│   ├── page.tsx            ← Product Performance (server)
│   └── client.tsx          ← Product Performance (client)
├── acquisition/
│   ├── page.tsx            ← Acquisition & Attribution (server)
│   └── client.tsx          ← Acquisition & Attribution (client)
├── mmm/
│   ├── page.tsx            ← Media Mix Modeling (server)
│   └── client.tsx          ← Media Mix Modeling (client)
├── abtesting/
│   ├── page.tsx            ← Experimentation Hub (server)
│   └── client.tsx          ← Experimentation Hub (client)
├── email/
│   ├── page.tsx            ← Email Sequences (server)
│   └── client.tsx          ← Email Sequences (client)
├── video/
│   ├── page.tsx            ← Video Analytics (server)
│   └── client.tsx          ← Video Analytics (client)
├── bookings/
│   ├── page.tsx            ← Bookings & Scheduling (server)
│   └── client.tsx          ← Bookings & Scheduling (client)
├── community/
│   ├── page.tsx            ← הכוורת (server)
│   └── client.tsx          ← הכוורת (client)
├── leads/
│   ├── page.tsx            ← Leads & CRM (server)
│   └── client.tsx          ← Leads & CRM (client)
└── system/
    ├── page.tsx            ← System & Logs (server)
    └── client.tsx          ← System & Logs (client)

components/admin/
└── ui.tsx                  ← Shared components (KPI cards, tables, badges, etc.)

lib/admin/
├── queries.ts              ← All Supabase queries + 3rd party API integrations
└── types.ts                ← TypeScript types
```

## Integration Steps (Priority Order)

### Phase 1 — Core Admin (Week 1)
1. Copy all files to ~/hadar-danan/
2. Replace existing admin page
3. Test with existing Supabase data
4. Verify: Overview, Funnel, Products, Email, Leads, System pages

### Phase 2 — Calendly + Bookings (Week 2)
1. Get Calendly API token (Standard plan or higher)
2. Add CALENDLY_API_TOKEN to .env
3. Test bookings sync
4. Set up Calendly webhook → Supabase for real-time updates

### Phase 3 — Meta Ads Integration (Week 2-3)
1. Create Meta App at developers.facebook.com
2. Get long-lived access token (System User recommended)
3. Add META_ADS_ACCESS_TOKEN + META_AD_ACCOUNT_ID to .env
4. Test Acquisition page — campaign data should appear
5. Set up Meta CAPI for server-side conversion tracking

### Phase 4 — Google Ads + GA4 (Week 3)
1. Set up Google Ads API access
2. Add GA4 Data API credentials
3. Install @google-analytics/data package
4. Test acquisition page with Google data

### Phase 5 — Vimeo + Video Analytics (Week 3-4)
1. Get Vimeo Pro API token
2. Add VIMEO_ACCESS_TOKEN to .env
3. Implement Vimeo Player SDK events → Supabase
4. Test video page with real watch data

### Phase 6 — WhatsApp Business (Week 4)
1. Set up WhatsApp Business API
2. Add tokens to .env
3. Implement quick-send from lead profiles
4. Set up automated no-show reminders

### Phase 7 — MMM Model (Week 5-6)
1. Requires: 12+ weeks of Meta + Google spend data
2. Implement simplified regression model in lib/admin/mmm.ts
3. Train weekly, store results in Supabase
4. Activate budget optimizer on MMM page

### Phase 8 — A/B Testing Agent (Week 6+)
1. Implement Bayesian significance calculator
2. Build agent logic for auto-create/auto-stop
3. Integrate with Vercel edge middleware for traffic splitting
4. Set up test backlog management

## Database Tables Needed

If not already present, ensure these tables exist in Supabase:

- users (with: funnel_stage, lead_score, source, utm_source, utm_medium, utm_campaign, ab_variant)
- orders (with: product_id, amount, status, user_id)
- email_logs (with: sequence_id, status: sent/opened/clicked/bounced)
- ab_tests (with: status, variant_a/b, visitors_a/b, conversions_a/b, confidence, winner)
- bookings (with: type, status, scheduled_at, calendly_event_id)
- hive_members (with: tier, status, cancelled_at, next_billing_at)
- quiz_results (with: answers, score, recommended_product)
- error_logs (with: level, message, context, payload)
- events (with: type, user_id, anonymous_id, metadata)
- video_events (NEW — for Vimeo player tracking)

## Claude Code Prompts

Use these prompts in Claude Code to integrate each file:

```
# Phase 1 — Core integration
Copy the admin layout, components, and queries from the admin-build files.
Replace the existing /app/admin/ directory with the new multi-page structure.
Keep the existing middleware auth check for /admin routes.

# Phase 2 — Calendly
Implement Calendly API integration. Read CALENDLY_API_TOKEN from env.
Create a webhook endpoint at /api/webhooks/calendly to sync booking events
to the bookings table in Supabase.

# Phase 3 — Meta Ads
Implement Meta Ads API integration using the Marketing API v19.0.
Create a server action that fetches campaign insights and caches for 5 minutes.
Add Meta CAPI endpoint at /api/webhooks/meta-capi for server-side conversion tracking.
```

## Design System Notes

- Background: #0f0f10 (main), #18181b (cards/sidebar)
- Gold accent: #c9a84c (matches hadar-danan.vercel.app design)
- Font: 'Assistant' for Hebrew, system-ui for numbers
- All pages RTL
- Dark theme only (admin is not public-facing)
- All KPI values use system-ui font for consistent number rendering
