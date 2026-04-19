CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  brand_logo_url TEXT,
  category TEXT NOT NULL DEFAULT 'כללי',
  product_description TEXT NOT NULL,
  discount_text TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  store_url TEXT,
  expires_at DATE,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active deals" ON deals
  FOR SELECT USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_deals_display_order ON deals(display_order);
CREATE INDEX IF NOT EXISTS idx_deals_is_active ON deals(is_active);
