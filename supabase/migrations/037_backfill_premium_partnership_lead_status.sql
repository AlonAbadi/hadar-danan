-- Backfill premium_lead / partnership_lead status for existing users whose
-- quiz recommendation said premium/partnership but their status never got
-- bumped (because /api/quiz-result POST used to gate the status bump behind
-- UCHAT_API_KEY presence). Run once in Supabase SQL Editor.
--
-- Only upgrades users currently in 'lead' or 'engaged' — never downgrades
-- buyers, booked, or already-tagged premium/partnership leads.

-- Premium leads
UPDATE users
SET    status = 'premium_lead'
WHERE  status IN ('lead', 'engaged')
  AND  id IN (
    SELECT DISTINCT user_id
    FROM   quiz_results
    WHERE  recommended_product = 'premium'
      AND  user_id IS NOT NULL
  );

-- Partnership leads
UPDATE users
SET    status = 'partnership_lead'
WHERE  status IN ('lead', 'engaged')
  AND  id IN (
    SELECT DISTINCT user_id
    FROM   quiz_results
    WHERE  recommended_product = 'partnership'
      AND  user_id IS NOT NULL
  );

-- NOTE: 'strategy' has no dedicated status. Strategy quiz leads stay
-- 'engaged' but are surfaced in the priority CRM tab via quiz_product join
-- (PRIORITY_TIERS in app/admin/crm/page.tsx).
