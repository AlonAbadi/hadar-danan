-- 058_handoff_dismissed.sql
--
-- Extends the handoff_stage CHECK constraint on users so Hadar can
-- explicitly dismiss a lead from the /admin/today worklist without
-- sending WhatsApp. Powers the "לא רלבנטי" button on the handoff card.
--
-- New state:
--   'dismissed' — Hadar reviewed the lead and decided not to contact.
--                 Filtered out of getImmediateLeads read.
--
-- Existing states preserved: whatsapp_sent, meeting_booked, NULL (queue).

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_handoff_stage_check;

ALTER TABLE users
  ADD CONSTRAINT users_handoff_stage_check
  CHECK (handoff_stage IN ('whatsapp_sent', 'meeting_booked', 'dismissed'));

-- Existing idx_users_handoff_stage index is still valid — no rebuild needed.
