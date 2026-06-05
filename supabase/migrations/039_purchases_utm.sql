-- Migration 039: Capture per-purchase UTM attribution.
--
-- Why: the dashboard joins purchases → users → users.utm_campaign to attribute
-- revenue to Meta campaigns. This loses attribution for any buyer whose user
-- row has null utm (organic signup) but who came back via a Meta retargeting
-- ad to purchase. Storing utm on the purchase itself captures the campaign
-- that actually drove the conversion.

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS utm_source   TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium   TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_content  TEXT,
  ADD COLUMN IF NOT EXISTS utm_term     TEXT,
  ADD COLUMN IF NOT EXISTS utm_adset    TEXT,
  ADD COLUMN IF NOT EXISTS utm_ad       TEXT,
  ADD COLUMN IF NOT EXISTS click_id     TEXT;

CREATE INDEX IF NOT EXISTS idx_purchases_utm_campaign ON purchases (utm_campaign);
CREATE INDEX IF NOT EXISTS idx_purchases_utm_source   ON purchases (utm_source);

NOTIFY pgrst, 'reload schema';
