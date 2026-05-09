-- Inbound WhatsApp signals: emoji reactions + text replies from leads.
-- type: 'reaction' | 'reply'
-- sentiment: 'positive' | 'negative' | 'neutral'
CREATE TABLE whatsapp_inbound (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
  phone       TEXT        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('reaction', 'reply')),
  content     TEXT,
  sentiment   TEXT        NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  score_delta INTEGER     NOT NULL DEFAULT 0,
  uchat_uid   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON whatsapp_inbound (user_id);
CREATE INDEX ON whatsapp_inbound (phone);
CREATE UNIQUE INDEX whatsapp_inbound_dedup
  ON whatsapp_inbound (uchat_uid, type, content)
  WHERE uchat_uid IS NOT NULL;
