-- TrustCheck Israel - Database Schema for Government Data
-- Sources: data.gov.il, ica.justice.gov.il, court.gov.il

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: companies_registry (from data.gov.il)
-- Source: רשם החברות (Companies Registrar)
-- ============================================
CREATE TABLE IF NOT EXISTS companies_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hp_number VARCHAR(9) UNIQUE NOT NULL,  -- מספר חברה
    name_hebrew VARCHAR(255) NOT NULL,     -- שם בעברית
    name_english VARCHAR(255),              -- שם באנגלית
    company_type VARCHAR(100),              -- סוג תאגיד (חברה בע"מ, עוסק מורשה, עוסק פטור)
    status VARCHAR(50),                     -- סטטוס (פעילה, בפירוק, חדלות פרעון)
    registration_date DATE,                 -- תאריך התאגדות
    address_street VARCHAR(255),            -- כתובת - רחוב
    address_city VARCHAR(100),              -- כתובת - עיר
    address_zipcode VARCHAR(10),            -- כתובת - מיקוד
    phone VARCHAR(50),                      -- טלפון
    website VARCHAR(255),                   -- אתר אינטרנט
    email VARCHAR(255),                     -- דואר אלקטרוני
    business_purpose TEXT,                  -- מטרת העסק
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'data.gov.il',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scraped_at TIMESTAMP,
    data_quality_score INTEGER DEFAULT 50,  -- 0-100
    
    -- Indexes
    CONSTRAINT valid_hp_number CHECK (hp_number ~ '^\d{9}$')
);

CREATE INDEX idx_companies_hp ON companies_registry(hp_number);
CREATE INDEX idx_companies_name_heb ON companies_registry(name_hebrew);
CREATE INDEX idx_companies_status ON companies_registry(status);
CREATE INDEX idx_companies_type ON companies_registry(company_type);
CREATE INDEX idx_companies_city ON companies_registry(address_city);

-- ============================================
-- TABLE: company_owners (from ica.justice.gov.il)
-- Source: רשם החברות - בעלים ומנהלים
-- ============================================
CREATE TABLE IF NOT EXISTS company_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_hp_number VARCHAR(9) NOT NULL REFERENCES companies_registry(hp_number) ON DELETE CASCADE,
    owner_name VARCHAR(255) NOT NULL,       -- שם הבעלים/מנהל
    owner_id_number VARCHAR(9),             -- תעודת זהות (optional)
    role VARCHAR(100),                      -- תפקיד (בעלים, מנהל, דירקטור)
    share_percentage DECIMAL(5,2),          -- אחוזי החזקה (0.00-100.00)
    appointment_date DATE,                  -- תאריך מינוי
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'ica.justice.gov.il',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_owners_company ON company_owners(company_hp_number);
CREATE INDEX idx_owners_name ON company_owners(owner_name);

-- ============================================
-- TABLE: legal_cases (from court.gov.il)
-- Source: נט המשפט (Court Network)
-- ============================================
CREATE TABLE IF NOT EXISTS legal_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_hp_number VARCHAR(9) NOT NULL REFERENCES companies_registry(hp_number) ON DELETE CASCADE,
    case_number VARCHAR(50) UNIQUE NOT NULL, -- מספר תיק
    case_type VARCHAR(100),                   -- סוג תיק (אזרחי, מסחרי, פלילי)
    court_name VARCHAR(255),                  -- שם בית משפט
    plaintiff VARCHAR(255),                   -- תובע
    defendant VARCHAR(255),                   -- נתבע
    case_status VARCHAR(50),                  -- סטטוס (פעיל, נסגר, תלוי ועומד)
    filing_date DATE,                         -- תאריך הגשה
    closing_date DATE,                        -- תאריך סגירה
    amount DECIMAL(15,2),                     -- סכום (אם רלוונטי)
    description TEXT,                         -- תיאור התיק
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'court.gov.il',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_legal_company ON legal_cases(company_hp_number);
CREATE INDEX idx_legal_case_num ON legal_cases(case_number);
CREATE INDEX idx_legal_status ON legal_cases(case_status);
CREATE INDEX idx_legal_filing_date ON legal_cases(filing_date);

