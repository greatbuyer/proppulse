-- ================================================================
-- Run this in Supabase SQL Editor to seed price_trends + market_metrics
-- This inserts data directly via SQL instead of through the API
-- ================================================================

-- Helper function to generate seeded deterministic data
-- We'll insert data directly instead of using the API

-- First, let's create a temporary function for seeded random
CREATE OR REPLACE FUNCTION seed_data() RETURNS void AS $$
DECLARE
  r RECORD;
  cfg RECORD;
  d DATE;
  res_price DECIMAL;
  com_price DECIMAL;
  prev_res_price DECIMAL;
  prev_com_price DECIMAL;
  prev_year_res DECIMAL;
  prev_year_com DECIMAL;
  month_counter INTEGER;
  base_days INTEGER;
  base_inventory INTEGER;
  seed_val DECIMAL;
BEGIN
  -- Loop through each region and insert sample price trends
  FOR r IN SELECT id, state FROM regions LOOP

    -- Get config for each state
    CASE r.state
      WHEN 'CA' THEN res_price := 550000; com_price := 380;
      WHEN 'TX' THEN res_price := 280000; com_price := 220;
      WHEN 'FL' THEN res_price := 320000; com_price := 250;
      WHEN 'NY' THEN res_price := 420000; com_price := 450;
      WHEN 'IL' THEN res_price := 240000; com_price := 200;
      WHEN 'WA' THEN res_price := 480000; com_price := 340;
      WHEN 'CO' THEN res_price := 430000; com_price := 300;
      WHEN 'AZ' THEN res_price := 330000; com_price := 240;
      WHEN 'GA' THEN res_price := 270000; com_price := 190;
      WHEN 'NC' THEN res_price := 290000; com_price := 200;
      WHEN 'OH' THEN res_price := 190000; com_price := 150;
      WHEN 'MI' THEN res_price := 210000; com_price := 160;
      WHEN 'PA' THEN res_price := 250000; com_price := 180;
      WHEN 'NV' THEN res_price := 360000; com_price := 260;
      WHEN 'TN' THEN res_price := 270000; com_price := 190;
      ELSE res_price := 300000; com_price := 200;
    END CASE;

    prev_res_price := res_price;
    prev_com_price := com_price;
    prev_year_res := res_price;
    prev_year_com := com_price;
    month_counter := 0;

    -- Generate 7 years of monthly data (2020-2026)
    FOR d IN SELECT generate_series('2020-01-01'::date, '2026-12-01'::date, '1 month'::interval)::date LOOP
      -- Grow prices with some variation
      seed_val := (HASHTEXT(r.state || d::text)::decimal / 2147483647.0);
      res_price := res_price * (1 + 0.005 + seed_val * 0.008);
      com_price := com_price * (1 + 0.004 + seed_val * 0.005);

      -- Insert residential
      INSERT INTO price_trends (region_id, date, property_type, median_price, price_per_sqft, yoy_change, mom_change)
      VALUES (
        r.id, d, 'residential',
        ROUND(res_price),
        ROUND(res_price / 1800),
        CASE WHEN month_counter >= 12 THEN ROUND(((res_price - prev_year_res) / prev_year_res * 100)::decimal, 2) ELSE 0 END,
        ROUND(((res_price - prev_res_price) / prev_res_price * 100)::decimal, 2)
      );

      -- Insert commercial
      INSERT INTO price_trends (region_id, date, property_type, median_price, price_per_sqft, yoy_change, mom_change)
      VALUES (
        r.id, d, 'commercial',
        ROUND(com_price * 1000),
        ROUND(com_price),
        CASE WHEN month_counter >= 12 THEN ROUND(((com_price - prev_year_com) / prev_year_com * 100)::decimal, 2) ELSE 0 END,
        ROUND(((com_price - prev_com_price) / prev_com_price * 100)::decimal, 2)
      );

      -- Track previous prices
      IF month_counter >= 12 THEN
        prev_year_res := res_price / (1 + 0.005 + seed_val * 0.008);
        prev_year_com := com_price / (1 + 0.004 + seed_val * 0.005);
      END IF;
      prev_res_price := res_price;
      prev_com_price := com_price;
      month_counter := month_counter + 1;
    END LOOP;

    -- Insert market metrics for current month
    base_days := 20 + ABS(HASHTEXT(r.state)) % 30;
    base_inventory := 5000 + ABS(HASHTEXT(r.state || 'inv')) % 50000;

    INSERT INTO market_metrics (region_id, date, property_type, median_days_on_market, inventory_count, new_listings, pending_sales)
    VALUES (
      r.id, '2026-02-01', 'residential',
      base_days + ABS(HASHTEXT(r.state || 'dom')) % 10,
      base_inventory + ABS(HASHTEXT(r.state || 'cnt')) % 5000,
      ROUND(base_inventory * 0.12),
      ROUND(base_inventory * 0.08)
    );

    INSERT INTO market_metrics (region_id, date, property_type, median_days_on_market, inventory_count, new_listings, pending_sales)
    VALUES (
      r.id, '2026-02-01', 'commercial',
      base_days + 20 + ABS(HASHTEXT(r.state || 'cdom')) % 20,
      ROUND(base_inventory * 0.3),
      ROUND(base_inventory * 0.04),
      ROUND(base_inventory * 0.02)
    );

  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the seeding function
SELECT seed_data();

-- Clean up the function
DROP FUNCTION seed_data();

-- Verify the data
SELECT 'price_trends' as table_name, COUNT(*) as row_count FROM price_trends
UNION ALL
SELECT 'market_metrics', COUNT(*) FROM market_metrics
UNION ALL
SELECT 'regions', COUNT(*) FROM regions;
