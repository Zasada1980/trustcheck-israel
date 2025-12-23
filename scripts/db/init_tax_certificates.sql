-- Tax Certificates Cache Table
-- Source: taxinfo.taxes.gov.il/gmishurim/
-- Purpose: Cache bookkeeping approvals and withholding tax certificates
-- TTL: 7 days (configurable)

-- Drop table if exists (for clean reinstall)
DROP TABLE IF EXISTS tax_certificates CASCADE;

-- Main table for tax certificates data
CREATE TABLE tax_certificates (
    -- Primary identifier
    hp_number BIGINT PRIMARY KEY,
    
    -- Company identification
    company_name TEXT NOT NULL,
    
    -- Tax file numbers
    vat_file BIGINT,  -- תיק מע"מ
    withholding_tax_file BIGINT,  -- תיק מ"ה
    
    -- Bookkeeping approval (ניהול ספרים)
    bookkeeping_approval BOOLEAN NOT NULL DEFAULT FALSE,
    bookkeeping_expiration DATE,  -- תוקף אישור
    bookkeeping_status TEXT,  -- "יש אישור" / "אין אישור" / "לא ידוע"
    
    -- Withholding tax certificates (ניכוי מס במקור) - JSONB for flexibility
    withholding_tax_certificates JSONB,
    /* Expected structure:
    {
        "services": "עפ''י תקנות מ''ה",  // שרותים נכסים
        "construction": "עפ''י תקנות מ''ה",  // בניה והובלה
        "security_cleaning": "אין אישור",  // שמירה ניקיון
        "production": "עפ''י תקנות מ''ה",  // שרותי הפקה
        "consulting": "עפ''י תקנות מ''ה",  // ייעוץ
        "planning_advertising": "עפ''י תקנות מ''ה",  // תכנון ופרסום
        "it_services": "עפ''י תקנות מ''ה",  // שרותי מחשוב
        "insurance_pension": "אין אישור"  // ביטוח ופנסיה
    }
    */
    
    -- Metadata
    source_url TEXT DEFAULT 'https://taxinfo.taxes.gov.il/gmishurim/',
    scrape_success BOOLEAN NOT NULL DEFAULT TRUE,
    scrape_error TEXT,  -- Error message if scraping failed
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tax_certs_last_updated ON tax_certificates(last_updated);
CREATE INDEX idx_tax_certs_bookkeeping ON tax_certificates(bookkeeping_approval) WHERE bookkeeping_approval = FALSE;  -- Find companies without approval
CREATE INDEX idx_tax_certs_scrape_success ON tax_certificates(scrape_success) WHERE scrape_success = FALSE;  -- Monitor failures

-- GIN index for JSONB queries (withholding tax categories)
CREATE INDEX idx_tax_certs_withholding_jsonb ON tax_certificates USING GIN (withholding_tax_certificates);

-- Statistics view
CREATE OR REPLACE VIEW tax_certificates_stats AS
SELECT
    COUNT(*) AS total_companies,
    COUNT(*) FILTER (WHERE bookkeeping_approval = TRUE) AS with_bookkeeping_approval,
    COUNT(*) FILTER (WHERE bookkeeping_approval = FALSE) AS without_bookkeeping_approval,
    COUNT(*) FILTER (WHERE scrape_success = FALSE) AS scrape_failures,
    AVG(EXTRACT(EPOCH FROM (NOW() - last_updated)) / 86400) AS avg_cache_age_days,
    COUNT(*) FILTER (WHERE last_updated > NOW() - INTERVAL '7 days') AS fresh_cache_count,
    COUNT(*) FILTER (WHERE last_updated <= NOW() - INTERVAL '7 days') AS stale_cache_count
FROM tax_certificates;

-- Helper function: Check if cache is fresh (< 7 days old)
CREATE OR REPLACE FUNCTION is_cache_fresh(hp BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM tax_certificates
        WHERE hp_number = hp
        AND last_updated > NOW() - INTERVAL '7 days'
        AND scrape_success = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Helper function: Get stale cache count (for monitoring)
CREATE OR REPLACE FUNCTION get_stale_cache_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM tax_certificates WHERE last_updated <= NOW() - INTERVAL '7 days')::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Sample data for testing (company 515972651 from user example)
INSERT INTO tax_certificates (
    hp_number,
    company_name,
    vat_file,
    withholding_tax_file,
    bookkeeping_approval,
    bookkeeping_status,
    withholding_tax_certificates
) VALUES (
    515972651,
    'א.א.ג ארט עיצוב ושירות בע"מ',
    515972651,
    515972651,
    FALSE,
    'אין אישור',
    '{
        "services": "עפ''י תקנות מ''ה",
        "construction": "עפ''י תקנות מ''ה",
        "security_cleaning": "עפ''י תקנות מ''ה",
        "production": "עפ''י תקנות מ''ה",
        "consulting": "עפ''י תקנות מ''ה",
        "planning_advertising": "עפ''י תקנות מ''ה",
        "it_services": "עפ''י תקנות מ''ה",
        "insurance_pension": "אין אישור"
    }'::jsonb
) ON CONFLICT (hp_number) DO UPDATE SET
    company_name = EXCLUDED.company_name,
    vat_file = EXCLUDED.vat_file,
    withholding_tax_file = EXCLUDED.withholding_tax_file,
    bookkeeping_approval = EXCLUDED.bookkeeping_approval,
    bookkeeping_status = EXCLUDED.bookkeeping_status,
    withholding_tax_certificates = EXCLUDED.withholding_tax_certificates,
    last_updated = NOW();

-- Display statistics
SELECT * FROM tax_certificates_stats;

-- Test queries
-- 1. Check if company 515972651 cache is fresh
SELECT hp_number, company_name, bookkeeping_approval, 
       EXTRACT(EPOCH FROM (NOW() - last_updated)) / 86400 AS cache_age_days,
       is_cache_fresh(hp_number) AS is_fresh
FROM tax_certificates 
WHERE hp_number = 515972651;

-- 2. Find companies without bookkeeping approval
SELECT hp_number, company_name, bookkeeping_status
FROM tax_certificates
WHERE bookkeeping_approval = FALSE
ORDER BY last_updated DESC
LIMIT 10;

-- 3. Find companies with specific withholding tax issues (no IT services approval)
SELECT hp_number, company_name,
       withholding_tax_certificates->'it_services' AS it_services_status
FROM tax_certificates
WHERE withholding_tax_certificates->>'it_services' = 'אין אישור'
LIMIT 10;

COMMENT ON TABLE tax_certificates IS 'Cache for Israeli Tax Authority certificates (bookkeeping + withholding tax). TTL: 7 days. Source: taxinfo.taxes.gov.il';
COMMENT ON COLUMN tax_certificates.hp_number IS 'Israeli company HP number (ח.פ.) - 9 digits';
COMMENT ON COLUMN tax_certificates.bookkeeping_approval IS 'Has valid bookkeeping approval (ניהול ספרים תקין)';
COMMENT ON COLUMN tax_certificates.withholding_tax_certificates IS 'JSONB: 8 categories of withholding tax certificates (ניכוי מס במקור)';
COMMENT ON COLUMN tax_certificates.last_updated IS 'Cache timestamp - refresh if older than 7 days';
