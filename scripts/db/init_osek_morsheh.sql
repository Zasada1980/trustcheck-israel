-- Schema for עוסק מורשה (VAT Registered Dealers)
-- Purpose: Store individual business dealers (HP NOT starting with 5)
-- Created: 25.12.2025

-- Drop existing table if exists
DROP TABLE IF EXISTS osek_morsheh CASCADE;

-- Create main table
CREATE TABLE osek_morsheh (
  -- Primary identification
  hp_number BIGINT PRIMARY KEY,
  business_name TEXT NOT NULL,
  
  -- Business classification
  dealer_type VARCHAR(50) DEFAULT 'עוסק מורשה',
  is_vat_registered BOOLEAN DEFAULT true,
  vat_number VARCHAR(20), -- מספר עוסק בעסקאות (actual VAT ID)
  
  -- Registration info
  registration_date DATE,
  cancellation_date DATE,
  tax_status VARCHAR(20) DEFAULT 'active', -- active/cancelled/suspended
  
  -- Business details
  business_type TEXT, -- סוג עסק (e.g., freelance, retail, services)
  business_sector VARCHAR(100), -- מגזר (e.g., technology, food, construction)
  legal_form VARCHAR(50), -- שותפות/עוסק פרטי
  
  -- Location
  city TEXT,
  street TEXT,
  house_number VARCHAR(20),
  postal_code VARCHAR(10),
  full_address TEXT,
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(500),
  
  -- Financial indicators (if available)
  estimated_revenue DECIMAL(15, 2), -- Estimated annual revenue
  employee_count INT,
  
  -- Data provenance
  data_source VARCHAR(50) NOT NULL, -- 'tax_authority', 'scraping', 'business_licenses', 'economy_ministry'
  source_url TEXT,
  source_file_name TEXT,
  
  -- Metadata
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending/verified/failed
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT osek_hp_not_5 CHECK (hp_number::TEXT NOT LIKE '5%'),
  CONSTRAINT osek_tax_status_valid CHECK (tax_status IN ('active', 'cancelled', 'suspended', 'unknown')),
  CONSTRAINT osek_verification_status_valid CHECK (verification_status IN ('pending', 'verified', 'failed'))
);

-- Create indexes for performance
CREATE INDEX idx_osek_tax_status ON osek_morsheh(tax_status) WHERE tax_status = 'active';
CREATE INDEX idx_osek_city ON osek_morsheh(city);
CREATE INDEX idx_osek_business_type ON osek_morsheh(business_type);
CREATE INDEX idx_osek_data_source ON osek_morsheh(data_source);
CREATE INDEX idx_osek_vat_registered ON osek_morsheh(is_vat_registered);
CREATE INDEX idx_osek_last_verified ON osek_morsheh(last_verified_at);

-- Full-text search index for business names (Hebrew support)
CREATE INDEX idx_osek_business_name_fts ON osek_morsheh USING gin(to_tsvector('hebrew', business_name));

-- Function: Check if data is stale (older than 30 days)
CREATE OR REPLACE FUNCTION is_osek_data_stale(hp BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT last_verified_at < NOW() - INTERVAL '30 days'
    FROM osek_morsheh
    WHERE hp_number = hp
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Upsert עוסק מורשה record
CREATE OR REPLACE FUNCTION upsert_osek_morsheh(
  p_hp_number BIGINT,
  p_business_name TEXT,
  p_dealer_type VARCHAR(50),
  p_is_vat_registered BOOLEAN,
  p_tax_status VARCHAR(20),
  p_data_source VARCHAR(50),
  p_city TEXT DEFAULT NULL,
  p_business_type TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO osek_morsheh (
    hp_number,
    business_name,
    dealer_type,
    is_vat_registered,
    tax_status,
    data_source,
    city,
    business_type,
    last_verified_at,
    updated_at
  ) VALUES (
    p_hp_number,
    p_business_name,
    p_dealer_type,
    p_is_vat_registered,
    p_tax_status,
    p_data_source,
    p_city,
    p_business_type,
    NOW(),
    NOW()
  )
  ON CONFLICT (hp_number) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    dealer_type = EXCLUDED.dealer_type,
    is_vat_registered = EXCLUDED.is_vat_registered,
    tax_status = EXCLUDED.tax_status,
    city = COALESCE(EXCLUDED.city, osek_morsheh.city),
    business_type = COALESCE(EXCLUDED.business_type, osek_morsheh.business_type),
    last_verified_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_osek_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER osek_update_timestamp
BEFORE UPDATE ON osek_morsheh
FOR EACH ROW
EXECUTE FUNCTION update_osek_timestamp();

-- Statistics view
CREATE OR REPLACE VIEW osek_morsheh_stats AS
SELECT
  dealer_type,
  tax_status,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM osek_morsheh) * 100, 2) as percentage,
  MIN(hp_number) as min_hp,
  MAX(hp_number) as max_hp,
  data_source
FROM osek_morsheh
GROUP BY dealer_type, tax_status, data_source
ORDER BY count DESC;

-- Grant permissions (adjust user as needed)
GRANT SELECT, INSERT, UPDATE ON osek_morsheh TO trustcheck_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trustcheck_admin;

-- Comments
COMMENT ON TABLE osek_morsheh IS 'VAT registered individual business dealers (עוסק מורשה) - HP numbers NOT starting with 5';
COMMENT ON COLUMN osek_morsheh.hp_number IS 'Business registration number (ח.פ.) - must NOT start with 5';
COMMENT ON COLUMN osek_morsheh.vat_number IS 'VAT identification number (מספר עוסק בעסקאות)';
COMMENT ON COLUMN osek_morsheh.data_source IS 'Source of data: tax_authority/scraping/business_licenses/economy_ministry';
COMMENT ON CONSTRAINT osek_hp_not_5 ON osek_morsheh IS 'Ensures HP number does NOT start with 5 (companies use 5xx prefix)';

-- Test data validation
DO $$
BEGIN
  -- Test: Try to insert HP starting with 5 (should fail)
  BEGIN
    INSERT INTO osek_morsheh (hp_number, business_name, data_source)
    VALUES (515044532, 'Test Company', 'test');
    RAISE EXCEPTION 'CHECK constraint failed - HP starting with 5 was allowed!';
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✓ CHECK constraint working: HP starting with 5 rejected';
  END;
  
  -- Test: Insert valid עוסק מורשה (should succeed)
  INSERT INTO osek_morsheh (hp_number, business_name, dealer_type, data_source)
  VALUES (312345678, 'Test עוסק מורשה', 'עוסק מורשה', 'test')
  ON CONFLICT (hp_number) DO NOTHING;
  
  RAISE NOTICE '✓ Valid עוסק מורשה inserted successfully';
  
  -- Clean up test data
  DELETE FROM osek_morsheh WHERE hp_number = 312345678;
  
  RAISE NOTICE '✓ Schema validation complete';
END $$;

-- Print summary
SELECT 
  'osek_morsheh table created successfully' as status,
  COUNT(*) as current_records
FROM osek_morsheh;
