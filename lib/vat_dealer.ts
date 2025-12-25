/**
 * VAT Dealer Verification Service
 * 
 * Verifies if a business is registered as עוסק מורשה (VAT dealer)
 * Uses Tax Authority public data and caches results in PostgreSQL
 * 
 * Strategy:
 * 1. Check PostgreSQL cache (vat_dealers table)
 * 2. If stale (>30 days) → verify via Tax Authority
 * 3. Update cache and return status
 */

import { pool } from './db/postgres';

export interface VATDealerStatus {
  hpNumber: string;
  isVATRegistered: boolean;  // עוסק מורשה
  vatNumber?: string;
  registrationDate?: string;
  dealerType: 'עוסק מורשה' | 'עוסק פטור' | 'חברה בע"מ' | 'unknown';
  taxStatus: 'active' | 'suspended' | 'cancelled' | 'unknown';
  
  // Bookkeeping approval (ניהול ספרים)
  bookkeepingStatus: 'יש אישור' | 'אין אישור' | 'לא ידוע';
  bookkeepingExpiryDate?: string;
  hasNikuiBamakor: boolean;  // ניכוי במקור
  
  // Metadata
  lastUpdated: string;
  dataSource: 'cache' | 'tax_authority_api' | 'web_scrape' | 'mock';
  cacheHit: boolean;
}

/**
 * Get VAT dealer status (with caching)
 */
export async function getVATDealerStatus(
  hpNumber: string,
  options: {
    forceRefresh?: boolean;
  } = {}
): Promise<VATDealerStatus | null> {
  
  try {
    // Step 1: Check PostgreSQL cache
    if (!options.forceRefresh) {
      const cached = await getVATDealerFromCache(hpNumber);
      
      if (cached && !cached.isStale) {
        console.log(`[VAT] Cache HIT for HP ${hpNumber}`);
        return {
          ...cached,
          dataSource: 'cache',
          cacheHit: true,
        };
      }
    }
    
    // Step 2: Verify via Tax Authority (NOT IMPLEMENTED YET)
    // TODO: Implement Tax Authority API integration
    // For now, use heuristic based on companies_registry data
    
    console.log(`[VAT] Inferring VAT status for HP ${hpNumber} from company type`);
    const inferredStatus = await inferVATStatusFromCompanyData(hpNumber);
    
    if (inferredStatus) {
      // Cache the inferred result
      await upsertVATDealerCache(hpNumber, inferredStatus);
      
      return {
        ...inferredStatus,
        dataSource: 'mock',
        cacheHit: false,
      };
    }
    
    return null;
    
  } catch (error) {
    console.error(`[VAT] Error getting dealer status for HP ${hpNumber}:`, error);
    return null;
  }
}

/**
 * Get VAT dealer from PostgreSQL cache
 */
