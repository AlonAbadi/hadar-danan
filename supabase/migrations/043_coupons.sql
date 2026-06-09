-- 043: coupons + redemptions
-- Single-code URL-based discount system. A coupon row defines a discount
-- that is applied only when the buyer arrives with ?code=<code> in the URL.
-- Customers without the code see full price — discount is never shown.
--
-- Validation lives in lib/coupons.ts and runs both:
--   1. server-side when rendering /workshop (decides what price to show)
--   2. server-side in /api/checkout (decides what to bill via Cardcom)
--
-- amount_paid on purchases (migration 016) stores the discounted amount.
-- amount stays at list price. Both are sent to Cardcom — list price for
-- record-keeping, amount_paid for the actual charge + invoice.

create table if not exists coupons (
  code             text primary key,
  product          text not null,                       -- 'workshop_1080' etc.
  discount_percent int  not null check (discount_percent > 0 and discount_percent <= 100),
  max_uses         int default null,                    -- null = unlimited
  used_count       int not null default 0,
  expires_at       timestamptz default null,            -- null = no expiry
  active           boolean not null default true,
  notes            text,
  created_at       timestamptz not null default now()
);

create table if not exists coupon_redemptions (
  id           uuid primary key default gen_random_uuid(),
  coupon_code  text not null references coupons(code),
  user_id      uuid not null references users(id),
  purchase_id  uuid not null references purchases(id),
  redeemed_at  timestamptz not null default now(),
  unique (coupon_code, purchase_id)
);

create index if not exists idx_coupon_redemptions_user on coupon_redemptions(user_id);
create index if not exists idx_coupon_redemptions_code on coupon_redemptions(coupon_code);

-- Seed the workshop 50% discount
insert into coupons (code, product, discount_percent, max_uses, expires_at, notes)
values ('SADNA50', 'workshop_1080', 50, null, null, 'Workshop 50% off — community list')
on conflict (code) do nothing;
