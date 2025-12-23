/**
 * PostgreSQL Database Client for Government Data
 * 
 * Sources:
 * - data.gov.il (companies registry, execution proceedings)
 * - ica.justice.gov.il (real-time company info, owners)
 * - court.gov.il (legal cases)
 * 
 * Architecture:
 * 1. Local database caches data from data.gov.il (updated monthly)
 * 2. Real-time scraping for fresh data (when needed)
 * 3. Fallback to cached data if scraping fails
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// Database configuration
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'trustcheck_gov_data',
  user: process.env.POSTGRES_USER || 'trustcheck_admin',
  password: process.env.POSTGRES_PASSWORD,
  max: 20, // Maximum pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Types
export interface CompanyProfile {
  id: string;
  hpNumber: string;
  nameHebrew: string;
  nameEnglish?: string;
  companyType: string;
  status: string;
  registrationDate?: string;
  addressStreet?: string;
  addressCity?: string;
  addressZipcode?: string;
  phone?: string;
  website?: string;
  email?: string;
  businessPurpose?: string;
  
  // NEW: Regulatory compliance fields (from companies_registry table)
  violations?: string;  // "מפרה" if company violates laws
  violationsCode?: string;  // Code 18 = violating company
  limitations?: string;  // "מוגבלת" or other limitations
  governmentCompany?: string;  // "כן" if government-owned
  lastAnnualReport?: string;  // Last annual report year
  description?: string;  // תאור עיסוק
  
  dataSource: string;
  lastUpdated: string;
  dataQualityScore: number;
  owners?: CompanyOwner[];
}

export interface CompanyOwner {
  name: string;
  idNumber?: string;
  role: string;
  sharePercentage?: number;
  appointmentDate?: string;
}

export interface LegalCase {
  id: string;
  companyHpNumber: string;
  caseNumber: string;
  caseType: string;
  courtName: string;
  plaintiff: string;
  defendant: string;
  caseStatus: string;
  filingDate?: string;
  closingDate?: string;
  amount?: number;
  description?: string;
  dataSource: string;
}

export interface ExecutionProceeding {
  id: string;
  companyHpNumber?: string;
  proceedingNumber: string;
  debtorName: string;
  creditorName: string;
  debtAmount: number;
  proceedingStatus: string;
  openingDate?: string;
  closingDate?: string;
}

export interface ScrapingLog {
  source: string;
  operation: string;
  hpNumber?: string;
  status: 'success' | 'failure' | 'rate_limited' | 'timeout';
  errorMessage?: string;
  responseTimeMs?: number;
}

// ============================================
// DATABASE QUERIES
// ============================================

/**
 * Search company in local database
 * Fast lookup (< 100ms) from cached data
 */
export async function searchLocalCompany(hpNumber: string): Promise<CompanyProfile | null> {
  try {
    const query = `
      SELECT 
        hp_number as id,
        hp_number as "hpNumber",
        name_hebrew as "nameHebrew",
        name_english as "nameEnglish",
        company_type as "companyType",
        status,
        incorporation_date as "registrationDate",
        address_street as "addressStreet",
        address_city as "addressCity",
        address_zipcode as "addressZipcode",
        '' as phone,
        '' as website,
        '' as email,
        purpose as "businessPurpose",
        
        -- NEW: Regulatory compliance fields
        violations,
        violations_code as "violationsCode",
        limitations,
        government_company as "governmentCompany",
        last_annual_report_year as "lastAnnualReport",
        description,
        
        data_source as "dataSource",
        imported_at as "lastUpdated",
        50 as "dataQualityScore"
      FROM companies_registry
      WHERE hp_number = $1::bigint
      LIMIT 1
    `;

    const result: QueryResult<CompanyProfile> = await pool.query(query, [hpNumber]);

    if (result.rows.length === 0) {
      return null;
    }

    const company = result.rows[0];

    // Fetch owners
    const ownersQuery = `
      SELECT 
        owner_name as "name",
        owner_id_number as "idNumber",
        role,
        share_percentage as "sharePercentage",
        appointment_date as "appointmentDate"
      FROM company_owners
      WHERE company_hp_number = $1
      ORDER BY share_percentage DESC NULLS LAST
    `;

    const ownersResult: QueryResult<CompanyOwner> = await pool.query(ownersQuery, [hpNumber]);
    company.owners = ownersResult.rows;

    return company;
  } catch (error) {
    console.error('[PostgreSQL] Error searching company:', error);
    return null;
  }
}

