-- ============================================================================
-- Manual SQL to run in Supabase SQL Editor (project rufzcpwzolitoqqhdmrx)
-- Fixes the active "click_id column not found" errors and clears stale logs.
-- ============================================================================

-- 1) Apply migration 035 — adds UTM + click_id columns to quiz_results.
--    This is the file in supabase/migrations/035_quiz_results_utm.sql.
--    The /api/quiz-result POST writes to click_id; without this it fails
--    on every quiz completion.

ALTER TABLE quiz_results
  ADD COLUMN IF NOT EXISTS utm_source   TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium   TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content  TEXT,
  ADD COLUMN IF NOT EXISTS utm_term     TEXT,
  ADD COLUMN IF NOT EXISTS utm_adset    TEXT,
  ADD COLUMN IF NOT EXISTS utm_ad       TEXT,
  ADD COLUMN IF NOT EXISTS click_id     TEXT;

CREATE INDEX IF NOT EXISTS idx_quiz_results_utm_source   ON quiz_results (utm_source);
CREATE INDEX IF NOT EXISTS idx_quiz_results_utm_campaign ON quiz_results (utm_campaign);

-- Force PostgREST schema cache reload so the new columns are visible immediately.
NOTIFY pgrst, 'reload schema';


-- 2) Clear historical errors that have already been fixed in code.
--    Run AFTER deploying the latest main branch.

DELETE FROM error_logs
WHERE
  -- ab_variant constraint — fixed in app/api/signup/route.ts (sanitizer)
  (context = 'api/signup' AND error LIKE '%users_ab_variant_check%')
  -- UChat namespace — fixed in lib/jobs/handlers/send-whatsapp.ts (hardcoded WABA namespace)
  OR (context LIKE 'cron/jobs:SEND_WHATSAPP%' AND (
        error LIKE '%content.namespace field is required%'
     OR error LIKE '%namespace not found%'
     OR error LIKE '%user ns field is required%'
     OR error LIKE '%<!DOCTYPE%'
  ))
  -- Old quiz-analysis tool_use dumps — code now uses structured tool_use
  OR (context LIKE 'api/admin/quiz-analysis%' AND (
        error LIKE '%tool_use input dump%'
     OR error LIKE '%JSON parse failed%'
  ))
  -- click_id errors before migration applied (run AFTER step 1)
  OR (context = '/api/quiz-result' AND error LIKE '%click_id%schema cache%');
