-- beegood atelier — onboarding fields added after application is accepted
-- Admin fills this in (or sends token to client) to generate the full site brief

alter table public.atelier_applications
  add column if not exists niche               text,
  add column if not exists target_audience     text,
  add column if not exists tone_keywords       text,
  add column if not exists products            jsonb,   -- [{name, price}]
  add column if not exists testimonials        jsonb,   -- [{name, quote}]
  add column if not exists whatsapp            text,
  add column if not exists domain_preference   text,
  add column if not exists generated_content   jsonb,   -- Claude output
  add column if not exists selected_palette    text,    -- 'warm' | 'dark' | 'fresh'
  add column if not exists onboarded_at        timestamptz;
