-- TrustCheck Israel Database Schema v3
-- Adds CheckID-equivalent free data sources
-- Date: 2025-12-23

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table 1: Companies Registry (EXISTING - from v2)
-- =====================================================
-- Already created in init_v2.sql
-- Columns: id, hp_number, name_hebrew, name_english, etc.

-- =====================================================
-- Table 2: Bank of Israel - Restricted Accounts (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS boi_mugbalim (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    id_number TEXT NOT NULL,              -- ת.ז or ח.פ (9 digits)
    name_hebrew TEXT NOT NULL,            -- Full name in Hebrew
    account_type TEXT CHECK (account_type IN ('individual', 'business')),
    
    -- Restriction details
    restriction_date DATE NOT NULL,       -- Date restriction started
    bank_name TEXT,                       -- Bank that imposed restriction
    bank_code TEXT,                       -- Bank identifier
    
    -- Status
    status TEXT CHECK (status IN ('active', 'removed')) DEFAULT 'active',
    removal_date DATE,                    -- If status='removed'
    
    -- Metadata
    data_source TEXT DEFAULT 'boi.org.il',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT unique_mugbalim_record UNIQUE (id_number, restriction_date)
);

-- Indexes for fast search
CREATE INDEX IF NOT EXISTS idx_mugbalim_id_search 
    ON boi_mugbalim(id_number) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_mugbalim_status 
    ON boi_mugbalim(status);
CREATE INDEX IF NOT EXISTS idx_mugbalim_updated 
    ON boi_mugbalim(last_updated);

-- =====================================================
-- Table 3: Tax Authority Status Cache (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_authority_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Business identity
    hp_number BIGINT NOT NULL,            -- Company HP number
    business_name TEXT,                   -- Hebrew name
    
    -- VAT (Maam) registration
    is_maam_registered BOOLEAN DEFAULT FALSE,
    is_maam_exempt BOOLEAN DEFAULT FALSE,
    maam_number TEXT,                     -- מספר עוסק מורשה
    maam_registration_date DATE,
    
    -- Withholding tax (Nikui Bamakor)
    has_nikui_bamakor BOOLEAN DEFAULT FALSE,
    nikui_registration_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    verification_method TEXT,             -- 'api' or 'inferred'
    
    -- Metadata
    data_source TEXT DEFAULT 'tax.gov.il',
    last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT unique_tax_status UNIQUE (hp_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tax_hp_search 
    ON tax_authority_status(hp_number);
CREATE INDEX IF NOT EXISTS idx_tax_maam_registered 
    ON tax_authority_status(is_maam_registered) WHERE is_active = TRUE;

-- =====================================================
-- Table 4: Legal Cases (Courts) (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS legal_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Case identity
    case_number TEXT NOT NULL UNIQUE,     -- מספר תיק
    case_type TEXT NOT NULL,              -- סוג תיק (civil, commercial, etc.)
    court_name TEXT NOT NULL,             -- בית המשפט
    
    -- Parties
    plaintiff TEXT,                       -- תובע
    plaintiff_id TEXT,                    -- ת.ז or ח.פ
    defendant TEXT,                       -- נתבע
    defendant_id TEXT,                    -- ת.ז or ח.פ
    
    -- Case details
    subject TEXT,                         -- נושא התביעה
    amount NUMERIC(15, 2),                -- סכום (if applicable)
    filing_date DATE,                     -- תאריך הגשה
    status TEXT CHECK (status IN ('active', 'closed', 'pending')),
    last_update DATE,
    
    -- Links
    case_url TEXT,                        -- Link to court portal
    
    -- Metadata
    data_source TEXT DEFAULT 'court.gov.il',
    last_scraped TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for search by party ID
CREATE INDEX IF NOT EXISTS idx_cases_plaintiff_id 
    ON legal_cases(plaintiff_id);
CREATE INDEX IF NOT EXISTS idx_cases_defendant_id 
    ON legal_cases(defendant_id);
CREATE INDEX IF NOT EXISTS idx_cases_status 
    ON legal_cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type 
    ON legal_cases(case_type);

-- Full-text search on party names
CREATE INDEX IF NOT EXISTS idx_cases_plaintiff_text 
    ON legal_cases USING gin(to_tsvector('hebrew', plaintiff));
CREATE INDEX IF NOT EXISTS idx_cases_defendant_text 
    ON legal_cases USING gin(to_tsvector('hebrew', defendant));

-- =====================================================
-- Table 5: Execution Proceedings (Hotzaa LaPoal) (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS execution_proceedings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Proceeding identity
    proceeding_number TEXT NOT NULL UNIQUE,  -- מספר תיק הוצל"פ
    execution_office TEXT NOT NULL,          -- משרד ההוצל"פ
    
    -- Debtor
    debtor_name TEXT NOT NULL,
    debtor_id TEXT NOT NULL,                 -- ת.ז or ח.פ
    
    -- Creditor
    creditor_name TEXT NOT NULL,
    creditor_id TEXT,
    
    -- Debt details
    amount NUMERIC(15, 2) NOT NULL,          -- סכום החוב
    filing_date DATE NOT NULL,
    status TEXT CHECK (status IN ('active', 'closed', 'suspended')) DEFAULT 'active',
    
    -- Payment plan
    has_payment_plan BOOLEAN DEFAULT FALSE,
    monthly_payment NUMERIC(10, 2),
    
    -- Actions
    last_action TEXT,
    last_action_date DATE,
    
    -- Metadata
    data_source TEXT DEFAULT 'hotzaa.court.gov.il',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for debtor search
CREATE INDEX IF NOT EXISTS idx_execution_debtor_id 
    ON execution_proceedings(debtor_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_execution_status 
    ON execution_proceedings(status);
CREATE INDEX IF NOT EXISTS idx_execution_amount 
    ON execution_proceedings(amount DESC);
CREATE INDEX IF NOT EXISTS idx_execution_filing 
    ON execution_proceedings(filing_date DESC);

-- Full-text search on debtor name
CREATE INDEX IF NOT EXISTS idx_execution_debtor_text 
    ON execution_proceedings USING gin(to_tsvector('hebrew', debtor_name));

-- =====================================================
-- Table 6: Data Source Health Monitoring (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS data_source_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    source_name TEXT NOT NULL,            -- 'data.gov.il', 'court.gov.il', etc.
    source_type TEXT NOT NULL,            -- 'api', 'scraper', 'file'
    
    -- Health metrics
    is_operational BOOLEAN DEFAULT TRUE,
    last_successful_fetch TIMESTAMP,
    last_failed_fetch TIMESTAMP,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Performance
    average_response_time_ms INTEGER,
    success_rate_24h NUMERIC(5, 2),       -- Percentage (0-100)
    
    -- Data freshness
    records_count BIGINT DEFAULT 0,
    last_data_update TIMESTAMP,
    
    -- Metadata
    error_message TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_source_name UNIQUE (source_name)
);

-- Insert initial health records
INSERT INTO data_source_health (source_name, source_type, is_operational, records_count) VALUES
    ('data.gov.il', 'api', TRUE, 0),
    ('companies_registry', 'scraper', TRUE, 716714),
    ('boi.org.il', 'file', TRUE, 0),
    ('tax.gov.il', 'api', FALSE, 0),
    ('court.gov.il', 'scraper', TRUE, 0),
    ('hotzaa.court.gov.il', 'scraper', TRUE, 0)
ON CONFLICT (source_name) DO NOTHING;

-- =====================================================
-- View: Complete Business Profile (NEW)
-- =====================================================
CREATE OR REPLACE VIEW business_complete_profile AS
SELECT 
    cr.hp_number,
    cr.name_hebrew,
    cr.name_english,
    cr.company_type,
    cr.status AS registration_status,
    cr.registration_date,
    
    -- Tax status
    ts.is_maam_registered,
    ts.is_maam_exempt,
    ts.maam_number,
    
    -- Restricted accounts
    EXISTS(SELECT 1 FROM boi_mugbalim bm 
           WHERE bm.id_number::BIGINT = cr.hp_number 
           AND bm.status = 'active') AS has_restricted_account,
    
    -- Legal cases count
    (SELECT COUNT(*) FROM legal_cases lc 
     WHERE lc.defendant_id = cr.hp_number::TEXT 
     AND lc.status = 'active') AS active_legal_cases,
    
    -- Execution proceedings
    (SELECT COUNT(*) FROM execution_proceedings ep 
     WHERE ep.debtor_id = cr.hp_number::TEXT 
     AND ep.status = 'active') AS active_debt_proceedings,
     
    (SELECT COALESCE(SUM(ep.amount), 0) FROM execution_proceedings ep 
     WHERE ep.debtor_id = cr.hp_number::TEXT 
     AND ep.status = 'active') AS total_active_debt,
    
    -- Metadata
    cr.last_updated AS data_last_updated
    
FROM companies_registry cr
LEFT JOIN tax_authority_status ts ON ts.hp_number = cr.hp_number;

-- =====================================================
-- Functions: Risk Calculation (NEW)
-- =====================================================

-- Calculate overall business risk score (0-100)
CREATE OR REPLACE FUNCTION calculate_business_risk(p_hp_number BIGINT)
RETURNS INTEGER AS $$
DECLARE
    v_risk_score INTEGER := 0;
    v_has_mugbalim BOOLEAN;
    v_active_cases INTEGER;
    v_total_debt NUMERIC;
    v_bankruptcy_cases INTEGER;
BEGIN
    -- Check Bank of Israel restrictions (+30 points)
    SELECT EXISTS(SELECT 1 FROM boi_mugbalim 
                  WHERE id_number::BIGINT = p_hp_number 
                  AND status = 'active') INTO v_has_mugbalim;
    IF v_has_mugbalim THEN
        v_risk_score := v_risk_score + 30;
    END IF;
    
    -- Count active legal cases (+5 points per case, max 30)
    SELECT COUNT(*) INTO v_active_cases 
    FROM legal_cases 
    WHERE defendant_id = p_hp_number::TEXT 
    AND status = 'active';
    v_risk_score := v_risk_score + LEAST(v_active_cases * 5, 30);
    
    -- Check bankruptcy cases (+40 points if exists)
    SELECT COUNT(*) INTO v_bankruptcy_cases 
    FROM legal_cases 
    WHERE defendant_id = p_hp_number::TEXT 
    AND (case_type LIKE '%פשיטת רגל%' OR case_type LIKE '%פירוק%')
    AND status = 'active';
    IF v_bankruptcy_cases > 0 THEN
        v_risk_score := v_risk_score + 40;
    END IF;
    
    -- Calculate total active debt (+1 point per ₪10K, max 30)
    SELECT COALESCE(SUM(amount), 0) INTO v_total_debt 
    FROM execution_proceedings 
    WHERE debtor_id = p_hp_number::TEXT 
    AND status = 'active';
    v_risk_score := v_risk_score + LEAST((v_total_debt / 10000)::INTEGER, 30);
    
    RETURN LEAST(v_risk_score, 100);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Materialized View: Business Trust Scores (NEW)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS business_trust_scores AS
SELECT 
    hp_number,
    name_hebrew,
    company_type,
    
    -- Calculate risk score (0-100, higher = more risk)
    calculate_business_risk(hp_number) AS risk_score,
    
    -- Trust score is inverse (100 - risk)
    (100 - calculate_business_risk(hp_number)) AS trust_score,
    
    -- Risk category
    CASE 
        WHEN calculate_business_risk(hp_number) >= 70 THEN 'high'
        WHEN calculate_business_risk(hp_number) >= 40 THEN 'medium'
        ELSE 'low'
    END AS risk_category,
    
    -- Last updated
    CURRENT_TIMESTAMP AS calculated_at
    
FROM companies_registry
WHERE status = 'פעילה';

-- Index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_scores_hp 
    ON business_trust_scores(hp_number);

-- Refresh function (call daily)
CREATE OR REPLACE FUNCTION refresh_trust_scores()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY business_trust_scores;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE boi_mugbalim IS 'Bank of Israel restricted accounts (10+ bounced checks)';
COMMENT ON TABLE tax_authority_status IS 'VAT and tax registration status cache';
COMMENT ON TABLE legal_cases IS 'Court cases from Net HaMishpat portal';
COMMENT ON TABLE execution_proceedings IS 'Debt collection proceedings from Hotzaa LaPoal';
COMMENT ON TABLE data_source_health IS 'Health monitoring for all data sources';

COMMENT ON VIEW business_complete_profile IS 'Complete business profile aggregating all data sources';
COMMENT ON MATERIALIZED VIEW business_trust_scores IS 'Pre-calculated trust/risk scores for all active companies';

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO trustcheck_admin;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO trustcheck_readonly;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO trustcheck_admin;

-- Done!
SELECT 'Schema v3 initialized successfully!' AS status;
