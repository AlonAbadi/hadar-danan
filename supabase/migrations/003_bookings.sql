-- ============================================================
-- Migration 003: Booking system for strategy sessions
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS bookings (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  user_id     UUID         REFERENCES users(id),
  name        TEXT         NOT NULL,
  email       TEXT         NOT NULL,
  phone       TEXT         NOT NULL,
  slot_date   DATE         NOT NULL,
  slot_time   TEXT         NOT NULL,   -- e.g. '10:00'
  status      TEXT         NOT NULL DEFAULT 'confirmed',  -- confirmed | cancelled
  notes       TEXT
);

-- Only one confirmed booking per time slot
CREATE UNIQUE INDEX IF NOT EXISTS bookings_slot_unique
  ON bookings(slot_date, slot_time)
  WHERE status = 'confirmed';

-- Fast lookup by date range
CREATE INDEX IF NOT EXISTS bookings_slot_date_idx ON bookings(slot_date);

-- Verify
SELECT COUNT(*) AS total_bookings FROM bookings;