/**
 * Search company by name (Hebrew)
 * Useful when HP number is unknown
 */
export async function searchCompaniesByName(name: string, limit: number = 10): Promise<CompanyProfile[]> {
  try {
    const query = `
      SELECT 
        id,
        hp_number as "hpNumber",
        name_hebrew as "nameHebrew",
        name_english as "nameEnglish",
        company_type as "companyType",
        status,
        address_city as "addressCity",
        data_quality_score as "dataQualityScore"
      FROM companies_registry
      WHERE 
        name_hebrew ILIKE $1 OR
        name_english ILIKE $1
      ORDER BY data_quality_score DESC, name_hebrew ASC
      LIMIT $2
    `;

    const searchPattern = `%${name}%`;
    const result: QueryResult<CompanyProfile> = await pool.query(query, [searchPattern, limit]);

    return result.rows;
  } catch (error) {
    console.error('[PostgreSQL] Error searching companies by name:', error);
    return [];
  }
}

/**
 * Get legal cases for company
 */
export async function getCompanyLegalCases(hpNumber: string): Promise<LegalCase[]> {
  try {
    const query = `
      SELECT 
        id,
        company_hp_number as "companyHpNumber",
        case_number as "caseNumber",
        case_type as "caseType",
        court_name as "courtName",
        plaintiff,
        defendant,
        case_status as "caseStatus",
        filing_date as "filingDate",
        closing_date as "closingDate",
        amount,
        description,
        data_source as "dataSource"
      FROM legal_cases
      WHERE company_hp_number = $1
      ORDER BY filing_date DESC
    `;

    const result: QueryResult<LegalCase> = await pool.query(query, [hpNumber]);
    return result.rows;
  } catch (error) {
    console.error('[PostgreSQL] Error fetching legal cases:', error);
    return [];
  }
}

/**
 * Get execution proceedings for company
 */
export async function getCompanyExecutionProceedings(hpNumber: string): Promise<ExecutionProceeding[]> {
  try {
    const query = `
      SELECT 
        id,
        company_hp_number as "companyHpNumber",
        proceeding_number as "proceedingNumber",
        debtor_name as "debtorName",
        creditor_name as "creditorName",
        debt_amount as "debtAmount",
        proceeding_status as "proceedingStatus",
        opening_date as "openingDate",
        closing_date as "closingDate"
      FROM execution_proceedings
      WHERE company_hp_number = $1
      ORDER BY opening_date DESC
    `;

    const result: QueryResult<ExecutionProceeding> = await pool.query(query, [hpNumber]);
    return result.rows;
  } catch (error) {
    console.error('[PostgreSQL] Error fetching execution proceedings:', error);
    return [];
  }
}

/**
 * Insert or update company in database
 */
