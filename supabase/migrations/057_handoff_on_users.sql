-- Migration 057: Handoff state on users (unified "לידים לטיפול מיידי" worklist)
--
-- The handoff is about a PERSON, not one extraction. Moving the stage onto the
-- users row lets the daily worklist merge leads from multiple sources (signal
-- strategy leads + high-value quiz leads) and dedupe them per person, with one
-- shared state machine:
--
--   handoff_stage = NULL             → sits in the queue ("תור")
--   handoff_stage = 'whatsapp_sent'  → Hadar clicked "שלח ווטסאפ"
--   handoff_stage = 'meeting_booked' → Hadar marked "סגר פגישה"
--
-- A booked lead who also has a completed purchase (paid) is filtered out of the
-- worklist at read time. purchases stays the source of truth for payment.
--
-- (Migration 056 added the same columns on signal_extractions; those are now
--  superseded by these and left unused — harmless.)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS handoff_stage      text
    CHECK (handoff_stage IN ('whatsapp_sent','meeting_booked')),
  ADD COLUMN IF NOT EXISTS handoff_wa_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS handoff_booked_at  timestamptz,
  ADD COLUMN IF NOT EXISTS handoff_by         text;

CREATE INDEX IF NOT EXISTS idx_users_handoff_stage ON users (handoff_stage);
