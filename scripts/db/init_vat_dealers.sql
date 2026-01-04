-- VAT Dealers Cache Table
-- Stores cached VAT registration status from Tax Authority API
-- Used to enrich company data with עוסק מורשה/פטור status

CREATE TABLE IF NOT EXISTS vat_dealers (
    hp_number BIGINT PRIMARY KEY,
    
    -- VAT Registration
    is_vat_registered BOOLEAN NOT NULL DEFAULT false,  -- עוסק מורשה
    vat_number TEXT,  -- מספר עוסק (usually same as HP)
    registration_date DATE,  -- תאריך רישום
    
    -- Business Classification
    dealer_type TEXT,  -- עוסק מורשה / עוסק פטור / חברה
    business_category TEXT,  -- קטגוריית עסק
    
    -- Tax Compliance
    has_nikui_bamakor BOOLEAN DEFAULT false,  -- ניכוי במקור
    tax_status TEXT,  -- active / suspended / cancelled
    
    -- Bookkeeping Status (ניהול ספרים)
    bookkeeping_status TEXT,  -- יש אישור / אין אישור / לא ידוע
    bookkeeping_expiry_date DATE,  -- תוקף אישור ניהול ספרים
    bookkeeping_last_checked TIMESTAMP,
    
    -- Metadata
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source TEXT DEFAULT 'tax_authority_api',  -- tax_authority_api / manual / scraped
    verification_method TEXT,  -- api / web_scrape / certificate
    
    -- Constraints
    CONSTRAINT valid_dealer_type CHECK (
        dealer_type IN ('עוסק מורשה', 'עוסק פטור', 'חברה בע"מ', 'שותפות רשומה', 'unknown')
    ),
    CONSTRAINT valid_tax_status CHECK (
        tax_status IN ('active', 'suspended', 'cancelled', 'unknown')
    ),
    CONSTRAINT valid_bookkeeping_status CHECK (
        bookkeeping_status IS NULL OR bookkeeping_status IN ('יש אישור', 'אין אישור', 'לא ידוע')
    )
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_vat_dealers_vat_number ON vat_dealers(vat_number);
CREATE INDEX IF NOT EXISTS idx_vat_dealers_registration ON vat_dealers(is_vat_registered);
CREATE INDEX IF NOT EXISTS idx_vat_dealers_last_updated ON vat_dealers(last_updated);
CREATE INDEX IF NOT EXISTS idx_vat_dealers_bookkeeping ON vat_dealers(bookkeeping_status);

-- Add comments
COMMENT ON TABLE vat_dealers IS 'VAT registration and bookkeeping status cache from Tax Authority';
COMMENT ON COLUMN vat_dealers.hp_number IS 'Company HP number (primary key, links to companies_registry)';
COMMENT ON COLUMN vat_dealers.is_vat_registered IS 'Whether business is registered for VAT (עוסק מורשה)';
COMMENT ON COLUMN vat_dealers.bookkeeping_status IS 'Bookkeeping approval status from Tax Authority';
COMMENT ON COLUMN vat_dealers.has_nikui_bamakor IS 'Whether business has withholding tax approval';

-- Function to check if data is stale (>30 days)
CREATE OR REPLACE FUNCTION is_vat_data_stale(hp_num BIGINT) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM vat_dealers 
        WHERE hp_number = hp_num 
        AND last_updated > CURRENT_TIMESTAMP - INTERVAL '30 days'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to upsert VAT dealer data
CREATE OR REPLACE FUNCTION upsert_vat_dealer(
    p_hp_number BIGINT,
    p_is_vat_registered BOOLEAN,
    p_vat_number TEXT DEFAULT NULL,
    p_dealer_type TEXT DEFAULT 'unknown',
    p_tax_status TEXT DEFAULT 'unknown',
    p_bookkeeping_status TEXT DEFAULT 'לא ידוע',
    p_data_source TEXT DEFAULT 'tax_authority_api'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO vat_dealers (
        hp_number, 
        is_vat_registered, 
        vat_number,
        dealer_type,
        tax_status,
        bookkeeping_status,
        data_source,
        last_updated
    ) VALUES (
        p_hp_number,
        p_is_vat_registered,
        p_vat_number,
        p_dealer_type,
        p_tax_status,
        p_bookkeeping_status,
        p_data_source,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (hp_number) DO UPDATE SET
        is_vat_registered = EXCLUDED.is_vat_registered,
        vat_number = COALESCE(EXCLUDED.vat_number, vat_dealers.vat_number),
        dealer_type = EXCLUDED.dealer_type,
        tax_status = EXCLUDED.tax_status,
        bookkeeping_status = EXCLUDED.bookkeeping_status,
        data_source = EXCLUDED.data_source,
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
