-- Multi-tenant support: tenants table
-- Each tenant is an independent brand/product running on beegood infrastructure.
-- Service-role only access (no RLS policies).

create table public.tenants (
  id                        uuid        primary key default gen_random_uuid(),
  slug                      text        not null unique,
  name                      text        not null,
  domains                   text[]      not null default '{}',
  status                    text        not null default 'setup',
  branding                  jsonb,
  content                   jsonb,
  products                  jsonb,
  cardcom_terminal_number   text,
  cardcom_username          text,
  cardcom_api_key_encrypted text,
  analytics                 jsonb,
  legal                     jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint tenants_slug_format check (
    slug ~ '^[a-z0-9][a-z0-9\-]{0,48}[a-z0-9]$'
  ),
  constraint tenants_slug_length check (
    length(slug) between 2 and 50
  ),
  constraint tenants_status_valid check (
    status in ('setup', 'active', 'paused', 'archived')
  )
);

-- Indexes
create index tenants_slug_idx    on public.tenants (slug);
create index tenants_domains_idx on public.tenants using gin (domains);
create index tenants_status_idx  on public.tenants (status);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

-- RLS enabled, no policies — service-role only (same pattern as atelier_applications)
alter table public.tenants enable row level security;

-- Seed: hadar tenant
insert into public.tenants (
  slug,
  name,
  domains,
  status,
  branding,
  content,
  products,
  analytics,
  legal
) values (
  'hadar',
  'הדר דנן',
  array['beegood.online', 'www.beegood.online'],
  'active',

  -- branding: Santosha palette + font
  jsonb_build_object(
    'font',        'Assistant',
    'bg',          '#0D1018',
    'card',        '#141820',
    'card_soft',   '#181D26',
    'border',      '#2C323E',
    'gold',        '#C9964A',
    'gold_light',  '#E8B94A',
    'gold_dark',   '#9E7C3A',
    'fg',          '#EDE9E1',
    'fg_muted',    '#9E9990',
    'grad_gold',   'linear-gradient(135deg, #E8B94A 0%, #C9964A 50%, #9E7C3A 100%)',
    'grad_card',   'linear-gradient(145deg, #1D2430, #111620)',
    'og_image',    'https://beegood.online/og-image.jpg'
  ),

  -- content: site title, description, OG metadata
  jsonb_build_object(
    'site_name',   'הדר דנן | BeeGood',
    'title',       'הדר דנן | שיטת TrueSignal by BeeGood - שיווק אותנטי לעסקים',
    'description', 'הדר דנן, מומחית לשיווק אותנטי ויוצרת שיטת TrueSignal by BeeGood. קורסים, סדנאות וליווי אישי לבעלי עסקים שרוצים לשווק בלי לאבד את עצמם.',
    'og_image',    'https://beegood.online/og-image.jpg',
    'locale',      'he_IL',
    'direction',   'rtl'
  ),

  -- products: all active product slugs
  jsonb_build_array(
    'training',
    'challenge',
    'workshop',
    'course',
    'strategy',
    'hive',
    'premium',
    'partnership',
    'atelier'
  ),

  -- analytics
  jsonb_build_object(
    'gtm_id', 'G-L76SZ1SCS1'
  ),

  -- legal: company registration details from footer
  jsonb_build_object(
    'company_name',   'הדר דנן בע״מ',
    'company_id',     '516791555',
    'address',        'החילזון 5, רמת גן',
    'phone',          '053-9566961'
  )
);

-- Verify seed
select
  id,
  slug,
  name,
  domains,
  status,
  branding->>'font'            as font,
  content->>'title'            as site_title,
  analytics->>'gtm_id'         as gtm_id,
  legal->>'company_name'       as company_name,
  legal->>'company_id'         as company_id,
  jsonb_array_length(products) as product_count,
  created_at
from public.tenants
where slug = 'hadar';
