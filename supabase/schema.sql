-- ================================================================
-- PropPulse — Supabase Database Schema
-- Run this in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. REGIONS (states, metros, cities, zips)
-- ============================================
CREATE TABLE IF NOT EXISTS regions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  type TEXT CHECK (type IN ('state', 'metro', 'city', 'zip')) DEFAULT 'state',
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PRICE TRENDS (time-series pricing data)
-- ============================================
CREATE TABLE IF NOT EXISTS price_trends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial')) NOT NULL,
  median_price DECIMAL,
  price_per_sqft DECIMAL,
  yoy_change DECIMAL,
  mom_change DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MARKET METRICS (inventory, days on market)
-- ============================================
CREATE TABLE IF NOT EXISTS market_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial')) NOT NULL,
  median_days_on_market INTEGER,
  inventory_count INTEGER,
  new_listings INTEGER,
  pending_sales INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. USER PREFERENCES (saved markets, alerts)
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  alerts_enabled BOOLEAN DEFAULT false,
  alert_threshold DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, region_id)
);

-- ============================================
-- 5. INDEXES for query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_price_trends_region ON price_trends(region_id);
CREATE INDEX IF NOT EXISTS idx_price_trends_date ON price_trends(date);
CREATE INDEX IF NOT EXISTS idx_price_trends_type ON price_trends(property_type);
CREATE INDEX IF NOT EXISTS idx_price_trends_region_date ON price_trends(region_id, date);
CREATE INDEX IF NOT EXISTS idx_market_metrics_region ON market_metrics(region_id);
CREATE INDEX IF NOT EXISTS idx_market_metrics_type ON market_metrics(property_type);
CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON user_preferences(user_id);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================
-- Allow anyone to read regions and price data (public dashboard)
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Public read access for regions
CREATE POLICY "Regions are publicly readable"
  ON regions FOR SELECT
  USING (true);

-- Public read access for price trends
CREATE POLICY "Price trends are publicly readable"
  ON price_trends FOR SELECT
  USING (true);

-- Public read access for market metrics
CREATE POLICY "Market metrics are publicly readable"
  ON market_metrics FOR SELECT
  USING (true);

-- User preferences: users can only see/edit their own
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
  ON user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. SEED DATA — 15 US States
-- ============================================
INSERT INTO regions (name, state, type, latitude, longitude) VALUES
  ('California', 'CA', 'state', 36.78, -119.42),
  ('Texas', 'TX', 'state', 31.97, -99.90),
  ('Florida', 'FL', 'state', 27.66, -81.52),
  ('New York', 'NY', 'state', 42.17, -74.95),
  ('Illinois', 'IL', 'state', 40.63, -89.40),
  ('Washington', 'WA', 'state', 47.75, -120.74),
  ('Colorado', 'CO', 'state', 39.55, -105.78),
  ('Arizona', 'AZ', 'state', 34.05, -111.09),
  ('Georgia', 'GA', 'state', 32.16, -82.90),
  ('North Carolina', 'NC', 'state', 35.76, -79.02),
  ('Ohio', 'OH', 'state', 40.42, -82.91),
  ('Michigan', 'MI', 'state', 44.31, -85.60),
  ('Pennsylvania', 'PA', 'state', 41.20, -77.19),
  ('Nevada', 'NV', 'state', 38.80, -116.42),
  ('Tennessee', 'TN', 'state', 35.52, -86.58);
