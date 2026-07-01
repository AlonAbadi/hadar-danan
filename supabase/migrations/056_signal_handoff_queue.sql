-- Migration 056: Signal handoff queue (תור האות)
-- Practical, minimal handoff state machine for Hadar's manual WhatsApp workflow.
--
-- Flow (all manual, no automation):
--   handoff_stage = NULL            → lead sits in the queue ("תור")
--   handoff_stage = 'whatsapp_sent' → Hadar clicked "שלח ווטסאפ" (message composed + opened)
--   handoff_stage = 'meeting_booked'→ Hadar marked "סגר פגישה"
--
-- Removal from the list is computed at read time: a lead in 'meeting_booked'
-- that ALSO has a completed purchase (paid) is filtered out of the admin view.
-- We do NOT store "paid" here — purchases is the source of truth for payment.

ALTER TABLE signal_extractions
  ADD COLUMN IF NOT EXISTS handoff_stage      text
    CHECK (handoff_stage IN ('whatsapp_sent','meeting_booked')),
  ADD COLUMN IF NOT EXISTS handoff_wa_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS handoff_booked_at  timestamptz,
  ADD COLUMN IF NOT EXISTS handoff_by         text;

-- Index the open-handoff rows for the queue view (freshest first).
CREATE INDEX IF NOT EXISTS idx_signal_ext_handoff
  ON signal_extractions (handoff_stage, generated_at DESC);
