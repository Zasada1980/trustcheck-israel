-- ============================================
-- TrustCheck Israel - AI-Optimized Database Schema v4
-- ============================================
-- Purpose: Easy-to-read structure for AI/LLM analysis
-- Date: 27.12.2025
-- Optimizations:
--   - Clear naming (English, descriptive)
--   - Normalized values (boolean, enums, dates)
--   - AI-friendly text fields (clean, searchable)
--   - Computed risk scores (pre-calculated)
--   - Consolidated views (single-query access)
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- Drop old tables (clean start)
DROP TABLE IF EXISTS ai_business_profiles CASCADE;
DROP TABLE IF EXISTS ai_risk_indicators CASCADE;
DROP TABLE IF EXISTS ai_financial_status CASCADE;
DROP TABLE IF EXISTS ai_legal_history CASCADE;
DROP TABLE IF EXISTS ai_compliance_records CASCADE;
DROP TABLE IF EXISTS ai_analysis_cache CASCADE;

-- ============================================
-- MASTER TABLE: ai_business_profiles
-- Single source of truth for all business data
-- ============================================
CREATE TABLE ai_business_profiles (
    -- Primary Identity
    business_id BIGINT PRIMARY KEY,                     -- H.P. Number (מספר חברה/עוסק)
    business_name TEXT NOT NULL,                        -- Name in Hebrew
    business_name_en TEXT,                              -- Name in English
    business_name_clean TEXT,                           -- Cleaned for AI (lowercase, no special chars)
    
    -- Business Type (Simplified for AI)
    business_category TEXT NOT NULL,                    -- 'company' | 'osek_morsheh' | 'osek_patur'
    business_type_full TEXT,                            -- Full description (e.g., "חברה בע״מ")
    business_type_code INTEGER,                         -- Numeric code for ML
    
    -- Status (Clear Boolean + Text)
    is_active BOOLEAN NOT NULL DEFAULT true,            -- true = active, false = inactive
    status_text TEXT,                                   -- 'active' | 'liquidation' | 'bankrupt' | 'dissolved'
    status_reason TEXT,                                 -- Why inactive (if applicable)
    status_since DATE,                                  -- Date of status change
    
    -- Registration & Dates
    registration_date DATE,                             -- תאריך התאגדות
    registration_age_days INTEGER GENERATED ALWAYS AS  -- Auto-calculated
        (CURRENT_DATE - registration_date) STORED,
    last_annual_report_year INTEGER,                    -- Last annual report submitted
    years_since_report INTEGER GENERATED ALWAYS AS      -- Auto-calculated
        (EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER - last_annual_report_year) STORED,
    
    -- Compliance Flags (Boolean for AI)
    is_government_owned BOOLEAN DEFAULT false,          -- חברה ממשלתית
    has_violations BOOLEAN DEFAULT false,               -- מפרה (violates laws)
    violation_type TEXT,                                -- Description of violation
    has_limitations BOOLEAN DEFAULT false,              -- מוגבלת (limited company)
    limitation_type TEXT,                               -- Description of limitation
    
    -- Address (Structured)
    address_full TEXT,                                  -- Full address for display
    address_city TEXT,                                  -- City name
    address_street TEXT,                                -- Street name
    address_number TEXT,                                -- House number
    address_zipcode TEXT,                               -- Postal code
    address_country TEXT DEFAULT 'ישראל',               -- Country (default Israel)
    
    -- Contact (Sparse data)
    phone TEXT,
    email TEXT,
    website TEXT,
    
    -- Business Purpose (AI-readable)
    purpose_text TEXT,                                  -- תאור עיסוק (clean text)
    purpose_keywords TEXT[],                            -- Extracted keywords for search
    
    -- Data Quality & Freshness
    data_completeness_score INTEGER DEFAULT 0,          -- 0-100 (how much data we have)
    data_source TEXT DEFAULT 'data.gov.il',             -- Primary source
    data_last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_verified BOOLEAN DEFAULT false,                -- Human verification flag
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX idx_business_id ON ai_business_profiles(business_id);
CREATE INDEX idx_business_name_clean ON ai_business_profiles USING gin(business_name_clean gin_trgm_ops);
CREATE INDEX idx_business_category ON ai_business_profiles(business_category);
CREATE INDEX idx_business_active ON ai_business_profiles(is_active);
CREATE INDEX idx_business_city ON ai_business_profiles(address_city);
CREATE INDEX idx_business_violations ON ai_business_profiles(has_violations) WHERE has_violations = true;
CREATE INDEX idx_business_updated ON ai_business_profiles(data_last_updated DESC);

COMMENT ON TABLE ai_business_profiles IS 'AI-optimized master table for all Israeli businesses';

-- ============================================
-- TABLE: ai_risk_indicators
-- Pre-calculated risk scores for AI analysis
-- ============================================
CREATE TABLE ai_risk_indicators (
    business_id BIGINT PRIMARY KEY REFERENCES ai_business_profiles(business_id) ON DELETE CASCADE,
    
    -- Risk Categories (0-100 score, higher = more risk)
    overall_risk_score INTEGER DEFAULT 50,              -- Composite risk score
    
    -- Financial Risk
    financial_risk_score INTEGER DEFAULT 0,             -- Bank restrictions, debt, etc.
    has_bank_restrictions BOOLEAN DEFAULT false,        -- BOI Mugbalim blacklist
    bank_restriction_date DATE,                         -- When added to blacklist
    has_tax_debt BOOLEAN DEFAULT false,                 -- Tax Authority debt
    tax_debt_amount DECIMAL(15,2) DEFAULT 0,            -- Total tax debt (₪)
    has_execution_proceedings BOOLEAN DEFAULT false,    -- Hotzaa Lapoal cases
    execution_debt_amount DECIMAL(15,2) DEFAULT 0,      -- Total execution debt (₪)
    
    -- Legal Risk
    legal_risk_score INTEGER DEFAULT 0,                 -- Lawsuits, criminal cases
    active_lawsuits_count INTEGER DEFAULT 0,            -- Open court cases
    total_lawsuits_count INTEGER DEFAULT 0,             -- All-time cases
    criminal_cases_count INTEGER DEFAULT 0,             -- Criminal cases
    last_lawsuit_date DATE,                             -- Most recent case
    
    -- Operational Risk
    operational_risk_score INTEGER DEFAULT 0,           -- Age, reports, violations
    is_new_business BOOLEAN GENERATED ALWAYS AS         -- < 1 year old
        (CURRENT_DATE - (SELECT registration_date FROM ai_business_profiles WHERE business_id = ai_risk_indicators.business_id) < INTERVAL '1 year') STORED,
    missing_annual_reports BOOLEAN DEFAULT false,       -- > 2 years since last report
    has_regulatory_violations BOOLEAN DEFAULT false,    -- Government penalties
    
    -- Trust Indicators (Positive factors, lower = better trust)
    positive_indicators_count INTEGER DEFAULT 0,        -- Count of good signals
    has_valid_tax_certificate BOOLEAN DEFAULT false,    -- Current tax compliance
    has_recent_annual_report BOOLEAN DEFAULT false,     -- Report within 1 year
    business_longevity_years INTEGER DEFAULT 0,         -- Years in operation
    
    -- AI Summary
    risk_summary TEXT,                                  -- Human-readable summary
    risk_level TEXT,                                    -- 'low' | 'medium' | 'high' | 'critical'
    recommended_action TEXT,                            -- AI recommendation
    
    -- Metadata
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    calculation_version TEXT DEFAULT 'v1.0'
);

CREATE INDEX idx_risk_overall ON ai_risk_indicators(overall_risk_score DESC);
CREATE INDEX idx_risk_level ON ai_risk_indicators(risk_level);
CREATE INDEX idx_risk_financial ON ai_risk_indicators(financial_risk_score DESC);
CREATE INDEX idx_risk_legal ON ai_risk_indicators(legal_risk_score DESC);

COMMENT ON TABLE ai_risk_indicators IS 'Pre-calculated risk scores for AI/ML consumption';

-- ============================================
-- TABLE: ai_financial_status
-- Financial health indicators (BOI, Tax, Debt)
-- ============================================
CREATE TABLE ai_financial_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id BIGINT NOT NULL REFERENCES ai_business_profiles(business_id) ON DELETE CASCADE,
    
    -- Record Type
    record_type TEXT NOT NULL,                          -- 'boi_mugbalim' | 'tax_debt' | 'execution'
    record_status TEXT NOT NULL,                        -- 'active' | 'resolved' | 'pending'
    
    -- BOI Mugbalim (Bank Restrictions)
    boi_restriction_id TEXT,                            -- Unique BOI record ID
    boi_restriction_reason TEXT,                        -- Why restricted
    boi_restriction_start_date DATE,
    boi_restriction_end_date DATE,
    
    -- Tax Authority
    tax_debt_id TEXT,                                   -- Tax Authority case ID
    tax_debt_type TEXT,                                 -- 'income_tax' | 'vat' | 'other'
    tax_debt_amount DECIMAL(15,2),
    tax_debt_currency TEXT DEFAULT 'ILS',
    tax_debt_status TEXT,                               -- 'open' | 'payment_plan' | 'closed'
    
    -- Execution Proceedings (Hotzaa Lapoal)
    execution_file_number TEXT,                         -- תיק הוצל"פ
    execution_creditor_name TEXT,                       -- Creditor name
    execution_debt_amount DECIMAL(15,2),
    execution_open_date DATE,
    execution_close_date DATE,
    
    -- Common Fields
    severity_level TEXT,                                -- 'low' | 'medium' | 'high' | 'critical'
    amount_total DECIMAL(15,2),                         -- Total amount (unified)
    data_source TEXT,                                   -- 'boi.gov.il' | 'taxes.gov.il' | 'data.gov.il'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_financial_business ON ai_financial_status(business_id);
CREATE INDEX idx_financial_type ON ai_financial_status(record_type);
CREATE INDEX idx_financial_status ON ai_financial_status(record_status);
CREATE INDEX idx_financial_severity ON ai_financial_status(severity_level);

COMMENT ON TABLE ai_financial_status IS 'Financial health records (bank, tax, debt)';

-- ============================================
-- TABLE: ai_legal_history
-- Legal cases and court proceedings
-- ============================================
CREATE TABLE ai_legal_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id BIGINT NOT NULL REFERENCES ai_business_profiles(business_id) ON DELETE CASCADE,
    
    -- Case Identity
    case_number TEXT NOT NULL,                          -- מספר תיק
    case_type TEXT,                                     -- 'civil' | 'commercial' | 'criminal' | 'administrative'
    court_name TEXT,                                    -- Name of court
    court_location TEXT,                                -- City/region
    
    -- Parties
    plaintiff_name TEXT,                                -- Plaintiff (תובע)
    defendant_name TEXT,                                -- Defendant (נתבע)
    business_role TEXT,                                 -- 'plaintiff' | 'defendant' | 'third_party'
    
    -- Case Details
    case_status TEXT,                                   -- 'open' | 'closed' | 'pending_appeal' | 'dismissed'
    case_subject TEXT,                                  -- Subject matter (debt, contract, etc.)
    case_description TEXT,                              -- Clean description for AI
    
    -- Financial Impact
    claim_amount DECIMAL(15,2),                         -- Amount claimed (₪)
    judgment_amount DECIMAL(15,2),                      -- Amount awarded (₪)
    
    -- Timeline
    filing_date DATE,                                   -- Date filed
    closing_date DATE,                                  -- Date closed
    case_duration_days INTEGER GENERATED ALWAYS AS      -- Auto-calculated
        (closing_date - filing_date) STORED,
    
    -- AI Analysis
    case_severity TEXT,                                 -- 'low' | 'medium' | 'high'
    case_outcome TEXT,                                  -- 'favorable' | 'unfavorable' | 'settled' | 'pending'
    
    -- Data Source
    data_source TEXT DEFAULT 'court.gov.il',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_legal_business ON ai_legal_history(business_id);
CREATE INDEX idx_legal_case_num ON ai_legal_history(case_number);
CREATE INDEX idx_legal_type ON ai_legal_history(case_type);
CREATE INDEX idx_legal_status ON ai_legal_history(case_status);
CREATE INDEX idx_legal_filing ON ai_legal_history(filing_date DESC);

COMMENT ON TABLE ai_legal_history IS 'Court cases and legal proceedings';

-- ============================================
-- TABLE: ai_compliance_records
-- Regulatory compliance and government reports
-- ============================================
CREATE TABLE ai_compliance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id BIGINT NOT NULL REFERENCES ai_business_profiles(business_id) ON DELETE CASCADE,
    
    -- Record Type
    compliance_type TEXT NOT NULL,                      -- 'annual_report' | 'tax_certificate' | 'license' | 'permit'
    compliance_status TEXT NOT NULL,                    -- 'valid' | 'expired' | 'pending' | 'suspended'
    
    -- Annual Reports
    report_year INTEGER,                                -- Year of report
    report_submitted BOOLEAN DEFAULT false,             -- Was report submitted?
    report_submission_date DATE,
    report_late BOOLEAN DEFAULT false,                  -- Submitted after deadline?
    
    -- Tax Certificates (תעודת ניכוי מס במקור)
    tax_cert_number TEXT,                               -- Certificate ID
    tax_cert_valid_from DATE,
    tax_cert_valid_until DATE,
    tax_cert_is_valid BOOLEAN GENERATED ALWAYS AS       -- Auto-calculated
        (tax_cert_valid_until >= CURRENT_DATE) STORED,
    
    -- Licenses & Permits
    license_type TEXT,                                  -- Type of license
    license_number TEXT,
    license_issuer TEXT,                                -- Issuing authority
    license_valid_from DATE,
    license_valid_until DATE,
    license_renewable BOOLEAN DEFAULT true,
    
    -- Violations
    has_violation BOOLEAN DEFAULT false,
    violation_description TEXT,
    violation_penalty_amount DECIMAL(15,2),
    violation_resolved BOOLEAN DEFAULT false,
    
    -- Data Source
    data_source TEXT,                                   -- 'registrar' | 'taxes.gov.il' | 'ministry'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compliance_business ON ai_compliance_records(business_id);
CREATE INDEX idx_compliance_type ON ai_compliance_records(compliance_type);
CREATE INDEX idx_compliance_status ON ai_compliance_records(compliance_status);
CREATE INDEX idx_compliance_year ON ai_compliance_records(report_year DESC);

COMMENT ON TABLE ai_compliance_records IS 'Regulatory compliance and government reports';

-- ============================================
-- TABLE: ai_analysis_cache
-- Cache AI-generated analysis to avoid re-computation
-- ============================================
CREATE TABLE ai_analysis_cache (
    business_id BIGINT PRIMARY KEY REFERENCES ai_business_profiles(business_id) ON DELETE CASCADE,
    
    -- Trust Score (1-5 stars)
    trust_score DECIMAL(2,1) CHECK (trust_score BETWEEN 1.0 AND 5.0),
    trust_level TEXT,                                   -- 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
    
    -- AI-Generated Summary (Hebrew)
    summary_hebrew TEXT,                                -- Summary in Hebrew for display
    summary_english TEXT,                               -- Summary in English (optional)
    
    -- Strengths (Positive factors)
    strengths TEXT[],                                   -- Array of strength descriptions
    strengths_count INTEGER DEFAULT 0,
    
    -- Risks (Negative factors)
    risks TEXT[],                                       -- Array of risk descriptions
    risks_count INTEGER DEFAULT 0,
    
    -- Recommendations (Parent-focused)
    recommendations TEXT[],                             -- Array of actionable recommendations
    recommendations_priority TEXT,                      -- 'low' | 'medium' | 'high'
    
    -- AI Model Info
    model_name TEXT DEFAULT 'gemini-2.0-flash',         -- AI model used
    model_version TEXT,
    analysis_prompt_version TEXT DEFAULT 'v1.0',
    
    -- Metadata
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    is_stale BOOLEAN GENERATED ALWAYS AS                -- Auto-calculated
        (CURRENT_TIMESTAMP > expires_at) STORED,
    generation_time_ms INTEGER,                         -- Time to generate (performance tracking)
    
    -- Usage Tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP
);

CREATE INDEX idx_cache_trust_score ON ai_analysis_cache(trust_score DESC);
CREATE INDEX idx_cache_generated ON ai_analysis_cache(generated_at DESC);
CREATE INDEX idx_cache_stale ON ai_analysis_cache(is_stale) WHERE is_stale = true;

COMMENT ON TABLE ai_analysis_cache IS 'Cached AI analysis to reduce Gemini API calls';

-- ============================================
-- MATERIALIZED VIEW: ai_business_summary
-- Consolidated view for single-query access
-- ============================================
CREATE MATERIALIZED VIEW ai_business_summary AS
SELECT 
    bp.business_id,
    bp.business_name,
    bp.business_name_en,
    bp.business_category,
    bp.is_active,
    bp.status_text,
    bp.registration_date,
    bp.registration_age_days,
    bp.has_violations,
    bp.address_city,
    bp.data_completeness_score,
    
    -- Risk Indicators
    ri.overall_risk_score,
    ri.risk_level,
    ri.financial_risk_score,
    ri.legal_risk_score,
    ri.operational_risk_score,
    ri.has_bank_restrictions,
    ri.has_tax_debt,
    ri.has_execution_proceedings,
    ri.active_lawsuits_count,
    ri.positive_indicators_count,
    
    -- Financial Summary
    COALESCE(SUM(fs.amount_total) FILTER (WHERE fs.record_status = 'active'), 0) as total_active_debt,
    COUNT(fs.id) FILTER (WHERE fs.record_type = 'boi_mugbalim' AND fs.record_status = 'active') as active_bank_restrictions,
    
    -- Legal Summary
    COUNT(lh.id) FILTER (WHERE lh.case_status = 'open') as open_legal_cases,
    COUNT(lh.id) as total_legal_cases,
    
    -- Compliance Summary
    MAX(cr.report_year) as last_annual_report_year,
    COUNT(cr.id) FILTER (WHERE cr.compliance_type = 'tax_certificate' AND cr.tax_cert_is_valid = true) as valid_tax_certs,
    
    -- Cached Analysis
    ac.trust_score,
    ac.trust_level,
    ac.summary_hebrew,
    ac.strengths_count,
    ac.risks_count,
    ac.generated_at as analysis_date,
    
    -- Metadata
    bp.data_last_updated

FROM ai_business_profiles bp
LEFT JOIN ai_risk_indicators ri ON bp.business_id = ri.business_id
LEFT JOIN ai_financial_status fs ON bp.business_id = fs.business_id
LEFT JOIN ai_legal_history lh ON bp.business_id = lh.business_id
LEFT JOIN ai_compliance_records cr ON bp.business_id = cr.business_id
LEFT JOIN ai_analysis_cache ac ON bp.business_id = ac.business_id

GROUP BY 
    bp.business_id, bp.business_name, bp.business_name_en, bp.business_category,
    bp.is_active, bp.status_text, bp.registration_date, bp.registration_age_days,
    bp.has_violations, bp.address_city, bp.data_completeness_score,
    ri.overall_risk_score, ri.risk_level, ri.financial_risk_score, ri.legal_risk_score,
    ri.operational_risk_score, ri.has_bank_restrictions, ri.has_tax_debt,
    ri.has_execution_proceedings, ri.active_lawsuits_count, ri.positive_indicators_count,
    ac.trust_score, ac.trust_level, ac.summary_hebrew, ac.strengths_count,
    ac.risks_count, ac.generated_at, bp.data_last_updated;

CREATE UNIQUE INDEX idx_summary_business_id ON ai_business_summary(business_id);
CREATE INDEX idx_summary_risk_score ON ai_business_summary(overall_risk_score DESC);
CREATE INDEX idx_summary_trust_score ON ai_business_summary(trust_score DESC);
CREATE INDEX idx_summary_active ON ai_business_summary(is_active);

COMMENT ON MATERIALIZED VIEW ai_business_summary IS 'Consolidated single-query view for AI analysis';

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_business_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ai_business_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER trg_update_business_profiles
    BEFORE UPDATE ON ai_business_profiles
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_financial_status
    BEFORE UPDATE ON ai_financial_status
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_legal_history
    BEFORE UPDATE ON ai_legal_history
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_update_compliance_records
    BEFORE UPDATE ON ai_compliance_records
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================
-- HELPER FUNCTIONS FOR AI QUERIES
-- ============================================

-- Function: Get complete business profile for AI
CREATE OR REPLACE FUNCTION get_ai_business_profile(p_business_id BIGINT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'business', row_to_json(bp.*),
        'risk', row_to_json(ri.*),
        'financial', (SELECT json_agg(row_to_json(fs.*)) FROM ai_financial_status fs WHERE fs.business_id = p_business_id),
        'legal', (SELECT json_agg(row_to_json(lh.*)) FROM ai_legal_history lh WHERE lh.business_id = p_business_id),
        'compliance', (SELECT json_agg(row_to_json(cr.*)) FROM ai_compliance_records cr WHERE cr.business_id = p_business_id),
        'cached_analysis', row_to_json(ac.*)
    ) INTO result
    FROM ai_business_profiles bp
    LEFT JOIN ai_risk_indicators ri ON bp.business_id = ri.business_id
    LEFT JOIN ai_analysis_cache ac ON bp.business_id = ac.business_id
    WHERE bp.business_id = p_business_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_ai_business_profile IS 'Returns complete business profile as JSON for AI consumption';

-- Function: Calculate data completeness score
CREATE OR REPLACE FUNCTION calculate_completeness_score(p_business_id BIGINT)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    bp ai_business_profiles%ROWTYPE;
BEGIN
    SELECT * INTO bp FROM ai_business_profiles WHERE business_id = p_business_id;
    
    -- Basic info (30 points)
    IF bp.business_name IS NOT NULL THEN score := score + 10; END IF;
    IF bp.business_category IS NOT NULL THEN score := score + 10; END IF;
    IF bp.registration_date IS NOT NULL THEN score := score + 10; END IF;
    
    -- Address (20 points)
    IF bp.address_city IS NOT NULL THEN score := score + 10; END IF;
    IF bp.address_street IS NOT NULL THEN score := score + 10; END IF;
    
    -- Purpose (10 points)
    IF bp.purpose_text IS NOT NULL THEN score := score + 10; END IF;
    
    -- Financial data (20 points)
    IF EXISTS(SELECT 1 FROM ai_financial_status WHERE business_id = p_business_id) THEN
        score := score + 20;
    END IF;
    
    -- Legal data (10 points)
    IF EXISTS(SELECT 1 FROM ai_legal_history WHERE business_id = p_business_id) THEN
        score := score + 10;
    END IF;
    
    -- Compliance data (10 points)
    IF EXISTS(SELECT 1 FROM ai_compliance_records WHERE business_id = p_business_id) THEN
        score := score + 10;
    END IF;
    
    RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_completeness_score IS 'Calculates data completeness score (0-100)';

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trustcheck_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trustcheck_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO trustcheck_admin;
GRANT USAGE ON SCHEMA public TO trustcheck_admin;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ AI-Optimized Database Schema v4 created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '  • ai_business_profiles (master table)';
    RAISE NOTICE '  • ai_risk_indicators (pre-calculated scores)';
    RAISE NOTICE '  • ai_financial_status (BOI, tax, debt)';
    RAISE NOTICE '  • ai_legal_history (court cases)';
    RAISE NOTICE '  • ai_compliance_records (reports, certificates)';
    RAISE NOTICE '  • ai_analysis_cache (Gemini cache)';
    RAISE NOTICE '';
    RAISE NOTICE 'Views Created:';
    RAISE NOTICE '  • ai_business_summary (single-query consolidated view)';
    RAISE NOTICE '';
    RAISE NOTICE 'Helper Functions:';
    RAISE NOTICE '  • get_ai_business_profile(business_id) → JSON';
    RAISE NOTICE '  • calculate_completeness_score(business_id) → INTEGER';
    RAISE NOTICE '  • refresh_business_summary() → VOID';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for AI/ML workloads!';
END $$;
