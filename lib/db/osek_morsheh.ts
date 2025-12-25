/**
 * Osek Morsheh Service
 * 
 * Service for managing VAT registered individual business dealers (עוסק מורשה)
 * CRITICAL: Only handles HP numbers NOT starting with 5
 * HP starting with 5 = חברה בע"מ (handled by vat_dealer.ts)
 */

import { Pool } from 'pg';
import { pool } from './postgres';

interface OsekMorsheh {
  hp_number: number;
  business_name: string;
  dealer_type: 'עוסק מורשה' | 'עוסק פטור';
  is_vat_registered: boolean;
  vat_number?: string;
  registration_date?: Date;
  cancellation_date?: Date;
  tax_status: 'active' | 'cancelled' | 'suspended' | 'unknown';
  business_type?: string;
  business_sector?: string;
  legal_form?: string;
  city?: string;
  full_address?: string;
  phone?: string;
  data_source: 'tax_authority' | 'scraping' | 'business_licenses' | 'economy_ministry';
  last_verified_at: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Validates that HP number does NOT start with 5
 * עוסק מורשה can start with ANY digit (0,1,2,3,4,6,7,8,9) EXCEPT "5"
 * HP starting with "5" are reserved for חברות בע"מ (companies)
 * @throws Error if HP starts with 5
 */
function validateHPNotFive(hpNumber: number): void {
  const hpStr = hpNumber.toString();
  if (hpStr.charAt(0) === '5') {
    throw new Error(
      `Invalid HP number for עוסק מורשה: ${hpNumber}. ` +
      `HP numbers starting with 5 are חברות בע"מ (companies).`
    );
  }
}

/**
 * Get עוסק מורשה details from database
 */
export async function getOsekMorsheh(hpNumber: number): Promise<OsekMorsheh | null> {
  validateHPNotFive(hpNumber);
  
  const query = `
    SELECT 
      hp_number,
      business_name,
      dealer_type,
      is_vat_registered,
      vat_number,
      registration_date,
      cancellation_date,
      tax_status,
      business_type,
      business_sector,
      legal_form,
      city,
      full_address,
      phone,
      data_source,
      last_verified_at,
      created_at,
      updated_at
    FROM osek_morsheh
    WHERE hp_number = $1
  `;
  
  const result = await pool.query(query, [hpNumber]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0] as OsekMorsheh;
}

/**
 * Check if עוסק מורשה data is stale (older than 30 days)
 */
export async function deleteOsekMorsheh(hpNumber: number): Promise<boolean> {
  validateHPNotFive(hpNumber);
  
  const query = `SELECT is_osek_data_stale($1) as is_stale`;
  const result = await pool.query(query, [hpNumber]);
  
  return result.rows[0]?.is_stale ?? true;
}

/**
 * Upsert עוסק מורשה record
 */
export async function upsertOsekMorsheh(data: {
  hp_number: number;
  business_name: string;
  dealer_type: 'עוסק מורשה' | 'עוסק פטור';
  is_vat_registered: boolean;
  tax_status: 'active' | 'cancelled' | 'suspended' | 'unknown';
  data_source: 'tax_authority' | 'scraping' | 'business_licenses' | 'economy_ministry';
  city?: string;
  business_type?: string;
}): Promise<void> {
  validateHPNotFive(data.hp_number);
  
  await pool.query(
    `SELECT upsert_osek_morsheh($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.hp_number,
      data.business_name,
      data.dealer_type,
      data.is_vat_registered,
      data.tax_status,
      data.data_source,
      data.city,
      data.business_type,
    ]
  );
}

/**
 * Search for עוסק מורשה by business name (Hebrew full-text search)
 */
export async function searchOsekMorsheh(searchTerm: string, limit: number = 10): Promise<OsekMorsheh[]> {
  const query = `
    SELECT 
      hp_number,
      business_name,
      dealer_type,
      is_vat_registered,
      tax_status,
      city,
      business_type,
      data_source,
      last_verified_at
    FROM osek_morsheh
    WHERE to_tsvector('hebrew', business_name) @@ plainto_tsquery('hebrew', $1)
       OR business_name ILIKE $2
    ORDER BY 
      CASE WHEN business_name ILIKE $2 THEN 0 ELSE 1 END,
      last_verified_at DESC
    LIMIT $3
  `;
  
  const result = await pool.query(query, [searchTerm, `%${searchTerm}%`, limit]);
  
  return result.rows as OsekMorsheh[];
}

/**
 * Get statistics for עוסק מורשה database
 */
export async function getOsekStats(): Promise<{
  dealer_type: string;
  tax_status: string;
  count: number;
  percentage: number;
  min_hp: number;
  max_hp: number;
  data_source: string;
}[]> {
  const query = `SELECT * FROM osek_morsheh_stats`;
  const result = await pool.query(query);
  
  return result.rows;
}

/**
 * Classify business type based on HP number (CRITICAL RULE)
 * 
 * @returns Business classification for unified_data.ts
 */
export function classifyByHPNumber(hpNumber: number): {
  dealerType: 'חברה בע"מ' | 'עוסק מורשה' | 'עוסק פטור';
  isVATRegistered: boolean;
  requiresLookup: boolean;
} {
  const hpStr = hpNumber.toString();
  const firstDigit = hpStr.charAt(0);
  
  if (firstDigit === '5') {
    // HP starts with 5 → חברה בע"מ (Company)
    return {
      dealerType: 'חברה בע"מ',
      isVATRegistered: true,
      requiresLookup: false, // Can determine from HP alone
    };
  } else {
    // HP does NOT start with 5 (starts with 0,1,2,3,4,6,7,8,9) → Individual business
    // Need to lookup in database to determine if עוסק מורשה or עוסק פטור
    return {
      dealerType: 'עוסק פטור', // Default assumption
      isVATRegistered: false,
      requiresLookup: true, // Must check osek_morsheh table
    };
  }
}

/**
 * Get unified VAT status (combines company and individual businesses)
 * ROUTING LOGIC:
 * - HP starting with "5" → חברה בע"מ (query companies_registry)
 * - HP starting with 0,1,2,3,4,6,7,8,9 → עוסק מורשה/פטור (query osek_morsheh)
 * This is the main entry point for unified_data.ts
 */
export async function getUnifiedVATStatus(hpNumber: number): Promise<{
  dealerType: 'חברה בע"מ' | 'עוסק מורשה' | 'עוסק פטור';
  isVATRegistered: boolean;
  taxStatus: 'active' | 'cancelled' | 'suspended' | 'unknown';
  businessName?: string;
  city?: string;
  dataSource: string;
}> {
  const classification = classifyByHPNumber(hpNumber);
  
  if (!classification.requiresLookup) {
    // HP starts with 5 → חברה בע"מ
    // Use vat_dealer.ts logic (already implemented)
    return {
      dealerType: 'חברה בע"מ',
      isVATRegistered: true,
      taxStatus: 'active', // Default
      dataSource: 'companies_registry',
    };
  }
  
  // HP does NOT start with 5 → Check osek_morsheh database
  const osek = await getOsekMorsheh(hpNumber);
  
  if (osek) {
    return {
      dealerType: osek.dealer_type,
      isVATRegistered: osek.is_vat_registered,
      taxStatus: osek.tax_status,
      businessName: osek.business_name,
      city: osek.city,
      dataSource: osek.data_source,
    };
  }
  
  // Not found in database → Default to עוסק פטור
  return {
    dealerType: 'עוסק פטור',
    isVATRegistered: false,
    taxStatus: 'unknown',
    dataSource: 'inference',
  };
}

/**
 * Batch import עוסק מורשה records from external source
 * Use this for importing data from data.gov.il or Tax Authority API
 */
export async function batchImportOsek(
  records: Array<{
    hp_number: number;
    business_name: string;
    dealer_type?: 'עוסק מורשה' | 'עוסק פטור';
    tax_status?: 'active' | 'cancelled' | 'suspended';
    city?: string;
    business_type?: string;
  }>,
  dataSource: 'tax_authority' | 'scraping' | 'business_licenses' | 'economy_ministry'
): Promise<{ inserted: number; failed: number }> {
  let inserted = 0;
  let failed = 0;
  
  for (const record of records) {
    try {
      // Validate HP
      if (record.hp_number.toString().charAt(0) === '5') {
        console.warn(`[OSEK] Skipping HP ${record.hp_number} - starts with 5 (company)`);
        failed++;
        continue;
      }
      
      // Default values
      const dealerType = record.dealer_type ?? 'עוסק פטור';
      const isVATRegistered = dealerType === 'עוסק מורשה';
      const taxStatus = record.tax_status ?? 'active';
      
      await upsertOsekMorsheh({
        hp_number: record.hp_number,
        business_name: record.business_name,
        dealer_type: dealerType,
        is_vat_registered: isVATRegistered,
        tax_status: taxStatus,
        data_source: dataSource,
        city: record.city,
        business_type: record.business_type,
      });
      
      inserted++;
      
      if (inserted % 1000 === 0) {
        console.log(`[OSEK] Imported ${inserted} records...`);
      }
    } catch (error) {
      console.error(`[OSEK] Failed to import HP ${record.hp_number}:`, error);
      failed++;
    }
  }
  
  console.log(`[OSEK] Import complete: ${inserted} inserted, ${failed} failed`);
  
  return { inserted, failed };
}

export default {
  getOsekMorsheh,
  upsertOsekMorsheh,
  searchOsekMorsheh,
  getOsekStats,
  classifyByHPNumber,
  getUnifiedVATStatus,
  batchImportOsek,
};