export async function upsertCompany(company: Partial<CompanyProfile>): Promise<boolean> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO companies_registry (
        hp_number, name_hebrew, name_english, company_type, status,
        registration_date, address_street, address_city, address_zipcode,
        phone, website, email, business_purpose, data_source, data_quality_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (hp_number) 
      DO UPDATE SET
        name_hebrew = EXCLUDED.name_hebrew,
        name_english = EXCLUDED.name_english,
        company_type = EXCLUDED.company_type,
        status = EXCLUDED.status,
        registration_date = EXCLUDED.registration_date,
        address_street = EXCLUDED.address_street,
        address_city = EXCLUDED.address_city,
        address_zipcode = EXCLUDED.address_zipcode,
        phone = EXCLUDED.phone,
        website = EXCLUDED.website,
        email = EXCLUDED.email,
        business_purpose = EXCLUDED.business_purpose,
        data_source = EXCLUDED.data_source,
        data_quality_score = EXCLUDED.data_quality_score,
        last_updated = CURRENT_TIMESTAMP
    `;

    await client.query(query, [
      company.hpNumber,
      company.nameHebrew,
      company.nameEnglish,
      company.companyType,
      company.status,
      company.registrationDate,
      company.addressStreet,
      company.addressCity,
      company.addressZipcode,
      company.phone,
      company.website,
      company.email,
      company.businessPurpose,
      company.dataSource || 'ica.justice.gov.il',
      company.dataQualityScore || 75,
    ]);

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL] Error upserting company:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Insert or update company owners
 */
export async function upsertCompanyOwners(hpNumber: string, owners: CompanyOwner[]): Promise<boolean> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query('BEGIN');

    // Delete existing owners
    await client.query('DELETE FROM company_owners WHERE company_hp_number = $1', [hpNumber]);

    // Insert new owners
    if (owners.length > 0) {
      const insertQuery = `
        INSERT INTO company_owners (
          company_hp_number, owner_name, owner_id_number, role, share_percentage, appointment_date
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      for (const owner of owners) {
        await client.query(insertQuery, [
          hpNumber,
          owner.name,
          owner.idNumber,
          owner.role,
          owner.sharePercentage,
          owner.appointmentDate,
        ]);
      }
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL] Error upserting owners:', error);
    return false;
  } finally {
    client.release();
  }
}

/**
 * Log scraping operation (for monitoring)
 */
export async function logScrapingOperation(log: ScrapingLog): Promise<void> {
  try {
    const query = `
      INSERT INTO scraping_logs (
        source, operation, hp_number, status, error_message, response_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(query, [
      log.source,
      log.operation,
      log.hpNumber,
      log.status,
      log.errorMessage,
      log.responseTimeMs,
    ]);
  } catch (error) {
    console.error('[PostgreSQL] Error logging scraping operation:', error);
  }
}

/**
 * Check if company data is outdated (> 7 days old)
 */
export async function isCompanyDataOutdated(hpNumber: string): Promise<boolean> {
  try {
    const query = `
      SELECT 
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - last_updated)) / 86400 as days_old
      FROM companies_registry
      WHERE hp_number = $1::bigint
    `;

    const result = await pool.query(query, [hpNumber]);

    if (result.rows.length === 0) {
      return true; // Not found = outdated
    }

    const daysOld = parseFloat(result.rows[0].days_old);
    return daysOld > 7; // Consider outdated if > 7 days
  } catch (error) {
    console.error('[PostgreSQL] Error checking data freshness:', error);
    return true; // Assume outdated on error
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM companies_registry) as total_companies,
        (SELECT COUNT(*) FROM company_owners) as total_owners,
        (SELECT COUNT(*) FROM legal_cases) as total_legal_cases,
        (SELECT COUNT(*) FROM execution_proceedings) as total_executions,
        (SELECT COUNT(*) FROM scraping_logs WHERE created_at > NOW() - INTERVAL '24 hours') as logs_24h,
        (SELECT COUNT(*) FROM scraping_logs WHERE status = 'failure' AND created_at > NOW() - INTERVAL '24 hours') as failures_24h
    `);

    return stats.rows[0];
  } catch (error) {
    console.error('[PostgreSQL] Error fetching stats:', error);
    return null;
  }
}

/**
 * Health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('[PostgreSQL] Health check failed:', error);
    return false;
  }
}

// Cleanup on process exit
process.on('SIGTERM', async () => {
  await pool.end();
});

export default pool;