-- ============================================
-- TABLE: execution_proceedings (from data.gov.il)
-- Source: הוצאה לפועל (Execution Office)
-- ============================================
CREATE TABLE IF NOT EXISTS execution_proceedings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_hp_number VARCHAR(9) REFERENCES companies_registry(hp_number) ON DELETE CASCADE,
    proceeding_number VARCHAR(50) UNIQUE NOT NULL, -- מספר תיק הוצל"פ
    debtor_name VARCHAR(255),                      -- שם החייב
    creditor_name VARCHAR(255),                    -- שם הזוכה
    debt_amount DECIMAL(15,2),                     -- סכום החוב
    proceeding_status VARCHAR(50),                 -- סטטוס
    opening_date DATE,                             -- תאריך פתיחה
    closing_date DATE,                             -- תאריך סגירה
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'data.gov.il',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_execution_company ON execution_proceedings(company_hp_number);
CREATE INDEX idx_execution_debtor ON execution_proceedings(debtor_name);

-- ============================================
-- TABLE: scraping_logs (for monitoring)
-- Track scraping success/failures
-- ============================================
CREATE TABLE IF NOT EXISTS scraping_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(50) NOT NULL,            -- 'ica.justice.gov.il', 'court.gov.il', 'data.gov.il'
    operation VARCHAR(50) NOT NULL,         -- 'search_company', 'search_cases', 'bulk_download'
    hp_number VARCHAR(9),                   -- если релевантно
    status VARCHAR(20) NOT NULL,            -- 'success', 'failure', 'rate_limited', 'timeout'
    error_message TEXT,                     -- если error
    response_time_ms INTEGER,               -- время ответа в мс
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_source ON scraping_logs(source);
CREATE INDEX idx_logs_status ON scraping_logs(status);
CREATE INDEX idx_logs_created ON scraping_logs(created_at);

-- ============================================
-- TABLE: data_sync_status (for tracking updates)
-- Track when datasets were last synced from data.gov.il
-- ============================================
CREATE TABLE IF NOT EXISTS data_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_name VARCHAR(100) UNIQUE NOT NULL,  -- 'companies_registry', 'legal_cases', 'execution_proceedings'
    last_sync_date TIMESTAMP,                   -- последняя синхронизация
    next_sync_date TIMESTAMP,                   -- следующая синхронизация (usually +30 days)
    records_imported INTEGER DEFAULT 0,         -- количество импортированных записей
    sync_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'in_progress', 'completed', 'failed'
    sync_duration_seconds INTEGER,              -- длительность синхронизации
    error_message TEXT
);

INSERT INTO data_sync_status (dataset_name, next_sync_date) VALUES
    ('companies_registry', CURRENT_TIMESTAMP),
    ('legal_cases', CURRENT_TIMESTAMP),
    ('execution_proceedings', CURRENT_TIMESTAMP);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_companies_timestamp
    BEFORE UPDATE ON companies_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER update_owners_timestamp
    BEFORE UPDATE ON company_owners
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();

CREATE TRIGGER update_legal_timestamp
    BEFORE UPDATE ON legal_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated();

-- ============================================
-- VIEWS (for easier querying)
-- ============================================

-- View: Complete company profile with owners
CREATE OR REPLACE VIEW company_profiles AS
SELECT 
    c.*,
    COALESCE(
        json_agg(
            json_build_object(
                'name', o.owner_name,
                'role', o.role,
                'sharePercentage', o.share_percentage
            )
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'::json
    ) AS owners
FROM companies_registry c
LEFT JOIN company_owners o ON c.hp_number = o.company_hp_number
GROUP BY c.id;

-- View: Companies with legal issues
CREATE OR REPLACE VIEW companies_with_legal_issues AS
SELECT 
    c.hp_number,
    c.name_hebrew,
    c.company_type,
    c.status,
    COUNT(l.id) FILTER (WHERE l.case_status = 'פעיל') AS active_cases,
    COUNT(l.id) AS total_cases,
    COUNT(e.id) AS execution_proceedings,
    SUM(e.debt_amount) AS total_debt
FROM companies_registry c
LEFT JOIN legal_cases l ON c.hp_number = l.company_hp_number
LEFT JOIN execution_proceedings e ON c.hp_number = e.company_hp_number
GROUP BY c.hp_number, c.name_hebrew, c.company_type, c.status;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trustcheck_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trustcheck_admin;
GRANT USAGE ON SCHEMA public TO trustcheck_admin;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'TrustCheck Database Schema created successfully!';
    RAISE NOTICE 'Tables: companies_registry, company_owners, legal_cases, execution_proceedings';
    RAISE NOTICE 'Ready to import data from data.gov.il';
END $$;
