-- Migration 062: /kriah v2 routing instrumentation (BUILD_SPEC §11 + AUDIT §ג)
--
-- Columns for the two-key gate: declared business state (key 1), the LLM
-- evidence extraction + deterministic score (key 2), regex shadow columns
-- (logged only in week 1, not scored), and the routing outcome. Additive.

ALTER TABLE signal_extractions
  ADD COLUMN IF NOT EXISTS key1_declared   text
    CHECK (key1_declared IN ('A','B','C','D')),
  ADD COLUMN IF NOT EXISTS evidence_score  numeric,
  ADD COLUMN IF NOT EXISTS llm_evidence    jsonb,
  ADD COLUMN IF NOT EXISTS regex_staff     boolean,
  ADD COLUMN IF NOT EXISTS regex_money     boolean,
  ADD COLUMN IF NOT EXISTS distress_money  boolean,
  ADD COLUMN IF NOT EXISTS truth_cell      text,
  ADD COLUMN IF NOT EXISTS routed_ending   text
    CHECK (routed_ending IN ('concierge','hive','pre_revenue','crisis_soft')),
  ADD COLUMN IF NOT EXISTS phone_given     boolean;

-- Day-2 offer email for the v2 core lane (the ₪590 offer moved OFF the
-- ending screen per Alon's decision — it arrives by email instead).
INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES ('KRIAH_CORE_LEAD', 40, 'המשפט שלכם עדיין מחזיק?', 'kriah_hive_offer', TRUE)
ON CONFLICT DO NOTHING;
