-- ============================================
-- Migration Script: Old Schema → AI-Optimized Schema
-- ============================================
-- Purpose: Migrate data from companies_registry to ai_business_profiles
-- Date: 27.12.2025
-- Estimated Time: 5-10 minutes for 716K records
-- ============================================

-- Step 1: Backup existing data (optional but recommended)
CREATE TABLE IF NOT EXISTS companies_registry_backup AS SELECT * FROM companies_registry;

-- Step 2: Migrate to ai_business_profiles
INSERT INTO ai_business_profiles (
    business_id,
    business_name,
    business_name_en,
    business_name_clean,
    business_category,
    business_type_full,
    business_type_code,
    is_active,
    status_text,
    status_reason,
    registration_date,
    last_annual_report_year,
    is_government_owned,
    has_violations,
    violation_type,
    has_limitations,
    limitation_type,
    address_full,
    address_city,
    address_street,
    address_number,
    address_zipcode,
    address_country,
    purpose_text,
    data_completeness_score,
    data_source,
    data_last_updated
)
SELECT 
    -- Primary Identity
    hp_number::BIGINT as business_id,
    name_hebrew as business_name,
    name_english as business_name_en,
    LOWER(REGEXP_REPLACE(COALESCE(name_hebrew, ''), '[^א-ת0-9a-zA-Z ]', '', 'g')) as business_name_clean,
    
    -- Business Category (simplified logic)
    CASE 
        WHEN company_type ILIKE '%עוסק מורשה%' THEN 'osek_morsheh'
        WHEN company_type ILIKE '%עוסק פטור%' THEN 'osek_patur'
        WHEN company_type ILIKE '%בע"מ%' OR company_type ILIKE '%בע״מ%' THEN 'company'
        WHEN company_type ILIKE '%חברה%' THEN 'company'
        ELSE 'company'
    END as business_category,
    
    company_type as business_type_full,
    
    -- Business Type Code (numeric mapping)
    CASE 
        WHEN company_type_code IS NOT NULL AND company_type_code ~ '^\d+$' 
        THEN company_type_code::INTEGER
        ELSE NULL
    END as business_type_code,
    
    -- Status (Boolean + Text)
    CASE 
        WHEN status ILIKE '%פעיל%' OR status ILIKE 'active%' THEN true
        WHEN status ILIKE '%פירוק%' OR status ILIKE '%liquidat%' THEN false
        WHEN status ILIKE '%חדל%' OR status ILIKE '%bankrupt%' THEN false
        ELSE true
    END as is_active,
    
    CASE 
        WHEN status ILIKE '%פעיל%' THEN 'active'
        WHEN status ILIKE '%פירוק%' THEN 'liquidation'
        WHEN status ILIKE '%חדל%' THEN 'bankrupt'
        WHEN status ILIKE '%מחוק%' THEN 'dissolved'
        ELSE 'active'
    END as status_text,
    
    status_sub as status_reason,
    
    -- Registration Date (parse DD/MM/YYYY format)
    CASE 
        WHEN incorporation_date ~ '^\d{2}/\d{2}/\d{4}$' THEN
            TO_DATE(incorporation_date, 'DD/MM/YYYY')
        ELSE NULL
    END as registration_date,
    
    -- Last Annual Report
    CASE 
        WHEN last_annual_report_year ~ '^\d{4}$' THEN last_annual_report_year::INTEGER
        ELSE NULL
    END as last_annual_report_year,
    
    -- Compliance Flags
    CASE 
        WHEN government_company ILIKE 'כן%' OR government_company ILIKE 'yes%' THEN true
        ELSE false
    END as is_government_owned,
    
    CASE 
        WHEN violations IS NOT NULL AND violations != '' THEN true
        WHEN violations_code = '18' THEN true
        ELSE false
    END as has_violations,
    
    violations as violation_type,
    
    CASE 
        WHEN limitations IS NOT NULL AND limitations != '' THEN true
        ELSE false
    END as has_limitations,
    
    limitations as limitation_type,
    
    -- Address (Structured)
    TRIM(CONCAT_WS(', ', 
        address_street,
        address_house_number,
        address_city,
        address_zipcode
    )) as address_full,
    
    address_city,
    address_street,
    address_house_number as address_number,
    address_zipcode,
    
    COALESCE(
        CASE 
            WHEN address_country IS NOT NULL AND address_country != '' THEN address_country
            ELSE 'ישראל'
        END,
        'ישראל'
    ) as address_country,
    
    -- Purpose (Clean text)
    NULLIF(TRIM(purpose), '') as purpose_text,
    
    -- Data Completeness (calculate basic score)
    (
        CASE WHEN name_hebrew IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN company_type IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN incorporation_date IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN address_city IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN address_street IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN purpose IS NOT NULL THEN 10 ELSE 0 END
    ) as data_completeness_score,
    
    COALESCE(data_source, 'data.gov.il') as data_source,
    COALESCE(imported_at, CURRENT_TIMESTAMP) as data_last_updated

