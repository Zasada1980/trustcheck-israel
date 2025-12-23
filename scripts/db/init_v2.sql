-- TrustCheck Israel - Database Schema v2 (data.gov.il CSV compatible)
-- Source: מאגר חברות - רשם החברות (f004176c-b85f-4542-8901-7b3176f9a054)
-- Total records: ~716,714 companies (as of 2025-12-22)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing table if needed
DROP TABLE IF EXISTS companies_registry CASCADE;

-- ============================================
-- TABLE: companies_registry (29 columns from data.gov.il)
-- ============================================
CREATE TABLE IF NOT EXISTS companies_registry (
    -- Core company info (columns 1-12)
    hp_number BIGINT PRIMARY KEY,                        -- מספר חברה (column 1)
    name_hebrew TEXT,                                    -- שם חברה (column 2)
    name_english TEXT,                                   -- שם באנגלית (column 3)
    company_type TEXT,                                   -- סוג תאגיד (column 4)
    status TEXT,                                         -- סטטוס חברה (column 5)
    description TEXT,                                    -- תאור חברה (column 6)
    purpose TEXT,                                        -- מטרת החברה (column 7)
    incorporation_date TEXT,                             -- תאריך התאגדות (column 8, format: DD/MM/YYYY)
    government_company TEXT,                             -- חברה ממשלתית (column 9)
    limitations TEXT,                                    -- מגבלות (column 10)
    violations TEXT,                                     -- מפרה (column 11)
    last_annual_report_year TEXT,                        -- שנה אחרונה של דוח שנתי (column 12)
    
    -- Address info (columns 13-20)
    address_city TEXT,                                   -- שם עיר (column 13)
    address_street TEXT,                                 -- שם רחוב (column 14)
    address_house_number TEXT,                           -- מספר בית (column 15)
    address_zipcode TEXT,                                -- מיקוד (column 16)
    address_pobox TEXT,                                  -- ת.ד. (column 17)
    address_country TEXT,                                -- מדינה (column 18)
    address_care_of TEXT,                                -- אצל (column 19)
    status_sub TEXT,                                     -- תת סטטוס (column 20)
    
    -- Codes (columns 21-29)
    status_code TEXT,                                    -- קוד סטטוס חברה (column 21)
    company_type_code TEXT,                              -- קוד סוג חברה (column 22)
    company_classification_code TEXT,                    -- קוד סיווג חברה (column 23)
    purpose_code TEXT,                                   -- קוד מטרת החברה (column 24)
    limitations_code TEXT,                               -- קוד מגבלה (column 25)
    violations_code TEXT,                                -- קוד חברה מפרה (column 26)
    city_code TEXT,                                      -- קוד ישוב (column 27)
    street_code TEXT,                                    -- קוד רחוב (column 28)
    country_code TEXT,                                   -- קוד מדינה (column 29)
    
    -- Metadata
    data_source TEXT DEFAULT 'data.gov.il',
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX idx_companies_hp ON companies_registry(hp_number);
CREATE INDEX idx_companies_name_heb ON companies_registry USING gin(to_tsvector('hebrew', name_hebrew));
CREATE INDEX idx_companies_status ON companies_registry(status);
CREATE INDEX idx_companies_type ON companies_registry(company_type);
CREATE INDEX idx_companies_city ON companies_registry(address_city);
CREATE INDEX idx_companies_incorporation_date ON companies_registry(incorporation_date);

-- Full-text search index (Hebrew + English)
CREATE INDEX idx_companies_fulltext ON companies_registry 
    USING gin(to_tsvector('hebrew', COALESCE(name_hebrew, '') || ' ' || COALESCE(name_english, '')));

-- Comment on table
COMMENT ON TABLE companies_registry IS 'Israeli Companies Registry from data.gov.il (רשם החברות)';
COMMENT ON COLUMN companies_registry.hp_number IS 'Company HP number (מספר חברה) - primary identifier';
COMMENT ON COLUMN companies_registry.status IS 'Company status: פעילה (active), בפירוק (liquidation), etc.';
