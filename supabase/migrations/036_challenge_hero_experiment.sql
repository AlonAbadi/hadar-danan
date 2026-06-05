-- Migration 036: Challenge hero format A/B test
-- Two parallel experiment rows, both fed by the same ab_variant cookie:
--   challenge_hero_format         — primary, conversion = PURCHASE of challenge_197
--   challenge_hero_format_checkout — secondary, conversion = CHECKOUT_STARTED for challenge_197
-- Both track the same visitors (every /challenge PAGE_VIEW), so we can compare
-- click-through vs actual sale per variant without compromising the primary metric.

INSERT INTO experiments (name, variant_a_label, variant_b_label, status, visitors_a, visitors_b, conversions_a, conversions_b)
VALUES
  ('challenge_hero_format',          'וידאו של הדר (control)', 'טקסט מעוצב במקום וידאו', 'running', 0, 0, 0, 0),
  ('challenge_hero_format_checkout', 'וידאו של הדר (control)', 'טקסט מעוצב במקום וידאו', 'running', 0, 0, 0, 0)
ON CONFLICT (name) DO NOTHING;
