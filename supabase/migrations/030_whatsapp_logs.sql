-- Tracks WhatsApp messages sent via the Business Cloud API.
-- Used for deduplication (same role as email_logs for SEND_EMAIL jobs).

CREATE TABLE whatsapp_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_name  TEXT        NOT NULL,
  phone          TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'sent', -- sent | failed
  wa_message_id  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevents double-sends when the job runner retries a job.
-- One successful send per (user, template) is enough.
CREATE UNIQUE INDEX whatsapp_logs_dedup
  ON whatsapp_logs(user_id, template_name)
  WHERE status = 'sent';
