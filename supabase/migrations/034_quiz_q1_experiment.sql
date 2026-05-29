-- Migration 034: A/B test "quiz_q1_framing"
-- Tests reframing of Q1 in the quiz from identity ("where are you?")
-- to pain ("what's stopping you?") for campaign visitors.
-- Visitor: PAGE_VIEW on /quiz step 0 (fires on QuizClient mount)
-- Conversion: QUIZ_LEAD (lead-gate form submitted)

INSERT INTO experiments (
  name,
  status,
  variant_a_label,
  variant_b_label,
  visitors_a,
  visitors_b,
  conversions_a,
  conversions_b
)
SELECT
  'quiz_q1_framing',
  'running',
  'איפה העסק שלך עכשיו?',
  'מה עוצר אותך מלצמוח בשיווק?',
  0, 0, 0, 0
WHERE NOT EXISTS (
  SELECT 1 FROM experiments WHERE name = 'quiz_q1_framing'
);
