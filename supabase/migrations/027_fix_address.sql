-- 027: Fix hadar legal.address — add comma and space before רמת גן
BEGIN;
UPDATE public.tenants
SET legal = legal || jsonb_build_object('address', 'החילזון 5, רמת גן')
WHERE slug = 'hadar';
SELECT legal->>'address' AS address FROM public.tenants WHERE slug = 'hadar';
COMMIT;
