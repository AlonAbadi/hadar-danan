-- Migration 060: day-3 fallback email for boiling (strategy-bucket) leads.
--
-- A strategy-bucket extraction promises a personal reach-out from Hadar
-- (the concierge lane: founder alert email + top of /admin/today). If no
-- meeting is booked within 3 days, this email is the insurance policy:
-- it re-opens the conversation AND carries the self-serve fallback
-- (כוורת האות ₪590) so a cooling boiling lead still has something to buy.
--
-- Enqueued by /api/signal/extract only when bucket='strategy'. The send-email
-- handler suppresses it at send time if by then the lead booked a meeting,
-- was dismissed, or already purchased anything.

INSERT INTO email_sequences (trigger_event, delay_hours, subject, template_key, active)
VALUES (
  'SIGNAL_STRATEGY_LEAD',
  72,
  'האות שלכם עדיין כאן',
  'signal_strategy_fallback',
  TRUE
)
ON CONFLICT DO NOTHING;
