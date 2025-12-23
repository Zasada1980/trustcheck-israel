-- ============================================
-- BOI Mugbalim Table (Bank of Israel Restricted Accounts)
-- Source: https://www.boi.org.il/en/restricted-accounts
-- Update: Daily via scripts/download_boi_mugbalim.ps1
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table (if needed for fresh start)
-- DROP TABLE IF EXISTS boi_mugbalim CASCADE;

-- Create main table
CREATE TABLE IF NOT EXISTS boi_mugbalim (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Business/Person identification
    id_number VARCHAR(9) UNIQUE NOT NULL,  -- H.P. (Company) or T.Z. (Person) - 9 digits
    name_hebrew VARCHAR(255),              -- שם בעברית
    name_english VARCHAR(255),             -- Name in English
    
    -- Restriction details
    restriction_date DATE NOT NULL,        -- Date when account was restricted
    bank_name VARCHAR(255),                -- Name of bank (e.g., "Bank Hapoalim", "Bank Leumi")
    reason TEXT,                           -- Reason for restriction (e.g., "10+ returned checks")
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'boi.org.il',  -- Always BOI
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When record was last updated
    
    -- Constraints
    CONSTRAINT valid_id_number CHECK (id_number ~ '^[0-9]{9}$')  -- Must be 9 digits
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_mugbalim_id ON boi_mugbalim(id_number);
CREATE INDEX IF NOT EXISTS idx_mugbalim_date ON boi_mugbalim(restriction_date DESC);
CREATE INDEX IF NOT EXISTS idx_mugbalim_bank ON boi_mugbalim(bank_name);
CREATE INDEX IF NOT EXISTS idx_mugbalim_updated ON boi_mugbalim(last_updated DESC);

-- Full-text search on names (Hebrew + English)
CREATE INDEX IF NOT EXISTS idx_mugbalim_names ON boi_mugbalim 
    USING gin(to_tsvector('hebrew', COALESCE(name_hebrew, '') || ' ' || COALESCE(name_english, '')));

-- Comments
COMMENT ON TABLE boi_mugbalim IS 'Bank of Israel Restricted Accounts (Mugbalim) - Companies/Persons with banking restrictions due to bounced checks or debt';
COMMENT ON COLUMN boi_mugbalim.id_number IS 'Israeli ID: H.P. (חברה פרטית) for companies or T.Z. (תעודת זהות) for individuals - 9 digits';
COMMENT ON COLUMN boi_mugbalim.restriction_date IS 'Date when banking account was restricted by BOI';
COMMENT ON COLUMN boi_mugbalim.reason IS 'Reason for restriction, typically "10+ returned checks" or similar';

-- Statistics view (useful for monitoring)
CREATE OR REPLACE VIEW mugbalim_stats AS
SELECT 
    COUNT(*) as total_restricted_accounts,
    COUNT(DISTINCT bank_name) as unique_banks,
    MIN(restriction_date) as oldest_restriction,
    MAX(restriction_date) as newest_restriction,
    MAX(last_updated) as last_data_update,
    COUNT(*) FILTER (WHERE restriction_date > CURRENT_DATE - INTERVAL '1 year') as restricted_last_year,
    COUNT(*) FILTER (WHERE restriction_date > CURRENT_DATE - INTERVAL '1 month') as restricted_last_month
FROM boi_mugbalim;

COMMENT ON VIEW mugbalim_stats IS 'Summary statistics for BOI Mugbalim data';

-- Sample query to test after import
-- SELECT * FROM boi_mugbalim WHERE id_number = '515972651' LIMIT 1;
-- SELECT * FROM mugbalim_stats;
