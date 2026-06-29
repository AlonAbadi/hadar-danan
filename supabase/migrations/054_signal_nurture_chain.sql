-- Migration 054: Signal nurture chain (the main funnel)
-- Extends the SIGNAL_EXTRACTED sequence from a single welcome (046) into a full
-- 6-touch converting chain. Value-first: welcome → exercise → story → offer →
-- proof → soft close. The offer emails (day5/8/12) branch by the lead's bucket
-- at send time (strategy → session, else → challenge) — the Hive is paused
-- until redefined. Templates live in lib/email/templates.ts. Enqueued by
-- /api/signal/extract (live) and scripts/backfill-signal-nurture.mjs (past leads).

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES
  ('SIGNAL_EXTRACTED',  24, 'אות שלא עושים איתו כלום הוא רק משפט יפה',          'signal_day1',  TRUE),
  ('SIGNAL_EXTRACTED',  72, 'האנשים הכי מוכשרים שאני מכירה — בלתי נראים',       'signal_day3',  TRUE),
  ('SIGNAL_EXTRACTED', 120, 'לדעת את האות זה הקל. החלק הקשה הוא אחר',           'signal_day5',  TRUE),
  ('SIGNAL_EXTRACTED', 192, 'מה בעצם קורה (וזה לא עוד תוכן)',                    'signal_day8',  TRUE),
  ('SIGNAL_EXTRACTED', 288, 'האות שלך עדיין כאן',                                'signal_day12', TRUE)
ON CONFLICT DO NOTHING;