async function getVATDealerFromCache(hpNumber: string): Promise<(VATDealerStatus & { isStale: boolean }) | null> {
  try {
    const result = await pool.query(`
      SELECT 
        hp_number,
        is_vat_registered,
        vat_number,
        registration_date,
        dealer_type,
        tax_status,
        bookkeeping_status,
        bookkeeping_expiry_date,
        has_nikui_bamakor,
        last_updated,
        data_source,
        is_vat_data_stale($1) as is_stale
      FROM vat_dealers
      WHERE hp_number = $1
    `, [hpNumber]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    return {
      hpNumber: row.hp_number.toString(),
      isVATRegistered: row.is_vat_registered,
      vatNumber: row.vat_number,
      registrationDate: row.registration_date,
      dealerType: row.dealer_type,
      taxStatus: row.tax_status,
      bookkeepingStatus: row.bookkeeping_status,
      bookkeepingExpiryDate: row.bookkeeping_expiry_date,
      hasNikuiBamakor: row.has_nikui_bamakor,
      lastUpdated: row.last_updated.toISOString(),
      dataSource: row.data_source,
      cacheHit: true,
      isStale: row.is_stale,
    };
    
  } catch (error) {
    console.error(`[VAT] Error fetching from cache:`, error);
    return null;
  }
}

/**
 * Infer VAT status from company registry data
 * 
 * Heuristic rules:
 * - חברה בע"מ → usually עוסק מורשה (revenue > 102K NIS threshold)
 * - שותפות → may be עוסק מורשה or פטור
 * - עוסק פטור → explicitly marked (revenue < 102K NIS)
 */
async function inferVATStatusFromCompanyData(hpNumber: string): Promise<Omit<VATDealerStatus, 'dataSource' | 'cacheHit'> | null> {
  try {
    const result = await pool.query(`
      SELECT 
        hp_number,
        company_type,
        status,
        incorporation_date
      FROM companies_registry
      WHERE hp_number = $1
    `, [hpNumber]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const company = result.rows[0];
    
    // STRICT Business classification by HP number first digit:
    // 
    // RULE 1 (ABSOLUTE): חברת בע"מ = HP starts with 5
    //   - ALL companies (Ltd/Public/Private) start with 5
    //   - CANNOT be עוסק מורשה or עוסק פטור
    //   - Corporate entities subject to VAT
    //
    // RULE 2: עוסק מורשה or עוסק פטור = HP starts with 0-4, 6-9
    //   - Individual businesses and partnerships
    //   - VAT status depends on revenue (102K NIS threshold)
    //   - Default: עוסק פטור unless company_type indicates partnership
    
    const hpStr = company.hp_number.toString();
    const firstDigit = hpStr.charAt(0);
    const companyType = company.company_type || '';
    
    let dealerType: 'עוסק מורשה' | 'עוסק פטור' | 'חברה בע"מ' | 'unknown';
    let isVATRegistered: boolean;
    
    if (firstDigit === '5') {
      // ABSOLUTE RULE: First digit = 5 → חברה בע"מ
      dealerType = 'חברה בע"מ';
      isVATRegistered = true; // Companies ARE subject to VAT (מע"מ)
    } else {
      // First digit = 0-4, 6-9 → עוסק (dealer)
      // Check if partnership → עוסק מורשה, else → עוסק פטור
      const isPartnership = companyType.includes('שותפות');
      
      if (isPartnership) {
        dealerType = 'עוסק מורשה';
        isVATRegistered = true;
      } else {
        dealerType = 'עוסק פטור';
        isVATRegistered = false;
      }
    }
    
    const isLikelyVATRegistered = isVATRegistered;
    
    return {
      hpNumber: company.hp_number.toString(),
      isVATRegistered: isLikelyVATRegistered,
      vatNumber: isLikelyVATRegistered ? company.hp_number.toString() : undefined,
      registrationDate: company.incorporation_date,
      dealerType,
      taxStatus: company.status === 'פעילה' ? 'active' : 'cancelled',
      bookkeepingStatus: 'לא ידוע',  // Unknown until we scrape tax certificates
      hasNikuiBamakor: false,  // Conservative default
      lastUpdated: new Date().toISOString(),
    };
    
  } catch (error) {
    console.error(`[VAT] Error inferring status:`, error);
    return null;
  }
}

/**
 * Update VAT dealer cache in PostgreSQL
 */
async function upsertVATDealerCache(
  hpNumber: string, 
  status: Omit<VATDealerStatus, 'dataSource' | 'cacheHit'>
): Promise<void> {
  try {
    await pool.query(`
      SELECT upsert_vat_dealer(
        $1,  -- hp_number
        $2,  -- is_vat_registered
        $3,  -- vat_number
        $4,  -- dealer_type
        $5,  -- tax_status
        $6,  -- bookkeeping_status
        $7   -- data_source
      )
    `, [
      hpNumber,
      status.isVATRegistered,
      status.vatNumber,
      status.dealerType,
      status.taxStatus,
      status.bookkeepingStatus,
      'inferred',  // Mark as inferred, not from Tax Authority API
    ]);
    
    console.log(`[VAT] Cached status for HP ${hpNumber}`);
    
  } catch (error) {
    console.error(`[VAT] Error caching dealer status:`, error);
  }
}

/**
 * Batch enrich companies with VAT status
 * Used for initial population or periodic refresh
 */
export async function enrichCompaniesWithVATStatus(
  options: {
    limit?: number;
    onlyMissing?: boolean;
  } = {}
): Promise<{ processed: number; enriched: number; failed: number }> {
  
  const { limit, onlyMissing = true } = options;
  
  const stats = {
    processed: 0,
    enriched: 0,
    failed: 0,
  };
  
  try {
    // Get companies without VAT data
    const query = onlyMissing
      ? `SELECT c.hp_number 
         FROM companies_registry c 
         LEFT JOIN vat_dealers v ON c.hp_number = v.hp_number 
         WHERE v.hp_number IS NULL 
         ORDER BY c.hp_number
         ${limit ? `LIMIT ${limit}` : ''}`
      : `SELECT hp_number FROM companies_registry 
         ORDER BY hp_number
         ${limit ? `LIMIT ${limit}` : ''}`;
    
    const result = await pool.query(query);
    
    console.log(`[VAT] Enriching ${result.rows.length} companies with VAT status...`);
    
    for (const row of result.rows) {
      try {
        const status = await getVATDealerStatus(row.hp_number.toString(), { forceRefresh: true });
        
        if (status) {
          stats.enriched++;
        } else {
          stats.failed++;
        }
        
        stats.processed++;
        
        // Progress logging
        if (stats.processed % 100 === 0) {
          console.log(`[VAT] Processed ${stats.processed}/${result.rows.length} companies`);
        }
        
      } catch (error) {
        console.error(`[VAT] Error enriching HP ${row.hp_number}:`, error);
        stats.failed++;
        stats.processed++;
      }
    }
    
    console.log(`[VAT] Enrichment complete:`, stats);
    return stats;
    
  } catch (error) {
    console.error(`[VAT] Error in batch enrichment:`, error);
    return stats;
  }
}
