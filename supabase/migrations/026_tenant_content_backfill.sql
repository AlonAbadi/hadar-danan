-- 026: Backfill missing content and legal fields on hadar tenant
-- Adds: content.from_email, content.title_template, content.tagline,
--       content.social, legal.whatsapp_phone
-- No schema changes — appends keys into existing JSONB columns.
-- The || operator merges objects; existing keys are preserved.
--
-- NOTE: tagline merges hadar's brand line + TrueSignal© methodology into one
-- string. When onboarding a second tenant, split into tagline + methodology_name.

BEGIN;

UPDATE public.tenants
SET
  content = content || jsonb_build_object(
    'from_email',     'noreply@beegood.online',
    'title_template', '%s | הדר דנן',
    'tagline',        'אנחנו לא יוצרים תוכן. אנחנו בונים את האות שלך. | TrueSignal©',
    'social',         jsonb_build_object(
      'instagram', 'https://www.instagram.com/hadar_danan',
      'tiktok',    'https://www.tiktok.com/@hadardanann',
      'spotify',   'https://open.spotify.com/show/12EPZoAiHLq63tiq6GjreC',
      'podcast',   'https://podcasts.apple.com/il/podcast/id1829722848'
    )
  ),
  legal = legal || jsonb_build_object(
    'whatsapp_phone', '972539566961'
  )
WHERE slug = 'hadar';

-- Verification: all 5 new fields must be non-null
SELECT
  content->>'from_email'     AS from_email,
  content->>'title_template' AS title_template,
  content->>'tagline'        AS tagline,
  content->'social'          AS social,
  legal->>'whatsapp_phone'   AS whatsapp_phone
FROM public.tenants
WHERE slug = 'hadar';

COMMIT;