FROM companies_registry
WHERE hp_number IS NOT NULL
ON CONFLICT (business_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    business_name_en = EXCLUDED.business_name_en,
    business_name_clean = EXCLUDED.business_name_clean,
    business_category = EXCLUDED.business_category,
    is_active = EXCLUDED.is_active,
    status_text = EXCLUDED.status_text,
    data_last_updated = CURRENT_TIMESTAMP;

-- Step 3: Initialize risk indicators with default values
INSERT INTO ai_risk_indicators (
    business_id,
    overall_risk_score,
    financial_risk_score,
    legal_risk_score,
    operational_risk_score,
    risk_level,
    risk_summary
)
SELECT 
    business_id,
    -- Initial risk score based on basic factors
    CASE 
        WHEN NOT is_active THEN 80  -- Inactive = high risk
        WHEN has_violations THEN 70  -- Violations = medium-high risk
        WHEN registration_age_days < 365 THEN 60  -- New business = medium risk
        ELSE 30  -- Default = low-medium risk
    END as overall_risk_score,
    
    0 as financial_risk_score,  -- Will be updated when financial data added
    0 as legal_risk_score,      -- Will be updated when legal data added
    
    -- Operational risk based on age and reports
    CASE 
        WHEN NOT is_active THEN 80
        WHEN has_violations THEN 60
        WHEN years_since_report > 2 THEN 50
        WHEN registration_age_days < 365 THEN 40
        ELSE 20
    END as operational_risk_score,
    
    -- Risk level classification
    CASE 
        WHEN NOT is_active THEN 'high'
        WHEN has_violations THEN 'medium'
        WHEN registration_age_days < 365 THEN 'medium'
        ELSE 'low'
    END as risk_level,
    
    -- Risk summary (Hebrew)
    CASE 
        WHEN NOT is_active THEN 'עסק לא פעיל - סיכון גבוה'
        WHEN has_violations THEN 'עסק מפר חוק - סיכון בינוני-גבוה'
        WHEN years_since_report > 2 THEN 'לא הגיש דוחות שנתיים - סיכון בינוני'
        WHEN registration_age_days < 365 THEN 'עסק חדש - סיכון בינוני'
        ELSE 'עסק רגיל - סיכון נמוך'
    END as risk_summary

FROM ai_business_profiles
ON CONFLICT (business_id) DO NOTHING;

-- Step 4: Migrate VAT dealers to ai_business_profiles (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vat_dealers') THEN
        INSERT INTO ai_business_profiles (
            business_id,
            business_name,
            business_category,
            business_type_full,
            is_active,
            status_text,
            registration_date,
            data_source,
            data_completeness_score
        )
        SELECT 
            hp_number::BIGINT as business_id,
            COALESCE(business_name, owner_name) as business_name,
            'osek_morsheh' as business_category,
            'עוסק מורשה' as business_type_full,
            CASE WHEN status ILIKE '%פעיל%' THEN true ELSE false END as is_active,
            CASE WHEN status ILIKE '%פעיל%' THEN 'active' ELSE 'inactive' END as status_text,
            CASE 
                WHEN registration_date ~ '^\d{2}/\d{2}/\d{4}$' THEN TO_DATE(registration_date, 'DD/MM/YYYY')
                ELSE NULL
            END as registration_date,
            'data.gov.il' as data_source,
            30 as data_completeness_score  -- Lower score for VAT-only data
        FROM vat_dealers
        WHERE hp_number IS NOT NULL
        ON CONFLICT (business_id) DO UPDATE SET
            data_last_updated = CURRENT_TIMESTAMP
        WHERE ai_business_profiles.data_completeness_score < 30;
        
        RAISE NOTICE '✅ Migrated VAT dealers to ai_business_profiles';
    END IF;
END $$;

-- Step 5: Migrate osek_morsheh (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'osek_morsheh') THEN
        INSERT INTO ai_business_profiles (
            business_id,
            business_name,
            business_category,
            business_type_full,
            is_active,
            status_text,
            data_source,
            data_completeness_score
        )
        SELECT 
            hp_number::BIGINT as business_id,
            business_name,
            'osek_morsheh' as business_category,
            'עוסק מורשה' as business_type_full,
            true as is_active,
            'active' as status_text,
            'manual' as data_source,
            20 as data_completeness_score
        FROM osek_morsheh
        WHERE hp_number IS NOT NULL
        ON CONFLICT (business_id) DO NOTHING;
        
        RAISE NOTICE '✅ Migrated osek_morsheh to ai_business_profiles';
    END IF;
END $$;

-- Step 6: Refresh materialized view
SELECT refresh_business_summary();

-- Step 7: Generate migration report
DO $$
DECLARE
    total_businesses INTEGER;
    active_businesses INTEGER;
    high_risk_count INTEGER;
    completeness_avg NUMERIC;
BEGIN
    SELECT COUNT(*) INTO total_businesses FROM ai_business_profiles;
    SELECT COUNT(*) INTO active_businesses FROM ai_business_profiles WHERE is_active = true;
    SELECT COUNT(*) INTO high_risk_count FROM ai_risk_indicators WHERE risk_level IN ('high', 'critical');
    SELECT AVG(data_completeness_score)::NUMERIC(5,2) INTO completeness_avg FROM ai_business_profiles;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration Report - AI-Optimized Schema';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Total Businesses Migrated: %', total_businesses;
    RAISE NOTICE 'Active Businesses: % (%.1f%%)', active_businesses, (active_businesses::NUMERIC / total_businesses * 100);
    RAISE NOTICE 'High Risk Businesses: % (%.1f%%)', high_risk_count, (high_risk_count::NUMERIC / total_businesses * 100);
    RAISE NOTICE 'Average Data Completeness: %.1f/100', completeness_avg;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Verify data: SELECT * FROM ai_business_summary LIMIT 10;';
    RAISE NOTICE '  2. Test AI query: SELECT get_ai_business_profile(515044532);';
    RAISE NOTICE '  3. Update app code to use new schema';
    RAISE NOTICE '';
END $$;
